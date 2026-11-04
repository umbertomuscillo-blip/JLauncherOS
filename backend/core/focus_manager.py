"""Focus Manager per il controllo degli stati cognitivi in JLauncherOS.

Gestisce la transizione atomica tra NORMAL, DEEP_WORK e STUDY.
Nelle modalità DEEP_WORK e STUDY, sopprime notifiche sonore e pop-up invasivi.
"""

import datetime
import logging
from typing import Callable, List, Literal, Optional

logger = logging.getLogger("jlauncheros.focus_manager")

FocusModeType = Literal["NORMAL", "DEEP_WORK", "STUDY"]


class FocusManager:
    """Gestore centralizzato dello stato di concentrazione e focus."""

    def __init__(self) -> None:
        self.active_mode: FocusModeType = "NORMAL"
        self.expires_at: Optional[datetime.datetime] = None
        self._listeners: List[Callable[[FocusModeType, FocusModeType], None]] = []

    def set_mode(
        self,
        mode: FocusModeType,
        duration_minutes: int = 50,
        silence_audio: bool = True,
    ) -> dict:
        """Imposta la modalità di focus corrente registrando l'orario di scadenza."""
        previous = self.active_mode
        self.active_mode = mode

        if mode != "NORMAL":
            self.expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
                minutes=duration_minutes
            )
        else:
            self.expires_at = None

        logger.info(
            "Transizione Focus Mode: %s -> %s (Durata: %d min, Silenzioso: %s)",
            previous,
            self.active_mode,
            duration_minutes,
            silence_audio,
        )

        for listener in self._listeners:
            try:
                listener(previous, self.active_mode)
            except Exception as exc:
                logger.error("Errore nel listener di FocusManager: %s", exc, exc_info=True)

        return {
            "previous_mode": previous,
            "active_mode": self.active_mode,
            "expires_at": self.expires_at.isoformat() if self.expires_at else "",
        }

    def is_silenced(self) -> bool:
        """Ritorna True se la modalità corrente richiede silenzio assoluto."""
        return self.active_mode in ("DEEP_WORK", "STUDY")

    def register_listener(self, callback: Callable[[FocusModeType, FocusModeType], None]) -> None:
        """Registra un callback invocato ad ogni cambio di stato."""
        self._listeners.append(callback)


# Istanza singleton globale
focus_manager = FocusManager()
