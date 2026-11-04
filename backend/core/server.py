"""WebSocket Server per il Bridge IPC di JLauncherOS.

Gestisce il trasporto bidirezionale su loopback con websockets,
autenticazione delle connessioni e broadcast di eventi push alla Dynamic Notch.
"""

import asyncio
import logging
from typing import Any, Dict, Optional, Set

import websockets
import websockets.asyncio.server
from websockets.exceptions import ConnectionClosed

from .router import IPCRouter, JsonRpcNotification

logger = logging.getLogger("jlauncheros.ipc_server")


class IPCWebSocketServer:
    """Server WebSocket asincrono locale per la comunicazione IPC."""

    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 8765,
        router: Optional[IPCRouter] = None,
    ) -> None:
        self.host: str = host
        self.port: int = port
        self.router: IPCRouter = router or IPCRouter()
        self.router.set_broadcaster(self.broadcast_event)
        self.connected_clients: Set[Any] = set()
        self.authenticated_clients: Set[Any] = set()
        self._server: Optional[Any] = None
        self._is_running: bool = False

    async def handler(self, websocket: Any) -> None:
        """Gestisce il ciclo di vita di una singola connessione WebSocket client."""
        client_address = getattr(websocket, "remote_address", ("unknown", 0))
        logger.info("Nuova connessione client stabilita da %s", client_address)

        self.connected_clients.add(websocket)
        is_authenticated = False

        try:
            async for raw_message in websocket:
                if not isinstance(raw_message, str):
                    raw_message = raw_message.decode("utf-8")

                response_str, newly_auth = await self.router.dispatch(
                    raw_message=raw_message,
                    is_authenticated=is_authenticated,
                )

                if newly_auth:
                    is_authenticated = True
                    self.authenticated_clients.add(websocket)
                    logger.info("Client %s promosso a stato AUTENTICATO.", client_address)

                if response_str:
                    await websocket.send(response_str)

        except ConnectionClosed as close_err:
            logger.info("Connessione client %s terminata: %s", client_address, close_err)
        except Exception as exc:
            logger.error(
                "Eccezione inattesa nel loop del client %s: %s",
                client_address,
                exc,
                exc_info=True,
            )
        finally:
            # Protezione Zero Memory Leak
            self.connected_clients.discard(websocket)
            self.authenticated_clients.discard(websocket)
            logger.debug("Client %s rimosso da tutti i set di connessione.", client_address)

    async def broadcast_event(self, method: str, params: Optional[Dict[str, Any]] = None) -> None:
        """Invia una notifica push (JSON-RPC senza id) a tutti i client autenticati."""
        if not self.authenticated_clients:
            return

        notification = JsonRpcNotification(method=method, params=params or {})
        payload = notification.model_dump_json()

        targets = list(self.authenticated_clients)
        results = await asyncio.gather(
            *(client.send(payload) for client in targets),
            return_exceptions=True,
        )

        for client, res in zip(targets, results):
            if isinstance(res, Exception):
                logger.warning("Fallimento nell'invio broadcast a %s: %s", client, res)

    async def start(self) -> None:
        """Avvia il server WebSocket in ascolto sulla porta configurata."""
        if self._is_running:
            logger.warning("IPCWebSocketServer è già in esecuzione.")
            return

        logger.info("Avvio IPCWebSocketServer su ws://%s:%d/ws...", self.host, self.port)
        self._server = await websockets.asyncio.server.serve(
            self.handler,
            self.host,
            self.port,
            ping_interval=3,
            ping_timeout=3,
        )
        self._is_running = True
        logger.info("IPCWebSocketServer attivo su ws://%s:%d/ws", self.host, self.port)

    async def stop(self) -> None:
        """Arresta ordinatamente il server chiudendo tutte le connessioni attive."""
        logger.info("Arresto di IPCWebSocketServer in corso...")
        self._is_running = False

        # Chiusura di tutti i client connessi
        all_clients = list(self.connected_clients)
        if all_clients:
            logger.info("Chiusura forzata di %d client connessi...", len(all_clients))
            await asyncio.gather(
                *(client.close(code=1001, reason="Server shutting down") for client in all_clients),
                return_exceptions=True,
            )

        self.connected_clients.clear()
        self.authenticated_clients.clear()

        if self._server:
            self._server.close()
            await self._server.wait_closed()
            self._server = None

        logger.info("IPCWebSocketServer arrestato con successo.")
