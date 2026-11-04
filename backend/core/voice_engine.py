"""Voice Engine per JARVIS su Apple Silicon M4.

Gestisce la macchina a 4 stati vocali della Dynamic Notch (idle, listening, thinking, speaking)
e la trascrizione locale, integrandosi con il FocusManager.
"""

import asyncio
import inspect
import logging
from typing import Any, Callable, Dict, Literal, Optional

from .focus_manager import focus_manager

logger = logging.getLogger("jlauncheros.voice_engine")

VoiceState = Literal["idle", "listening", "thinking", "speaking"]


class VoiceEngine:
    """Motore vocale locale ottimizzato per Apple Silicon M4."""

    def __init__(self) -> None:
        self.state: VoiceState = "idle"
        self.sample_rate: int = 16000
        self.is_listening: bool = False
        self._event_broadcaster: Optional[Callable[[str, Dict[str, Any]], Any]] = None

    def set_broadcaster(self, broadcaster: Callable[[str, Dict[str, Any]], Any]) -> None:
        """Configura il callback per inviare eventi push via WebSocket alla Dynamic Notch."""
        self._event_broadcaster = broadcaster

    async def _emit_state(self, new_state: VoiceState, amplitude: float = 0.0) -> None:
        """Invia notifica di transizione di stato della Notch."""
        self.state = new_state
        if self._event_broadcaster:
            payload = {
                "state": new_state,
                "audio_amplitude": amplitude,
                "energy_frequency": [0.1, 0.3, 0.7, 0.4, 0.2] if new_state == "speaking" else [],
            }
            if inspect.iscoroutinefunction(self._event_broadcaster):
                await self._event_broadcaster("event.voice.stateChanged", payload)
            else:
                self._event_broadcaster("event.voice.stateChanged", payload)

    async def start_listening(self) -> Dict[str, Any]:
        """Attiva la cattura vocale locale."""
        if focus_manager.is_silenced():
            logger.info("Avvio ascolto in Focus Mode (%s): audio discreto attivo.", focus_manager.active_mode)

        self.is_listening = True
        logger.info("VoiceEngine: Inizio ascolto microfono a %d Hz...", self.sample_rate)
        await self._emit_state("listening", amplitude=0.45)

        return {
            "listening": True,
            "sample_rate": self.sample_rate,
        }

    async def stop_listening(self) -> Dict[str, Any]:
        """Arresta la cattura vocale ritornando a stato idle."""
        self.is_listening = False
        logger.info("VoiceEngine: Ascolto terminato.")
        await self._emit_state("idle", amplitude=0.0)

        return {"listening": False}

    async def simulate_interaction(self, user_text: str) -> None:
        """Simula una sequenza vocale completa per test e animazione 120 FPS della Notch."""
        await self._emit_state("listening", amplitude=0.6)
        await asyncio.sleep(0.3)

        # Trascrizione
        if self._event_broadcaster:
            transcript_payload = {
                "is_final": True,
                "text": user_text,
                "confidence": 0.98,
            }
            if inspect.iscoroutinefunction(self._event_broadcaster):
                await self._event_broadcaster("event.voice.transcript", transcript_payload)
            else:
                self._event_broadcaster("event.voice.transcript", transcript_payload)

        # Thinking
        await self._emit_state("thinking", amplitude=0.2)
        await asyncio.sleep(0.3)

        # Speaking
        await self._emit_state("speaking", amplitude=0.85)
        await asyncio.sleep(0.5)

        # Idle
        await self._emit_state("idle", amplitude=0.0)


voice_engine = VoiceEngine()
