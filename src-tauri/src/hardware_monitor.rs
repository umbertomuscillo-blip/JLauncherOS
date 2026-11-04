#![deny(clippy::unwrap_used)]

use serde::{Deserialize, Serialize};
use std::process::Command;
use std::sync::Mutex;
use sysinfo::System;

pub struct HardwareState {
    pub sys: Mutex<System>,
}

impl Default for HardwareState {
    fn default() -> Self {
        let mut sys = System::new();
        sys.refresh_cpu_usage();
        sys.refresh_memory();
        Self {
            sys: Mutex::new(sys),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatteryStats {
    pub percentage: u8,
    pub is_charging: bool,
    pub is_plugged: bool,
    pub time_remaining: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareStats {
    pub cpu_usage: f32,
    pub memory_used_gb: f64,
    pub memory_total_gb: f64,
    pub memory_percentage: f32,
    pub battery: Option<BatteryStats>,
}

/// Legge lo stato della batteria eseguendo /usr/bin/pmset -g batt (nativo macOS).
/// Restituisce None se si tratta di un Mac desktop privo di batteria interna.
fn read_battery_info() -> Option<BatteryStats> {
    let output = Command::new("/usr/bin/pmset")
        .arg("-g")
        .arg("batt")
        .output();

    let out = match output {
        Ok(o) => {
            if !o.status.success() {
                return None;
            }
            String::from_utf8_lossy(&o.stdout).to_string()
        }
        Err(e) => {
            log::warn!("[hardware_monitor] Impossibile eseguire pmset: {e}");
            return None;
        }
    };

    if !out.contains("InternalBattery") {
        return None;
    }

    let is_plugged = out.contains("AC Power");

    // Esempio output riga 2:
    //  -InternalBattery-0 (id=35520611)	100%; charged; 0:00 remaining present: true
    //  -InternalBattery-0 (id=35520611)	78%; discharging; 3:45 remaining present: true
    //  -InternalBattery-0 (id=35520611)	45%; charging; 1:12 remaining present: true
    let mut percentage: u8 = 100;
    let mut is_charging = false;
    let mut time_remaining: Option<String> = None;

    for line in out.lines() {
        if line.contains("InternalBattery") {
            let parts: Vec<&str> = line.split(';').collect();
            if let Some(first_part) = parts.first() {
                if let Some(pct_idx) = first_part.find('%') {
                    let num_slice = &first_part[..pct_idx];
                    let digits: String = num_slice.chars().filter(|c| c.is_ascii_digit()).collect();
                    if let Ok(pct) = digits.parse::<u8>() {
                        percentage = pct.min(100);
                    }
                }
            }

            if let Some(state_part) = parts.get(1) {
                let s = state_part.trim().to_lowercase();
                if s.contains("charging") && !s.contains("discharging") {
                    is_charging = true;
                } else if s.contains("charged") {
                    is_charging = false;
                }
            }

            if let Some(rem_part) = parts.get(2) {
                let trimmed = rem_part.trim();
                if let Some(rem_idx) = trimmed.find("remaining") {
                    let time_str = trimmed[..rem_idx].trim().to_string();
                    if !time_str.is_empty() && time_str != "0:00" {
                        time_remaining = Some(time_str);
                    }
                }
            }
        }
    }

    Some(BatteryStats {
        percentage,
        is_charging,
        is_plugged,
        time_remaining,
    })
}

/// Campiona l'utilizzo di CPU, RAM e lo stato della batteria.
#[tauri::command]
pub fn get_hardware_stats(
    state: tauri::State<'_, HardwareState>,
) -> Result<HardwareStats, String> {
    let mut sys = state
        .sys
        .lock()
        .map_err(|e| format!("Lock su HardwareState fallito: {e}"))?;

    sys.refresh_cpu_usage();
    sys.refresh_memory();

    let cpu_usage = sys.global_cpu_usage();
    let total_bytes = sys.total_memory();
    let used_bytes = sys.used_memory();

    let memory_total_gb = (total_bytes as f64) / (1024.0 * 1024.0 * 1024.0);
    let memory_used_gb = (used_bytes as f64) / (1024.0 * 1024.0 * 1024.0);
    let memory_percentage = if total_bytes > 0 {
        ((used_bytes as f32) / (total_bytes as f32)) * 100.0
    } else {
        0.0
    };

    let battery = read_battery_info();

    Ok(HardwareStats {
        cpu_usage: (cpu_usage * 10.0).round() / 10.0,
        memory_used_gb: (memory_used_gb * 100.0).round() / 100.0,
        memory_total_gb: (memory_total_gb * 10.0).round() / 10.0,
        memory_percentage: (memory_percentage * 10.0).round() / 10.0,
        battery,
    })
}
