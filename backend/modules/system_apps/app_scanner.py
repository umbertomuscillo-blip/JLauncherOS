"""Modulo System App Scanner & Clean Uninstaller per JLauncherOS.

Effettua la scansione delle applicazioni installate su macOS (/Applications, /System/Applications),
la categorizzazione automatica (Dev, Design, Media, Utility) e l'analisi preventiva dei file residui
per la disinstallazione pulita in stile LaunchMe.
"""

import glob
import logging
import os
import plistlib
import subprocess
from typing import Any, Dict, List, Optional

from core.thread_pool import run_in_thread_pool

logger = logging.getLogger("jlauncheros.app_scanner")


class AppScanner:
    """Scanner per le applicazioni installate nel sistema macOS."""

    def __init__(self) -> None:
        self._cached_apps: List[Dict[str, Any]] = []

    def _determine_category(self, name: str, bundle_id: str) -> str:
        """Determina la categoria dell'applicazione in base a nome e bundle ID."""
        nl = name.lower()
        bl = bundle_id.lower()

        if any(w in nl or w in bl for w in ("code", "terminal", "xcode", "git", "pycharm", "cursor", "antigravity", "sublime", "iterm", "docker")):
            return "Dev"
        if any(w in nl or w in bl for w in ("photoshop", "figma", "sketch", "illustrator", "capcut", "lightroom", "blender", "canvas", "canva", "designer")):
            return "Design"
        if any(w in nl or w in bl for w in ("spotify", "music", "vlc", "podcasts", "audio", "tv", "media", "youtube", "sound")):
            return "Media"
        if any(w in nl or w in bl for w in ("safari", "chrome", "brave", "firefox", "notion", "notes", "slack", "mail", "telegram", "whatsapp", "calendar")):
            return "Productivity"
        if any(w in nl or w in bl for w in ("settings", "system", "finder", "activity", "console", "disk", "keychain", "app store")):
            return "System"
        return "Utilities"

    def _scan_applications_sync(self) -> List[Dict[str, Any]]:
        """Scansiona i percorsi standard delle applicazioni macOS."""
        search_dirs = [
            "/Applications",
            "/System/Applications",
            "/System/Applications/Utilities",
            os.path.expanduser("~/Applications"),
        ]

        apps = []
        seen_names = set()

        for s_dir in search_dirs:
            if not os.path.exists(s_dir):
                continue

            try:
                for entry in os.listdir(s_dir):
                    if not entry.endswith(".app"):
                        continue

                    full_path = os.path.join(s_dir, entry)
                    app_name = os.path.splitext(entry)[0]
                    if app_name in seen_names:
                        continue

                    seen_names.add(app_name)
                    bundle_id = f"com.apple.{app_name.lower()}"

                    # Lettura Info.plist se accessibile
                    plist_path = os.path.join(full_path, "Contents", "Info.plist")
                    if os.path.exists(plist_path):
                        try:
                            with open(plist_path, "rb") as fp:
                                pl = plistlib.load(fp)
                                bundle_id = pl.get("CFBundleIdentifier", bundle_id)
                                app_name = pl.get("CFBundleDisplayName", pl.get("CFBundleName", app_name))
                        except Exception:
                            pass

                    category = self._determine_category(app_name, bundle_id)

                    apps.append({
                        "name": app_name,
                        "bundle_id": bundle_id,
                        "path": full_path,
                        "category": category,
                        "is_favorite": app_name in ("Visual Studio Code", "Spotify", "Figma", "Terminal", "Safari", "Notion", "CapCut", "Antigravity IDE"),
                    })
            except Exception as exc:
                logger.warning("Errore durante la scansione della directory %s: %s", s_dir, exc)

        apps.sort(key=lambda x: x["name"].lower())
        return apps

    async def get_applications_async(self) -> List[Dict[str, Any]]:
        """Restituisce le applicazioni installate con offload nel thread pool."""
        if not self._cached_apps:
            self._cached_apps = await run_in_thread_pool(self._scan_applications_sync)
        return self._cached_apps

    def _launch_app_sync(self, app_path: str) -> bool:
        """Lancia l'applicazione specificata su macOS."""
        try:
            subprocess.Popen(["open", app_path])
            return True
        except Exception as exc:
            logger.error("Errore nel lancio dell'applicazione %s: %s", app_path, exc, exc_info=True)
            return False

    async def launch_app_async(self, app_path: str) -> bool:
        """Lancia un'applicazione in modo asincrono."""
        return await run_in_thread_pool(self._launch_app_sync, app_path)

    def _scan_app_remnants_sync(self, app_name: str, bundle_id: str) -> Dict[str, Any]:
        """Trova file di cache, preferenze e dati applicativi in ~/Library per il Clean Uninstaller."""
        home = os.path.expanduser("~")
        remnants = []
        total_bytes = 0

        search_locations = [
            os.path.join(home, "Library", "Application Support", app_name),
            os.path.join(home, "Library", "Caches", bundle_id),
            os.path.join(home, "Library", "Caches", app_name),
            os.path.join(home, "Library", "Preferences", f"{bundle_id}.plist"),
            os.path.join(home, "Library", "Logs", app_name),
            os.path.join(home, "Library", "Saved Application State", f"{bundle_id}.savedState"),
        ]

        for p in search_locations:
            if os.path.exists(p):
                size = 0
                if os.path.isfile(p):
                    size = os.path.getsize(p)
                else:
                    for root, _, files in os.walk(p):
                        for f in files:
                            try:
                                size += os.path.getsize(os.path.join(root, f))
                            except Exception:
                                pass
                total_bytes += size
                remnants.append({
                    "path": p,
                    "size_bytes": size,
                    "is_directory": os.path.isdir(p),
                })

        size_mb = round(total_bytes / (1024 * 1024), 2)
        return {
            "app_name": app_name,
            "bundle_id": bundle_id,
            "remnants": remnants,
            "total_bytes": total_bytes,
            "total_human": f"{size_mb} MB" if size_mb >= 1.0 else f"{round(total_bytes / 1024, 1)} KB",
            "remnant_count": len(remnants),
        }

    async def get_uninstall_preview_async(self, app_path: str) -> Dict[str, Any]:
        """Restituisce l'anteprima dei file rimovibili per la disinstallazione pulita."""
        app_name = os.path.splitext(os.path.basename(app_path))[0]
        bundle_id = f"com.{app_name.lower()}"

        plist_path = os.path.join(app_path, "Contents", "Info.plist")
        if os.path.exists(plist_path):
            try:
                with open(plist_path, "rb") as fp:
                    pl = plistlib.load(fp)
                    bundle_id = pl.get("CFBundleIdentifier", bundle_id)
            except Exception:
                pass

        return await run_in_thread_pool(self._scan_app_remnants_sync, app_name, bundle_id)


app_scanner = AppScanner()
