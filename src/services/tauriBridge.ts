import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import {
  APPS_ICONS_PROGRESS_EVENT,
  DEFAULT_NOTCH_METRICS,
  LAUNCHER_VISIBILITY_EVENT,
  type AppLeftoverItem,
  type ClipboardEntry,
  type FileSearchResult,
  type GestureSettings,
  type HardwareStats,
  type IconRequest,
  type IconsProgressPayload,
  type MediaTrackInfo,
  type NotchMetrics,
  type ScanAppsResult,
  type WorkflowItem,
} from '~types';

/** Etichette delle finestre definite in tauri.conf.json. */
export type WindowLabel = 'launcher' | 'notch';

/** True se la pagina gira dentro il runtime Tauri (e non in un browser con `vite dev`). */
export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function warnNoRuntime(fn: string): void {
  console.warn(`[tauriBridge] ${fn}: runtime Tauri assente, chiamata ignorata.`);
}

async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (err) {
    console.error(`[tauriBridge] invoke('${cmd}') fallito:`, err);
    throw err;
  }
}

/** Ritorna la label della finestra corrente, oppure null fuori da Tauri. */
export function getWindowLabel(): string | null {
  if (!isTauriRuntime()) {
    warnNoRuntime('getWindowLabel');
    return null;
  }
  try {
    return getCurrentWebviewWindow().label;
  } catch (err) {
    console.error('[tauriBridge] getWindowLabel fallito:', err);
    return null;
  }
}

/** Alterna il launcher; ritorna il nuovo stato di visibilità. */
export async function toggleLauncher(): Promise<boolean> {
  if (!isTauriRuntime()) {
    warnNoRuntime('toggleLauncher');
    return false;
  }
  return safeInvoke<boolean>('toggle_launcher_window');
}

export async function setLauncherVisibility(visible: boolean): Promise<void> {
  if (!isTauriRuntime()) {
    warnNoRuntime('setLauncherVisibility');
    return;
  }
  await safeInvoke<void>('set_launcher_visibility', { visible });
}

export async function setNotchExpanded(expanded: boolean): Promise<void> {
  if (!isTauriRuntime()) {
    warnNoRuntime('setNotchExpanded');
    return;
  }
  await safeInvoke<void>('set_notch_expanded', { expanded });
}

/** Sottoscrive l'evento di visibilità del launcher. Ritorna la funzione di unlisten. */
export async function onLauncherVisibility(cb: (visible: boolean) => void): Promise<UnlistenFn> {
  if (!isTauriRuntime()) {
    warnNoRuntime('onLauncherVisibility');
    return () => undefined;
  }
  try {
    return await listen<boolean>(LAUNCHER_VISIBILITY_EVENT, (e) => cb(e.payload));
  } catch (err) {
    console.error('[tauriBridge] listen(launcher://visibility-changed) fallito:', err);
    throw err;
  }
}

// ───────────────── Indicizzazione app, icone e gesture (Step 1B) ─────────────────

/** Scansiona /Applications, ~/Applications e le sorgenti extra. Non estrae le icone. */
export async function scanApps(extraSources: string[] = []): Promise<ScanAppsResult> {
  if (!isTauriRuntime()) {
    warnNoRuntime('scanApps');
    return {
      apps: [],
      stats: { scanned: 0, indexed: 0, skipped: 0, duplicates: 0, elapsedMs: 0 },
    };
  }
  return safeInvoke<ScanAppsResult>('scan_apps', { extraSources });
}

/** Estrae (o riusa dalla cache) l'icona di una app; ritorna il path assoluto del PNG. */
export async function getAppIcon(appPath: string, bundleId: string): Promise<string> {
  if (!isTauriRuntime()) {
    warnNoRuntime('getAppIcon');
    throw new Error('[tauriBridge] getAppIcon richiede il runtime Tauri');
  }
  return safeInvoke<string>('get_app_icon', { appPath, bundleId });
}

/** Estrae in parallelo le icone mancanti; segue l'avanzamento con `onIconsProgress`. */
export async function prefetchAppIcons(apps: IconRequest[]): Promise<IconsProgressPayload> {
  if (!isTauriRuntime()) {
    warnNoRuntime('prefetchAppIcons');
    return { done: 0, total: apps.length, failed: apps.length };
  }
  return safeInvoke<IconsProgressPayload>('prefetch_app_icons', { apps });
}

export async function onIconsProgress(cb: (p: IconsProgressPayload) => void): Promise<UnlistenFn> {
  if (!isTauriRuntime()) {
    warnNoRuntime('onIconsProgress');
    return () => undefined;
  }
  try {
    return await listen<IconsProgressPayload>(APPS_ICONS_PROGRESS_EVENT, (e) => cb(e.payload));
  } catch (err) {
    console.error('[tauriBridge] listen(apps://icons-progress) fallito:', err);
    throw err;
  }
}

/** Applica Hot Corners e gesture trackpad (pinch apre, spread chiude). */
export async function configureGestures(settings: GestureSettings): Promise<void> {
  if (!isTauriRuntime()) {
    warnNoRuntime('configureGestures');
    return;
  }
  await safeInvoke<void>('configure_gestures', { settings });
}

/** Lancia l'applicazione nativa e nasconde il launcher. */
export async function launchApp(appPath: string): Promise<void> {
  if (!isTauriRuntime()) {
    warnNoRuntime('launchApp');
    console.info(`[tauriBridge] (Mock) Lancio applicazione: ${appPath}`);
    return;
  }
  await safeInvoke<void>('open_app', { appPath });
  await setLauncherVisibility(false);
}

/** Converte il path di un PNG in cache in un URL utilizzabile da `<img src>` (asset protocol). */
export function iconSrc(iconCachePath: string): string {
  if (!isTauriRuntime()) {
    console.warn('[tauriBridge] iconSrc: runtime Tauri assente, ritorno il path invariato.');
    return iconCachePath;
  }
  return convertFileSrc(iconCachePath);
}

// ───────────────── Ricerca File, QuickLook & Azioni Disco (Step 3B) ─────────────────

/** Cerca file e directory su macOS tramite Spotlight (mdfind). */
export async function searchFiles(
  query: string,
  maxResults: number = 25,
): Promise<FileSearchResult[]> {
  if (!isTauriRuntime()) {
    warnNoRuntime('searchFiles');
    return [];
  }
  return safeInvoke<FileSearchResult[]>('search_files', { query, maxResults });
}

/** Apre l'anteprima QuickLook nativa di macOS sul file indicato. */
export async function quicklookPreview(path: string): Promise<void> {
  if (!isTauriRuntime()) {
    warnNoRuntime('quicklookPreview');
    return;
  }
  await safeInvoke<void>('quicklook_preview', { path });
}

/** Mostra ed evidenzia il file nel Finder. */
export async function showInFinder(path: string): Promise<void> {
  if (!isTauriRuntime()) {
    warnNoRuntime('showInFinder');
    return;
  }
  await safeInvoke<void>('show_in_finder', { path });
}

/** Sposta in modo sicuro un file nel Cestino di macOS. */
export async function trashFile(path: string): Promise<void> {
  if (!isTauriRuntime()) {
    warnNoRuntime('trashFile');
    return;
  }
  await safeInvoke<void>('trash_file', { path });
}

// ───────────────── Clipboard History Daemon (Step 3B) ─────────────────

/** Recupera la cronologia recente degli appunti registrata dal daemon. */
export async function getClipboardHistory(): Promise<ClipboardEntry[]> {
  if (!isTauriRuntime()) {
    warnNoRuntime('getClipboardHistory');
    return [];
  }
  return safeInvoke<ClipboardEntry[]>('get_clipboard_history');
}

/** Scrive un testo negli appunti di sistema. */
export async function copyToClipboard(content: string): Promise<void> {
  if (!isTauriRuntime()) {
    warnNoRuntime('copyToClipboard');
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.warn('[tauriBridge] navigator.clipboard fallito:', err);
    }
    return;
  }
  await safeInvoke<void>('copy_to_clipboard', { content });
}

/** Svuota la cronologia degli appunti preservando i preferiti (pin). */
export async function clearClipboardHistory(): Promise<void> {
  if (!isTauriRuntime()) {
    warnNoRuntime('clearClipboardHistory');
    return;
  }
  await safeInvoke<void>('clear_clipboard_history');
}

/** Attiva/disattiva lo stato preferito (pin) di un elemento degli appunti. */
export async function toggleFavoriteClipboard(entryId: string): Promise<boolean> {
  if (!isTauriRuntime()) {
    warnNoRuntime('toggleFavoriteClipboard');
    return false;
  }
  return safeInvoke<boolean>('toggle_favorite_clipboard', { entryId });
}

// ───────────────── Workflows & Automazioni 1-Click (Step 4A) ─────────────────

/**
 * Esegue un workflow lanciando in parallelo tutte le app e aprendo tutti i percorsi Finder configurati.
 * A completamento, chiude il launcher.
 */
export async function executeWorkflow(workflow: WorkflowItem): Promise<void> {
  if (!isTauriRuntime()) {
    warnNoRuntime('executeWorkflow');
    console.info(
      `[tauriBridge] (Mock) Esecuzione workflow: "${workflow.name}" (${workflow.targetAppPaths.length} app, ${workflow.targetFinderPaths.length} file)`,
    );
    return;
  }

  const tasks: Promise<unknown>[] = [];

  for (const appPath of workflow.targetAppPaths) {
    tasks.push(safeInvoke<void>('open_app', { appPath }));
  }

  for (const finderPath of workflow.targetFinderPaths) {
    tasks.push(safeInvoke<void>('open_app', { appPath: finderPath }));
  }

  const results = await Promise.allSettled(tasks);
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`[tauriBridge] executeWorkflow: ${failed.length}/${tasks.length} lanci falliti`);
  }

  await setLauncherVisibility(false);
}

// ───────────────── Clean Uninstaller (Step 4B) ─────────────────

/**
 * Scansiona in profondità ~/Library/ alla ricerca di residui (caches, preferences, app support, containers).
 */
export async function scanAppLeftovers(
  bundleId: string,
  appName: string,
): Promise<AppLeftoverItem[]> {
  if (!isTauriRuntime()) {
    warnNoRuntime('scanAppLeftovers');
    return [];
  }
  return safeInvoke<AppLeftoverItem[]>('scan_app_leftovers', {
    bundleId,
    appName,
  });
}

/**
 * Sposta in modo sicuro una lista di percorsi nel Cestino di macOS.
 */
export async function moveToTrashBatch(paths: string[]): Promise<string[]> {
  if (!isTauriRuntime()) {
    warnNoRuntime('moveToTrashBatch');
    return [];
  }
  return safeInvoke<string[]>('move_to_trash_batch', { paths });
}

// ───────────────── Media Player Bridge (Step 5A) ─────────────────

let mockPlaying = true;

/**
 * Recupera lo stato in tempo reale del player musicale attivo (Spotify o Apple Music).
 */
export async function getMediaStatus(): Promise<MediaTrackInfo | null> {
  if (!isTauriRuntime()) {
    return {
      player: 'spotify',
      state: mockPlaying ? 'playing' : 'paused',
      title: 'Starboy (feat. Daft Punk)',
      artist: 'The Weeknd',
      album: 'Starboy',
      artworkUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&auto=format&fit=crop&q=80',
      durationSecs: 230,
      positionSecs: 94,
    };
  }
  return safeInvoke<MediaTrackInfo | null>('get_media_status');
}

/**
 * Toggle Play/Pause sul player musicale attivo.
 */
export async function mediaPlayPause(): Promise<boolean> {
  if (!isTauriRuntime()) {
    mockPlaying = !mockPlaying;
    return true;
  }
  return safeInvoke<boolean>('media_play_pause');
}

/**
 * Passa alla traccia successiva.
 */
export async function mediaNextTrack(): Promise<boolean> {
  if (!isTauriRuntime()) {
    console.info('[tauriBridge] (Mock) mediaNextTrack');
    return true;
  }
  return safeInvoke<boolean>('media_next_track');
}

/**
 * Ritorna alla traccia precedente.
 */
export async function mediaPreviousTrack(): Promise<boolean> {
  if (!isTauriRuntime()) {
    console.info('[tauriBridge] (Mock) mediaPreviousTrack');
    return true;
  }
  return safeInvoke<boolean>('media_previous_track');
}

// ───────────────── Hardware & System Monitor (Step 5B) ─────────────────

let mockCpu = 18;

/**
 * Campiona in tempo reale CPU, RAM e lo stato della batteria.
 */
export async function getHardwareStats(): Promise<HardwareStats> {
  if (!isTauriRuntime()) {
    mockCpu = Math.min(85, Math.max(8, mockCpu + (Math.random() * 8 - 4)));
    return {
      cpuUsage: Math.round(mockCpu * 10) / 10,
      memoryUsedGb: 18.4,
      memoryTotalGb: 36.0,
      memoryPercentage: 51.1,
      battery: {
        percentage: 95,
        isCharging: true,
        isPlugged: true,
        timeRemaining: '0:45',
      },
    };
  }
  return safeInvoke<HardwareStats>('get_hardware_stats');
}

// ───────────────── Dynamic Notch Engine (Step 6) ─────────────────

/**
 * Interroga il backend Cocoa per rilevare la presenza e le dimensioni esatte del Notch hardware.
 */
export async function getNotchMetrics(): Promise<NotchMetrics> {
  if (!isTauriRuntime()) {
    return {
      ...DEFAULT_NOTCH_METRICS,
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
      screenHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,
    };
  }
  try {
    return await safeInvoke<NotchMetrics>('get_notch_metrics');
  } catch (err) {
    console.error('[tauriBridge] get_notch_metrics fallito, uso fallback:', err);
    return DEFAULT_NOTCH_METRICS;
  }
}



