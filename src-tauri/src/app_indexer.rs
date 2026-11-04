//! App Indexer: scansione parallela delle `.app`, lettura robusta di `Info.plist`
//! ed estrazione delle icone `.icns` in una cache PNG locale.
//!
//! Regole del progetto: nessun `.unwrap()`, ogni errore di I/O o parsing viene tracciato con `log`.

use std::collections::HashMap;
use std::fmt;
use std::fs;
use std::io::{self, BufWriter, Cursor};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::{Instant, SystemTime};

use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use walkdir::WalkDir;

/// Evento emesso durante `prefetch_app_icons` (payload: `IconsProgress`).
pub const ICONS_PROGRESS_EVENT: &str = "apps://icons-progress";

/// Sottocartella di `~/Library/Caches` che contiene i PNG delle icone.
const CACHE_SUBDIR: &str = "com.launchme.clone/icons";
/// Profondità massima di ricerca delle `.app` (copre `/Applications/Utilities/X.app`).
const MAX_DEPTH: usize = 3;
/// Lato minimo preferito per l'icona in cache.
const TARGET_ICON_PX: u32 = 256;
/// Ogni quante icone viene emesso un evento di avanzamento.
const PROGRESS_EVERY: usize = 10;

// ───────────────────────── Errori ─────────────────────────

#[derive(Debug)]
pub enum IndexError {
    Io { path: PathBuf, source: io::Error },
    Plist { path: PathBuf, detail: String },
    MissingKey { path: PathBuf, key: &'static str },
    Icon { path: PathBuf, detail: String },
    NoCacheDir,
}

impl fmt::Display for IndexError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io { path, source } => write!(f, "I/O su '{}': {source}", path.display()),
            Self::Plist { path, detail } => write!(f, "Info.plist non valido '{}': {detail}", path.display()),
            Self::MissingKey { path, key } => write!(f, "chiave '{key}' mancante in '{}'", path.display()),
            Self::Icon { path, detail } => write!(f, "icona '{}': {detail}", path.display()),
            Self::NoCacheDir => write!(f, "cartella cache dell'utente non disponibile"),
        }
    }
}

impl std::error::Error for IndexError {}

fn io_err(path: &Path) -> impl FnOnce(io::Error) -> IndexError + '_ {
    move |source| IndexError::Io { path: path.to_path_buf(), source }
}

// ───────────────────────── Tipi esposti al frontend ─────────────────────────

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannedApp {
    pub id: String,
    pub name: String,
    pub path: String,
    pub icon_cache_path: String,
    pub icon_ready: bool,
    pub category: String,
    pub is_hidden: bool,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanStats {
    pub scanned: usize,
    pub indexed: usize,
    pub skipped: usize,
    pub duplicates: usize,
    pub elapsed_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanAppsResult {
    pub apps: Vec<ScannedApp>,
    pub stats: ScanStats,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IconRequest {
    pub id: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IconsProgress {
    pub done: usize,
    pub total: usize,
    pub failed: usize,
}

// ───────────────────────── Lettura Info.plist ─────────────────────────

#[derive(Debug)]
struct BundleInfo {
    bundle_id: String,
    name: String,
    icon_file: Option<String>,
    category: &'static str,
    is_hidden: bool,
}

/// Decodifica un file UTF-16 con BOM in UTF-8, allineando la dichiarazione `encoding`.
fn decode_utf16_bom(bytes: &[u8]) -> Option<Result<String, String>> {
    let (little_endian, rest) = match bytes {
        [0xFF, 0xFE, rest @ ..] => (true, rest),
        [0xFE, 0xFF, rest @ ..] => (false, rest),
        _ => return None,
    };
    let (pairs, remainder) = rest.as_chunks::<2>();
    if !remainder.is_empty() {
        return Some(Err("UTF-16 non valido: lunghezza dispari".to_string()));
    }
    let units: Vec<u16> = pairs
        .iter()
        .map(|pair| if little_endian { u16::from_le_bytes(*pair) } else { u16::from_be_bytes(*pair) })
        .collect();
    Some(
        String::from_utf16(&units)
            .map(|s| s.replacen("UTF-16", "UTF-8", 1).replacen("utf-16", "utf-8", 1))
            .map_err(|e| format!("UTF-16 non valido: {e}")),
    )
}

/// Livelli 1 e 2: plist nativo (XML/binario) e, in caso di BOM UTF-16, trascodifica.
fn parse_plist_bytes(bytes: &[u8]) -> Result<plist::Dictionary, String> {
    let first = plist::Value::from_reader(Cursor::new(bytes));
    let first_err = match first {
        Ok(v) => return v.into_dictionary().ok_or_else(|| "la radice non è un dizionario".to_string()),
        Err(e) => e.to_string(),
    };
    match decode_utf16_bom(bytes) {
        Some(Ok(text)) => plist::Value::from_reader(Cursor::new(text.as_bytes()))
            .map_err(|e| format!("{first_err}; dopo trascodifica UTF-16: {e}"))?
            .into_dictionary()
            .ok_or_else(|| "la radice non è un dizionario".to_string()),
        Some(Err(e)) => Err(format!("{first_err}; {e}")),
        None => Err(first_err),
    }
}

/// Livello 3: `plutil -convert xml1`, ultima risorsa per formati insoliti.
fn parse_plist_with_plutil(path: &Path) -> Result<plist::Dictionary, String> {
    let output = Command::new("/usr/bin/plutil")
        .args(["-convert", "xml1", "-o", "-"])
        .arg(path)
        .output()
        .map_err(|e| format!("esecuzione plutil fallita: {e}"))?;
    if !output.status.success() {
        return Err(format!("plutil ha restituito {}", output.status));
    }
    parse_plist_bytes(&output.stdout)
}

fn load_info_plist(path: &Path) -> Result<plist::Dictionary, IndexError> {
    let bytes = fs::read(path).map_err(io_err(path))?;
    match parse_plist_bytes(&bytes) {
        Ok(dict) => Ok(dict),
        Err(native_err) => {
            log::warn!("[app_indexer] parsing nativo fallito per '{}': {native_err}; provo plutil", path.display());
            parse_plist_with_plutil(path).map_err(|plutil_err| IndexError::Plist {
                path: path.to_path_buf(),
                detail: format!("{native_err}; plutil: {plutil_err}"),
            })
        }
    }
}

fn get_str<'a>(dict: &'a plist::Dictionary, key: &str) -> Option<&'a str> {
    dict.get(key).and_then(plist::Value::as_string).filter(|s| !s.trim().is_empty())
}

fn get_flag(dict: &plist::Dictionary, key: &str) -> bool {
    match dict.get(key) {
        Some(plist::Value::Boolean(b)) => *b,
        Some(plist::Value::String(s)) => matches!(s.trim().to_ascii_lowercase().as_str(), "1" | "true" | "yes"),
        Some(plist::Value::Integer(i)) => i.as_signed().is_some_and(|n| n != 0),
        _ => false,
    }
}

fn category_from_lsapp(value: Option<&str>) -> &'static str {
    let Some(raw) = value else { return "other" };
    let short = raw.strip_prefix("public.app-category.").unwrap_or(raw);
    match short {
        "productivity" | "business" | "finance" => "productivity",
        "developer-tools" => "development",
        "utilities" => "utilities",
        "music" | "video" | "photography" | "graphics-design" | "entertainment" => "media",
        s if s == "games" || s.ends_with("-games") => "games",
        _ => "other",
    }
}

fn extract_bundle_info(dict: &plist::Dictionary, app_path: &Path) -> Result<BundleInfo, IndexError> {
    let bundle_id = get_str(dict, "CFBundleIdentifier")
        .ok_or_else(|| IndexError::MissingKey { path: app_path.to_path_buf(), key: "CFBundleIdentifier" })?
        .to_string();
    let name = get_str(dict, "CFBundleDisplayName")
        .or_else(|| get_str(dict, "CFBundleName"))
        .map(str::to_string)
        .or_else(|| app_path.file_stem().map(|s| s.to_string_lossy().into_owned()))
        .unwrap_or_else(|| bundle_id.clone());
    let icon_file = get_str(dict, "CFBundleIconFile").map(str::to_string);
    Ok(BundleInfo {
        bundle_id,
        name,
        icon_file,
        category: category_from_lsapp(get_str(dict, "LSApplicationCategoryType")),
        is_hidden: get_flag(dict, "LSUIElement") || get_flag(dict, "LSBackgroundOnly"),
    })
}

fn read_bundle_info(app_path: &Path) -> Result<BundleInfo, IndexError> {
    let dict = load_info_plist(&app_path.join("Contents/Info.plist"))?;
    extract_bundle_info(&dict, app_path)
}

// ───────────────────────── Cache icone ─────────────────────────

pub fn default_cache_dir() -> Result<PathBuf, IndexError> {
    dirs::cache_dir().map(|d| d.join(CACHE_SUBDIR)).ok_or(IndexError::NoCacheDir)
}

fn sanitize_bundle_id(id: &str) -> String {
    id.chars()
        .map(|c| if c.is_ascii_alphanumeric() || matches!(c, '.' | '-' | '_') { c } else { '_' })
        .collect()
}

fn cache_path_for(cache_dir: &Path, bundle_id: &str) -> PathBuf {
    cache_dir.join(format!("{}.png", sanitize_bundle_id(bundle_id)))
}

/// Risolve il file `.icns` dichiarato in `CFBundleIconFile` (estensione opzionale).
fn resolve_icns(app_path: &Path, icon_file: Option<&str>) -> Option<PathBuf> {
    let name = icon_file?;
    let resources = app_path.join("Contents/Resources");
    let direct = resources.join(name);
    if direct.is_file() {
        return Some(direct);
    }
    let with_ext = resources.join(format!("{name}.icns"));
    with_ext.is_file().then_some(with_ext)
}

fn mtime(path: &Path) -> Option<SystemTime> {
    fs::metadata(path).and_then(|m| m.modified()).ok()
}

/// File di riferimento per la freschezza della cache: l'`.icns` oppure, per le app senza
/// `.icns` (fallback NSWorkspace), l'`Info.plist`, così un aggiornamento dell'app invalida la cache.
fn freshness_source(app_path: &Path, icns: Option<&Path>) -> PathBuf {
    icns.map_or_else(|| app_path.join("Contents/Info.plist"), Path::to_path_buf)
}

/// La cache è valida se il PNG esiste e (quando c'è una sorgente) non è più vecchio dell'`.icns`.
fn is_cache_fresh(png: &Path, source: Option<&Path>) -> bool {
    let Some(png_time) = mtime(png) else { return false };
    match source.and_then(mtime) {
        Some(src_time) => png_time >= src_time,
        None => true,
    }
}

fn write_png_atomic(dest: &Path, width: u32, height: u32, rgba: &[u8]) -> Result<(), IndexError> {
    let icon_err = |detail: String| IndexError::Icon { path: dest.to_path_buf(), detail };
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent).map_err(io_err(parent))?;
    }
    let tmp = dest.with_extension("png.tmp");
    let result = (|| -> Result<(), IndexError> {
        let file = fs::File::create(&tmp).map_err(io_err(&tmp))?;
        let mut encoder = png::Encoder::new(BufWriter::new(file), width, height);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        encoder.set_compression(png::Compression::Best);
        encoder.set_adaptive_filter(png::AdaptiveFilterType::Adaptive);
        let mut writer = encoder.write_header().map_err(|e| icon_err(format!("header PNG: {e}")))?;
        writer.write_image_data(rgba).map_err(|e| icon_err(format!("dati PNG: {e}")))?;
        writer.finish().map_err(|e| icon_err(format!("chiusura PNG: {e}")))
    })();
    match result {
        Ok(()) => fs::rename(&tmp, dest).map_err(io_err(dest)),
        Err(e) => {
            if let Err(rm) = fs::remove_file(&tmp) {
                log::warn!("[app_indexer] pulizia '{}' fallita: {rm}", tmp.display());
            }
            Err(e)
        }
    }
}

/// Converte l'`.icns` in PNG scegliendo la rappresentazione più piccola con lato ≥ 256 px
/// (altrimenti la più grande). Prova le candidate in ordine finché una si decodifica.
fn icns_to_png(src: &Path, dest: &Path) -> Result<(), IndexError> {
    let icon_err = |detail: String| IndexError::Icon { path: src.to_path_buf(), detail };
    let file = fs::File::open(src).map_err(io_err(src))?;
    let family = icns::IconFamily::read(io::BufReader::new(file)).map_err(|e| icon_err(format!("lettura icns: {e}")))?;

    let mut candidates: Vec<icns::IconType> = family.available_icons().into_iter().filter(|t| !t.is_mask()).collect();
    candidates.sort_by_key(|t| {
        let w = t.pixel_width();
        // Prima i lati ≥ TARGET crescenti, poi i più piccoli decrescenti.
        if w >= TARGET_ICON_PX { (0, w) } else { (1, u32::MAX - w) }
    });
    if candidates.is_empty() {
        return Err(icon_err("nessuna rappresentazione disponibile".to_string()));
    }

    let mut last_error = String::new();
    for icon_type in candidates {
        match family.get_icon_with_type(icon_type) {
            Ok(image) => {
                let rgba = image.convert_to(icns::PixelFormat::RGBA);
                return write_png_atomic(dest, rgba.width(), rgba.height(), rgba.data());
            }
            Err(e) => {
                last_error = format!("{icon_type:?}: {e}");
                log::warn!("[app_indexer] decodifica {last_error} in '{}'", src.display());
            }
        }
    }
    Err(icon_err(format!("nessuna rappresentazione decodificabile (ultimo errore: {last_error})")))
}

/// Fallback per app senza `.icns` (asset catalog): usa `NSWorkspace.iconForFile`.
#[cfg(target_os = "macos")]
fn workspace_icon_to_png(app_path: &Path, dest: &Path) -> Result<(), IndexError> {
    use objc2_app_kit::{NSBitmapImageFileType, NSBitmapImageRep, NSWorkspace};
    use objc2_foundation::{NSDictionary, NSString};

    let icon_err = |detail: &str| IndexError::Icon { path: app_path.to_path_buf(), detail: detail.to_string() };
    let ns_path = NSString::from_str(&app_path.to_string_lossy());
    let image = NSWorkspace::sharedWorkspace().iconForFile(&ns_path);
    let tiff = image
        .TIFFRepresentation()
        .ok_or_else(|| icon_err("NSImage senza rappresentazione TIFF"))?;
    let rep = NSBitmapImageRep::imageRepWithData(&tiff).ok_or_else(|| icon_err("NSBitmapImageRep non creabile"))?;
    let png_data = unsafe { rep.representationUsingType_properties(NSBitmapImageFileType::PNG, &NSDictionary::new()) }
        .ok_or_else(|| icon_err("codifica PNG di NSBitmapImageRep fallita"))?;
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent).map_err(io_err(parent))?;
    }
    let tmp = dest.with_extension("png.tmp");
    fs::write(&tmp, png_data.to_vec()).map_err(io_err(&tmp))?;
    fs::rename(&tmp, dest).map_err(io_err(dest))
}

#[cfg(not(target_os = "macos"))]
fn workspace_icon_to_png(app_path: &Path, _dest: &Path) -> Result<(), IndexError> {
    Err(IndexError::Icon { path: app_path.to_path_buf(), detail: "fallback NSWorkspace disponibile solo su macOS".to_string() })
}

/// Esito del tentativo di estrazione basato su `.icns`.
enum IconStep {
    Done(PathBuf),
    NeedsFallback { app_path: PathBuf, dest: PathBuf },
}

/// Controlla la cache e prova l'`.icns`; se non c'è o non si decodifica, richiede il fallback.
fn icon_step(app_path: &Path, bundle_id: &str, cache_dir: &Path) -> IconStep {
    let dest = cache_path_for(cache_dir, bundle_id);
    let icns = match read_bundle_info(app_path) {
        Ok(info) => resolve_icns(app_path, info.icon_file.as_deref()),
        Err(e) => {
            log::warn!("[app_indexer] lettura plist per icona fallita: {e}");
            None
        }
    };
    if is_cache_fresh(&dest, Some(&freshness_source(app_path, icns.as_deref()))) {
        return IconStep::Done(dest);
    }
    match icns {
        Some(src) => match icns_to_png(&src, &dest) {
            Ok(()) => IconStep::Done(dest),
            Err(e) => {
                log::warn!("[app_indexer] {e}; uso il fallback NSWorkspace");
                IconStep::NeedsFallback { app_path: app_path.to_path_buf(), dest }
            }
        },
        None => {
            log::warn!("[app_indexer] nessun .icns per '{}'; uso il fallback NSWorkspace", app_path.display());
            IconStep::NeedsFallback { app_path: app_path.to_path_buf(), dest }
        }
    }
}

/// Estrae (o riusa dalla cache) l'icona di una singola app, incluso il fallback.
pub fn ensure_icon(app_path: &Path, bundle_id: &str, cache_dir: &Path) -> Result<PathBuf, IndexError> {
    match icon_step(app_path, bundle_id, cache_dir) {
        IconStep::Done(p) => Ok(p),
        IconStep::NeedsFallback { app_path, dest } => workspace_icon_to_png(&app_path, &dest).map(|()| dest),
    }
}

// ───────────────────────── Scanner ─────────────────────────

fn is_app_bundle(path: &Path) -> bool {
    path.extension().is_some_and(|e| e.eq_ignore_ascii_case("app"))
}

/// Raccoglie le `.app` sotto `root` senza mai entrare nei bundle.
fn collect_app_paths(root: &Path) -> Vec<PathBuf> {
    if !root.exists() {
        log::warn!("[app_indexer] cartella sorgente assente: '{}'", root.display());
        return Vec::new();
    }
    let mut found = Vec::new();
    let mut walker = WalkDir::new(root).max_depth(MAX_DEPTH).follow_links(false).sort_by_file_name().into_iter();
    while let Some(entry) = walker.next() {
        match entry {
            Ok(e) => {
                let ft = e.file_type();
                if (ft.is_dir() || ft.is_symlink()) && is_app_bundle(e.path()) && e.path().is_dir() {
                    if ft.is_dir() {
                        walker.skip_current_dir();
                    }
                    found.push(e.into_path());
                }
            }
            Err(err) => log::error!("[app_indexer] errore durante la scansione di '{}': {err}", root.display()),
        }
    }
    found
}

fn index_app(app_path: &Path, cache_dir: &Path) -> Result<ScannedApp, IndexError> {
    let info = read_bundle_info(app_path)?;
    let icns = resolve_icns(app_path, info.icon_file.as_deref());
    let icon_path = cache_path_for(cache_dir, &info.bundle_id);
    let icon_ready = is_cache_fresh(&icon_path, Some(&freshness_source(app_path, icns.as_deref())));
    Ok(ScannedApp {
        id: info.bundle_id,
        name: info.name,
        path: app_path.to_string_lossy().into_owned(),
        icon_cache_path: icon_path.to_string_lossy().into_owned(),
        icon_ready,
        category: info.category.to_string(),
        is_hidden: info.is_hidden,
    })
}

/// Scansiona le radici (in ordine di priorità) e ritorna le app deduplicate per bundle id.
pub fn scan_roots(roots: &[PathBuf], cache_dir: &Path) -> ScanAppsResult {
    let started = Instant::now();
    let per_root: Vec<Vec<PathBuf>> = roots.par_iter().map(|r| collect_app_paths(r)).collect();
    let paths: Vec<PathBuf> = per_root.into_iter().flatten().collect();

    let results: Vec<Result<ScannedApp, IndexError>> = paths.par_iter().map(|p| index_app(p, cache_dir)).collect();

    let mut stats = ScanStats { scanned: paths.len(), ..ScanStats::default() };
    let mut apps: Vec<ScannedApp> = Vec::with_capacity(results.len());
    let mut seen: HashMap<String, String> = HashMap::new();
    for result in results {
        match result {
            Ok(app) => {
                if let Some(first) = seen.get(&app.id) {
                    log::warn!("[app_indexer] bundle id duplicato '{}': tengo '{first}', scarto '{}'", app.id, app.path);
                    stats.duplicates += 1;
                } else {
                    seen.insert(app.id.clone(), app.path.clone());
                    apps.push(app);
                }
            }
            Err(e) => {
                log::error!("[app_indexer] app saltata: {e}");
                stats.skipped += 1;
            }
        }
    }
    apps.sort_by_cached_key(|a| a.name.to_lowercase());
    stats.indexed = apps.len();
    stats.elapsed_ms = u64::try_from(started.elapsed().as_millis()).unwrap_or(u64::MAX);
    log::info!(
        "[app_indexer] scansione: {} bundle, {} indicizzate, {} saltate, {} duplicate in {} ms",
        stats.scanned, stats.indexed, stats.skipped, stats.duplicates, stats.elapsed_ms
    );
    ScanAppsResult { apps, stats }
}

fn expand_home(raw: &str) -> PathBuf {
    match (raw.strip_prefix("~/"), dirs::home_dir()) {
        (Some(rest), Some(home)) => home.join(rest),
        _ => PathBuf::from(raw),
    }
}

fn default_roots(extra_sources: &[String]) -> Vec<PathBuf> {
    let mut roots = vec![PathBuf::from("/Applications")];
    match dirs::home_dir() {
        Some(home) => roots.push(home.join("Applications")),
        None => log::error!("[app_indexer] home directory non disponibile: salto ~/Applications"),
    }
    roots.extend(extra_sources.iter().filter(|s| !s.trim().is_empty()).map(|s| expand_home(s)));
    roots
}

// ───────────────────────── Comandi Tauri ─────────────────────────

fn join_error(context: &str, e: &tauri::Error) -> String {
    let msg = format!("{context}: task di background fallito: {e}");
    log::error!("[app_indexer] {msg}");
    msg
}

/// Scansiona `/Applications`, `~/Applications` e le sorgenti extra. Non estrae icone.
#[tauri::command]
pub async fn scan_apps(extra_sources: Vec<String>) -> Result<ScanAppsResult, String> {
    let cache_dir = default_cache_dir().map_err(|e| {
        log::error!("[app_indexer] {e}");
        e.to_string()
    })?;
    tauri::async_runtime::spawn_blocking(move || scan_roots(&default_roots(&extra_sources), &cache_dir))
        .await
        .map_err(|e| join_error("scan_apps", &e))
}

/// Estrae (o riusa dalla cache) l'icona di una singola app e ritorna il path del PNG.
#[tauri::command]
pub async fn get_app_icon(app_path: String, bundle_id: String) -> Result<String, String> {
    let cache_dir = default_cache_dir().map_err(|e| {
        log::error!("[app_indexer] {e}");
        e.to_string()
    })?;
    let outcome = tauri::async_runtime::spawn_blocking(move || ensure_icon(Path::new(&app_path), &bundle_id, &cache_dir))
        .await
        .map_err(|e| join_error("get_app_icon", &e))?;
    outcome.map(|p| p.to_string_lossy().into_owned()).map_err(|e| {
        log::error!("[app_indexer] {e}");
        e.to_string()
    })
}

/// Estrae in parallelo le icone mancanti, emettendo `apps://icons-progress`.
#[tauri::command]
pub async fn prefetch_app_icons(app: AppHandle, apps: Vec<IconRequest>) -> Result<IconsProgress, String> {
    let cache_dir = default_cache_dir().map_err(|e| {
        log::error!("[app_indexer] {e}");
        e.to_string()
    })?;
    tauri::async_runtime::spawn_blocking(move || prefetch_blocking(&app, &apps, &cache_dir))
        .await
        .map_err(|e| join_error("prefetch_app_icons", &e))
}

fn emit_progress(app: &AppHandle, progress: &IconsProgress) {
    if let Err(e) = app.emit(ICONS_PROGRESS_EVENT, progress) {
        log::error!("[app_indexer] emissione {ICONS_PROGRESS_EVENT} fallita: {e}");
    }
}

fn prefetch_blocking(app: &AppHandle, requests: &[IconRequest], cache_dir: &Path) -> IconsProgress {
    let started = Instant::now();
    let total = requests.len();
    let done = AtomicUsize::new(0);

    // Fase 1 (parallela): cache + .icns. Le app che richiedono il fallback sono raccolte per la fase 2.
    let steps: Vec<IconStep> = requests
        .par_iter()
        .map(|req| {
            let step = icon_step(Path::new(&req.path), &req.id, cache_dir);
            let n = done.fetch_add(1, Ordering::Relaxed) + 1;
            if n.is_multiple_of(PROGRESS_EVERY) {
                emit_progress(app, &IconsProgress { done: n, total, failed: 0 });
            }
            step
        })
        .collect();

    // Fase 2 (seriale): NSWorkspace non è garantito thread-safe in parallelo.
    let mut failed = 0;
    for step in steps {
        if let IconStep::NeedsFallback { app_path, dest } = step {
            if let Err(e) = workspace_icon_to_png(&app_path, &dest) {
                log::error!("[app_indexer] icona non estraibile: {e}");
                failed += 1;
            }
        }
    }
    let progress = IconsProgress { done: total, total, failed };
    emit_progress(app, &progress);
    log::info!("[app_indexer] prefetch icone: {total} app, {failed} fallite in {} ms", started.elapsed().as_millis());
    progress
}

// ───────────────────────── Test ─────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    type TestResult = Result<(), Box<dyn std::error::Error>>;

    struct TempDir(PathBuf);
    impl TempDir {
        fn new(tag: &str) -> Result<Self, io::Error> {
            let nanos = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0);
            let dir = std::env::temp_dir().join(format!("lmc-{tag}-{}-{nanos}", std::process::id()));
            fs::create_dir_all(&dir)?;
            Ok(Self(dir))
        }
    }
    impl Drop for TempDir {
        fn drop(&mut self) {
            if let Err(e) = fs::remove_dir_all(&self.0) {
                eprintln!("pulizia '{}' fallita: {e}", self.0.display());
            }
        }
    }

    fn sample_dict(extra: &[(&str, plist::Value)]) -> plist::Dictionary {
        let mut d = plist::Dictionary::new();
        d.insert("CFBundleIdentifier".into(), "com.test.app".into());
        d.insert("CFBundleName".into(), "Test".into());
        for (k, v) in extra {
            d.insert((*k).to_string(), v.clone());
        }
        d
    }

    fn make_app(root: &Path, name: &str, dict: &plist::Dictionary) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let app = root.join(format!("{name}.app"));
        fs::create_dir_all(app.join("Contents/Resources"))?;
        plist::to_file_xml(app.join("Contents/Info.plist"), dict)?;
        Ok(app)
    }

    #[test]
    fn parses_xml_and_binary_plist() -> TestResult {
        let dict = sample_dict(&[]);
        let mut xml = Vec::new();
        plist::to_writer_xml(&mut xml, &dict)?;
        let mut bin = Vec::new();
        plist::to_writer_binary(&mut bin, &dict)?;
        assert_eq!(parse_plist_bytes(&xml)?.get("CFBundleIdentifier"), dict.get("CFBundleIdentifier"));
        assert_eq!(parse_plist_bytes(&bin)?.get("CFBundleIdentifier"), dict.get("CFBundleIdentifier"));
        Ok(())
    }

    #[test]
    fn parses_utf16_xml_plist() -> TestResult {
        let mut xml = Vec::new();
        plist::to_writer_xml(&mut xml, &sample_dict(&[]))?;
        let text = String::from_utf8(xml)?.replacen("<?xml version=\"1.0\" encoding=\"UTF-8\"?>", "<?xml version=\"1.0\" encoding=\"UTF-16\"?>", 1);
        let mut bytes = vec![0xFF, 0xFE];
        for unit in text.encode_utf16() {
            bytes.extend_from_slice(&unit.to_le_bytes());
        }
        let dict = parse_plist_bytes(&bytes).map_err(io::Error::other)?;
        assert_eq!(get_str(&dict, "CFBundleIdentifier"), Some("com.test.app"));
        Ok(())
    }

    #[test]
    fn corrupted_plist_returns_error_without_panic() {
        assert!(parse_plist_bytes(b"\x00\x01 non e' un plist").is_err());
        assert!(parse_plist_bytes(&[]).is_err());
    }

    #[test]
    fn icon_file_without_extension_is_resolved() -> TestResult {
        let tmp = TempDir::new("icon-ext")?;
        let app = make_app(&tmp.0, "A", &sample_dict(&[("CFBundleIconFile", "AppIcon".into())]))?;
        fs::write(app.join("Contents/Resources/AppIcon.icns"), b"x")?;
        assert_eq!(resolve_icns(&app, Some("AppIcon")), Some(app.join("Contents/Resources/AppIcon.icns")));
        assert_eq!(resolve_icns(&app, Some("Missing")), None);
        Ok(())
    }

    #[test]
    fn scan_dedups_by_bundle_id_and_skips_broken_bundles() -> TestResult {
        let tmp = TempDir::new("scan")?;
        let (r1, r2, cache) = (tmp.0.join("r1"), tmp.0.join("r2"), tmp.0.join("cache"));
        make_app(&r1, "Alpha", &sample_dict(&[]))?;
        make_app(&r2, "AlphaCopy", &sample_dict(&[]))?; // stesso bundle id
        let broken = r2.join("Broken.app/Contents");
        fs::create_dir_all(&broken)?;
        fs::write(broken.join("Info.plist"), b"\x00garbage")?;
        let result = scan_roots(&[r1, r2], &cache);
        assert_eq!(result.stats.scanned, 3);
        assert_eq!(result.stats.indexed, 1);
        assert_eq!(result.stats.duplicates, 1);
        assert_eq!(result.stats.skipped, 1);
        assert!(result.apps.first().is_some_and(|a| a.path.contains("r1")));
        Ok(())
    }

    #[test]
    fn category_mapping() {
        assert_eq!(category_from_lsapp(Some("public.app-category.developer-tools")), "development");
        assert_eq!(category_from_lsapp(Some("public.app-category.arcade-games")), "games");
        assert_eq!(category_from_lsapp(None), "other");
    }

    #[test]
    fn icon_is_extracted_then_served_from_cache() -> TestResult {
        let tmp = TempDir::new("icons")?;
        let cache = tmp.0.join("cache");
        let dict = sample_dict(&[("CFBundleIconFile", "AppIcon".into())]);
        let app = make_app(&tmp.0, "Icon", &dict)?;

        let image = icns::Image::from_data(icns::PixelFormat::RGBA, 256, 256, vec![200u8; 256 * 256 * 4])?;
        let mut family = icns::IconFamily::new();
        family.add_icon(&image)?;
        family.write(fs::File::create(app.join("Contents/Resources/AppIcon.icns"))?)?;

        let png_path = ensure_icon(&app, "com.test.app", &cache)?;
        assert!(png_path.is_file());
        let first = mtime(&png_path);

        let again = ensure_icon(&app, "com.test.app", &cache)?;
        assert_eq!(again, png_path);
        assert_eq!(mtime(&png_path), first, "la cache fresca non deve essere rigenerata");
        Ok(())
    }

    #[test]
    fn stale_cache_is_regenerated_when_icns_is_newer() -> TestResult {
        let tmp = TempDir::new("stale")?;
        let (png, icns_path) = (tmp.0.join("a.png"), tmp.0.join("a.icns"));
        fs::write(&png, b"old")?;
        std::thread::sleep(std::time::Duration::from_millis(30));
        fs::write(&icns_path, b"new")?;
        assert!(!is_cache_fresh(&png, Some(&icns_path)));
        assert!(is_cache_fresh(&png, None));
        assert!(!is_cache_fresh(&tmp.0.join("missing.png"), None));
        Ok(())
    }

    /// Benchmark sulle app reali: il budget di 300 ms si applica alle build release.
    #[test]
    fn real_scan_is_within_budget() -> TestResult {
        let cache = default_cache_dir()?;
        let result = scan_roots(&default_roots(&[]), &cache);
        eprintln!("scansione reale: {:?}", result.stats);
        if !cfg!(debug_assertions) {
            assert!(result.stats.elapsed_ms < 300, "scansione troppo lenta: {} ms", result.stats.elapsed_ms);
        }
        Ok(())
    }
}
