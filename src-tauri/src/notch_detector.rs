//! Rilevamento metriche hardware del Notch di macOS tramite Cocoa (NSScreen safeAreaInsets).

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NotchMetrics {
    pub has_notch: bool,
    pub top_inset: f64,
    pub notch_width: f64,
    pub notch_height: f64,
    pub screen_width: f64,
    pub screen_height: f64,
}

impl NotchMetrics {
    #[must_use]
    pub fn fallback() -> Self {
        Self {
            has_notch: false,
            top_inset: 0.0,
            notch_width: 180.0,
            notch_height: 32.0,
            screen_width: 1920.0,
            screen_height: 1080.0,
        }
    }
}

#[cfg(target_os = "macos")]
#[must_use]
pub fn get_notch_metrics_internal() -> NotchMetrics {
    use objc2::MainThreadMarker;
    use objc2_app_kit::{NSEvent, NSScreen};

    let Some(mtm) = MainThreadMarker::new() else {
        log::warn!("[notch_detector] MainThreadMarker::new() ha restituito None, uso fallback");
        return NotchMetrics::fallback();
    };

    let screens = NSScreen::screens(mtm);
    if screens.is_empty() {
        return NotchMetrics::fallback();
    }

    // Cerchiamo lo schermo contenente il cursore del mouse; altrimenti usiamo il mainScreen
    let mouse_loc = NSEvent::mouseLocation();
    let target_screen = screens
        .iter()
        .find(|s| {
            let f = s.frame();
            mouse_loc.x >= f.origin.x
                && mouse_loc.x < f.origin.x + f.size.width
                && mouse_loc.y >= f.origin.y
                && mouse_loc.y < f.origin.y + f.size.height
        })
        .or_else(|| NSScreen::mainScreen(mtm));

    let screen = match target_screen {
        Some(s) => s,
        None => return NotchMetrics::fallback(),
    };

    let insets = screen.safeAreaInsets();
    let frame = screen.frame();
    let screen_width = frame.size.width;
    let screen_height = frame.size.height;

    if insets.top > 0.0 {
        let top_left = screen.auxiliaryTopLeftArea();
        let top_right = screen.auxiliaryTopRightArea();

        let notch_width = if top_right.size.width > 0.0 && top_left.size.width > 0.0 {
            let left_boundary = top_left.origin.x + top_left.size.width;
            let right_boundary = top_right.origin.x;
            (right_boundary - left_boundary).max(0.0)
        } else {
            // Larghezza di riferimento standard MacBook Pro / Air
            208.0
        };

        let notch_height = insets.top;

        NotchMetrics {
            has_notch: true,
            top_inset: insets.top,
            notch_width,
            notch_height,
            screen_width,
            screen_height,
        }
    } else {
        NotchMetrics {
            has_notch: false,
            top_inset: 0.0,
            notch_width: 180.0,
            notch_height: 32.0,
            screen_width,
            screen_height,
        }
    }
}

#[cfg(not(target_os = "macos"))]
#[must_use]
pub fn get_notch_metrics_internal() -> NotchMetrics {
    NotchMetrics::fallback()
}

/// Restituisce le metriche hardware del Notch per lo schermo attivo.
#[tauri::command]
pub async fn get_notch_metrics(app: tauri::AppHandle) -> Result<NotchMetrics, String> {
    let (tx, rx) = std::sync::mpsc::sync_channel(1);
    app.run_on_main_thread(move || {
        let metrics = get_notch_metrics_internal();
        let _ = tx.send(metrics);
    })
    .map_err(|e| {
        let msg = format!("run_on_main_thread fallito per get_notch_metrics: {e}");
        log::error!("[notch_detector] {msg}");
        msg
    })?;

    rx.recv().map_err(|e| {
        let msg = format!("Ricezione canale fallita per get_notch_metrics: {e}");
        log::error!("[notch_detector] {msg}");
        msg
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_notch_metrics_fallback() {
        let fallback = NotchMetrics::fallback();
        assert!(!fallback.has_notch);
        assert_eq!(fallback.top_inset, 0.0);
        assert_eq!(fallback.notch_width, 180.0);
        assert_eq!(fallback.notch_height, 32.0);
    }

    #[test]
    fn test_notch_metrics_json_serialization() {
        let metrics = NotchMetrics {
            has_notch: true,
            top_inset: 37.5,
            notch_width: 208.0,
            notch_height: 37.5,
            screen_width: 1710.0,
            screen_height: 1112.0,
        };
        let json = serde_json::to_string(&metrics).unwrap_or_default();
        assert!(json.contains("\"hasNotch\":true"));
        assert!(json.contains("\"topInset\":37.5"));
        assert!(json.contains("\"notchWidth\":208.0"));
    }
}
