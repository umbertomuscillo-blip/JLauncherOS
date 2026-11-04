"""Global ThreadPoolExecutor per offloading di blocking I/O su Apple Silicon M4.

Garantisce che nessuna operazione di scansione APFS, purge cache o hashing
venga mai eseguita sull'event loop principale di asyncio.
"""

import asyncio
import functools
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, TypeVar

logger = logging.getLogger("JARVIS.ThreadPool")
T = TypeVar("T")

# Dimensionato specificamente per Apple Silicon M4 (Efficiency + Performance cores)
global_thread_pool = ThreadPoolExecutor(
    max_workers=8,
    thread_name_prefix="jlauncher_m4_worker",
)


async def run_in_thread_pool(func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
    """Esegue operazioni I/O bloccanti senza affamare l'event loop asyncio."""
    loop = asyncio.get_running_loop()
    if kwargs:
        func = functools.partial(func, **kwargs)
    return await loop.run_in_executor(global_thread_pool, func, *args)


def shutdown_thread_pool(wait: bool = True) -> None:
    """Arresta ordinatamente il pool di thread globale (Graceful Shutdown)."""
    logger.info("Chiusura ThreadPoolExecutor globale (wait=%s)...", wait)
    global_thread_pool.shutdown(wait=wait)

