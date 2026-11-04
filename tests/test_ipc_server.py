"""Automated test suite for JLauncherOS IPC WebSocket Server & Router (Fase 2).

Testa:
1. Rifiuto con codice -32005 se un client chiama metodi prima di system.handshake o con token errato.
2. Handshake valido con token corretto e ritorno di status == 'authenticated'.
3. Chiamata a system.setFocusMode e gestione errori (-32601 e -32602).
4. Ricezione istantanea di notifiche push via server.broadcast_event.
5. Benchmark RTT su loopback < 2.0ms.
"""

import asyncio
import json
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path

# Assicura import dal backend
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import pytest
import websockets
from core.router import (
    AUTHENTICATION_FAILURE,
    INVALID_PARAMS,
    METHOD_NOT_FOUND,
    IPCRouter,
)
from core.server import IPCWebSocketServer

TEST_TOKEN = "test-secret-uuid-v4-abc123"
TEST_PORT = 9876  # Porta dedicata per i test unitari isolati


@asynccontextmanager
async def run_ipc_server():
    """Async context manager che avvia un server IPC isolato su porta di test."""
    router = IPCRouter(expected_auth_token=TEST_TOKEN)
    server = IPCWebSocketServer(host="127.0.0.1", port=TEST_PORT, router=router)
    await server.start()
    await asyncio.sleep(0.05)
    try:
        yield server
    finally:
        await server.stop()


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected():
    """Verifica che invocare metodi prima di system.handshake ritorni -32005."""
    async with run_ipc_server():
        uri = f"ws://127.0.0.1:{TEST_PORT}/ws"
        async with websockets.connect(uri) as ws:
            req = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "system.ping",
                "params": {"timestamp": 123456},
            }
            await ws.send(json.dumps(req))
            resp_raw = await ws.recv()
            resp = json.loads(resp_raw)

            assert resp.get("jsonrpc") == "2.0"
            assert resp.get("id") == 1
            assert "error" in resp
            assert resp["error"]["code"] == AUTHENTICATION_FAILURE
            assert "Authentication Failure" in resp["error"]["message"]


@pytest.mark.asyncio
async def test_invalid_token_handshake_rejected():
    """Verifica che un token errato durante l'handshake venga rifiutato con -32005."""
    async with run_ipc_server():
        uri = f"ws://127.0.0.1:{TEST_PORT}/ws"
        async with websockets.connect(uri) as ws:
            req = {
                "jsonrpc": "2.0",
                "id": "h1",
                "method": "system.handshake",
                "params": {
                    "auth_token": "token-sbagliato-non-valido",
                    "client_version": "1.0.0",
                },
            }
            await ws.send(json.dumps(req))
            resp_raw = await ws.recv()
            resp = json.loads(resp_raw)

            assert resp.get("id") == "h1"
            assert "error" in resp
            assert resp["error"]["code"] == AUTHENTICATION_FAILURE


@pytest.mark.asyncio
async def test_successful_handshake_and_focus_mode():
    """Verifica handshake con successo e successiva invocazione di system.setFocusMode."""
    async with run_ipc_server():
        uri = f"ws://127.0.0.1:{TEST_PORT}/ws"
        async with websockets.connect(uri) as ws:
            # 1. Handshake valido
            handshake_req = {
                "jsonrpc": "2.0",
                "id": "h2",
                "method": "system.handshake",
                "params": {"auth_token": TEST_TOKEN, "client_version": "1.0.0"},
            }
            await ws.send(json.dumps(handshake_req))
            resp1 = json.loads(await ws.recv())

            assert resp1.get("id") == "h2"
            assert "result" in resp1
            assert resp1["result"]["status"] == "authenticated"
            assert resp1["result"]["system_mode"] == "NORMAL"

            # 2. Invocazione system.setFocusMode
            focus_req = {
                "jsonrpc": "2.0",
                "id": "f1",
                "method": "system.setFocusMode",
                "params": {
                    "mode": "DEEP_WORK",
                    "duration_minutes": 45,
                    "silence_audio": True,
                },
            }
            await ws.send(json.dumps(focus_req))
            resp2 = json.loads(await ws.recv())

            assert resp2.get("id") == "f1"
            assert "result" in resp2
            assert resp2["result"]["previous_mode"] == "NORMAL"
            assert resp2["result"]["active_mode"] == "DEEP_WORK"


@pytest.mark.asyncio
async def test_method_not_found_and_invalid_params():
    """Verifica codici -32601 (Method not found) e -32602 (Invalid params)."""
    async with run_ipc_server():
        uri = f"ws://127.0.0.1:{TEST_PORT}/ws"
        async with websockets.connect(uri) as ws:
            # Autenticazione
            await ws.send(
                json.dumps({
                    "jsonrpc": "2.0",
                    "id": "init",
                    "method": "system.handshake",
                    "params": {"auth_token": TEST_TOKEN},
                })
            )
            await ws.recv()

            # 1. Metodo inesistente
            await ws.send(
                json.dumps({
                    "jsonrpc": "2.0",
                    "id": 10,
                    "method": "unknown.fakeMethod",
                })
            )
            resp1 = json.loads(await ws.recv())
            assert resp1["error"]["code"] == METHOD_NOT_FOUND

            # 2. Parametri non validi per system.setFocusMode
            await ws.send(
                json.dumps({
                    "jsonrpc": "2.0",
                    "id": 11,
                    "method": "system.setFocusMode",
                    "params": {"mode": "MODO_NON_VALIDO"},
                })
            )
            resp2 = json.loads(await ws.recv())
            assert resp2["error"]["code"] == INVALID_PARAMS


@pytest.mark.asyncio
async def test_broadcast_push_event():
    """Verifica invio e ricezione immediata di notifiche push broadcast senza campo id."""
    async with run_ipc_server() as server:
        uri = f"ws://127.0.0.1:{TEST_PORT}/ws"
        async with websockets.connect(uri) as ws:
            # Autenticazione
            await ws.send(
                json.dumps({
                    "jsonrpc": "2.0",
                    "id": "auth",
                    "method": "system.handshake",
                    "params": {"auth_token": TEST_TOKEN},
                })
            )
            await ws.recv()

            # Emissione broadcast dal demone
            event_payload = {
                "state": "speaking",
                "audio_amplitude": 0.82,
                "energy_frequency": [0.2, 0.5, 0.9],
            }
            await server.broadcast_event("event.voice.stateChanged", event_payload)

            # Il client riceve la notifica push
            push_raw = await asyncio.wait_for(ws.recv(), timeout=1.0)
            push_data = json.loads(push_raw)

            assert push_data.get("jsonrpc") == "2.0"
            assert "id" not in push_data  # Assenza formale del campo id
            assert push_data.get("method") == "event.voice.stateChanged"
            assert push_data["params"]["state"] == "speaking"
            assert push_data["params"]["audio_amplitude"] == 0.82


@pytest.mark.asyncio
async def test_loopback_rtt_benchmark():
    """Benchmark RTT: esegue 10 chiamate system.ping consecutive con RTT medio < 2.0ms."""
    async with run_ipc_server():
        uri = f"ws://127.0.0.1:{TEST_PORT}/ws"
        async with websockets.connect(uri) as ws:
            # Autenticazione
            await ws.send(
                json.dumps({
                    "jsonrpc": "2.0",
                    "id": "auth",
                    "method": "system.handshake",
                    "params": {"auth_token": TEST_TOKEN},
                })
            )
            await ws.recv()

            rtt_samples = []
            iterations = 10

            for i in range(iterations):
                t_start = time.perf_counter()
                req = {
                    "jsonrpc": "2.0",
                    "id": f"ping_{i}",
                    "method": "system.ping",
                    "params": {"timestamp": int(time.time() * 1000)},
                }
                await ws.send(json.dumps(req))
                resp_raw = await ws.recv()
                t_end = time.perf_counter()

                resp = json.loads(resp_raw)
                assert resp.get("id") == f"ping_{i}"
                assert resp["result"]["pong"] is True

                rtt_ms = (t_end - t_start) * 1000.0
                rtt_samples.append(rtt_ms)

            mean_rtt = sum(rtt_samples) / len(rtt_samples)
            min_rtt = min(rtt_samples)
            max_rtt = max(rtt_samples)

            print(
                f"\n[Benchmark RTT Loopback] Media: {mean_rtt:.2f}ms | Min: {min_rtt:.2f}ms | Max: {max_rtt:.2f}ms"
            )

            # Requisito ferreo: latenza media RTT < 2.0ms su localhost
            assert mean_rtt < 2.0, f"RTT medio ({mean_rtt:.2f}ms) supera la soglia di 2.0ms!"
