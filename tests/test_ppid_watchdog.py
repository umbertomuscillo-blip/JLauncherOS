"""Unit tests for PPID Watchdog and Zero Zombie mechanisms."""

import asyncio
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import pytest
from main import ppid_watchdog


@pytest.mark.asyncio
async def test_ppid_watchdog_normal_cancel():
    """Verifica che il watchdog gestisca pulitamente la cancellazione."""
    task = asyncio.create_task(ppid_watchdog(interval=0.1))
    await asyncio.sleep(0.2)
    assert not task.done()
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task


@pytest.mark.asyncio
async def test_ppid_watchdog_detects_orphan(monkeypatch):
    """Verifica che quando PPID == 1 il watchdog invochi sys.exit(0)."""
    monkeypatch.setattr(os, "getppid", lambda: 1)
    monkeypatch.setattr(os, "_exit", sys.exit)
    with pytest.raises(SystemExit) as exc_info:
        await ppid_watchdog(interval=0.01)
    assert exc_info.value.code == 0
