"""APFS Storage Monitor: Telemetria e Rilevamento Spazio Critico su macOS."""

import logging
import os
import shutil
from typing import Any, Dict, Optional

logger = logging.getLogger("jlauncheros.help_memoria.monitor")


def format_bytes(size: float) -> str:
    """Converte una dimensione in byte in stringa formattata leggibile dall'utente."""
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} PB"


class APFSMonitor:
    """Monitoraggio telemetrico delle partizioni APFS e soglie di allarme."""

    def __init__(self, mount_point: str = "/") -> None:
        self.mount_point: str = mount_point

    def get_telemetry(self) -> Dict[str, Any]:
        """Restituisce le statistiche di utilizzo storage correnti."""
        try:
            total, used, free = shutil.disk_usage(self.mount_point)
            pct_used = round((used / total) * 100.0, 1) if total > 0 else 0.0

            telemetry = {
                "mount_point": self.mount_point,
                "total_bytes": total,
                "used_bytes": used,
                "available_bytes": free,
                "available_human": format_bytes(free),
                "total_human": format_bytes(total),
                "used_percentage": pct_used,
            }
            return telemetry
        except Exception as exc:
            logger.error("Errore durante la lettura delle statistiche disco per %s: %s", self.mount_point, exc, exc_info=True)
            return {
                "mount_point": self.mount_point,
                "total_bytes": 0,
                "used_bytes": 0,
                "available_bytes": 0,
                "available_human": "0 B",
                "total_human": "0 B",
                "used_percentage": 0.0,
            }

    def check_alarm(self) -> Optional[Dict[str, Any]]:
        """Verifica se lo spazio libero è sceso sotto le soglie di sicurezza."""
        telemetry = self.get_telemetry()
        free_bytes = telemetry["available_bytes"]

        # Soglie: CRITICAL < 5 GB, WARNING < 15 GB
        five_gb = 5 * 1024 * 1024 * 1024
        fifteen_gb = 15 * 1024 * 1024 * 1024

        if free_bytes < five_gb and free_bytes > 0:
            return {
                "mount_point": self.mount_point,
                "available_bytes": free_bytes,
                "available_human": telemetry["available_human"],
                "severity": "CRITICAL",
                "recommendation": "Spazio libero critico (< 5GB). Eseguire pulizia immediata con Help Memoria.",
            }
        elif free_bytes < fifteen_gb and free_bytes > 0:
            return {
                "mount_point": self.mount_point,
                "available_bytes": free_bytes,
                "available_human": telemetry["available_human"],
                "severity": "WARNING",
                "recommendation": "Spazio libero ridotto (< 15GB). Considerare l'eliminazione di Xcode DerivedData o cache.",
            }
        return None


apfs_monitor = APFSMonitor()
