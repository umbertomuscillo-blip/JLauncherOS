//! Clipboard History Daemon per macOS.
//! Monitora NSPasteboard senza overhead, categorizza testo, colori HEX, link, file e immagini,
//! e fornisce comandi Tauri per cronologia, preferiti e copia.
//! Regole del progetto: zero `.unwrap()`, ogni operazione è tracciata con `log`.

use serde::{Deserialize, Serialize};
use std::io::Write;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardEntry {
    pub id: String,
    pub category: String,
    pub content: String,
    pub preview_path: Option<String>,
    pub color_hex: Option<String>,
    pub timestamp: u64,
    pub is_favorite: bool,
}

pub struct ClipboardState {
    pub entries: Vec<ClipboardEntry>,
    pub max_items: usize,
}

impl Default for ClipboardState {
    fn default() -> Self {
        Self {
            entries: Vec::new(),
            max_items: 120,
        }
    }
}

pub type SharedClipboard = Arc<Mutex<ClipboardState>>;

/// Rileva se una stringa è un codice colore HEX (#RGB o #RRGGBB o #RRGGBBAA).
fn detect_hex_color(s: &str) -> Option<String> {
    let trimmed = s.trim();
    if !trimmed.starts_with('#') {
        return None;
    }
    let hex_part = &trimmed[1..];
    let len = hex_part.len();
    if (len == 3 || len == 6 || len == 8) && hex_part.chars().all(|c| c.is_ascii_hexdigit()) {
        Some(trimmed.to_string())
    } else {
        None
    }
}

/// Rileva se una stringa è un URL HTTP/HTTPS.
fn is_url(s: &str) -> bool {
    let trimmed = s.trim();
    trimmed.starts_with("http://") || trimmed.starts_with("https://")
}

/// Rileva se una stringa è un percorso di file esistente sul disco.
fn is_existing_file_path(s: &str) -> bool {
    let trimmed = s.trim();
    if trimmed.starts_with('/') {
        std::path::Path::new(trimmed).exists()
    } else {
        false
    }
}

/// Estrae il testo corrente negli appunti tramite `pbpaste`.
fn read_pasteboard_text() -> Option<String> {
    let output = Command::new("/usr/bin/pbpaste").output().ok()?;
    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout).to_string();
        let trimmed = text.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }
    None
}

/// Legge il changeCount corrente della generalPasteboard via Cocoa.
#[cfg(target_os = "macos")]
fn get_pasteboard_change_count() -> isize {
    use objc2_app_kit::NSPasteboard;
    let pb = NSPasteboard::generalPasteboard();
    pb.changeCount()
}

#[cfg(not(target_os = "macos"))]
fn get_pasteboard_change_count() -> isize {
    0
}

/// Avvia il daemon di monitoraggio in un thread background.
pub fn start_clipboard_daemon(state: SharedClipboard) {
    std::thread::spawn(move || {
        log::info!("[clipboard_daemon] Avvio del daemon monitoraggio appunti macOS");
        let mut last_change_count = get_pasteboard_change_count();

        loop {
            std::thread::sleep(std::time::Duration::from_millis(450));
            let current_count = get_pasteboard_change_count();

            if current_count != last_change_count {
                last_change_count = current_count;

                if let Some(text) = read_pasteboard_text() {
                    let now = match SystemTime::now().duration_since(UNIX_EPOCH) {
                        Ok(d) => d.as_millis() as u64,
                        Err(_) => 0,
                    };

                    // Categorizzazione intelligente
                    let (category, color_hex) = if let Some(hex) = detect_hex_color(&text) {
                        ("colors".to_string(), Some(hex))
                    } else if is_url(&text) {
                        ("links".to_string(), None)
                    } else if is_existing_file_path(&text) {
                        ("files".to_string(), None)
                    } else {
                        ("text".to_string(), None)
                    };

                    let entry = ClipboardEntry {
                        id: format!("clip-{now}"),
                        category,
                        content: text.clone(),
                        preview_path: None,
                        color_hex,
                        timestamp: now,
                        is_favorite: false,
                    };

                    if let Ok(mut locked) = state.lock() {
                        // Evita duplicati identici all'ultimo inserimento
                        if locked.entries.first().map(|e| e.content.as_str()) != Some(&text) {
                            locked.entries.insert(0, entry);
                            if locked.entries.len() > locked.max_items {
                                // Rimuovi dal fondo mantenendo i preferiti
                                if let Some(pos) = locked.entries.iter().rposition(|e| !e.is_favorite) {
                                    locked.entries.remove(pos);
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}

/// Restituisce la lista cronologica degli elementi negli appunti.
#[tauri::command]
pub fn get_clipboard_history(
    state: tauri::State<'_, SharedClipboard>,
) -> Result<Vec<ClipboardEntry>, String> {
    let locked = state
        .lock()
        .map_err(|e| format!("Impossibile acquisire il lock sugli appunti: {e}"))?;
    Ok(locked.entries.clone())
}

/// Copia un testo negli appunti di sistema tramite `pbcopy`.
#[tauri::command]
pub fn copy_to_clipboard(content: String) -> Result<(), String> {
    log::info!("[clipboard_daemon] Scrittura su appunti di sistema via pbcopy");
    let mut child = Command::new("/usr/bin/pbcopy")
        .stdin(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Impossibile eseguire pbcopy: {e}"))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(content.as_bytes())
            .map_err(|e| format!("Impossibile scrivere sui dati di pbcopy: {e}"))?;
    }

    let status = child
        .wait()
        .map_err(|e| format!("Attesa terminazione pbcopy fallita: {e}"))?;

    if !status.success() {
        return Err("pbcopy terminato con errore".to_string());
    }

    Ok(())
}

/// Cancella la cronologia degli appunti (preservando gli elementi contrassegnati come preferiti).
#[tauri::command]
pub fn clear_clipboard_history(
    state: tauri::State<'_, SharedClipboard>,
) -> Result<(), String> {
    let mut locked = state
        .lock()
        .map_err(|e| format!("Impossibile acquisire il lock sugli appunti: {e}"))?;
    locked.entries.retain(|e| e.is_favorite);
    log::info!("[clipboard_daemon] Cronologia appunti svuotata (preferiti conservati)");
    Ok(())
}

/// Aggiunge o rimuove un elemento dai preferiti (pin).
#[tauri::command]
pub fn toggle_favorite_clipboard(
    entry_id: String,
    state: tauri::State<'_, SharedClipboard>,
) -> Result<bool, String> {
    let mut locked = state
        .lock()
        .map_err(|e| format!("Impossibile acquisire il lock sugli appunti: {e}"))?;

    for entry in &mut locked.entries {
        if entry.id == entry_id {
            entry.is_favorite = !entry.is_favorite;
            return Ok(entry.is_favorite);
        }
    }

    Err(format!("Elemento appunti '{entry_id}' non trovato"))
}
