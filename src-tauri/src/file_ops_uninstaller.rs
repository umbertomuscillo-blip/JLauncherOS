//! Modulo per la ricerca file istantanea via Spotlight (mdfind),
//! QuickLook, integrazione con il Finder e spostamento nel Cestino.
//! Regole del progetto: zero `.unwrap()`, ogni operazione è tracciata con `log`.

use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileSearchResult {
    pub path: String,
    pub name: String,
    pub is_directory: bool,
    pub size_bytes: Option<u64>,
    pub extension: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppLeftoverItem {
    pub path: String,
    pub name: String,
    pub category: String,
    pub size_bytes: u64,
    pub is_directory: bool,
}

/// Risolve eventuali prefissi tilde `~/` verso la directory `$HOME` dell'utente.
fn resolve_tilde(path_str: &str) -> String {
    if path_str.starts_with("~/") {
        match std::env::var("HOME") {
            Ok(home) => path_str.replacen('~', &home, 1),
            Err(e) => {
                log::warn!("[file_ops] Impossibile recuperare $HOME: {e}");
                path_str.to_string()
            }
        }
    } else {
        path_str.to_string()
    }
}

/// Ricerca rapida di file e cartelle su disco tramite l'indicizzatore nativo Spotlight (`mdfind`).
#[tauri::command]
pub fn search_files(query: String, max_results: Option<usize>) -> Result<Vec<FileSearchResult>, String> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

    let limit = max_results.unwrap_or(25);
    log::info!("[file_ops] Ricerca Spotlight per '{trimmed}' (max {limit} risultati)");

    // Usiamo mdfind -name per matching rapido su nomi di file e cartelle
    let output = Command::new("/usr/bin/mdfind")
        .arg("-name")
        .arg(trimmed)
        .output()
        .map_err(|e| {
            let msg = format!("Errore durante l'esecuzione di mdfind: {e}");
            log::error!("[file_ops] {msg}");
            msg
        })?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        log::error!("[file_ops] mdfind fallito: {err_msg}");
        return Err(format!("mdfind terminato con errore: {err_msg}"));
    }

    let stdout_str = String::from_utf8_lossy(&output.stdout);
    let mut results = Vec::new();

    for line in stdout_str.lines() {
        let p_str = line.trim();
        if p_str.is_empty() {
            continue;
        }

        // Filtra directory di sistema o cartelle interne non rilevanti
        if p_str.starts_with("/System")
            || p_str.starts_with("/private")
            || p_str.contains("/.Trash")
            || p_str.contains("/Library/Caches")
        {
            continue;
        }

        let path = Path::new(p_str);
        if !path.exists() {
            continue;
        }

        let name = match path.file_name() {
            Some(n) => n.to_string_lossy().to_string(),
            None => p_str.to_string(),
        };

        let metadata = path.metadata().ok();
        let is_directory = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);
        let size_bytes = metadata.as_ref().map(|m| m.len());
        let extension = path.extension().map(|e| e.to_string_lossy().to_string());

        results.push(FileSearchResult {
            path: p_str.to_string(),
            name,
            is_directory,
            size_bytes,
            extension,
        });

        if results.len() >= limit {
            break;
        }
    }

    Ok(results)
}

/// Apre l'anteprima nativa QuickLook di macOS su un percorso file.
#[tauri::command]
pub fn quicklook_preview(path: String) -> Result<(), String> {
    let resolved = resolve_tilde(&path);
    log::info!("[file_ops] Apertura anteprima QuickLook per '{resolved}'");

    Command::new("/usr/bin/qlmanage")
        .arg("-p")
        .arg(&resolved)
        .spawn()
        .map_err(|e| {
            let msg = format!("Impossibile avviare QuickLook (qlmanage): {e}");
            log::error!("[file_ops] {msg}");
            msg
        })?;

    Ok(())
}

/// Mostra e seleziona il file all'interno del Finder di macOS.
#[tauri::command]
pub fn show_in_finder(path: String) -> Result<(), String> {
    let resolved = resolve_tilde(&path);
    log::info!("[file_ops] Mostra nel Finder: '{resolved}'");

    Command::new("/usr/bin/open")
        .arg("-R")
        .arg(&resolved)
        .spawn()
        .map_err(|e| {
            let msg = format!("Impossibile aprire il Finder con /usr/bin/open -R: {e}");
            log::error!("[file_ops] {msg}");
            msg
        })?;

    Ok(())
}

/// Sposta in modo sicuro un file o una directory nel Cestino di macOS.
#[tauri::command]
pub fn trash_file(path: String) -> Result<(), String> {
    let resolved = resolve_tilde(&path);
    log::info!("[file_ops] Spostamento nel Cestino di '{resolved}'");

    // Script AppleScript per spostare nel cestino del Finder
    let script = format!(
        "tell application \"Finder\" to delete POSIX file \"{}\"",
        resolved.replace('"', "\\\"")
    );

    let output = Command::new("/usr/bin/osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| {
            let msg = format!("Errore durante l'esecuzione di osascript per il cestino: {e}");
            log::error!("[file_ops] {msg}");
            msg
        })?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        log::error!("[file_ops] Spostamento nel cestino fallito: {err_msg}");
        return Err(format!("Impossibile spostare nel Cestino: {err_msg}"));
    }

    Ok(())
}

/// Calcola ricorsivamente la dimensione totale di una cartella o file senza seguire i symlink.
fn calculate_dir_size(path: &Path) -> u64 {
    let mut total: u64 = 0;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if let Ok(meta) = p.symlink_metadata() {
                if meta.is_dir() {
                    total = total.saturating_add(calculate_dir_size(&p));
                } else {
                    total = total.saturating_add(meta.len());
                }
            }
        }
    }
    total
}

/// Scansiona in profondità le directory standard di macOS in `~/Library/` per individuare
/// file e cartelle orfane/residue associate al bundle identifier o al nome dell'app.
#[tauri::command]
pub fn scan_app_leftovers(
    bundle_id: String,
    app_name: String,
) -> Result<Vec<AppLeftoverItem>, String> {
    let clean_bundle = bundle_id.trim();
    let clean_name = app_name.trim();

    // Guardie di sicurezza per prevenire falsi positivi catastrofici
    if clean_bundle.len() < 4 && clean_name.len() < 3 {
        log::warn!(
            "[uninstaller] Parametri di scansione troppo brevi: '{clean_bundle}', '{clean_name}'"
        );
        return Ok(Vec::new());
    }

    let home_dir = match std::env::var("HOME") {
        Ok(h) => h,
        Err(e) => {
            let msg = format!("Impossibile accedere alla variabile HOME: {e}");
            log::error!("[uninstaller] {msg}");
            return Err(msg);
        }
    };

    let base_library = Path::new(&home_dir).join("Library");
    if !base_library.exists() {
        return Ok(Vec::new());
    }

    let target_dirs: Vec<(&str, &str)> = vec![
        ("Application Support", "app_support"),
        ("Caches", "caches"),
        ("Preferences", "preferences"),
        ("Saved Application State", "saved_state"),
        ("Containers", "containers"),
        ("Logs", "logs"),
        ("HTTPStorages", "caches"),
        ("WebKit", "caches"),
    ];

    let mut leftovers = Vec::new();
    let lower_bundle = clean_bundle.to_ascii_lowercase();
    let lower_name = clean_name.to_ascii_lowercase();
    let no_spaces_name = lower_name.replace(' ', "");

    for (sub_dir, category) in target_dirs {
        let dir_path = base_library.join(sub_dir);
        if !dir_path.exists() {
            continue;
        }

        let entries = match std::fs::read_dir(&dir_path) {
            Ok(e) => e,
            Err(e) => {
                log::debug!("[uninstaller] Impossibile leggere {:?}: {e}", dir_path);
                continue;
            }
        };

        for entry in entries.flatten() {
            let item_path = entry.path();
            let file_name = match item_path.file_name() {
                Some(n) => n.to_string_lossy().to_string(),
                None => continue,
            };
            let lower_file_name = file_name.to_ascii_lowercase();

            // Criteri di matching rigorosi:
            let matches_bundle = lower_file_name == lower_bundle
                || lower_file_name.starts_with(&format!("{lower_bundle}."))
                || lower_file_name.starts_with(&format!("{lower_bundle}-"));

            let matches_name = if clean_name.len() >= 3
                && (category == "app_support" || category == "caches" || category == "logs")
            {
                lower_file_name == lower_name
                    || lower_file_name == format!("{lower_name}.app")
                    || (no_spaces_name.len() >= 4 && lower_file_name == no_spaces_name)
            } else {
                false
            };

            if matches_bundle || matches_name {
                let metadata = match item_path.symlink_metadata() {
                    Ok(m) => m,
                    Err(_) => continue,
                };

                let is_dir = metadata.is_dir();
                let size_bytes = if is_dir {
                    calculate_dir_size(&item_path)
                } else {
                    metadata.len()
                };

                leftovers.push(AppLeftoverItem {
                    path: item_path.to_string_lossy().to_string(),
                    name: file_name,
                    category: category.to_string(),
                    size_bytes,
                    is_directory: is_dir,
                });
            }
        }
    }

    log::info!(
        "[uninstaller] Trovati {} residui per '{}' ({})",
        leftovers.len(),
        clean_name,
        clean_bundle
    );

    Ok(leftovers)
}

/// Sposta in modo sicuro un insieme di file o cartelle nel Cestino di macOS via AppleScript Finder.
/// Non usa mai `rm -rf`: garantisce la possibilità di ripristino ("Put Back").
#[tauri::command]
pub fn move_to_trash_batch(paths: Vec<String>) -> Result<Vec<String>, String> {
    let mut trashed = Vec::new();
    let mut errors = Vec::new();

    for p in paths {
        let resolved = resolve_tilde(&p);
        let path = Path::new(&resolved);
        if !path.exists() {
            log::warn!("[uninstaller] Percorso inesistente ignorato: '{resolved}'");
            continue;
        }

        // AppleScript: tell application "Finder" to delete POSIX file "..."
        let script = format!(
            "tell application \"Finder\" to delete POSIX file \"{}\"",
            resolved.replace('\\', "\\\\").replace('"', "\\\"")
        );

        match Command::new("/usr/bin/osascript").arg("-e").arg(&script).output() {
            Ok(output) => {
                if output.status.success() {
                    log::info!("[uninstaller] Spostato nel Cestino: '{resolved}'");
                    trashed.push(resolved);
                } else {
                    let err_msg = String::from_utf8_lossy(&output.stderr).to_string();
                    log::error!("[uninstaller] Errore cestinamento per '{resolved}': {err_msg}");
                    errors.push(format!("{resolved}: {err_msg}"));
                }
            }
            Err(e) => {
                let msg = format!("Errore esecuzione osascript per '{resolved}': {e}");
                log::error!("[uninstaller] {msg}");
                errors.push(msg);
            }
        }
    }

    if trashed.is_empty() && !errors.is_empty() {
        return Err(format!(
            "Nessun elemento spostato nel Cestino: {}",
            errors.join("; ")
        ));
    }

    Ok(trashed)
}
