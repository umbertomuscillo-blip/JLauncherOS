"""Test suite per i moduli fusi di JLauncherOS (Fase 3).

Verifica:
1. APFSMonitor: calcolo telemetria e soglie allarmi.
2. DiskScanner: scansione offloadata su ThreadPoolExecutor con streaming progress.
3. CacheCleaner: operazione di pulizia (dry run).
4. PrompterrrPipeline: pipeline dual-stage Architetto-Critico e streaming token.
5. VoiceEngine: transizioni stati della Dynamic Notch.
6. Invocazione end-to-end via WebSocket per i namespace memory, prompterrr, voice e media.
"""

import asyncio
import json
import sys
from contextlib import asynccontextmanager
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import pytest
import websockets
from core.focus_manager import focus_manager
from core.router import IPCRouter
from core.server import IPCWebSocketServer
from core.thread_pool import global_thread_pool, run_in_thread_pool
from core.voice_engine import voice_engine
from modules.help_memoria.apfs_monitor import apfs_monitor
from modules.help_memoria.cleaner import cleaner
from modules.help_memoria.disk_scanner import disk_scanner
from modules.prompterrr.pipeline import prompterrr_pipeline

TEST_TOKEN = "fused-modules-test-secret"
TEST_PORT = 9877


@asynccontextmanager
async def run_fused_server():
    """Avvia un'istanza del server con tutti i moduli cablati su porta 9877."""
    router = IPCRouter(expected_auth_token=TEST_TOKEN)
    server = IPCWebSocketServer(host="127.0.0.1", port=TEST_PORT, router=router)
    await server.start()
    await asyncio.sleep(0.05)
    try:
        yield server
    finally:
        await server.stop()


@pytest.mark.asyncio
async def test_apfs_monitor_telemetry():
    """Verifica che il monitor APFS restituisca dati di spazio validi."""
    telemetry = apfs_monitor.get_telemetry()
    assert telemetry["total_bytes"] > 0
    assert telemetry["available_bytes"] > 0
    assert "GB" in telemetry["available_human"] or "MB" in telemetry["available_human"]


@pytest.mark.asyncio
async def test_disk_scanner_offloading():
    """Verifica che la scansione disco avvenga senza bloccare e restituisca metriche."""
    progress_events = []

    async def on_progress(p):
        progress_events.append(p)

    res = await disk_scanner.scan_targets(
        targets=["caches"],
        deep_scan=False,
        progress_callback=on_progress,
    )
    assert res["status"] == "completed"
    assert "discovered_cleanable_bytes" in res
    assert len(progress_events) >= 1
    assert progress_events[-1]["percentage"] == 100.0


@pytest.mark.asyncio
async def test_cache_cleaner_dry_run():
    """Verifica che la pulizia in modalità dry_run calcoli i byte senza rimuovere file."""
    res = await cleaner.clean_categories(["caches"], dry_run=True)
    assert res["dry_run"] is True
    assert "freed_bytes" in res
    assert "freed_human" in res


@pytest.mark.asyncio
async def test_prompterrr_pipeline_execution():
    """Verifica l'esecuzione della pipeline Architetto-Critico e lo streaming token."""
    token_chunks = []

    async def on_token(t):
        token_chunks.append(t)

    res = await prompterrr_pipeline.execute(
        prompt_input="Genera un componente per display ProMotion a 120 FPS.",
        context_files=[],
        token_callback=on_token,
    )
    assert res["pipeline_id"].startswith("pipe_")
    assert "CRITIC REFINEMENT" in res["final_prompt"]
    assert len(token_chunks) > 0


@pytest.mark.asyncio
async def test_voice_engine_and_focus():
    """Verifica le transizioni della macchina a stati vocale e il FocusManager."""
    focus_manager.set_mode("DEEP_WORK", duration_minutes=30)
    assert focus_manager.is_silenced() is True

    start_res = await voice_engine.start_listening()
    assert start_res["listening"] is True
    assert voice_engine.state == "listening"

    stop_res = await voice_engine.stop_listening()
    assert stop_res["listening"] is False
    assert voice_engine.state == "idle"

    # Reset
    focus_manager.set_mode("NORMAL")


@pytest.mark.asyncio
async def test_full_fused_ipc_interaction():
    """Test di integrazione WebSocket end-to-end con i moduli fusi."""
    async with run_fused_server():
        uri = f"ws://127.0.0.1:{TEST_PORT}/ws"
        async with websockets.connect(uri) as ws:
            # 1. Autenticazione
            await ws.send(
                json.dumps({
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "system.handshake",
                    "params": {"auth_token": TEST_TOKEN},
                })
            )
            auth_resp = json.loads(await ws.recv())
            assert auth_resp["result"]["status"] == "authenticated"

            # 2. memory.triggerDiskScan via IPC
            await ws.send(
                json.dumps({
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "memory.triggerDiskScan",
                    "params": {"targets": ["logs"]},
                })
            )

            # Ricezione di eventuali progress events e risposta finale
            final_resp = None
            for _ in range(5):
                msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=2.0))
                if msg.get("id") == 2:
                    final_resp = msg
                    break

            assert final_resp is not None
            assert final_resp["result"]["status"] == "completed"

            # 3. voice.startListening via IPC
            await ws.send(
                json.dumps({
                    "jsonrpc": "2.0",
                    "id": 3,
                    "method": "voice.startListening",
                    "params": {},
                })
            )
            voice_resp = json.loads(await ws.recv())
            # Potrebbe arrivare prima un evento push o la risposta
            if "method" in voice_resp:
                voice_resp = json.loads(await ws.recv())
            assert voice_resp.get("id") == 3
            assert voice_resp["result"]["listening"] is True

            # 4. media.controlPlayback via IPC
            await ws.send(
                json.dumps({
                    "jsonrpc": "2.0",
                    "id": 4,
                    "method": "media.controlPlayback",
                    "params": {"action": "play"},
                })
            )
            media_resp = json.loads(await ws.recv())
            if "method" in media_resp:
                media_resp = json.loads(await ws.recv())
            assert media_resp.get("id") == 4
            assert media_resp["result"]["is_playing"] is True

            # 5. memory.scan via IPC
            await ws.send(
                json.dumps({
                    "jsonrpc": "2.0",
                    "id": 5,
                    "method": "memory.scan",
                    "params": {"targets": ["caches"]},
                })
            )
            scan_resp = None
            for _ in range(5):
                msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
                if msg.get("id") == 5:
                    scan_resp = msg
                    break
            assert scan_resp is not None
            assert scan_resp["result"]["status"] == "completed"
            assert "discovered_cleanable_bytes" in scan_resp["result"]

            # 6. memory.clean via IPC
            await ws.send(
                json.dumps({
                    "jsonrpc": "2.0",
                    "id": 6,
                    "method": "memory.clean",
                    "params": {"categories": ["caches"], "dry_run": True},
                })
            )
            clean_resp = None
            for _ in range(5):
                msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
                if msg.get("id") == 6:
                    clean_resp = msg
                    break
            assert clean_resp is not None
            assert clean_resp["result"]["dry_run"] is True

            # 7. prompterrr.submitPrompt via IPC con token streaming
            await ws.send(
                json.dumps({
                    "jsonrpc": "2.0",
                    "id": 7,
                    "method": "prompterrr.submitPrompt",
                    "params": {
                        "prompt": "Genera architettura a 120 FPS per ProMotion.",
                        "mode": "architect_critic",
                    },
                })
            )
            token_events = []
            submit_resp = None
            for _ in range(25):
                msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
                if msg.get("method") == "event.prompterrr.tokenStream":
                    token_events.append(msg["params"])
                elif msg.get("id") == 7:
                    submit_resp = msg
                    break
            assert len(token_events) > 0
            assert submit_resp is not None
            assert "final_prompt" in submit_resp["result"]


@pytest.mark.asyncio
async def test_thread_pool_topology_and_offloading():
    """Verifica che il ThreadPool sia dimensionato a 8 worker per M4 e offloadi correttamente."""
    assert global_thread_pool._max_workers == 8

    def blocking_calc(val: int) -> int:
        import time
        time.sleep(0.01)
        return val * 2

    res = await run_in_thread_pool(blocking_calc, 21)
    assert res == 42


@pytest.mark.asyncio
async def test_disk_scanner_directory_async():
    """Verifica l'entrypoint asincrono scan_directory_async delegato al thread pool."""
    test_dir = str(BACKEND_DIR / "config")
    progress_captured = []

    async def on_progress(evt_name, payload):
        progress_captured.append((evt_name, payload))

    res = await disk_scanner.scan_directory_async(test_dir, broadcast_cb=on_progress)
    assert res["target"] == test_dir
    assert res["count"] > 0
    assert len(progress_captured) == 1
    assert progress_captured[0][1]["percentage"] == 100

