"""Modulo Spaces & Workflows Manager per JLauncherOS.

Consente la gestione di profili contestuali di lavoro (es. Design, Coding, Study, Deep Work),
il lancio simultaneo in un click di app e cartelle, e l'import/export in formato .launchmespaces.
"""

import json
import logging
import os
import subprocess
import time
from typing import Any, Dict, List, Optional

from core.thread_pool import run_in_thread_pool

logger = logging.getLogger("jlauncheros.spaces")

SPACES_STORAGE_PATH = os.path.expanduser("~/.jlauncheros/spaces.json")


class SpacesManager:
    """Manager per gli scenari di produttività e Workflows di JLauncherOS."""

    def __init__(self) -> None:
        self._active_space_id: str = "space_coding"
        self._spaces: Dict[str, Dict[str, Any]] = {}
        self._init_defaults()

    def _init_defaults(self) -> None:
        """Configura i profili predefiniti."""
        self._spaces = {
            "space_coding": {
                "id": "space_coding",
                "name": "Coding & Terminal",
                "icon": "code-2",
                "accent_color": "#0a84ff",
                "theme": "frosted_dark",
                "wallpaper": "linear-gradient(135deg, #090d16 0%, #111a2e 100%)",
                "hotkey": "⌥1",
                "apps": [
                    {"name": "Visual Studio Code", "bundle_id": "com.microsoft.VSCode", "path": "/Applications/Visual Studio Code.app"},
                    {"name": "Terminal", "bundle_id": "com.apple.Terminal", "path": "/System/Applications/Utilities/Terminal.app"},
                    {"name": "GitHub Desktop", "bundle_id": "com.github.GitHubClient", "path": "/Applications/GitHub Desktop.app"},
                ],
                "folders": [
                    "/Users/umbertomuscillo/Downloads/JLauncherOS",
                ],
                "layout_grid": "4x6",
            },
            "space_design": {
                "id": "space_design",
                "name": "Design & 3D Studio",
                "icon": "palette",
                "accent_color": "#bf5af2",
                "theme": "liquid_cyan",
                "wallpaper": "linear-gradient(135deg, #1b0a2a 0%, #0d1e30 100%)",
                "hotkey": "⌥2",
                "apps": [
                    {"name": "Figma", "bundle_id": "com.figma.Desktop", "path": "/Applications/Figma.app"},
                    {"name": "Adobe Photoshop", "bundle_id": "com.adobe.Photoshop", "path": "/Applications/Adobe Photoshop Elements 2025.app"},
                    {"name": "CapCut", "bundle_id": "com.lemon.capcut", "path": "/Applications/CapCut.app"},
                ],
                "folders": [
                    "/Users/umbertomuscillo/Downloads",
                ],
                "layout_grid": "3x5",
            },
            "space_study": {
                "id": "space_study",
                "name": "Study & Research",
                "icon": "book-open",
                "accent_color": "#30d158",
                "theme": "neon_glow",
                "wallpaper": "linear-gradient(135deg, #0d1e16 0%, #06130d 100%)",
                "hotkey": "⌥3",
                "apps": [
                    {"name": "Notion", "bundle_id": "notion.id", "path": "/Applications/Notion.app"},
                    {"name": "Safari", "bundle_id": "com.apple.Safari", "path": "/Applications/Safari.app"},
                    {"name": "Notes", "bundle_id": "com.apple.Notes", "path": "/System/Applications/Notes.app"},
                ],
                "folders": [
                    "/Users/umbertomuscillo/Documents",
                ],
                "layout_grid": "4x6",
            },
            "space_deep_work": {
                "id": "space_deep_work",
                "name": "Deep Work & Focus",
                "icon": "zap",
                "accent_color": "#ff9f0a",
                "theme": "oled_black",
                "wallpaper": "linear-gradient(135deg, #050505 0%, #141414 100%)",
                "hotkey": "⌥4",
                "apps": [
                    {"name": "Antigravity IDE", "bundle_id": "com.google.antigravity", "path": "/Applications/Antigravity IDE.app"},
                    {"name": "Spotify", "bundle_id": "com.spotify.client", "path": "/Applications/Spotify.app"},
                ],
                "folders": [],
                "layout_grid": "3x5",
            },
        }

    def get_all_spaces(self) -> Dict[str, Any]:
        """Restituisce l'elenco di tutti gli spazi configurati e quello attivo."""
        return {
            "active_space_id": self._active_space_id,
            "spaces": list(self._spaces.values()),
        }

    def switch_space(self, space_id: str) -> Optional[Dict[str, Any]]:
        """Attiva un determinato Space."""
        if space_id in self._spaces:
            self._active_space_id = space_id
            return self._spaces[space_id]
        return None

    def save_space(self, space_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva o aggiorna un profilo Space."""
        space_id = space_data.get("id") or f"space_{int(time.time())}"
        space_data["id"] = space_id
        self._spaces[space_id] = space_data
        return space_data

    def delete_space(self, space_id: str) -> bool:
        """Elimina uno Space non predefinito."""
        if space_id in self._spaces and len(self._spaces) > 1:
            del self._spaces[space_id]
            if self._active_space_id == space_id:
                self._active_space_id = next(iter(self._spaces.keys()))
            return True
        return False

    def _launch_workflow_sync(self, space_id: str) -> Dict[str, Any]:
        """Esegue il lancio nativo di tutte le app e cartelle dello Space su macOS."""
        space = self._spaces.get(space_id)
        if not space:
            return {"success": False, "error": f"Space {space_id} non trovato"}

        launched_apps = []
        opened_folders = []

        # 1. Lancio applicazioni via 'open -a'
        for app in space.get("apps", []):
            app_path = app.get("path") or app.get("name")
            try:
                subprocess.Popen(["open", app_path])
                launched_apps.append(app.get("name", app_path))
            except Exception as exc:
                logger.warning("Impossibile lanciare l'applicazione %s: %s", app_path, exc)

        # 2. Apertura cartelle del workflow nel Finder
        for folder_path in space.get("folders", []):
            if os.path.exists(folder_path):
                try:
                    subprocess.Popen(["open", folder_path])
                    opened_folders.append(folder_path)
                except Exception as exc:
                    logger.warning("Impossibile aprire la cartella %s: %s", folder_path, exc)

        return {
            "success": True,
            "space_id": space_id,
            "space_name": space.get("name"),
            "launched_apps": launched_apps,
            "opened_folders": opened_folders,
        }

    async def batch_launch_workflow_async(self, space_id: str) -> Dict[str, Any]:
        """Esegue il batch launch asincrono nel thread pool."""
        return await run_in_thread_pool(self._launch_workflow_sync, space_id)

    def export_space(self, space_id: str) -> Dict[str, Any]:
        """Esporta lo Space nel formato di interscambio .launchmespaces."""
        space = self._spaces.get(space_id)
        if not space:
            raise ValueError(f"Space {space_id} inesistente")
        return {
            "format": "launchmespaces",
            "version": "1.0",
            "exported_at": int(time.time()),
            "space": space,
        }

    def import_space(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Importa un tema o workflow da payload .launchmespaces."""
        space_data = payload.get("space") or payload
        space_id = space_data.get("id") or f"imported_{int(time.time())}"
        space_data["id"] = space_id
        self._spaces[space_id] = space_data
        self._active_space_id = space_id
        return space_data


spaces_manager = SpacesManager()
