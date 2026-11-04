#![deny(clippy::unwrap_used)]

pub mod app_indexer;
pub mod clipboard_daemon;
pub mod file_ops_uninstaller;
pub mod gestures_hotkeys;
pub mod hardware_monitor;
pub mod media_system_bridge;
pub mod notch_detector;
pub mod sidecar_manager;
pub mod window_manager;

use sidecar_manager::SidecarState;
use std::sync::{Arc, Mutex};
use tauri::{ActivationPolicy, Manager, RunEvent, WindowEvent};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

/// Hotkey globale di default (specchio di DEFAULT_LAUNCH_HOTKEY in launchme.ts).
const DEFAULT_LAUNCH_HOTKEY: &str = "CommandOrControl+4";

#[tauri::command]
fn get_ipc_secret(state: tauri::State<'_, SidecarState>) -> Result<String, String> {
    match state.get_ipc_secret() {
        Ok(Some(secret)) => Ok(secret),
        Ok(None) => Err("IPC Secret non ancora generato".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn open_app(app_path: String) -> Result<(), String> {
    log::info!("[lib] Avvio applicazione/percorso: {app_path}");
    let resolved_path = if app_path.starts_with("~/") {
        match std::env::var("HOME") {
            Ok(home) => app_path.replacen('~', &home, 1),
            Err(e) => {
                log::warn!("[lib] Impossibile recuperare $HOME per espandere '~': {e}");
                app_path
            }
        }
    } else {
        app_path
    };

    std::process::Command::new("/usr/bin/open")
        .arg(&resolved_path)
        .spawn()
        .map_err(|e| {
            let msg = format!("Errore durante l'avvio di '{resolved_path}': {e}");
            log::error!("[lib] {msg}");
            msg
        })?;
    Ok(())
}

pub fn run() {
    let sidecar_state = SidecarState::new();
    let sidecar_state_clone = sidecar_state.clone();
    let sidecar_state_run = sidecar_state.clone();

    let clipboard_state: clipboard_daemon::SharedClipboard =
        Arc::new(Mutex::new(clipboard_daemon::ClipboardState::default()));
    clipboard_daemon::start_clipboard_daemon(clipboard_state.clone());

    let hardware_state = hardware_monitor::HardwareState::default();

    let result = tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(sidecar_state.clone())
        .manage(clipboard_state)
        .manage(hardware_state)
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    // Solo su Pressed: su Released il launcher si richiuderebbe subito.
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    if let Err(e) = window_manager::toggle_launcher_window(app.clone()) {
                        log::error!("[hotkey] toggle_launcher_window fallito: {e}");
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_ipc_secret,
            window_manager::toggle_launcher_window,
            window_manager::set_launcher_visibility,
            window_manager::set_notch_expanded,
            app_indexer::scan_apps,
            app_indexer::get_app_icon,
            app_indexer::prefetch_app_icons,
            gestures_hotkeys::configure_gestures,
            open_app,
            file_ops_uninstaller::search_files,
            file_ops_uninstaller::quicklook_preview,
            file_ops_uninstaller::show_in_finder,
            file_ops_uninstaller::trash_file,
            file_ops_uninstaller::scan_app_leftovers,
            file_ops_uninstaller::move_to_trash_batch,
            clipboard_daemon::get_clipboard_history,
            clipboard_daemon::copy_to_clipboard,
            clipboard_daemon::clear_clipboard_history,
            clipboard_daemon::toggle_favorite_clipboard,
            media_system_bridge::get_media_status,
            media_system_bridge::media_play_pause,
            media_system_bridge::media_next_track,
            media_system_bridge::media_previous_track,
            hardware_monitor::get_hardware_stats,
            notch_detector::get_notch_metrics,
        ])
        .setup(move |app| {
            println!("[JLauncherOS Host] Inizializzazione applicazione Tauri v2...");
            if let Err(err) = sidecar_state_clone.spawn(&app.handle()) {
                eprintln!(
                    "[JLauncherOS Host] ERRORE durante lo spawn del sidecar Python: {}",
                    err
                );
            }

            #[cfg(target_os = "macos")]
            app.set_activation_policy(ActivationPolicy::Accessory);

            let handle = app.handle().clone();
            if let Err(e) = window_manager::position_notch_on_cursor_monitor(&handle) {
                log::error!("[setup] posizionamento notch fallito: {e}");
            }
            app.global_shortcut().register(DEFAULT_LAUNCH_HOTKEY).map_err(|e| {
                log::error!("[setup] registrazione hotkey '{DEFAULT_LAUNCH_HOTKEY}' fallita: {e}");
                e
            })?;
            if let Err(e) = gestures_hotkeys::start(&handle) {
                log::error!("[setup] avvio gestures_hotkeys fallito: {e}");
            }

            // Tray Icon nella Menu Bar di macOS per controllo rapido e stato
            let toggle_i = tauri::menu::MenuItem::with_id(app, "toggle", "Apri / Chiudi (⌘4)", true, None::<&str>)
                .map_err(|e| format!("{e}"))?;
            let quit_i = tauri::menu::MenuItem::with_id(app, "quit", "Esci da LaunchMeClone", true, None::<&str>)
                .map_err(|e| format!("{e}"))?;
            let menu = tauri::menu::Menu::with_items(app, &[&toggle_i, &quit_i])
                .map_err(|e| format!("{e}"))?;

            let mut tray_builder = tauri::tray::TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event {
                        let app = tray.app_handle();
                        if let Err(e) = window_manager::toggle_launcher_window(app.clone()) {
                            log::error!("[tray] toggle fallito: {e}");
                        }
                    }
                })
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "toggle" => {
                            if let Err(e) = window_manager::toggle_launcher_window(app.clone()) {
                                log::error!("[tray_menu] toggle fallito: {e}");
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            if let Err(e) = tray_builder.build(app) {
                log::error!("[setup] creazione tray icon fallita: {e}");
            }

            // Mostriamo il launcher all'avvio iniziale per feedback visivo immediato
            let handle_open = app.handle().clone();
            if let Err(e) = window_manager::set_launcher_visibility(handle_open, true) {
                log::error!("[setup] apertura launcher iniziale fallita: {e}");
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // Il launcher non viene mai distrutto: la chiusura equivale a nasconderlo.
            if window.label() == window_manager::LAUNCHER_LABEL {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    if let Err(e) = window_manager::set_launcher_visibility(window.app_handle().clone(), false) {
                        log::error!("[window_event] hide su CloseRequested fallito: {e}");
                    }
                }
            }
        })
        .build(tauri::generate_context!());

    match result {
        Ok(app) => app.run(move |handle, event| match event {
            // Shutdown pulito: rimuove monitor NSEvent, osservatori e device Multitouch.
            RunEvent::Exit => {
                gestures_hotkeys::stop();
                if let Err(err) = sidecar_state_run.graceful_shutdown() {
                    eprintln!("[JLauncherOS Host] Errore graceful shutdown: {err}");
                }
            }
            // Quando l'utente clicca sull'app nel Finder/Dock/Spotlight mentre è già aperta
            RunEvent::Reopen { .. } => {
                if let Err(e) = window_manager::set_launcher_visibility(handle.clone(), true) {
                    log::error!("[run] apertura launcher su Reopen fallita: {e}");
                }
            }
            _ => {}
        }),
        Err(e) => {
            log::error!("[run] errore fatale dell'applicazione Tauri: {e}");
            eprintln!("[run] errore fatale dell'applicazione Tauri: {e}");
            std::process::exit(1);
        }
    }
}
