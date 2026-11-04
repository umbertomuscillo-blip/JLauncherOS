/**
 * Persistenza versionata del layout su localStorage con validazione e salvataggio sicuro di backup.
 */
import {
  DEFAULT_THEME_WALLPAPER,
  GRID_DEFAULTS,
  createDefaultSpace,
  type FolderItem,
  type GridCellPlacement,
  type PersistedLauncherV1,
  type SpaceProfile,
  type WidgetConfig,
  type WorkflowItem,
} from '~types';

export const STORAGE_KEY = 'launchme.clone.v1.layout';

export interface StorageLoadResult {
  status: 'empty' | 'ok' | 'corrupt';
  data?: PersistedLauncherV1;
  error?: string;
}

export interface StorageSaveResult {
  ok: boolean;
  error?: string;
}

function isValidPlacement(p: unknown): p is GridCellPlacement {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.pageIndex === 'number' &&
    typeof o.row === 'number' &&
    typeof o.col === 'number' &&
    typeof o.rowSpan === 'number' &&
    typeof o.colSpan === 'number' &&
    (o.itemType === 'app' || o.itemType === 'folder' || o.itemType === 'workflow' || o.itemType === 'widget') &&
    typeof o.itemId === 'string'
  );
}

function isValidFolderStyle(s: unknown): boolean {
  if (typeof s !== 'object' || s === null) return false;
  const o = s as Record<string, unknown>;
  const validTypes = ['default', 'color', 'emoji', 'image'];
  if (!validTypes.includes(o.type as string)) return false;
  if (o.colorHex !== undefined && typeof o.colorHex !== 'string') return false;
  if (o.emoji !== undefined && typeof o.emoji !== 'string') return false;
  if (o.coverImagePath !== undefined && typeof o.coverImagePath !== 'string') return false;
  return true;
}

function isValidFinderShortcut(sc: unknown): boolean {
  if (typeof sc !== 'object' || sc === null) return false;
  const o = sc as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.finderPath === 'string' &&
    isValidFolderStyle(o.customStyle)
  );
}

export function isValidFolder(f: unknown): f is FolderItem {
  if (typeof f !== 'object' || f === null) return false;
  const o = f as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    Array.isArray(o.appIds) &&
    o.appIds.every((id) => typeof id === 'string') &&
    Array.isArray(o.finderShortcuts) &&
    o.finderShortcuts.every(isValidFinderShortcut) &&
    isValidFolderStyle(o.style)
  );
}

export function isValidWorkflow(w: unknown): w is WorkflowItem {
  if (typeof w !== 'object' || w === null) return false;
  const o = w as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    isValidFolderStyle(o.iconStyle) &&
    Array.isArray(o.targetAppPaths) &&
    o.targetAppPaths.every((p) => typeof p === 'string') &&
    Array.isArray(o.targetFinderPaths) &&
    o.targetFinderPaths.every((p) => typeof p === 'string')
  );
}

export function isValidWidgetConfig(w: unknown): w is WidgetConfig {
  if (typeof w !== 'object' || w === null) return false;
  const o = w as Record<string, unknown>;
  const validTypes = [
    'music',
    'weather',
    'hardware',
    'clock',
    'calendar',
    'photo',
    'shape_photo',
    'gif',
    'animations',
    'affirmation',
  ];
  const validSizes = ['1x1', '2x1', '2x2', '4x2', '3x2', '4x4'];
  return (
    typeof o.id === 'string' &&
    typeof o.type === 'string' &&
    validTypes.includes(o.type as string) &&
    typeof o.size === 'string' &&
    validSizes.includes(o.size as string) &&
    typeof o.settings === 'object' &&
    o.settings !== null
  );
}

export function isValidSpaceProfile(s: unknown): s is SpaceProfile {
  if (typeof s !== 'object' || s === null) return false;
  const o = s as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return false;
  if (o.hotkey !== undefined && typeof o.hotkey !== 'string') return false;
  if (o.scheduleTime !== undefined && typeof o.scheduleTime !== 'string') return false;
  if (!Array.isArray(o.placements) || !o.placements.every(isValidPlacement)) return false;
  if (o.folders !== undefined && (!Array.isArray(o.folders) || !o.folders.every(isValidFolder))) return false;
  if (o.workflows !== undefined && (!Array.isArray(o.workflows) || !o.workflows.every(isValidWorkflow))) return false;
  if (o.widgets !== undefined && (!Array.isArray(o.widgets) || !o.widgets.every(isValidWidgetConfig))) return false;
  return true;
}

export function validatePersisted(obj: unknown): obj is PersistedLauncherV1 {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  if (o.version !== 1) return false;
  if (!Array.isArray(o.placements) || !o.placements.every(isValidPlacement)) return false;
  if (!Array.isArray(o.hiddenAppIds) || !o.hiddenAppIds.every((id) => typeof id === 'string')) return false;

  if (typeof o.grid !== 'object' || o.grid === null) return false;
  const g = o.grid as Record<string, unknown>;
  if (typeof g.cols !== 'number' || typeof g.rows !== 'number') return false;

  if (typeof o.launchHistory !== 'object' || o.launchHistory === null) return false;
  const lh = o.launchHistory as Record<string, unknown>;
  for (const val of Object.values(lh)) {
    if (typeof val !== 'number') return false;
  }

  if (typeof o.theme !== 'object' || o.theme === null) return false;
  const th = o.theme as Record<string, unknown>;
  if (typeof th.iconSizePx !== 'number' || typeof th.hideAppTitles !== 'boolean' || typeof th.showCategoriesPageOnLaunch !== 'boolean') {
    return false;
  }

  if (o.folders !== undefined) {
    if (!Array.isArray(o.folders) || !o.folders.every(isValidFolder)) return false;
  }

  if (o.workflows !== undefined) {
    if (!Array.isArray(o.workflows) || !o.workflows.every(isValidWorkflow)) return false;
  }

  if (o.widgets !== undefined) {
    if (!Array.isArray(o.widgets) || !o.widgets.every(isValidWidgetConfig)) return false;
  }

  if (o.spaces !== undefined) {
    if (!Array.isArray(o.spaces) || !o.spaces.every(isValidSpaceProfile)) return false;
  }

  if (o.activeSpaceId !== undefined && typeof o.activeSpaceId !== 'string') {
    return false;
  }

  return true;
}

export function loadLayout(): StorageLoadResult {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { status: 'empty' };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      const errStr = parseErr instanceof Error ? parseErr.message : String(parseErr);
      const backupKey = `${STORAGE_KEY}.corrupt-${Date.now()}`;
      localStorage.setItem(backupKey, raw);
      console.error(`[layoutStorage] JSON corrotto, salvato backup in '${backupKey}':`, errStr);
      return { status: 'corrupt', error: `JSON non valido: ${errStr}` };
    }

    if (!validatePersisted(parsed)) {
      const backupKey = `${STORAGE_KEY}.corrupt-${Date.now()}`;
      localStorage.setItem(backupKey, raw);
      console.error(`[layoutStorage] Schema non valido, salvato backup in '${backupKey}'`);
      return { status: 'corrupt', error: 'Validazione schema fallita' };
    }

    return { status: 'ok', data: parsed };
  } catch (err) {
    const errStr = err instanceof Error ? err.message : String(err);
    console.error('[layoutStorage] Errore in lettura da localStorage:', err);
    return { status: 'corrupt', error: errStr };
  }
}

export function saveLayout(data: PersistedLauncherV1): StorageSaveResult {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    return { ok: true };
  } catch (err) {
    const errStr = err instanceof Error ? err.message : String(err);
    console.error('[layoutStorage] Errore salvataggio su localStorage:', err);
    return { ok: false, error: errStr };
  }
}

export function defaultPersisted(): PersistedLauncherV1 {
  return {
    version: 1,
    placements: [],
    grid: { cols: GRID_DEFAULTS.cols, rows: GRID_DEFAULTS.rows },
    hiddenAppIds: [],
    launchHistory: {},
    folders: [],
    workflows: [],
    spaces: [createDefaultSpace()],
    activeSpaceId: 'default',
    theme: {
      ...DEFAULT_THEME_WALLPAPER,
    },
  };
}
