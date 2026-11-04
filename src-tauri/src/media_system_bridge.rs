#![deny(clippy::unwrap_used)]

use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaTrackInfo {
    pub player: String,
    pub state: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub artwork_url: Option<String>,
    pub duration_secs: f64,
    pub position_secs: f64,
}

/// Controlla in modo istantaneo (<2ms) se un processo è in esecuzione con pgrep.
fn is_process_running(process_name: &str) -> bool {
    let output = Command::new("/usr/bin/pgrep")
        .arg("-x")
        .arg(process_name)
        .output();

    match output {
        Ok(out) => out.status.success(),
        Err(e) => {
            log::warn!("[media_bridge] Impossibile eseguire pgrep per '{process_name}': {e}");
            false
        }
    }
}

/// Esegue uno script AppleScript e restituisce l'output trimato in stringa.
fn run_applescript(script: &str) -> Result<String, String> {
    let output = Command::new("/usr/bin/osascript")
        .arg("-e")
        .arg(script)
        .output()
        .map_err(|e| format!("Errore esecuzione osascript: {e}"))?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!("osascript fallito: {err_msg}"));
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

/// Recupera le informazioni della traccia corrente da Spotify se in esecuzione.
fn query_spotify() -> Option<MediaTrackInfo> {
    if !is_process_running("Spotify") {
        return None;
    }

    let script = r#"
tell application "Spotify"
    try
        set pState to (player state as string)
        if pState is "stopped" then
            return "stopped|||||||||0|||0|||"
        end if
        set tName to (name of current track)
        set tArtist to (artist of current track)
        set tAlbum to (album of current track)
        set tDuration to ((duration of current track) / 1000)
        set tPosition to (player position)
        set tArtwork to ""
        try
            set tArtwork to (artwork url of current track)
        end try
        return pState & "|||" & tName & "|||" & tArtist & "|||" & tAlbum & "|||" & tDuration & "|||" & tPosition & "|||" & tArtwork
    on error
        return "idle|||||||||0|||0|||"
    end try
end tell
"#;

    match run_applescript(script) {
        Ok(raw) => {
            let parts: Vec<&str> = raw.split("|||").collect();
            if parts.len() < 6 {
                return None;
            }
            let state = parts.first().copied().unwrap_or("idle").to_string();
            let title = parts.get(1).copied().unwrap_or("").to_string();
            let artist = parts.get(2).copied().unwrap_or("").to_string();
            let album = parts.get(3).copied().unwrap_or("").to_string();
            let duration_secs = parts.get(4).copied().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
            let position_secs = parts.get(5).copied().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
            let artwork_url = parts.get(6).and_then(|s| {
                let trimmed = s.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(trimmed.to_string())
                }
            });

            Some(MediaTrackInfo {
                player: "spotify".to_string(),
                state,
                title,
                artist,
                album,
                artwork_url,
                duration_secs,
                position_secs,
            })
        }
        Err(e) => {
            log::warn!("[media_bridge] Errore lettura Spotify: {e}");
            None
        }
    }
}

/// Recupera le informazioni della traccia corrente da Apple Music se in esecuzione.
fn query_apple_music() -> Option<MediaTrackInfo> {
    if !is_process_running("Music") {
        return None;
    }

    let script = r#"
tell application "Music"
    try
        set pState to (player state as string)
        if pState is "stopped" then
            return "stopped|||||||||0|||0"
        end if
        set tName to (name of current track)
        set tArtist to (artist of current track)
        set tAlbum to (album of current track)
        set tDuration to (duration of current track)
        set tPosition to (player position)
        return pState & "|||" & tName & "|||" & tArtist & "|||" & tAlbum & "|||" & tDuration & "|||" & tPosition
    on error
        return "idle|||||||||0|||0"
    end try
end tell
"#;

    match run_applescript(script) {
        Ok(raw) => {
            let parts: Vec<&str> = raw.split("|||").collect();
            if parts.len() < 6 {
                return None;
            }
            let state = parts.first().copied().unwrap_or("idle").to_string();
            let title = parts.get(1).copied().unwrap_or("").to_string();
            let artist = parts.get(2).copied().unwrap_or("").to_string();
            let album = parts.get(3).copied().unwrap_or("").to_string();
            let duration_secs = parts.get(4).copied().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
            let position_secs = parts.get(5).copied().unwrap_or("0").parse::<f64>().unwrap_or(0.0);

            Some(MediaTrackInfo {
                player: "apple_music".to_string(),
                state,
                title,
                artist,
                album,
                artwork_url: None,
                duration_secs,
                position_secs,
            })
        }
        Err(e) => {
            log::warn!("[media_bridge] Errore lettura Apple Music: {e}");
            None
        }
    }
}

/// Ritorna lo stato del player musicale attualmente attivo (Spotify priorità se in play, altrimenti Music).
#[tauri::command]
pub fn get_media_status() -> Result<Option<MediaTrackInfo>, String> {
    let spotify_info = query_spotify();
    if let Some(ref info) = spotify_info {
        if info.state == "playing" {
            return Ok(Some(info.clone()));
        }
    }

    let music_info = query_apple_music();
    if let Some(ref info) = music_info {
        if info.state == "playing" {
            return Ok(Some(info.clone()));
        }
    }

    // Se nessuno è in playing, restituisci quello che ha una traccia (in pausa)
    if let Some(info) = spotify_info {
        if !info.title.is_empty() {
            return Ok(Some(info));
        }
    }

    if let Some(info) = music_info {
        if !info.title.is_empty() {
            return Ok(Some(info));
        }
    }

    Ok(None)
}

/// Toggle Play / Pause sul player attualmente attivo o in esecuzione.
#[tauri::command]
pub fn media_play_pause() -> Result<bool, String> {
    if is_process_running("Spotify") {
        let script = r#"tell application "Spotify" to playpause"#;
        if run_applescript(script).is_ok() {
            return Ok(true);
        }
    }

    if is_process_running("Music") {
        let script = r#"tell application "Music" to playpause"#;
        if run_applescript(script).is_ok() {
            return Ok(true);
        }
    }

    Ok(false)
}

/// Passa alla traccia successiva sul player attivo.
#[tauri::command]
pub fn media_next_track() -> Result<bool, String> {
    if is_process_running("Spotify") {
        let script = r#"tell application "Spotify" to next track"#;
        if run_applescript(script).is_ok() {
            return Ok(true);
        }
    }

    if is_process_running("Music") {
        let script = r#"tell application "Music" to next track"#;
        if run_applescript(script).is_ok() {
            return Ok(true);
        }
    }

    Ok(false)
}

/// Ritorna alla traccia precedente sul player attivo.
#[tauri::command]
pub fn media_previous_track() -> Result<bool, String> {
    if is_process_running("Spotify") {
        let script = r#"tell application "Spotify" to previous track"#;
        if run_applescript(script).is_ok() {
            return Ok(true);
        }
    }

    if is_process_running("Music") {
        let script = r#"tell application "Music" to previous track"#;
        if run_applescript(script).is_ok() {
            return Ok(true);
        }
    }

    Ok(false)
}
