"""Disk Scanner per Help Memoria: Scansione multi-threaded ricorsiva su APFS."""

import asyncio
import inspect
import logging
import os
from pathlib import Path
import uuid
from typing import Any, Callable, Dict, List, Optional

from core.thread_pool import run_in_thread_pool

logger = logging.getLogger("jlauncheros.help_memoria.scanner")


class DiskScanner:
    """Esegue scansioni asincrone offloadate delle cartelle cache e log su macOS."""

    def __init__(self) -> None:
        self.home = Path.home()
        self.known_targets: Dict[str, Path] = {
            "caches": self.home / "Library" / "Caches",
            "logs": self.home / "Library" / "Logs",
            "xcode_derived_data": self.home / "Library" / "Developer" / "Xcode" / "DerivedData",
            "trash": self.home / ".Trash",
        }
        self.active_scans: Dict[str, Dict[str, Any]] = {}

    def _scan_apfs_blocking(self, target_dir: str) -> Dict[str, Any]:
        """Operazione bloccante I/O-bound: DEVE girare in un worker thread."""
        total_size = 0
        file_count = 0
        try:
            for dirpath, _, filenames in os.walk(target_dir):
                for f in filenames:
                    fp = os.path.join(dirpath, f)
                    if not os.path.islink(fp):
                        try:
                            total_size += os.path.getsize(fp)
                            file_count += 1
                        except OSError:
                            continue
        except Exception as exc:
            logger.warning("Errore durante la scansione bloccante di %s: %s", target_dir, exc)
        return {"target": target_dir, "size_bytes": total_size, "count": file_count}

    async def scan_directory_async(
        self, target_dir: str, broadcast_cb: Optional[Callable[[str, Dict[str, Any]], Any]] = None
    ) -> Dict[str, Any]:
        """Entrypoint asincrono esposto al JSON-RPC Router con delega totale al thread pool."""
        result = await run_in_thread_pool(self._scan_apfs_blocking, target_dir)
        if broadcast_cb:
            payload = {"percentage": 100, **result}
            if inspect.iscoroutinefunction(broadcast_cb):
                await broadcast_cb("event.memory.scanProgress", payload)
            else:
                broadcast_cb("event.memory.scanProgress", payload)
        return result

    def get_target_path(self, target_key: str) -> Optional[Path]:
        """Restituisce il percorso reale della categoria target."""
        return self.known_targets.get(target_key)

    def _sync_scan_category(
        self,
        category: str,
        path: Path,
        max_depth: int = 3,
    ) -> Dict[str, Any]:
        """Esegue la scansione sincrona di una singola cartella (da invocare nel thread pool)."""
        scanned_files = 0
        total_bytes = 0
        file_samples: List[str] = []

        if not path.exists():
            return {
                "category": category,
                "path": str(path),
                "exists": False,
                "files_count": 0,
                "total_bytes": 0,
            }

        try:
            for root, dirs, files in os.walk(str(path)):
                # Limita la profondità di ricorsione per rapidità
                depth = len(Path(root).relative_to(path).parts)
                if depth > max_depth:
                    dirs.clear()
                    continue

                for f in files:
                    scanned_files += 1
                    file_path = os.path.join(root, f)
                    try:
                        stat = os.lstat(file_path)
                        total_bytes += stat.st_size
                        if len(file_samples) < 5:
                            file_samples.append(file_path)
                    except OSError:
                        continue
        except Exception as exc:
            logger.warning("Errore durante la scansione di %s: %s", path, exc)

        return {
            "category": category,
            "path": str(path),
            "exists": True,
            "files_count": scanned_files,
            "total_bytes": total_bytes,
            "samples": file_samples,
        }

    async def scan_targets(
        self,
        targets: Optional[List[str]] = None,
        deep_scan: bool = False,
        progress_callback: Optional[Callable[[Dict[str, Any]], Any]] = None,
    ) -> Dict[str, Any]:
        """Avvia la scansione asincrona delegando l'I/O al thread pool."""
        scan_id = f"scan_{uuid.uuid4().hex[:8]}"
        selected_targets = targets or list(self.known_targets.keys())

        logger.info("Avvio scansione disco [ID: %s] per i target: %s", scan_id, selected_targets)

        total_discovered_bytes = 0
        total_scanned_files = 0
        categories_breakdown: Dict[str, Any] = {}

        self.active_scans[scan_id] = {
            "status": "scanning",
            "targets": selected_targets,
            "discovered_bytes": 0,
        }

        total_steps = len(selected_targets)
        for idx, target_name in enumerate(selected_targets):
            path = self.get_target_path(target_name)
            if not path:
                continue

            max_depth = 5 if deep_scan else 2
            # Offloading dell'I/O su ThreadPoolExecutor per proteggere l'event loop
            result = await run_in_thread_pool(self._sync_scan_category, target_name, path, max_depth)

            total_discovered_bytes += result["total_bytes"]
            total_scanned_files += result["files_count"]
            categories_breakdown[target_name] = result

            pct = round(((idx + 1) / total_steps) * 100.0, 1)

            if progress_callback:
                progress_payload = {
                    "scan_id": scan_id,
                    "current_path": str(path),
                    "scanned_files": total_scanned_files,
                    "discovered_cleanable_bytes": total_discovered_bytes,
                    "percentage": pct,
                }
                if inspect.iscoroutinefunction(progress_callback):
                    await progress_callback(progress_payload)
                else:
                    progress_callback(progress_payload)

        self.active_scans[scan_id] = {
            "status": "completed",
            "total_bytes": total_discovered_bytes,
            "total_files": total_scanned_files,
            "categories": categories_breakdown,
        }

        return {
            "scan_id": scan_id,
            "status": "completed",
            "discovered_cleanable_bytes": total_discovered_bytes,
            "scanned_files": total_scanned_files,
            "breakdown": categories_breakdown,
        }


disk_scanner = DiskScanner()
