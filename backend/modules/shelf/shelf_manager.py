"""Modulo Drop Shelf (Pocket) & AirDrop per JLauncherOS.

Gestisce la mensola di drag-and-drop del Dynamic Notch ("Pocket Shelf")
e l'invio istantaneo verso AirDrop di macOS.
"""

import logging
import os
import shutil
import subprocess
import time
from typing import Any, Dict, List, Optional

from core.thread_pool import run_in_thread_pool

logger = logging.getLogger("jlauncheros.shelf")

SHELF_DIR = os.path.expanduser("~/.jlauncheros/shelf")


class ShelfItem:
    """Rappresentazione di un file o elemento presente nella Pocket Shelf."""

    def __init__(
        self,
        item_id: str,
        name: str,
        path: str,
        size_bytes: int,
        added_at: float,
        file_type: str = "file",
    ) -> None:
        self.item_id = item_id
        self.name = name
        self.path = path
        self.size_bytes = size_bytes
        self.added_at = added_at
        self.file_type = file_type

    def to_dict(self) -> Dict[str, Any]:
        size_kb = round(self.size_bytes / 1024, 1)
        size_human = f"{size_kb} KB" if size_kb < 1024 else f"{round(size_kb / 1024, 2)} MB"
        return {
            "item_id": self.item_id,
            "name": self.name,
            "path": self.path,
            "size_bytes": self.size_bytes,
            "size_human": size_human,
            "added_at": self.added_at,
            "file_type": self.file_type,
        }


class ShelfManager:
    """Manager per la Drop Shelf del Notch e la condivisione AirDrop."""

    def __init__(self) -> None:
        self._items: List[ShelfItem] = []
        os.makedirs(SHELF_DIR, exist_ok=True)
        self._init_mock_shelf()

    def _init_mock_shelf(self) -> None:
        """Crea elementi di benvenuto nella pocket shelf."""
        now = time.time()
        self._items = [
            ShelfItem("shelf_1", "Project_Wireframe_v2.fig", "/Users/umbertomuscillo/Downloads/Wireframe.fig", 4200000, now - 300, "design"),
            ShelfItem("shelf_2", "Audio_Stem_Master_120.wav", "/Users/umbertomuscillo/Downloads/Master.wav", 18400000, now - 600, "audio"),
            ShelfItem("shelf_3", "LaunchMe_Reference_Spec.pdf", "/Users/umbertomuscillo/Downloads/Spec.pdf", 890000, now - 1200, "pdf"),
        ]

    def get_items(self) -> List[Dict[str, Any]]:
        """Restituisce l'elenco dei file correnti nella Pocket Shelf."""
        return [item.to_dict() for item in self._items]

    def add_file(self, name: str, source_path: Optional[str] = None, size_bytes: int = 0) -> Dict[str, Any]:
        """Aggiunge un file alla mensola."""
        item_id = f"shelf_{int(time.time() * 1000)}"
        path = source_path or os.path.join(SHELF_DIR, name)

        if source_path and os.path.exists(source_path):
            size_bytes = os.path.getsize(source_path)

        ext = os.path.splitext(name)[1].lower()
        file_type = "file"
        if ext in (".png", ".jpg", ".jpeg", ".webp", ".gif"):
            file_type = "image"
        elif ext in (".mp3", ".wav", ".flac", ".m4a"):
            file_type = "audio"
        elif ext in (".pdf", ".docx", ".txt", ".md"):
            file_type = "doc"
        elif ext in (".zip", ".tar", ".gz", ".dmg"):
            file_type = "archive"

        item = ShelfItem(
            item_id=item_id,
            name=name,
            path=path,
            size_bytes=size_bytes,
            added_at=time.time(),
            file_type=file_type,
        )
        self._items.insert(0, item)
        return item.to_dict()

    def remove_item(self, item_id: str) -> bool:
        """Rimuove un file dalla mensola."""
        initial = len(self._items)
        self._items = [i for i in self._items if i.item_id != item_id]
        return len(self._items) < initial

    def clear(self) -> bool:
        """Svuota la mensola."""
        self._items.clear()
        return True

    def _trigger_airdrop_sync(self, file_path: str) -> bool:
        """Attiva la finestra AirDrop di macOS per il file specificato."""
        try:
            # Prova prima l'apertura tramite utility AirDrop nativa
            cmd = ["open", "-a", "/System/Applications/Utilities/AirDrop.app"]
            subprocess.run(cmd, capture_output=True, timeout=1.5)
            # Se esiste il file reale, apri la cartella di selezione Finder
            if os.path.exists(file_path):
                subprocess.run(["open", "-R", file_path], capture_output=True, timeout=1.0)
            return True
        except Exception as exc:
            logger.error("Errore nell'avvio del target AirDrop per %s: %s", file_path, exc, exc_info=True)
            return False

    async def airdrop_file_async(self, item_id: str) -> Dict[str, Any]:
        """Invia il file specificato verso AirDrop."""
        target = next((i for i in self._items if i.item_id == item_id), None)
        path = target.path if target else ""
        success = await run_in_thread_pool(self._trigger_airdrop_sync, path)
        return {
            "item_id": item_id,
            "success": success,
            "status": "airdrop_invoked",
        }


shelf_manager = ShelfManager()
