/**
 * LaunchMeClone — Contratto Dati Globale (Step 1A).
 * Nessun `any`: ogni campo dinamico usa `unknown` o union letterali.
 */

/** Evento Tauri emesso da Rust a ogni cambio di visibilità del launcher (payload: boolean). */
export const LAUNCHER_VISIBILITY_EVENT = 'launcher://visibility-changed' as const;

/** Hotkey globale di default per aprire/chiudere il launcher. */
export const DEFAULT_LAUNCH_HOTKEY = 'CommandOrControl+4' as const;

// ───────────────────────── App ─────────────────────────

export type AppCategory =
  | 'recent'
  | 'productivity'
  | 'development'
  | 'games'
  | 'media'
  | 'utilities'
  | 'other'
  | 'hidden';

export interface AppItem {
  /** Bundle identifier dell'app. */
  id: string;
  name: string;
  customName?: string;
  path: string;
  iconCachePath: string;
  customIconPath?: string;
  removeIconBg?: boolean;
  category: AppCategory;
  isHidden: boolean;
  /** Timestamp Unix in millisecondi. */
  lastLaunchedAt?: number;
}

// ───────────────────── Cartelle / Workflow ─────────────────────

export type CustomFolderStyleType = 'default' | 'color' | 'emoji' | 'image';

export interface CustomFolderStyle {
  type: CustomFolderStyleType;
  colorHex?: string;
  emoji?: string;
  coverImagePath?: string;
}

export interface FinderFolderShortcut {
  id: string;
  name: string;
  finderPath: string;
  customStyle: CustomFolderStyle;
}

export interface FolderItem {
  id: string;
  name: string;
  appIds: string[];
  finderShortcuts: FinderFolderShortcut[];
  style: CustomFolderStyle;
}

export interface WorkflowItem {
  id: string;
  name: string;
  iconStyle: CustomFolderStyle;
  targetAppPaths: string[];
  targetFinderPaths: string[];
}

// ───────────────────────── Widget ─────────────────────────

/** '3x2' e '4x4' sono riservati alle variazioni calendario/meteo. */
export type WidgetSize = '1x1' | '2x1' | '2x2' | '4x2' | '3x2' | '4x4';

export type WidgetType =
  | 'music'
  | 'weather'
  | 'hardware'
  | 'clock'
  | 'calendar'
  | 'photo'
  | 'shape_photo'
  | 'gif'
  | 'animations'
  | 'affirmation';

export type MusicWidgetStyle = 'minimal' | 'full_cover' | 'vinyl';

export type WeatherWidgetStyle =
  | 'minimal'
  | 'compact'
  | 'forecast'
  | 'panel'
  | 'almanac'
  | 'horizon'
  | 'bold'
  | 'story';

export type HardwareWidgetStyle = 'gauges' | 'graphs' | 'minimal';

export type ClockWidgetStyle = 'analog' | 'digital_flip' | 'world_clock';

export type CalendarWidgetStyle = 'month' | 'agenda';

export interface BatteryStats {
  percentage: number;
  isCharging: boolean;
  isPlugged: boolean;
  timeRemaining?: string;
}

export interface HardwareStats {
  cpuUsage: number;
  memoryUsedGb: number;
  memoryTotalGb: number;
  memoryPercentage: number;
  battery?: BatteryStats;
}

export interface HardwareWidgetSettings {
  style?: HardwareWidgetStyle;
}

export interface ClockWidgetSettings {
  style?: ClockWidgetStyle;
  showSeconds?: boolean;
  timezones?: string[];
}

export interface CalendarWidgetSettings {
  style?: CalendarWidgetStyle;
}

export interface MusicWidgetSettings {
  style?: MusicWidgetStyle;
  showProgress?: boolean;
  animatedArt?: boolean;
}

export interface WeatherWidgetSettings {
  style?: WeatherWidgetStyle;
  cityName?: string;
  latitude?: number;
  longitude?: number;
}

export interface MediaTrackInfo {
  player: 'spotify' | 'apple_music' | 'none';
  state: 'playing' | 'paused' | 'stopped' | 'idle';
  title: string;
  artist: string;
  album: string;
  artworkUrl?: string;
  durationSecs: number;
  positionSecs: number;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  windSpeed: number;
  uvIndex: number;
  isDay: boolean;
  high: number;
  low: number;
}

export interface HourlyForecast {
  time: string;
  hour: number;
  temperature: number;
  weatherCode: number;
  weatherIcon: string;
  precipitationProbability: number;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  tempMax: number;
  tempMin: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
}

export interface WeatherReport {
  cityName: string;
  coordinates: { latitude: number; longitude: number };
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  updatedAt: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  settings: Record<string, unknown>;
}

// ───────────────────────── Griglia ─────────────────────────

export type GridItemType = 'app' | 'folder' | 'workflow' | 'widget';

export interface GridCellPlacement {
  id: string;
  pageIndex: number;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  itemType: GridItemType;
  itemId: string;
}

// ───────────────────── Tema e Wallpaper ─────────────────────

export type WallpaperType =
  | 'static'
  | 'dynamic_heic'
  | 'live_video'
  | 'dynamic_sun'
  | 'dynamic_weather';

export type UiTheme = 'liquid_glass' | 'flat';
export type GlassMode = 'clear' | 'tinted';
export type IconAppearance = 'light' | 'dark' | 'tinted' | 'clear_colored';

export interface WallpaperConfig {
  type: WallpaperType;
  filePath?: string;
  weatherCity?: string;
  blurIntensity: number;
}

export interface ThemeAndWallpaperConfig {
  uiTheme: UiTheme;
  glassMode: GlassMode;
  glassTintColorHex: string;
  iconAppearance: IconAppearance;
  disableGlassOnIconsForGpu: boolean;
  iconSizePx: number;
  hideAppTitles: boolean;
  classicViewEnabled: boolean;
  showCategoriesPageOnLaunch: boolean;
  centerSearchBar: boolean;
  hideCloseXButton: boolean;
  wallpaper: WallpaperConfig;
}

// ───────────────────────── Clipboard ─────────────────────────

export type ClipboardCategory =
  | 'recent'
  | 'images'
  | 'colors'
  | 'text'
  | 'files'
  | 'links'
  | 'favorites';

export interface ClipboardEntry {
  id: string;
  category: ClipboardCategory;
  content: string;
  previewPath?: string;
  colorHex?: string;
  /** Timestamp Unix in millisecondi. */
  timestamp: number;
  isFavorite: boolean;
}

// ───────────────────────── Ricerca File ─────────────────────────

export interface FileSearchResult {
  path: string;
  name: string;
  is_directory: boolean;
  size_bytes?: number;
  extension?: string;
}

// ────────────────────── Clean Uninstaller (Step 4B) ──────────────────────

export type LeftoverCategory =
  | 'app_support'
  | 'caches'
  | 'preferences'
  | 'containers'
  | 'saved_state'
  | 'logs'
  | 'other';

export interface AppLeftoverItem {
  path: string;
  name: string;
  category: LeftoverCategory;
  sizeBytes: number;
  isDirectory: boolean;
}

// ───────────────────────── Notch ─────────────────────────

export interface NotchMetrics {
  hasNotch: boolean;
  topInset: number;
  notchWidth: number;
  notchHeight: number;
  screenWidth: number;
  screenHeight: number;
}

export const DEFAULT_NOTCH_METRICS: NotchMetrics = {
  hasNotch: false,
  topInset: 0,
  notchWidth: 180,
  notchHeight: 32,
  screenWidth: 1920,
  screenHeight: 1080,
};

export type NotchOpenTrigger = 'hover' | 'click';
export type NotchBackgroundStyle =
  | 'black'
  | 'clear_liquid_glass'
  | 'black_liquid_glass'
  | 'custom_image';

export interface NotchConfig {
  enabled: boolean;
  openTrigger: NotchOpenTrigger;
  compactWidth: number;
  compactHeight: number;
  hideWhileGaming: boolean;
  hideFromScreenCapture: boolean;
  backgroundStyle: NotchBackgroundStyle;
  customBgImagePath?: string;
  pinnedItemIds: string[];
  notchWidgets: WidgetConfig[];
  pocketFilePaths: string[];
}

// ───────────────────────── Space ─────────────────────────

export const DEFAULT_NOTCH_CONFIG: NotchConfig = {
  enabled: true,
  openTrigger: 'hover',
  compactWidth: 180,
  compactHeight: 34,
  hideWhileGaming: true,
  hideFromScreenCapture: false,
  backgroundStyle: 'black_liquid_glass',
  pinnedItemIds: [],
  notchWidgets: [],
  pocketFilePaths: [],
};

export interface SpaceProfile {
  id: string;
  name: string;
  hotkey?: string;
  /** Orario di attivazione automatica, formato 'HH:mm'. */
  scheduleTime?: string;
  placements: GridCellPlacement[];
  folders: FolderItem[];
  workflows: WorkflowItem[];
  widgets: WidgetConfig[];
  themeWallpaper: ThemeAndWallpaperConfig;
  notchConfig: NotchConfig;
}

export function createDefaultSpace(
  id: string = 'default',
  name: string = 'Predefinito',
  placements: GridCellPlacement[] = [],
  folders: FolderItem[] = [],
  workflows: WorkflowItem[] = [],
  theme: ThemeAndWallpaperConfig = DEFAULT_THEME_WALLPAPER,
  widgets: WidgetConfig[] = [],
): SpaceProfile {
  return {
    id,
    name,
    hotkey: 'CommandOrControl+1',
    scheduleTime: undefined,
    placements,
    folders,
    workflows,
    widgets,
    themeWallpaper: theme,
    notchConfig: DEFAULT_NOTCH_CONFIG,
  };
}

// ───────────────────── Impostazioni globali ─────────────────────

/** Azione associabile a un angolo attivo dello schermo. */
export type HotCornerAction = 'none' | 'toggle_launcher';

export interface HotCornersConfig {
  topLeft: HotCornerAction;
  topRight: HotCornerAction;
  bottomLeft: HotCornerAction;
  bottomRight: HotCornerAction;
}

export interface GlobalSystemSettings {
  /** Default: DEFAULT_LAUNCH_HOTKEY ('CommandOrControl+4'). */
  launchHotkey: string;
  hotCorners: HotCornersConfig;
  pinchGestureEnabled: boolean;
  spreadGestureEnabled: boolean;
  extraAppSources: string[];
  openAtLogin: boolean;
  showDockIcon: boolean;
  showMenuBarIcon: boolean;
  activeSpaceId: string;
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSystemSettings = {
  launchHotkey: DEFAULT_LAUNCH_HOTKEY,
  hotCorners: {
    topLeft: 'none',
    topRight: 'none',
    bottomLeft: 'none',
    bottomRight: 'none',
  },
  pinchGestureEnabled: false,
  spreadGestureEnabled: false,
  extraAppSources: [],
  openAtLogin: false,
  showDockIcon: false,
  showMenuBarIcon: true,
  activeSpaceId: 'default',
};

// ───────────────── Indicizzazione app, icone e gesture (Step 1B) ─────────────────

/** Evento Tauri emesso durante `prefetchAppIcons` (payload: IconsProgressPayload). */
export const APPS_ICONS_PROGRESS_EVENT = 'apps://icons-progress' as const;

/** App prodotta dallo scanner Rust. `iconCachePath` è il PNG atteso anche se non ancora generato (vedi `iconReady`). */
export interface ScannedAppItem
  extends Pick<AppItem, 'id' | 'name' | 'path' | 'iconCachePath' | 'category' | 'isHidden'> {
  iconReady: boolean;
}

export interface ScanStats {
  scanned: number;
  indexed: number;
  skipped: number;
  duplicates: number;
  elapsedMs: number;
}

export interface ScanAppsResult {
  apps: ScannedAppItem[];
  stats: ScanStats;
}

export interface IconRequest {
  /** Bundle identifier. */
  id: string;
  /** Path assoluto della .app. */
  path: string;
}

export interface IconsProgressPayload {
  done: number;
  total: number;
  failed: number;
}

/** Impostazioni inviate al backend per Hot Corners e trackpad gestures. */
export interface GestureSettings {
  hotCorners: HotCornersConfig;
  pinchEnabled: boolean;
  spreadEnabled: boolean;
}

// ───────────────── Griglia, categorie e persistenza (Step 2A) ─────────────────

/** Dimensioni fisse della griglia (7×5 per pagina, massimo 10 pagine). */
export const GRID_DEFAULTS = { cols: 7, rows: 5, maxPages: 10 } as const;

export interface GridDimensions {
  cols: number;
  rows: number;
}

export const DEFAULT_THEME_WALLPAPER: ThemeAndWallpaperConfig = {
  uiTheme: 'liquid_glass',
  glassMode: 'clear',
  glassTintColorHex: '#000000',
  iconAppearance: 'light',
  disableGlassOnIconsForGpu: false,
  iconSizePx: 80,
  hideAppTitles: false,
  classicViewEnabled: false,
  showCategoriesPageOnLaunch: false,
  centerSearchBar: false,
  hideCloseXButton: false,
  wallpaper: { type: 'static', blurIntensity: 24 },
};

/** Card della pagina Categorie (tutte le categorie tranne 'other'). */
export type CategoryCardId = Exclude<AppCategory, 'other'>;

/** Parte del tema persistita in localStorage (Step 3A: estesa a tutta la config tema/wallpaper). */
export type PersistedTheme = Partial<ThemeAndWallpaperConfig> &
  Pick<ThemeAndWallpaperConfig, 'iconSizePx' | 'hideAppTitles' | 'showCategoriesPageOnLaunch'>;

/** Schema salvato in localStorage (versionato). */
export interface PersistedLauncherV1 {
  version: 1;
  placements: GridCellPlacement[];
  grid: GridDimensions;
  hiddenAppIds: string[];
  /** bundleId → timestamp Unix (ms) dell'ultimo lancio. */
  launchHistory: Record<string, number>;
  theme: PersistedTheme;
  /** Cartelle create dall'utente (Step 2B). Opzionale per compatibilità v1 esistente. */
  folders?: FolderItem[];
  /** Workflows 1-click creati dall'utente (Step 4A). */
  workflows?: WorkflowItem[];
  /** Profili Spaces (Step 4A). */
  spaces?: SpaceProfile[];
  /** Id dello Space attivo (Step 4A). */
  activeSpaceId?: string;
  /** Widgets configurati (Step 5A). */
  widgets?: WidgetConfig[];
}
