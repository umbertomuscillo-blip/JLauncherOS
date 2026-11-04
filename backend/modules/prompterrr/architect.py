"""Stadio 1 di Prompterrr: L'Architetto Cognitivo."""

import logging
from typing import Dict, List, Optional

from .context_cache import estimate_tokens

logger = logging.getLogger("jlauncheros.prompterrr.architect")


class ArchitectStage:
    """Genera l'impalcatura concettuale e la bozza iniziale strutturata del prompt."""

    def build_blueprint(
        self,
        prompt_input: str,
        context_text: str = "",
        temperature: float = 0.2,
    ) -> Dict[str, str]:
        """Struttura un prompt ad alta densità informativa basato sul contesto."""
        logger.info("Esecuzione Stadio Architetto per prompt: %.40s...", prompt_input)

        system_role = (
            "Sei un Architetto di Sistemi Senior specializzato in macOS, Apple Silicon M4 e ingegneria robusta."
        )

        objective = f"## Obiettivo Primario\n{prompt_input}\n"
        constraints = (
            "## Vincoli Inviolabili\n"
            "- Zero Zombie Process supervision.\n"
            "- Asyncio non-blocking event loop (<10ms tick latency).\n"
            "- Error handling rigoroso con log di contesto.\n"
        )

        context_section = ""
        if context_text:
            context_section = f"## Contesto e Fonti di Verità\n{context_text[:2000]}\n"

        blueprint = f"{system_role}\n\n{objective}\n{constraints}\n{context_section}"
        tokens = estimate_tokens(blueprint)

        return {
            "stage": "architect",
            "blueprint": blueprint,
            "estimated_tokens": str(tokens),
        }


architect = ArchitectStage()
