"""Cache Cleaner per Help Memoria: Pulizia controllata delle cache APFS."""

import logging
import os
import shutil
from pathlib import Path
from typing import Any, Dict, List

from core.thread_pool import run_in_thread_pool
from .apfs_monitor import format_bytes

logger = logging.getLogger("jlauncheros.help_memoria.cleaner")


class CacheCleaner:
    """Esegue la rimozione sicura di file di cache e log autorizzati dall'utente."""

    def __init__(self) -> None:
        self.home = Path.home()
        self.cleanable_paths: Dict[str, Path] = {
            "xcode_derived_data": self.home / "Library" / "Developer" / "Xcode" / "DerivedData",
            "caches": self.home / "Library" / "Caches",
            "logs": self.home / "Library" / "Logs",
            "trash": self.home / ".Trash",
        }

    def _sync_clean_category(self, category: str, path: Path, dry_run: bool = False) -> Dict[str, Any]:
        """Esegue la pulizia sincrona in thread pool separato."""
        freed_bytes = 0
        deleted_count = 0

        if not path.exists():
            return {"freed_bytes": 0, "deleted_count": 0}

        try:
            for item in path.iterdir():
                try:
                    if item.is_symlink() or item.is_file():
                        size = item.stat().st_size
                        if not dry_run:
                            item.unlink()
                        freed_bytes += size
                        deleted_count += 1
                    elif item.is_dir():
                        size = sum(f.stat().st_size for f in item.glob("**/*") if f.is_file())
                        if not dry_run:
                            shutil.rmtree(item, ignore_errors=True)
                        freed_bytes += size
                        deleted_count += 1
                except OSError as os_err:
                    logger.debug("Permesso negato o file occupato per %s: %s", item, os_err)
                    continue
        except Exception as exc:
            logger.error("Errore durante la pulizia di %s: %s", path, exc, exc_info=True)

        return {"freed_bytes": freed_bytes, "deleted_count": deleted_count}

    async def clean_categories(
        self,
        categories: List[str],
        dry_run: bool = False,
    ) -> Dict[str, Any]:
        """Esegue la pulizia asincrona delegando la cancellazione I/O al thread pool."""
        total_freed = 0
        total_deleted = 0

        logger.info(
            "Avvio operazione di pulizia (Categorie: %s, DryRun: %s)...",
            categories,
            dry_run,
        )

        for cat in categories:
            target_path = self.cleanable_paths.get(cat)
            if not target_path or not target_path.exists():
                continue

            # Offloading I/O su ThreadPoolExecutor
            res = await run_in_thread_pool(self._sync_clean_category, cat, target_path, dry_run)
            total_freed += res["freed_bytes"]
            total_deleted += res["deleted_count"]

        return {
            "freed_bytes": total_freed,
            "freed_human": format_bytes(total_freed),
            "deleted_files_count": total_deleted,
            "dry_run": dry_run,
        }


cleaner = CacheCleaner()
