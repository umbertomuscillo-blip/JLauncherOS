#!/usr/bin/env python3
"""JARVIS Core Daemon - JLauncherOS Backend (Fase 1).

Implementa il bootstrap dell'event loop asyncio puro, il Watchdog PPID
per l'annientamento dei processi zombie e la gestione pulita dei segnali Unix.
"""

import asyncio
import logging
import os
import signal
import sys
from typing import Optional, Set

from config.settings import settings
from core.router import IPCRouter
from core.server import IPCWebSocketServer
from core.thread_pool import shutdown_thread_pool

# Configurazione logging avanzato (Zero Silent Failures)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("jlauncheros.backend")


async def ppid_watchdog(interval: float = 1.0) -> None:
    """Watchdog asincrono anti-zombie.

    Verifica periodicamente che il processo genitore (Tauri Host) sia in vita.
    Se il genitore crasha, il processo viene riassegnato a PID 1 (launchd/init).
    In tal caso il demone si auto-termina immediatamente.
    """
    logger.info(
        "PPID Watchdog avviato (intervallo: %.1fs, Genitore Iniziale PID: %d)",
        interval,
        os.getppid(),
    )
    try:
        while True:
            await asyncio.sleep(interval)
            current_ppid = os.getppid()
            if current_ppid == 1:
                logger.critical(
                    "Parent process (Tauri) terminato inaspettatamente (PPID=1). "
                    "Auto-terminazione immediata per Protocollo Zero Zombie."
                )
                try:
                    sys.exit(0)
                finally:
                    os._exit(0)
    except asyncio.CancelledError:
        logger.info("PPID Watchdog arrestato normalmente.")
        raise
    except Exception as exc:
        logger.error("Errore critico inatteso nel PPID Watchdog: %s", exc, exc_info=True)
        sys.exit(1)


async def daemon_lifecycle(shutdown_event: asyncio.Event) -> None:
    """Lifecycle principale del demone backend."""
    logger.info("JARVIS Daemon attivo e in ascolto. Radice: %s", settings.PROJECT_ROOT)
    logger.info("IPC Secret presente: %s", bool(settings.JLAUNCHER_IPC_SECRET))

    router = IPCRouter(expected_auth_token=settings.JLAUNCHER_IPC_SECRET)
    server = IPCWebSocketServer(
        host=settings.WS_HOST,
        port=settings.WS_PORT,
        router=router,
    )

    await server.start()

    try:
        # Attende fino all'innesco del segnale di shutdown
        await shutdown_event.wait()
        logger.info("Ricevuta notifica di terminazione nel lifecycle del demone.")
    except asyncio.CancelledError:
        logger.info("Task daemon_lifecycle cancellato. Chiusura pulita di IPCWebSocketServer...")
        await server.stop()
        raise
    finally:
        await server.stop()


async def shutdown(loop: asyncio.AbstractEventLoop, sig: signal.Signals, shutdown_event: asyncio.Event) -> None:
    """Esegue il Graceful Shutdown cancellando tutti i task pendenti."""
    logger.info("Segnale di terminazione intercettato: %s. Avvio Graceful Shutdown...", sig.name)
    shutdown_event.set()

    tasks: Set[asyncio.Task] = {
        t for t in asyncio.all_tasks(loop=loop) if t is not asyncio.current_task(loop=loop)
    }

    if not tasks:
        logger.info("Nessun task asincrono residuo da cancellare.")
        return

    logger.info("Cancellazione di %d task asincroni pendenti...", len(tasks))
    for task in tasks:
        task.cancel()

    # Attesa della cancellazione di tutti i task
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for res in results:
        if isinstance(res, Exception) and not isinstance(res, asyncio.CancelledError):
            logger.error("Eccezione durante la cancellazione dei task: %s", res, exc_info=True)

    # Chiusura ordinata del pool di thread globale (Protocollo Zero Zombie)
    shutdown_thread_pool(wait=True)
    logger.info("Graceful Shutdown completato con successo.")


def register_signal_handlers(loop: asyncio.AbstractEventLoop, shutdown_event: asyncio.Event) -> None:
    """Registra gli handler asincroni per SIGINT e SIGTERM nell'event loop."""
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(
                sig,
                lambda s=sig: asyncio.create_task(shutdown(loop, s, shutdown_event)),
            )
            logger.debug("Signal handler registrato per %s", sig.name)
        except (NotImplementedError, RuntimeError) as exc:
            logger.warning("Impossibile registrare signal handler per %s: %s", sig.name, exc)


async def main() -> None:
    """Entry-point asincrono primario del demone."""
    loop = asyncio.get_running_loop()
    shutdown_event = asyncio.Event()

    # Registrazione signal handler
    register_signal_handlers(loop, shutdown_event)

    # Avvio task di supervisione Zero Zombie
    watchdog_task = asyncio.create_task(
        ppid_watchdog(interval=settings.WATCHDOG_INTERVAL_SECONDS),
        name="ppid_watchdog",
    )

    try:
        # Avvio ciclo di vita del demone
        await daemon_lifecycle(shutdown_event)
    except asyncio.CancelledError:
        logger.info("Ciclo principale del demone cancellato.")
    except Exception as exc:
        logger.error("Errore irreversibile nel main loop: %s", exc, exc_info=True)
        sys.exit(1)
    finally:
        if not watchdog_task.done():
            watchdog_task.cancel()
            try:
                await watchdog_task
            except asyncio.CancelledError:
                pass
        shutdown_thread_pool(wait=False)


if __name__ == "__main__":
    logger.info("Inizializzazione JARVIS Backend Daemon (PID: %d)...", os.getpid())
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Interruzione da tastiera rilevata. Uscita completata.")
    except Exception as err:
        logger.error("Crash non gestito durante l'esecuzione: %s", err, exc_info=True)
        sys.exit(1)
    logger.info("JARVIS Backend Daemon terminato con codice 0.")
    sys.exit(0)
