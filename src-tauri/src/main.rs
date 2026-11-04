// Evita la finestra console aggiuntiva su Windows in release; no-op su macOS.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    jlauncheros_lib::run();
}
