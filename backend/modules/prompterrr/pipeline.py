"""Pipeline Dual-Stage Architetto-Critico per Prompterrr su Apple Silicon M4.

Coordina il flusso cognitivo a due stadi:
1. Stadio Architetto: strutturazione logica ad alta densità del prompt.
2. Stadio Critico: validazione e raffinamento zero-defect.
Emette token in streaming asincrono non bloccante via WebSocket push.
"""

import asyncio
import inspect
import logging
import time
import uuid
from typing import Any, Callable, Dict, List, Optional

from .architect import architect
from .context_cache import context_cache, estimate_tokens
from .critic import CriticStage

logger = logging.getLogger("jlauncheros.prompterrr.pipeline")


class PrompterrrPipeline:
    """Coordinatore della pipeline dual-stage Architetto-Critico con token streaming."""

    def __init__(self) -> None:
        self.critic = CriticStage()
        self.active_pipelines: Dict[str, bool] = {}

    async def execute(
        self,
        prompt_input: str,
        context_files: Optional[List[str]] = None,
        mode: str = "architect_critic",
        temperature: float = 0.2,
        enable_cache: bool = True,
        token_callback: Optional[Callable[[Dict[str, Any]], Any]] = None,
    ) -> Dict[str, Any]:
        """Esegue l'intera pipeline emettendo token in streaming continuo."""
        pipeline_id = f"pipe_{uuid.uuid4().hex[:8]}"
        self.active_pipelines[pipeline_id] = True
        t0 = time.perf_counter()

        logger.info("Avvio Prompterrr Pipeline [%s] (Modalità: %s)", pipeline_id, mode)

        # 1. Caricamento contesto con Context Cache (SHA-256 offloadato su M4 ThreadPool)
        context_text, cache_hit, tokens_saved = await context_cache.get_or_load_context(
            context_files or [],
            enable_cache=enable_cache,
        )

        # 2. Stadio 1: Architetto
        arch_res = architect.build_blueprint(prompt_input, context_text, temperature)
        blueprint = arch_res["blueprint"]

        # Streaming bozza architetto
        if token_callback and self.active_pipelines.get(pipeline_id, False):
            chunks = [blueprint[i : i + 64] for i in range(0, len(blueprint), 64)]
            emitted = 0
            for chunk in chunks:
                if not self.active_pipelines.get(pipeline_id, False):
                    logger.info("Pipeline %s interrotta dall'utente.", pipeline_id)
                    break
                emitted += estimate_tokens(chunk)
                payload = {
                    "pipeline_id": pipeline_id,
                    "stage": "architect",
                    "token_chunk": chunk,
                    "tokens_emitted": emitted,
                }
                if inspect.iscoroutinefunction(token_callback):
                    await token_callback(payload)
                else:
                    token_callback(payload)
                await asyncio.sleep(0.01)  # Simula streaming fluido a 100 chunk/s

        # 3. Stadio 2: Critico
        final_prompt = self.critic.refine(blueprint)

        # Streaming revisione critico
        if token_callback and self.active_pipelines.get(pipeline_id, False):
            critic_header = "\n[Critico: Revisione completata con successo]\n"
            payload = {
                "pipeline_id": pipeline_id,
                "stage": "critic",
                "token_chunk": critic_header,
                "tokens_emitted": estimate_tokens(final_prompt),
            }
            if inspect.iscoroutinefunction(token_callback):
                await token_callback(payload)
            else:
                token_callback(payload)

        duration_ms = int((time.perf_counter() - t0) * 1000)
        self.active_pipelines.pop(pipeline_id, None)

        return {
            "pipeline_id": pipeline_id,
            "duration_ms": duration_ms,
            "cache_hit": cache_hit,
            "tokens_saved": tokens_saved,
            "final_prompt": final_prompt,
        }

    def abort(self, pipeline_id: str) -> bool:
        """Interrompe immediatamente una pipeline in esecuzione."""
        if pipeline_id in self.active_pipelines:
            self.active_pipelines[pipeline_id] = False
            logger.info("Inviato segnale di stop per pipeline %s", pipeline_id)
            return True
        return False


prompterrr_pipeline = PrompterrrPipeline()
