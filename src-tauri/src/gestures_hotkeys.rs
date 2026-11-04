//! Hot Corners e Trackpad Gestures (pinch/spread a 3-5 dita).
//!
//! - Hot Corners: monitor `NSEvent` (mouseMoved) globale + locale, installati solo se almeno un angolo è attivo.
//! - Gesture: `MultitouchSupport.framework` (API privata) caricato con `dlopen`; attivo solo se pinch o spread sono abilitati.
//! - Dopo lo Sleep (`NSWorkspaceDidWakeNotification`) monitor e device Multitouch vengono ricreati.
//!
//! Regole del progetto: nessun `.unwrap()`, ogni errore viene tracciato con `log`.

use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};
use std::sync::{Mutex, MutexGuard, OnceLock, RwLock};
use std::time::{Duration, Instant};

use serde::Deserialize;
use tauri::{AppHandle, Manager};

use crate::window_manager;

const CORNER_ZONE: f64 = 2.0;
const CORNER_COOLDOWN: Duration = Duration::from_millis(600);
const PINCH_RATIO: f32 = 0.70;
const SPREAD_RATIO: f32 = 1.40;
const MIN_FINGERS: usize = 3;
const MAX_FINGERS: usize = 5;
/// Attesa dopo il risveglio: i device trackpad non sono subito disponibili.
const WAKE_RESTART_DELAY: Duration = Duration::from_millis(1500);

// ───────────────────────── Impostazioni ─────────────────────────

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum HotCornerAction {
    #[default]
    None,
    ToggleLauncher,
}

#[derive(Debug, Clone, Copy, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct HotCorners {
    pub top_left: HotCornerAction,
    pub top_right: HotCornerAction,
    pub bottom_left: HotCornerAction,
    pub bottom_right: HotCornerAction,
}

#[derive(Debug, Clone, Copy, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GestureSettings {
    pub hot_corners: HotCorners,
    pub pinch_enabled: bool,
    pub spread_enabled: bool,
}

// Stato letto dai callback ad alta frequenza: atomici, nessun lock nel percorso caldo.
static PINCH_ENABLED: AtomicBool = AtomicBool::new(false);
static SPREAD_ENABLED: AtomicBool = AtomicBool::new(false);
static CORNER_ACTIONS: [AtomicU8; 4] = [AtomicU8::new(0), AtomicU8::new(0), AtomicU8::new(0), AtomicU8::new(0)];
static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();
static SCREEN_FRAMES: RwLock<Vec<Rect>> = RwLock::new(Vec::new());
static CORNER_STATE: Mutex<CornerState> = Mutex::new(CornerState::new());
static PINCH_TRACKER: Mutex<PinchTracker> = Mutex::new(PinchTracker::new());

/// Acquisisce un lock tracciando (e recuperando) l'eventuale avvelenamento.
fn lock<'a, T>(m: &'a Mutex<T>, what: &str) -> MutexGuard<'a, T> {
    m.lock().unwrap_or_else(|poisoned| {
        log::error!("[gestures] mutex '{what}' avvelenato: recupero lo stato");
        poisoned.into_inner()
    })
}

fn store_settings(s: &GestureSettings) {
    PINCH_ENABLED.store(s.pinch_enabled, Ordering::Relaxed);
    SPREAD_ENABLED.store(s.spread_enabled, Ordering::Relaxed);
    let actions = [s.hot_corners.top_left, s.hot_corners.top_right, s.hot_corners.bottom_left, s.hot_corners.bottom_right];
    for (slot, action) in CORNER_ACTIONS.iter().zip(actions) {
        slot.store(action as u8, Ordering::Relaxed);
    }
}

fn corner_action(c: Corner) -> HotCornerAction {
    match CORNER_ACTIONS[c as usize].load(Ordering::Relaxed) {
        1 => HotCornerAction::ToggleLauncher,
        _ => HotCornerAction::None,
    }
}

fn any_corner_active() -> bool {
    CORNER_ACTIONS.iter().any(|a| a.load(Ordering::Relaxed) != 0)
}

// ───────────────────────── Logica pura: angoli ─────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Corner {
    TopLeft = 0,
    TopRight = 1,
    BottomLeft = 2,
    BottomRight = 3,
}

/// Rettangolo schermo in coordinate Cocoa (origine in basso a sinistra, in punti).
#[derive(Debug, Clone, Copy)]
pub struct Rect {
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
}

impl Rect {
    fn contains(&self, px: f64, py: f64) -> bool {
        px >= self.x && px < self.x + self.w && py >= self.y && py < self.y + self.h
    }
}

/// Angolo toccato dal cursore. Un angolo coperto da uno schermo adiacente non è raggiungibile e viene ignorato.
pub fn corner_hit(px: f64, py: f64, frames: &[Rect]) -> Option<Corner> {
    for (idx, f) in frames.iter().enumerate() {
        // (angolo, x, y, segno verso l'esterno su x, segno verso l'esterno su y)
        let corners = [
            (Corner::TopLeft, f.x, f.y + f.h, -1.0, 1.0),
            (Corner::TopRight, f.x + f.w, f.y + f.h, 1.0, 1.0),
            (Corner::BottomLeft, f.x, f.y, -1.0, -1.0),
            (Corner::BottomRight, f.x + f.w, f.y, 1.0, -1.0),
        ];
        for (corner, cx, cy, ox, oy) in corners {
            if (px - cx).abs() > CORNER_ZONE || (py - cy).abs() > CORNER_ZONE {
                continue;
            }
            let probes = [(cx + ox * 1.5, cy - oy * 1.5), (cx - ox * 1.5, cy + oy * 1.5)];
            let covered = frames
                .iter()
                .enumerate()
                .any(|(j, other)| j != idx && probes.iter().any(|(x, y)| other.contains(*x, *y)));
            if !covered {
                return Some(corner);
            }
        }
    }
    None
}

/// Anti-ripetizione: l'angolo scatta una volta e si riarma quando il cursore ne esce.
#[derive(Debug)]
pub struct CornerState {
    armed: bool,
    last_fire: Option<Instant>,
}

impl CornerState {
    pub const fn new() -> Self {
        Self { armed: true, last_fire: None }
    }

    pub fn step(&mut self, hit: Option<Corner>, now: Instant) -> Option<Corner> {
        let Some(corner) = hit else {
            self.armed = true;
            return None;
        };
        let cooled = self.last_fire.is_none_or(|t| now.duration_since(t) >= CORNER_COOLDOWN);
        if self.armed && cooled {
            self.armed = false;
            self.last_fire = Some(now);
            return Some(corner);
        }
        None
    }
}

// ───────────────────────── Logica pura: pinch / spread ─────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PinchEvent {
    Pinch,
    Spread,
}

#[derive(Debug)]
pub struct PinchTracker {
    fingers: usize,
    baseline: f32,
    fired: bool,
}

impl PinchTracker {
    pub const fn new() -> Self {
        Self { fingers: 0, baseline: 0.0, fired: false }
    }

    fn reset(&mut self) {
        *self = Self::new();
    }

    /// `points`: posizioni normalizzate dei contatti. Ritorna un evento al massimo una volta per sessione di tocco.
    pub fn update(&mut self, points: &[(f32, f32)], allow_pinch: bool, allow_spread: bool) -> Option<PinchEvent> {
        let n = points.len();
        if !(MIN_FINGERS..=MAX_FINGERS).contains(&n) {
            self.reset();
            return None;
        }
        let (sx, sy) = points.iter().fold((0.0_f32, 0.0_f32), |(ax, ay), (x, y)| (ax + x, ay + y));
        let (cx, cy) = (sx / n as f32, sy / n as f32);
        let spread = points.iter().map(|(x, y)| ((x - cx).powi(2) + (y - cy).powi(2)).sqrt()).sum::<f32>() / n as f32;

        // Nuova sessione o numero di dita cambiato: ricalibra la distanza di riferimento.
        if self.fingers != n || self.baseline <= f32::EPSILON {
            self.fingers = n;
            self.baseline = spread;
            self.fired = false;
            return None;
        }
        if self.fired {
            return None;
        }
        let ratio = spread / self.baseline;
        let event = if ratio < PINCH_RATIO && allow_pinch {
            PinchEvent::Pinch
        } else if ratio > SPREAD_RATIO && allow_spread {
            PinchEvent::Spread
        } else {
            return None;
        };
        self.fired = true;
        Some(event)
    }
}

// ───────────────────────── Azioni sul launcher ─────────────────────────

#[derive(Debug, Clone, Copy)]
enum LauncherCommand {
    Open,
    Close,
    Toggle,
}

/// Esegue l'azione fuori dal main thread (e fuori dal callback nativo) per evitare deadlock con Tauri.
fn dispatch(command: LauncherCommand, source: &'static str) {
    let Some(app) = APP_HANDLE.get().cloned() else {
        log::error!("[gestures] {source}: AppHandle non inizializzato");
        return;
    };
    tauri::async_runtime::spawn_blocking(move || {
        let visible = match app.get_webview_window(window_manager::LAUNCHER_LABEL) {
            Some(w) => match w.is_visible() {
                Ok(v) => v,
                Err(e) => {
                    log::error!("[gestures] {source}: lettura visibilità launcher fallita: {e}");
                    return;
                }
            },
            None => {
                log::error!("[gestures] {source}: finestra launcher non trovata");
                return;
            }
        };
        let result = match (command, visible) {
            (LauncherCommand::Open, false) | (LauncherCommand::Toggle, false) => window_manager::set_launcher_visibility(app, true),
            (LauncherCommand::Close, true) | (LauncherCommand::Toggle, true) => window_manager::set_launcher_visibility(app, false),
            _ => Ok(()),
        };
        if let Err(e) = result {
            log::error!("[gestures] {source}: azione {command:?} fallita: {e}");
        }
    });
}

fn handle_corner_hit(px: f64, py: f64) {
    if !any_corner_active() {
        return;
    }
    let hit = {
        let frames = SCREEN_FRAMES.read().unwrap_or_else(|p| {
            log::error!("[gestures] lock SCREEN_FRAMES avvelenato: recupero lo stato");
            p.into_inner()
        });
        corner_hit(px, py, &frames)
    };
    // Gli angoli senza azione non consumano l'armamento.
    let hit = hit.filter(|c| corner_action(*c) != HotCornerAction::None);
    let fired = lock(&CORNER_STATE, "CORNER_STATE").step(hit, Instant::now());
    if let Some(corner) = fired {
        if corner_action(corner) == HotCornerAction::ToggleLauncher {
            dispatch(LauncherCommand::Toggle, "hot_corner");
        }
    }
}

fn handle_contacts(points: &[(f32, f32)]) {
    let pinch = PINCH_ENABLED.load(Ordering::Relaxed);
    let spread = SPREAD_ENABLED.load(Ordering::Relaxed);
    let event = lock(&PINCH_TRACKER, "PINCH_TRACKER").update(points, pinch, spread);
    match event {
        Some(PinchEvent::Pinch) => dispatch(LauncherCommand::Open, "pinch"),
        Some(PinchEvent::Spread) => dispatch(LauncherCommand::Close, "spread"),
        None => {}
    }
}

// ───────────────────────── Multitouch (API privata) ─────────────────────────

#[cfg(target_os = "macos")]
mod multitouch {
    use super::{handle_contacts, lock, MAX_FINGERS};
    use std::ffi::{c_int, c_void};
    use std::sync::Mutex;

    const FRAMEWORK_PATH: &str = "/System/Library/PrivateFrameworks/MultitouchSupport.framework/MultitouchSupport";
    /// Stato `Touching` nel layout delle struct Multitouch.
    const STATE_TOUCHING: c_int = 4;
    const MAX_CONTACTS_PER_FRAME: c_int = 32;

    #[repr(C)]
    struct MtVector {
        x: f32,
        y: f32,
    }

    /// Layout reverse-engineered di `MTTouch` (96 byte su arm64).
    #[repr(C)]
    struct MtTouch {
        frame: c_int,
        timestamp: f64,
        identifier: c_int,
        state: c_int,
        finger_id: c_int,
        hand_id: c_int,
        normalized_pos: MtVector,
        normalized_vel: MtVector,
        size: f32,
        zero1: c_int,
        angle: f32,
        major_axis: f32,
        minor_axis: f32,
        mm_pos: MtVector,
        mm_vel: MtVector,
        zero2: [c_int; 2],
        density: f32,
    }

    type ContactCallback = extern "C" fn(*mut c_void, *const MtTouch, c_int, f64, c_int) -> c_int;
    type CreateListFn = unsafe extern "C" fn() -> *const c_void;
    type RegisterFn = unsafe extern "C" fn(*mut c_void, ContactCallback);
    type StartFn = unsafe extern "C" fn(*mut c_void, c_int);
    type StopFn = unsafe extern "C" fn(*mut c_void);

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        fn CFArrayGetCount(array: *const c_void) -> isize;
        fn CFArrayGetValueAtIndex(array: *const c_void, index: isize) -> *const c_void;
        fn CFRelease(cf: *const c_void);
    }

    struct Session {
        _library: libloading::Library,
        unregister: RegisterFn,
        stop: StopFn,
        list: usize,
        devices: Vec<usize>,
    }

    static SESSION: Mutex<Option<Session>> = Mutex::new(None);

    extern "C" fn contact_callback(_device: *mut c_void, touches: *const MtTouch, count: c_int, _timestamp: f64, _frame: c_int) -> c_int {
        if touches.is_null() || count <= 0 || count > MAX_CONTACTS_PER_FRAME {
            handle_contacts(&[]);
            return 0;
        }
        // SAFETY: il framework garantisce `count` strutture valide per la durata del callback.
        let slice = unsafe { std::slice::from_raw_parts(touches, count as usize) };
        let mut points = [(0.0_f32, 0.0_f32); MAX_FINGERS + 1];
        let mut n = 0;
        for t in slice.iter().filter(|t| t.state == STATE_TOUCHING) {
            if n < points.len() {
                points[n] = (t.normalized_pos.x, t.normalized_pos.y);
                n += 1;
            }
        }
        handle_contacts(&points[..n]);
        0
    }

    pub fn is_running() -> bool {
        lock(&SESSION, "SESSION").is_some()
    }

    #[cfg(test)]
    pub fn touch_struct_size() -> usize {
        std::mem::size_of::<MtTouch>()
    }

    pub fn start() -> Result<usize, String> {
        let mut guard = lock(&SESSION, "SESSION");
        if guard.is_some() {
            return Ok(guard.as_ref().map_or(0, |s| s.devices.len()));
        }
        // SAFETY: caricamento di un framework di sistema; i simboli sono risolti e validati subito sotto.
        let library = unsafe { libloading::Library::new(FRAMEWORK_PATH) }.map_err(|e| format!("dlopen MultitouchSupport fallito: {e}"))?;
        macro_rules! sym {
            ($name:literal, $ty:ty) => {{
                // SAFETY: firma ricavata dalla documentazione reverse-engineered dell'API.
                let s = unsafe { library.get::<$ty>(concat!($name, "\0").as_bytes()) }
                    .map_err(|e| format!("simbolo {} non trovato: {e}", $name))?;
                *s
            }};
        }
        let create_list: CreateListFn = sym!("MTDeviceCreateList", CreateListFn);
        let register: RegisterFn = sym!("MTRegisterContactFrameCallback", RegisterFn);
        let unregister: RegisterFn = sym!("MTUnregisterContactFrameCallback", RegisterFn);
        let start: StartFn = sym!("MTDeviceStart", StartFn);
        let stop: StopFn = sym!("MTDeviceStop", StopFn);

        // SAFETY: `MTDeviceCreateList` restituisce un CFArray (+1) o null.
        let list = unsafe { create_list() };
        if list.is_null() {
            return Err("MTDeviceCreateList ha restituito null".to_string());
        }
        let count = unsafe { CFArrayGetCount(list) };
        let mut devices = Vec::new();
        for i in 0..count {
            let dev = unsafe { CFArrayGetValueAtIndex(list, i) };
            if dev.is_null() {
                log::error!("[gestures] device Multitouch #{i} nullo, saltato");
                continue;
            }
            unsafe {
                register(dev.cast_mut(), contact_callback);
                start(dev.cast_mut(), 0);
            }
            devices.push(dev as usize);
        }
        log::info!("[gestures] Multitouch attivo su {} device", devices.len());
        let n = devices.len();
        *guard = Some(Session { _library: library, unregister, stop, list: list as usize, devices });
        Ok(n)
    }

    pub fn stop() {
        let Some(session) = lock(&SESSION, "SESSION").take() else { return };
        for dev in &session.devices {
            // SAFETY: i device appartengono ancora all'array `list`, rilasciato solo dopo.
            unsafe {
                (session.unregister)(*dev as *mut c_void, contact_callback);
                (session.stop)(*dev as *mut c_void);
            }
        }
        // SAFETY: `list` è stato creato con `MTDeviceCreateList` (+1).
        unsafe { CFRelease(session.list as *const c_void) };
        handle_contacts(&[]);
        log::info!("[gestures] Multitouch fermato");
    }
}

/// Avvia o ferma Multitouch in base alle impostazioni correnti.
fn sync_multitouch() {
    #[cfg(target_os = "macos")]
    {
        let wanted = PINCH_ENABLED.load(Ordering::Relaxed) || SPREAD_ENABLED.load(Ordering::Relaxed);
        if wanted {
            if let Err(e) = multitouch::start() {
                log::error!("[gestures] avvio Multitouch fallito: {e}");
            }
        } else if multitouch::is_running() {
            multitouch::stop();
        }
    }
}

// ───────────────────────── Cocoa: monitor e notifiche ─────────────────────────

#[cfg(target_os = "macos")]
mod cocoa {
    use super::{handle_corner_hit, any_corner_active, sync_multitouch, Rect, SCREEN_FRAMES, WAKE_RESTART_DELAY};
    use block2::RcBlock;
    use objc2::rc::Retained;
    use objc2::runtime::{AnyObject, ProtocolObject};
    use objc2::MainThreadMarker;
    use objc2_app_kit::{NSApplicationDidChangeScreenParametersNotification, NSEvent, NSEventMask, NSScreen, NSWorkspace, NSWorkspaceDidWakeNotification};
    use objc2_foundation::{NSNotification, NSNotificationCenter, NSObjectProtocol};
    use std::cell::RefCell;
    use std::ptr::NonNull;

    #[derive(Default)]
    struct MainState {
        global_monitor: Option<Retained<AnyObject>>,
        local_monitor: Option<Retained<AnyObject>>,
        wake_observer: Option<Retained<ProtocolObject<dyn NSObjectProtocol>>>,
        screen_observer: Option<Retained<ProtocolObject<dyn NSObjectProtocol>>>,
    }

    // Tutto lo stato Cocoa vive e muore sul main thread: nessun `unsafe impl Send` necessario.
    thread_local! {
        static MAIN_STATE: RefCell<MainState> = RefCell::new(MainState::default());
    }

    fn with_state<R>(f: impl FnOnce(&mut MainState) -> R) -> Result<R, String> {
        MAIN_STATE
            .try_with(|s| match s.try_borrow_mut() {
                Ok(mut st) => Ok(f(&mut st)),
                Err(e) => Err(format!("MAIN_STATE già in uso: {e}")),
            })
            .map_err(|e| format!("MAIN_STATE non accessibile: {e}"))?
    }

    pub fn refresh_screen_frames(mtm: MainThreadMarker) {
        let frames: Vec<Rect> = NSScreen::screens(mtm)
            .iter()
            .map(|s| {
                let f = s.frame();
                Rect { x: f.origin.x, y: f.origin.y, w: f.size.width, h: f.size.height }
            })
            .collect();
        match SCREEN_FRAMES.write() {
            Ok(mut guard) => *guard = frames,
            Err(poisoned) => {
                log::error!("[gestures] lock SCREEN_FRAMES avvelenato: lo ripristino");
                *poisoned.into_inner() = frames;
            }
        }
    }

    fn on_mouse_moved() {
        let p = NSEvent::mouseLocation();
        handle_corner_hit(p.x, p.y);
    }

    fn install_corner_monitors(mtm: MainThreadMarker) -> Result<(), String> {
        refresh_screen_frames(mtm);
        with_state(|st| {
            if st.global_monitor.is_some() {
                return Ok(());
            }
            let global_block = RcBlock::new(|_event: NonNull<NSEvent>| on_mouse_moved());
            let global = NSEvent::addGlobalMonitorForEventsMatchingMask_handler(NSEventMask::MouseMoved, &global_block)
                .ok_or_else(|| "addGlobalMonitor ha restituito nil".to_string())?;
            let local_block = RcBlock::new(|event: NonNull<NSEvent>| -> *mut NSEvent {
                on_mouse_moved();
                event.as_ptr()
            });
            // SAFETY: il blocco restituisce lo stesso evento ricevuto (puntatore valido).
            let local = unsafe { NSEvent::addLocalMonitorForEventsMatchingMask_handler(NSEventMask::MouseMoved, &local_block) }
                .ok_or_else(|| "addLocalMonitor ha restituito nil".to_string())?;
            st.global_monitor = Some(global);
            st.local_monitor = Some(local);
            log::info!("[gestures] monitor Hot Corners installati");
            Ok(())
        })?
    }

    fn remove_corner_monitors() -> Result<(), String> {
        with_state(|st| {
            for monitor in [st.global_monitor.take(), st.local_monitor.take()].into_iter().flatten() {
                // SAFETY: `monitor` proviene da add*MonitorForEventsMatchingMask.
                unsafe { NSEvent::removeMonitor(&monitor) };
            }
        })
    }

    /// Installa/rimuove i monitor in base alle azioni configurate (zero overhead se nessun angolo è attivo).
    pub fn sync_corner_monitors() {
        let Some(mtm) = MainThreadMarker::new() else {
            log::error!("[gestures] sync_corner_monitors chiamata fuori dal main thread");
            return;
        };
        let result = if any_corner_active() { install_corner_monitors(mtm) } else { remove_corner_monitors() };
        if let Err(e) = result {
            log::error!("[gestures] sincronizzazione monitor Hot Corners fallita: {e}");
        }
    }

    fn on_wake() {
        log::info!("[gestures] risveglio dallo Sleep: riattivo monitor e gesture");
        if let Err(e) = remove_corner_monitors() {
            log::error!("[gestures] rimozione monitor dopo il risveglio fallita: {e}");
        }
        sync_corner_monitors();
        tauri::async_runtime::spawn_blocking(|| {
            // I device trackpad vengono invalidati dallo Sleep e tornano disponibili con ritardo.
            std::thread::sleep(WAKE_RESTART_DELAY);
            super::multitouch::stop();
            sync_multitouch();
        });
    }

    pub fn register_observers(mtm: MainThreadMarker) -> Result<(), String> {
        refresh_screen_frames(mtm);
        with_state(|st| {
            if st.wake_observer.is_some() {
                return;
            }
            let wake_block = RcBlock::new(|_n: NonNull<NSNotification>| on_wake());
            let workspace_center = NSWorkspace::sharedWorkspace().notificationCenter();
            // SAFETY: il blocco gira sul thread che posta la notifica (main thread) e non cattura riferimenti.
            let wake = unsafe {
                workspace_center.addObserverForName_object_queue_usingBlock(Some(NSWorkspaceDidWakeNotification), None, None, &wake_block)
            };
            st.wake_observer = Some(wake);

            let screen_block = RcBlock::new(|_n: NonNull<NSNotification>| {
                if let Some(mtm) = MainThreadMarker::new() {
                    refresh_screen_frames(mtm);
                }
            });
            let default_center = NSNotificationCenter::defaultCenter();
            // SAFETY: come sopra.
            let screens = unsafe {
                default_center.addObserverForName_object_queue_usingBlock(Some(NSApplicationDidChangeScreenParametersNotification), None, None, &screen_block)
            };
            st.screen_observer = Some(screens);
            log::info!("[gestures] osservatori NSWorkspaceDidWake e cambio schermi registrati");
        })
    }

    pub fn shutdown() {
        if let Err(e) = remove_corner_monitors() {
            log::error!("[gestures] rimozione monitor allo shutdown fallita: {e}");
        }
        let removed = with_state(|st| {
            if let Some(o) = st.wake_observer.take() {
                // SAFETY: token restituito da addObserverForName.
                unsafe { NSWorkspace::sharedWorkspace().notificationCenter().removeObserver(AsRef::<AnyObject>::as_ref(&*o)) };
            }
            if let Some(o) = st.screen_observer.take() {
                // SAFETY: token restituito da addObserverForName.
                unsafe { NSNotificationCenter::defaultCenter().removeObserver(AsRef::<AnyObject>::as_ref(&*o)) };
            }
        });
        if let Err(e) = removed {
            log::error!("[gestures] rimozione osservatori allo shutdown fallita: {e}");
        }
    }
}

// ───────────────────────── API pubblica ─────────────────────────

/// Registra gli osservatori (wake, cambio schermi). Nessun monitor parte finché `configure_gestures` non li richiede.
pub fn start(app: &AppHandle) -> Result<(), String> {
    if APP_HANDLE.set(app.clone()).is_err() {
        log::warn!("[gestures] start() chiamata più volte: AppHandle già impostato");
    }
    #[cfg(target_os = "macos")]
    app.run_on_main_thread(|| {
        let Some(mtm) = objc2::MainThreadMarker::new() else {
            log::error!("[gestures] start: il closure non gira sul main thread");
            return;
        };
        if let Err(e) = cocoa::register_observers(mtm) {
            log::error!("[gestures] registrazione osservatori fallita: {e}");
        }
    })
    .map_err(|e| {
        let msg = format!("run_on_main_thread(start): {e}");
        log::error!("[gestures] {msg}");
        msg
    })?;
    Ok(())
}

/// Chiamata su `RunEvent::Exit` (main thread): rimuove monitor, osservatori e device Multitouch.
pub fn stop() {
    #[cfg(target_os = "macos")]
    {
        multitouch::stop();
        cocoa::shutdown();
    }
}

/// Applica le impostazioni di gesture/angoli ricevute dal frontend.
#[tauri::command]
pub fn configure_gestures(app: AppHandle, settings: GestureSettings) -> Result<(), String> {
    log::info!("[gestures] configurazione: {settings:?}");
    store_settings(&settings);
    lock(&CORNER_STATE, "CORNER_STATE").step(None, Instant::now());
    sync_multitouch();
    #[cfg(target_os = "macos")]
    app.run_on_main_thread(cocoa::sync_corner_monitors).map_err(|e| {
        let msg = format!("run_on_main_thread(sync_corner_monitors): {e}");
        log::error!("[gestures] {msg}");
        msg
    })?;
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        log::warn!("[gestures] Hot Corners e gesture disponibili solo su macOS");
    }
    Ok(())
}

// ───────────────────────── Test ─────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    const SCREEN: Rect = Rect { x: 0.0, y: 0.0, w: 1000.0, h: 600.0 };

    #[test]
    fn detects_all_four_corners() {
        let f = [SCREEN];
        assert_eq!(corner_hit(0.5, 599.5, &f), Some(Corner::TopLeft));
        assert_eq!(corner_hit(999.5, 599.5, &f), Some(Corner::TopRight));
        assert_eq!(corner_hit(0.5, 0.5, &f), Some(Corner::BottomLeft));
        assert_eq!(corner_hit(999.5, 0.5, &f), Some(Corner::BottomRight));
        assert_eq!(corner_hit(500.0, 300.0, &f), None);
        assert_eq!(corner_hit(500.0, 599.5, &f), None, "il centro del bordo non è un angolo");
    }

    #[test]
    fn corner_shared_with_adjacent_screen_is_ignored() {
        let right = Rect { x: 1000.0, y: 0.0, w: 1000.0, h: 600.0 };
        let frames = [SCREEN, right];
        assert_eq!(corner_hit(999.5, 599.5, &frames), None, "TR del primo è coperto dal secondo");
        assert_eq!(corner_hit(1000.5, 0.5, &frames), None, "BL del secondo è coperto dal primo");
        assert_eq!(corner_hit(0.5, 599.5, &frames), Some(Corner::TopLeft));
        assert_eq!(corner_hit(1999.5, 599.5, &frames), Some(Corner::TopRight));
    }

    #[test]
    fn corner_fires_once_then_rearms_after_leaving() {
        let mut s = CornerState::new();
        let t0 = Instant::now();
        assert_eq!(s.step(Some(Corner::TopLeft), t0), Some(Corner::TopLeft));
        assert_eq!(s.step(Some(Corner::TopLeft), t0 + Duration::from_millis(10)), None);
        assert_eq!(s.step(None, t0 + Duration::from_millis(20)), None);
        assert_eq!(s.step(Some(Corner::TopLeft), t0 + Duration::from_millis(100)), None, "cooldown non scaduto");
        assert_eq!(s.step(None, t0 + Duration::from_millis(200)), None);
        assert_eq!(s.step(Some(Corner::TopLeft), t0 + Duration::from_millis(700)), Some(Corner::TopLeft));
    }

    fn fingers(scale: f32, n: usize) -> Vec<(f32, f32)> {
        (0..n)
            .map(|i| {
                let a = i as f32 / n as f32 * std::f32::consts::TAU;
                (0.5 + a.cos() * 0.1 * scale, 0.5 + a.sin() * 0.1 * scale)
            })
            .collect()
    }

    #[test]
    fn pinch_and_spread_are_detected_once_per_touch() {
        let mut t = PinchTracker::new();
        assert_eq!(t.update(&fingers(1.0, 4), true, true), None);
        assert_eq!(t.update(&fingers(0.9, 4), true, true), None);
        assert_eq!(t.update(&fingers(0.5, 4), true, true), Some(PinchEvent::Pinch));
        assert_eq!(t.update(&fingers(0.4, 4), true, true), None, "una sola volta per sessione");
        assert_eq!(t.update(&[], true, true), None);
        assert_eq!(t.update(&fingers(1.0, 3), true, true), None);
        assert_eq!(t.update(&fingers(1.6, 3), true, true), Some(PinchEvent::Spread));
    }

    #[test]
    fn disabled_gesture_does_not_consume_the_touch_session() {
        let mut t = PinchTracker::new();
        assert_eq!(t.update(&fingers(1.0, 4), false, true), None);
        assert_eq!(t.update(&fingers(0.5, 4), false, true), None);
        assert_eq!(t.update(&fingers(1.6, 4), false, true), Some(PinchEvent::Spread));
    }

    #[test]
    fn two_fingers_or_palm_are_ignored() {
        let mut t = PinchTracker::new();
        assert_eq!(t.update(&fingers(1.0, 2), true, true), None);
        assert_eq!(t.update(&fingers(0.3, 2), true, true), None);
        assert_eq!(t.update(&fingers(1.0, 6), true, true), None);
    }

    #[test]
    fn settings_deserialize_from_frontend_json() -> Result<(), serde_json::Error> {
        let json = r#"{"hotCorners":{"topLeft":"toggle_launcher","topRight":"none","bottomLeft":"none","bottomRight":"none"},"pinchEnabled":true,"spreadEnabled":false}"#;
        let s: GestureSettings = serde_json::from_str(json)?;
        assert_eq!(s.hot_corners.top_left, HotCornerAction::ToggleLauncher);
        assert!(s.pinch_enabled && !s.spread_enabled);
        Ok(())
    }

    #[test]
    fn mt_touch_layout_matches_native_size() {
        #[cfg(target_os = "macos")]
        assert_eq!(super::multitouch::touch_struct_size(), 96);
    }
}
