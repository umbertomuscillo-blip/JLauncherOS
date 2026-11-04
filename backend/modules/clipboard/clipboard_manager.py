"""Modulo Clipboard Manager per JLauncherOS.

Monitora gli appunti di macOS in modo non bloccante, estrae snippet di testo,
codici colore HEX/RGB, URL, screenshot/immagini e percorsi di file.
"""

import asyncio
import logging
import os
import re
import subprocess
import time
from typing import Any, Dict, List, Optional

from core.thread_pool import run_in_thread_pool

logger = logging.getLogger("jlauncheros.clipboard")

HEX_COLOR_REGEX = re.compile(r"#(?:[0-9a-fA-F]{3}){1,2}\b")
URL_REGEX = re.compile(r"https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[^\s]*")


class ClipboardItem:
    """Rappresentazione tipizzata di un elemento memorizzato negli appunti."""

    def __init__(
        self,
        item_id: str,
        content_type: str,
        text_content: str,
        preview: str,
        timestamp: float,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.item_id = item_id
        self.content_type = content_type  # text, color, link, screenshot, file
        self.text_content = text_content
        self.preview = preview
        self.timestamp = timestamp
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "item_id": self.item_id,
            "content_type": self.content_type,
            "text_content": self.text_content,
            "preview": self.preview,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }


class ClipboardManager:
    """Gestore della cronologia appunti per la Dynamic Notch e il Launcher."""

    def __init__(self, max_history: int = 100) -> None:
        self.max_history: int = max_history
        self._history: List[ClipboardItem] = []
        self._last_content: str = ""
        self._init_defaults()

    def _init_defaults(self) -> None:
        """Popola una cronologia iniziale dimostrativa e utile."""
        now = time.time()
        initial_items = [
            ClipboardItem("clip_1", "color", "#0a84ff", "Apple Blue (#0a84ff)", now - 120, {"hex": "#0a84ff", "rgb": "10, 132, 255"}),
            ClipboardItem("clip_2", "color", "#bf5af2", "Liquid Purple (#bf5af2)", now - 240, {"hex": "#bf5af2", "rgb": "191, 90, 242"}),
            ClipboardItem("clip_3", "color", "#30d158", "Mint Green (#30d158)", now - 360, {"hex": "#30d158", "rgb": "48, 209, 88"}),
            ClipboardItem("clip_4", "link", "https://launchmeapp.com/changelog/", "LaunchMe Official Changelog", now - 480, {"domain": "launchmeapp.com"}),
            ClipboardItem("clip_5", "text", "git commit -m 'feat: dynamic notch island liquid glass'", "git commit -m 'feat: dynamic notch island...'", now - 600),
            ClipboardItem("clip_6", "file", "/Users/umbertomuscillo/Downloads/JLauncherOS", "JLauncherOS Project Root", now - 900, {"is_dir": True}),
            ClipboardItem("clip_7", "screenshot", "[Screenshot] 2026-11-03 10.30.png", "Retina Display Capture (1440x900)", now - 1200, {"dimensions": "1440x900"}),
        ]
        self._history.extend(initial_items)

    def _read_macos_pasteboard(self) -> str:
        """Legge il testo corrente dal pasteboard di macOS via pbpaste."""
        try:
            res = subprocess.run(["pbpaste"], capture_output=True, text=True, timeout=1.5)
            if res.returncode == 0:
                return res.stdout.strip()
        except Exception as exc:
            logger.warning("Impossibile leggere il pasteboard con pbpaste: %s", exc)
        return ""

    def _set_macos_pasteboard(self, text: str) -> bool:
        """Imposta il testo nel pasteboard di macOS via pbcopy."""
        try:
            p = subprocess.Popen(["pbcopy"], stdin=subprocess.PIPE, text=True)
            p.communicate(input=text, timeout=1.5)
            return p.returncode == 0
        except Exception as exc:
            logger.error("Errore nella scrittura sul pasteboard con pbcopy: %s", exc, exc_info=True)
            return False

    def capture_current(self) -> Optional[ClipboardItem]:
        """Cattura il contenuto attuale se variato e lo aggiunge alla cronologia."""
        current_text = self._read_macos_pasteboard()
        if not current_text or current_text == self._last_content:
            return None

        self._last_content = current_text
        content_type = "text"
        metadata: Dict[str, Any] = {}

        # Rilevamento colore HEX
        hex_match = HEX_COLOR_REGEX.search(current_text)
        if hex_match and len(current_text) <= 10:
            content_type = "color"
            metadata["hex"] = hex_match.group(0)

        # Rilevamento URL
        elif URL_REGEX.match(current_text):
            content_type = "link"

        # Rilevamento percorso file esistente
        elif current_text.startswith("/") and os.path.exists(current_text):
            content_type = "file"
            metadata["is_dir"] = os.path.isdir(current_text)

        preview = current_text if len(current_text) < 60 else current_text[:57] + "..."
        item_id = f"clip_{int(time.time() * 1000)}"

        new_item = ClipboardItem(
            item_id=item_id,
            content_type=content_type,
            text_content=current_text,
            preview=preview,
            timestamp=time.time(),
            metadata=metadata,
        )

        self._history.insert(0, new_item)
        if len(self._history) > self.max_history:
            self._history.pop()

        return new_item

    async def get_history_async(self, filter_type: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        """Restituisce la cronologia filtrata ed esegue un controllo sul pasteboard attivo."""
        # Esegue la cattura nel thread pool per evitare blocco dell'event loop
        await run_in_thread_pool(self.capture_current)

        items = self._history
        if filter_type and filter_type != "all":
            items = [item for item in items if item.content_type == filter_type]

        if search:
            q = search.lower()
            items = [item for item in items if q in item.text_content.lower() or q in item.preview.lower()]

        return [item.to_dict() for item in items]

    async def copy_item_async(self, item_id: str) -> bool:
        """Copia un elemento selezionato negli appunti di sistema."""
        target = next((item for item in self._history if item.item_id == item_id), None)
        if not target:
            return False

        success = await run_in_thread_pool(self._set_macos_pasteboard, target.text_content)
        if success:
            self._last_content = target.text_content
        return success

    def delete_item(self, item_id: str) -> bool:
        """Rimuove un elemento dalla cronologia."""
        initial_len = len(self._history)
        self._history = [item for item in self._history if item.item_id != item_id]
        return len(self._history) < initial_len

    def clear_history(self) -> bool:
        """Azzera l'intera cronologia degli appunti."""
        self._history.clear()
        return True


clipboard_manager = ClipboardManager()
