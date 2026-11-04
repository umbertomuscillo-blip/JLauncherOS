"""Unit tests for Backend settings resolution and absolute paths."""

import sys
from pathlib import Path

# Add backend to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from config.settings import Settings


def test_absolute_paths_resolution():
    settings = Settings()
    assert settings.BACKEND_DIR.is_absolute()
    assert settings.PROJECT_ROOT.is_absolute()
    assert (settings.BACKEND_DIR / "main.py").exists()
    assert (settings.PROJECT_ROOT / "backend").exists()


def test_network_and_ipc_defaults():
    settings = Settings()
    assert settings.WS_HOST == "127.0.0.1"
    assert settings.WS_PORT == 8765
    assert settings.WATCHDOG_INTERVAL_SECONDS == 1.0
