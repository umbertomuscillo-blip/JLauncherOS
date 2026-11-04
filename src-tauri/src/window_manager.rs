//! Window Manager nativo: Launcher fullscreen multi-monitor + Notch in alto al centro.

use tauri::{AppHandle, Emitter, LogicalSize, Manager, Monitor, PhysicalPosition, PhysicalSize, WebviewWindow};

pub const LAUNCHER_LABEL: &str = "launcher";
pub const NOTCH_LABEL: &str = "notch";
pub const VISIBILITY_EVENT: &str = "launcher://visibility-changed";

const NOTCH_WIDTH: f64 = 520.0;
const NOTCH_COMPACT_HEIGHT: f64 = 64.0;
const NOTCH_EXPANDED_HEIGHT: f64 = 170.0;

/// Logga l'errore e lo converte in `String` per il ritorno ai comandi Tauri.
fn fail<E: std::fmt::Display>(context: &str) -> impl FnOnce(E) -> String + '_ {
    move |e| {
        let msg = format!("{context}: {e}");
        log::error!("[window_manager] {msg}");
        msg
    }
}

fn get_window(app: &AppHandle, label: &str) -> Result<WebviewWindow, String> {
    app.get_webview_window(label).ok_or_else(|| {
        let msg = format!("finestra '{label}' non trovata");
        log::error!("[window_manager] {msg}");
        msg
    })
}

fn contains(m: &Monitor, p: &PhysicalPosition<f64>) -> bool {
    let (mp, ms) = (m.position(), m.size());
    p.x >= f64::from(mp.x)
        && p.x < f64::from(mp.x) + f64::from(ms.width)
        && p.y >= f64::from(mp.y)
        && p.y < f64::from(mp.y) + f64::from(ms.height)
}

/// Monitor su cui si trova il cursore; fallback sul monitor primario (con warning).
fn monitor_under_cursor(app: &AppHandle) -> Result<Monitor, String> {
    let cursor = app.cursor_position().map_err(fail("lettura posizione cursore"))?;
    let monitors = app.available_monitors().map_err(fail("elenco monitor"))?;
    if let Some(m) = monitors.into_iter().find(|m| contains(m, &cursor)) {
        return Ok(m);
    }
    log::warn!(
        "[window_manager] nessun monitor contiene il cursore ({}, {}): uso il primario",
        cursor.x,
        cursor.y
    );
    app.primary_monitor()
        .map_err(fail("lettura monitor primario"))?
        .ok_or_else(|| {
            let msg = "nessun monitor disponibile".to_string();
            log::error!("[window_manager] {msg}");
            msg
        })
}

/// Configura la NSWindow come overlay non bloccante sopra Spaces e app fullscreen.
#[cfg(target_os = "macos")]
fn apply_overlay_behavior(window: &WebviewWindow) -> Result<(), String> {
    use objc2_app_kit::{NSPopUpMenuWindowLevel, NSWindow, NSWindowCollectionBehavior};

    let win = window.clone();
    window
        .run_on_main_thread(move || {
            let ptr = match win.ns_window() {
                Ok(p) => p,
                Err(e) => {
                    log::error!("[window_manager] ns_window() fallito: {e}");
                    return;
                }
            };
            if ptr.is_null() {
                log::error!("[window_manager] ns_window() ha restituito un puntatore nullo");
                return;
            }
            // SAFETY: il puntatore proviene da Tauri, è non nullo ed è usato sul main thread.
            let ns_window: &NSWindow = unsafe { &*ptr.cast::<NSWindow>() };
            ns_window.setLevel(NSPopUpMenuWindowLevel);
            ns_window.setCollectionBehavior(
                NSWindowCollectionBehavior::CanJoinAllSpaces
                    | NSWindowCollectionBehavior::FullScreenAuxiliary
                    | NSWindowCollectionBehavior::Stationary
                    | NSWindowCollectionBehavior::IgnoresCycle,
            );
            ns_window.setHasShadow(false);
            ns_window.setOpaque(false);
        })
        .map_err(fail("run_on_main_thread(apply_overlay_behavior)"))
}

#[cfg(not(target_os = "macos"))]
fn apply_overlay_behavior(_window: &WebviewWindow) -> Result<(), String> {
    Ok(())
}

fn emit_visibility(app: &AppHandle, visible: bool) -> Result<(), String> {
    app.emit(VISIBILITY_EVENT, visible)
        .map_err(fail("emissione launcher://visibility-changed"))
}

fn show_launcher(app: &AppHandle) -> Result<(), String> {
    let window = get_window(app, LAUNCHER_LABEL)?;
    let monitor = monitor_under_cursor(app)?;
    window
        .set_position(*monitor.position())
        .map_err(fail("set_position launcher"))?;
    window
        .set_size(*monitor.size())
        .map_err(fail("set_size launcher"))?;
    apply_overlay_behavior(&window)?;
    window.show().map_err(fail("show launcher"))?;
    window.set_focus().map_err(fail("set_focus launcher"))?;
    emit_visibility(app, true)
}

fn hide_launcher(app: &AppHandle) -> Result<(), String> {
    let window = get_window(app, LAUNCHER_LABEL)?;
    window.hide().map_err(fail("hide launcher"))?;
    emit_visibility(app, false)
}

/// Apre/chiude il launcher sul monitor del cursore. Ritorna il nuovo stato di visibilità.
#[tauri::command]
pub fn toggle_launcher_window(app: AppHandle) -> Result<bool, String> {
    let window = get_window(&app, LAUNCHER_LABEL)?;
    let visible = window.is_visible().map_err(fail("is_visible launcher"))?;
    if visible {
        hide_launcher(&app)?;
        Ok(false)
    } else {
        show_launcher(&app)?;
        Ok(true)
    }
}

/// Mostra o nasconde esplicitamente il launcher, emettendo l'evento di visibilità.
#[tauri::command]
pub fn set_launcher_visibility(app: AppHandle, visible: bool) -> Result<(), String> {
    if visible {
        show_launcher(&app)
    } else {
        hide_launcher(&app)
    }
}

/// Posiziona il notch in alto al centro del monitor che contiene il cursore.
pub fn position_notch_on_cursor_monitor(app: &AppHandle) -> Result<(), String> {
    let window = get_window(app, NOTCH_LABEL)?;
    let monitor = monitor_under_cursor(app)?;
    let size: PhysicalSize<u32> = window.outer_size().map_err(fail("outer_size notch"))?;
    let (mp, ms) = (monitor.position(), monitor.size());
    let x = mp.x + (i32::try_from(ms.width).unwrap_or(0) - i32::try_from(size.width).unwrap_or(0)) / 2;
    window
        .set_position(PhysicalPosition::new(x, mp.y))
        .map_err(fail("set_position notch"))?;
    apply_overlay_behavior(&window)
}

/// Ridimensiona la finestra notch (compatta/espansa) mantenendola centrata in alto.
#[tauri::command]
pub fn set_notch_expanded(app: AppHandle, expanded: bool) -> Result<(), String> {
    let window = get_window(&app, NOTCH_LABEL)?;
    let height = if expanded { NOTCH_EXPANDED_HEIGHT } else { NOTCH_COMPACT_HEIGHT };
    window
        .set_size(LogicalSize::new(NOTCH_WIDTH, height))
        .map_err(fail("set_size notch"))?;
    position_notch_on_cursor_monitor(&app)
}
