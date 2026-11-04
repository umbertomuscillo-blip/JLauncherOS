"""Context Cache semantico per Prompterrr su Apple Silicon M4."""

import hashlib
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from core.thread_pool import run_in_thread_pool

logger = logging.getLogger("jlauncheros.prompterrr.cache")


def estimate_tokens(text: str) -> int:
    """Stima rapida e deterministica del numero di token BPE per un testo."""
    if not text:
        return 0
    # Media standard di 4 caratteri per token in LLM moderni
    return max(1, len(text) // 4)


class ContextCache:
    """Cache in-memory e calcolo fingerprint per i file di contesto LLM."""

    def __init__(self) -> None:
        self._cache: Dict[str, Tuple[str, int]] = {}
        self.total_tokens_saved: int = 0

    def _sync_read_and_hash(self, file_paths: List[str]) -> Tuple[str, str, int]:
        """Legge i file sincronicamente nel thread pool calcolando digest SHA-256."""
        combined_content: List[str] = []
        hasher = hashlib.sha256()

        for fp in file_paths:
            p = Path(fp)
            if p.exists() and p.is_file():
                try:
                    content = p.read_text(encoding="utf-8", errors="replace")
                    combined_content.append(f"--- File: {p.name} ---\n{content}\n")
                    hasher.update(content.encode("utf-8"))
                except Exception as exc:
                    logger.warning("Impossibile leggere contesto %s: %s", fp, exc)

        full_text = "\n".join(combined_content)
        digest = hasher.hexdigest()
        tokens = estimate_tokens(full_text)
        return digest, full_text, tokens

    async def get_or_load_context(
        self,
        context_files: List[str],
        enable_cache: bool = True,
    ) -> Tuple[str, bool, int]:
        """Recupera il contesto dalla cache o carica i file dal disco tramite ThreadPool."""
        if not context_files:
            return "", False, 0

        # Offload lettura e hash
        digest, content, tokens = await run_in_thread_pool(self._sync_read_and_hash, context_files)

        if enable_cache and digest in self._cache:
            cached_content, cached_tokens = self._cache[digest]
            self.total_tokens_saved += cached_tokens
            logger.info("Context Cache HIT [Hash: %s...]: risparmiati %d token", digest[:8], cached_tokens)
            return cached_content, True, cached_tokens

        if enable_cache and digest:
            self._cache[digest] = (content, tokens)
            logger.info("Context Cache MISS [Hash: %s...]: indicizzati %d token", digest[:8], tokens)

        return content, False, 0


context_cache = ContextCache()
