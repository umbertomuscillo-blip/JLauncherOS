"""Modulo Media Controller per JLauncherOS (Spotify & Apple Music Bridge).

Fornisce il controllo della riproduzione multimediale su macOS tramite AppleScript (osascript),
con fallback fluido a Soundscape Ambientale Lofi/Neural Focus se nessun player è attivo.
"""

import asyncio
import logging
import subprocess
from typing import Any, Dict, Optional

from core.thread_pool import run_in_thread_pool

logger = logging.getLogger("jlauncheros.media")

SPOTIFY_STATE_SCRIPT = """
if application "Spotify" is running then
    tell application "Spotify"
        set pState to (player state as string)
        set tName to (name of current track as string)
        set tArtist to (artist of current track as string)
        set tAlbum to (album of current track as string)
        set tPos to (player position as integer)
        set tDur to (round ((duration of current track) / 1000))
        return "SPOTIFY||" & pState & "||" & tName & "||" & tArtist & "||" & tAlbum & "||" & tPos & "||" & tDur
    end tell
else if application "Music" is running then
    tell application "Music"
        set pState to (player state as string)
        set tName to (name of current track as string)
        set tArtist to (artist of current track as string)
        set tAlbum to (album of current track as string)
        set tPos to (player position as integer)
        set tDur to (round (duration of current track))
        return "MUSIC||" & pState & "||" & tName & "||" & tArtist & "||" & tAlbum & "||" & tPos & "||" & tDur
    end tell
else
    return "NONE"
end if
"""


class MediaController:
    """Controller multimediale bidirezionale con supporto Apple Music, Spotify e Simulated Deck."""

    def __init__(self) -> None:
        self._is_playing: bool = True
        self._current_track = {
            "title": "Midnight City (Vinyl Edition)",
            "artist": "M83 & JARVIS Sound Lab",
            "album": "Hurry Up, We're Dreaming",
            "duration_seconds": 244,
            "position_seconds": 68,
            "is_playing": True,
            "player_app": "Vinyl Studio",
            "album_art_url": "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80",
            "vinyl_rpm": 33,
            "volume": 85,
        }

    def _query_macos_players_sync(self) -> Optional[Dict[str, Any]]:
        """Esegue lo script AppleScript per interrogare i player in esecuzione."""
        try:
            res = subprocess.run(
                ["osascript", "-e", SPOTIFY_STATE_SCRIPT],
                capture_output=True,
                text=True,
                timeout=1.2,
            )
            output = res.stdout.strip()
            if output and output != "NONE" and "||" in output:
                parts = output.split("||")
                if len(parts) >= 7:
                    app_name = "Spotify" if parts[0] == "SPOTIFY" else "Apple Music"
                    state = parts[1].lower()
                    return {
                        "title": parts[2],
                        "artist": parts[3],
                        "album": parts[4],
                        "position_seconds": int(parts[5]) if parts[5].isdigit() else 0,
                        "duration_seconds": int(parts[6]) if parts[6].isdigit() else 180,
                        "is_playing": "playing" in state,
                        "player_app": app_name,
                        "album_art_url": self._current_track.get("album_art_url"),
                        "vinyl_rpm": self._current_track.get("vinyl_rpm", 33),
                        "volume": self._current_track.get("volume", 85),
                    }
        except Exception as exc:
            logger.debug("Nessun player nativo risponde a osascript (usando player interno): %s", exc)
        return None

    def _execute_player_action_sync(self, app_name: str, action: str) -> bool:
        """Invia il comando di riproduzione al player designato via AppleScript."""
        script = ""
        if app_name.lower() == "spotify":
            if action in ("play", "pause", "play_pause"):
                script = 'tell application "Spotify" to playpause'
            elif action == "next":
                script = 'tell application "Spotify" to next track'
            elif action == "previous":
                script = 'tell application "Spotify" to previous track'
        elif app_name.lower() in ("music", "apple music"):
            if action in ("play", "pause", "play_pause"):
                script = 'tell application "Music" to playpause'
            elif action == "next":
                script = 'tell application "Music" to next track'
            elif action == "previous":
                script = 'tell application "Music" to previous track'

        if script:
            try:
                subprocess.run(["osascript", "-e", script], capture_output=True, timeout=1.0)
                return True
            except Exception as exc:
                logger.error("Errore nell'esecuzione azione osascript per %s: %s", app_name, exc, exc_info=True)
        return False

    async def get_playback_state_async(self) -> Dict[str, Any]:
        """Recupera lo stato corrente da macOS o dallo stato virtuale persistente."""
        native_state = await run_in_thread_pool(self._query_macos_players_sync)
        if native_state:
            self._current_track.update(native_state)
            return self._current_track

        # Avanzamento timer virtuale se in riproduzione
        if self._current_track["is_playing"]:
            new_pos = self._current_track["position_seconds"] + 1
            if new_pos > self._current_track["duration_seconds"]:
                new_pos = 0
            self._current_track["position_seconds"] = new_pos

        return dict(self._current_track)

    async def control_playback_async(self, action: str) -> Dict[str, Any]:
        """Controlla la riproduzione (play, pause, play_pause, next, previous)."""
        player_app = self._current_track.get("player_app", "")

        # Se il player è Spotify o Apple Music, invia comando nativo
        if player_app in ("Spotify", "Apple Music"):
            await run_in_thread_pool(self._execute_player_action_sync, player_app, action)

        if action == "play":
            self._current_track["is_playing"] = True
        elif action == "pause":
            self._current_track["is_playing"] = False
        elif action == "play_pause":
            self._current_track["is_playing"] = not self._current_track["is_playing"]
        elif action == "next":
            # Cambia traccia dimostrativa
            self._current_track["position_seconds"] = 0
            self._current_track["title"] = "Starboy (Daft Punk Mix)"
            self._current_track["artist"] = "The Weeknd"
            self._current_track["album"] = "Starboy"
            self._current_track["is_playing"] = True
        elif action == "previous":
            self._current_track["position_seconds"] = 0
            self._current_track["title"] = "Resonance (Echoes of M4)"
            self._current_track["artist"] = "HOME"
            self._current_track["album"] = "Odyssey"
            self._current_track["is_playing"] = True

        return dict(self._current_track)

    async def seek_async(self, position_seconds: int) -> Dict[str, Any]:
        """Sposta la testina di riproduzione alla posizione specificata."""
        duration = self._current_track.get("duration_seconds", 300)
        self._current_track["position_seconds"] = max(0, min(position_seconds, duration))
        return dict(self._current_track)

    def set_rpm(self, rpm: int) -> int:
        """Imposta la velocità del piatto vinile (33 o 45 RPM)."""
        valid_rpm = 45 if rpm == 45 else 33
        self._current_track["vinyl_rpm"] = valid_rpm
        return valid_rpm


media_controller = MediaController()
