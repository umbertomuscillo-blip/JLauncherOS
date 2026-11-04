"""Settings and configuration management for JLauncherOS backend.

Garantisce la risoluzione assoluta di tutti i percorsi e la configurazione
delle variabili IPC di sessione conformemente alle regole architetturali.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurazione centrale di JARVIS Daemon."""

    # Percorsi assoluti robusti
    BACKEND_DIR: Path = Path(__file__).resolve().parent.parent
    PROJECT_ROOT: Path = Path(__file__).resolve().parent.parent.parent

    # Rete e trasporto IPC
    WS_HOST: str = "127.0.0.1"
    WS_PORT: int = 8765

    # Token di sicurezza effimero iniettato da Tauri Host
    JLAUNCHER_IPC_SECRET: str = ""

    # Parametri Zero Zombie Watchdog
    WATCHDOG_INTERVAL_SECONDS: float = 1.0

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


# Istanza singleton delle impostazioni
settings = Settings()
