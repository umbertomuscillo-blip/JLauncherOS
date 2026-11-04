"""Test suite per le nuove funzionalità LaunchMe in JLauncherOS:
Clipboard Manager, Media Controller, Drop Shelf & AirDrop, Weather Service,
Spaces/Workflows e System App Scanner.
"""

import pytest

from core.router import IPCRouter
from modules.clipboard import clipboard_manager
from modules.media import media_controller
from modules.shelf import shelf_manager
from modules.spaces import spaces_manager
from modules.system_apps import app_scanner
from modules.weather import weather_service


@pytest.mark.asyncio
async def test_clipboard_manager_history_and_copy():
    """Verifica che la cronologia appunti filtri e memorizzi correttamente."""
    history = await clipboard_manager.get_history_async(filter_type="all")
    assert isinstance(history, list)
    assert len(history) > 0

    # Verifica filtro colori
    colors = await clipboard_manager.get_history_async(filter_type="color")
    assert all(c["content_type"] == "color" for c in colors)

    # Verifica copia di un elemento
    if colors:
        success = await clipboard_manager.copy_item_async(colors[0]["item_id"])
        assert success is True


@pytest.mark.asyncio
async def test_media_controller_playback_and_seek():
    """Verifica che il media controller aggiorni stato e traccia."""
    # Force simulated player mode for unit test determinism
    media_controller._current_track["player_app"] = "Vinyl Studio"
    media_controller._current_track["is_playing"] = False

    state = await media_controller.get_playback_state_async()
    assert "title" in state
    assert "artist" in state
    assert "is_playing" in state
    initial_playing = state["is_playing"]

    # Toggle play/pause
    toggled = await media_controller.control_playback_async("play_pause")
    assert toggled["is_playing"] != initial_playing

    # Seek
    seeked = await media_controller.seek_async(120)
    assert seeked["position_seconds"] == 120


@pytest.mark.asyncio
async def test_shelf_and_airdrop():
    """Verifica le operazioni sulla Pocket Shelf del Notch."""
    # Aggiunta file
    new_item = shelf_manager.add_file(name="MockDesign.sketch", size_bytes=1048576)
    assert new_item["name"] == "MockDesign.sketch"
    assert new_item["file_type"] == "file"

    items = shelf_manager.get_items()
    assert any(i["item_id"] == new_item["item_id"] for i in items)

    # Test trigger AirDrop
    air_res = await shelf_manager.airdrop_file_async(new_item["item_id"])
    assert air_res["status"] == "airdrop_invoked"

    # Rimozione
    removed = shelf_manager.remove_item(new_item["item_id"])
    assert removed is True


@pytest.mark.asyncio
async def test_weather_service():
    """Verifica il servizio meteo con previsione oraria e settimanale."""
    weather = await weather_service.get_weather_async(city="Cupertino")
    assert weather["city"] == "Cupertino"
    assert "temperature" in weather
    assert "condition" in weather
    assert len(weather["hourly"]) > 0
    assert len(weather["daily"]) > 0


@pytest.mark.asyncio
async def test_spaces_and_workflows():
    """Verifica la commutazione degli Spaces e l'import/export .launchmespaces."""
    all_spaces = spaces_manager.get_all_spaces()
    assert len(all_spaces["spaces"]) >= 4

    # Switch space
    switched = spaces_manager.switch_space("space_design")
    assert switched is not None
    assert switched["id"] == "space_design"

    # Export space
    exported = spaces_manager.export_space("space_design")
    assert exported["format"] == "launchmespaces"
    assert exported["space"]["name"] == "Design & 3D Studio"

    # Batch launch workflow simulation
    launch_res = await spaces_manager.batch_launch_workflow_async("space_design")
    assert launch_res["success"] is True


@pytest.mark.asyncio
async def test_app_scanner_and_uninstall_preview():
    """Verifica la scansione delle app e l'anteprima disinstallazione pulita."""
    apps = await app_scanner.get_applications_async()
    assert isinstance(apps, list)
    assert len(apps) > 0
    assert any(a["category"] in ("Dev", "Design", "Productivity", "Media", "Utilities", "System") for a in apps)

    # Anteprima disinstallazione
    preview = await app_scanner.get_uninstall_preview_async("/Applications/Safari.app")
    assert "remnants" in preview
    assert "total_bytes" in preview


@pytest.mark.asyncio
async def test_router_dispatch_new_methods():
    """Verifica l'intero ciclo di routing JSON-RPC per i nuovi comandi."""
    router = IPCRouter(expected_auth_token="TEST_SECRET")

    # 1. Handshake
    hs_req = '{"jsonrpc": "2.0", "id": 1, "method": "system.handshake", "params": {"auth_token": "TEST_SECRET"}}'
    hs_resp, is_auth = await router.dispatch(hs_req, False)
    assert is_auth is True

    # 2. clipboard.getHistory
    clip_req = '{"jsonrpc": "2.0", "id": 2, "method": "clipboard.getHistory", "params": {"filter_type": "all"}}'
    clip_resp, _ = await router.dispatch(clip_req, True)
    assert '"count":' in clip_resp

    # 3. weather.getCurrent
    w_req = '{"jsonrpc": "2.0", "id": 3, "method": "weather.getCurrent", "params": {"city": "Rome"}}'
    w_resp, _ = await router.dispatch(w_req, True)
    assert '"Rome"' in w_resp

    # 4. spaces.getSpaces
    sp_req = '{"jsonrpc": "2.0", "id": 4, "method": "spaces.getSpaces", "params": {}}'
    sp_resp, _ = await router.dispatch(sp_req, True)
    assert '"space_coding"' in sp_resp
