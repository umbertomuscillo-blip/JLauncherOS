import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type FC,
  type ReactNode,
} from 'react';
import {
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_NOTCH_METRICS,
  DEFAULT_THEME_WALLPAPER,
  GRID_DEFAULTS,
  createDefaultSpace,
  type AppCategory,
  type AppItem,
  type CategoryCardId,
  type CustomFolderStyle,
  type FinderFolderShortcut,
  type FolderItem,
  type GlobalSystemSettings,
  type GridCellPlacement,
  type GridDimensions,
  type NotchMetrics,
  type PersistedLauncherV1,
  type ScannedAppItem,
  type SpaceProfile,
  type ThemeAndWallpaperConfig,
  type WidgetConfig,
  type WorkflowItem,
} from '~types';
import { autoPlace, buildOccupancy, firstFreeCell, moveOrSwap, normalizePages, reconcile, type CellTarget } from '@/lib/gridLayout';
import { defaultPersisted, loadLayout, saveLayout } from '@/lib/layoutStorage';
import { getNotchMetrics } from '@/services/tauriBridge';

export interface LauncherState {
  activeSpaceId: string;
  spaces: SpaceProfile[];
  workflows: WorkflowItem[];
  widgets: WidgetConfig[];
  searchQuery: string;
  settings: GlobalSystemSettings;
  apps: AppItem[];
  scanStatus: 'idle' | 'scanning' | 'ready' | 'error';
  scanError?: string;
  lastScanAt?: number;
  iconRevision: number;
  grid: GridDimensions;
  placements: GridCellPlacement[];
  hiddenAppIds: string[];
  launchHistory: Record<string, number>;
  theme: ThemeAndWallpaperConfig;
  editMode: boolean;
  viewIndex: number;
  persistError?: string;
  lastNotice?: string;
  folders: FolderItem[];
  openFolderId: string | null;
  isBatchCreatorOpen: boolean;
  isThemeModalOpen: boolean;
  customizingAppId: string | null;
  isSpaceModalOpen: boolean;
  isWorkflowModalOpen: boolean;
  editingWorkflowId: string | null;
  uninstallingAppId: string | null;
  notchMetrics: NotchMetrics;
}

export type LauncherAction =
  | { type: 'SET_NOTCH_METRICS'; metrics: NotchMetrics }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_ACTIVE_SPACE'; spaceId: string }
  | { type: 'PATCH_SETTINGS'; patch: Partial<GlobalSystemSettings> }
  | { type: 'HYDRATE'; data: PersistedLauncherV1 }
  | { type: 'OPEN_UNINSTALLER'; appId: string }
  | { type: 'CLOSE_UNINSTALLER' }
  | { type: 'APP_UNINSTALLED'; appId: string }
  | { type: 'SWITCH_SPACE'; spaceId: string }
  | {
      type: 'CREATE_SPACE';
      name: string;
      duplicateCurrent?: boolean;
      hotkey?: string;
      scheduleTime?: string;
    }
  | {
      type: 'UPDATE_SPACE';
      spaceId: string;
      name?: string;
      hotkey?: string;
      scheduleTime?: string;
    }
  | { type: 'DELETE_SPACE'; spaceId: string }
  | { type: 'SET_SPACE_MODAL_OPEN'; open: boolean }
  | { type: 'OPEN_WORKFLOW_BUILDER'; workflowId?: string }
  | { type: 'CLOSE_WORKFLOW_BUILDER' }
  | { type: 'SAVE_WORKFLOW'; workflow: WorkflowItem; targetPlacement?: CellTarget }
  | { type: 'DELETE_WORKFLOW'; workflowId: string }
  | { type: 'SCAN_STARTED' }
  | { type: 'APPS_LOADED'; scanned: ScannedAppItem[] }
  | { type: 'SCAN_FAILED'; error: string }
  | { type: 'ICONS_REFRESHED' }
  | { type: 'SET_EDIT_MODE'; enabled: boolean }
  | { type: 'SET_VIEW'; viewIndex: number }
  | { type: 'MOVE_ITEM'; placementId: string; target: CellTarget }
  | { type: 'HIDE_APP'; appId: string }
  | { type: 'UNHIDE_APP'; appId: string }
  | { type: 'RECORD_LAUNCH'; appId: string }
  | { type: 'NORMALIZE_PAGES' }
  | { type: 'TOGGLE_CATEGORIES_PAGE' }
  | { type: 'DISMISS_PERSIST_ERROR' }
  | { type: 'SET_THEME_MODAL_OPEN'; open: boolean }
  | { type: 'UPDATE_THEME'; patch: Partial<ThemeAndWallpaperConfig> }
  | { type: 'OPEN_APP_CUSTOMIZER'; appId: string }
  | { type: 'CLOSE_APP_CUSTOMIZER' }
  | {
      type: 'SET_APP_CUSTOM_ICON';
      appId: string;
      customIconPath?: string;
      removeIconBg?: boolean;
    }
  | { type: 'OPEN_FOLDER'; folderId: string }
  | { type: 'CLOSE_FOLDER' }
  | { type: 'SET_BATCH_CREATOR_OPEN'; open: boolean }
  | {
      type: 'CREATE_FOLDER';
      name: string;
      appIds: string[];
      finderShortcuts?: FinderFolderShortcut[];
      style?: CustomFolderStyle;
      targetPlacement?: CellTarget;
    }
  | {
      type: 'MERGE_INTO_FOLDER';
      sourcePlacementId: string;
      targetPlacementId: string;
    }
  | {
      type: 'ADD_APP_TO_FOLDER';
      folderId: string;
      appId: string;
      sourcePlacementId?: string;
    }
  | {
      type: 'REMOVE_APP_FROM_FOLDER';
      folderId: string;
      appId: string;
    }
  | {
      type: 'DELETE_FOLDER';
      folderId: string;
    }
  | {
      type: 'UPDATE_FOLDER';
      folderId: string;
      name?: string;
      style?: CustomFolderStyle;
    }
  | {
      type: 'ADD_FINDER_SHORTCUT';
      folderId: string;
      shortcut: FinderFolderShortcut;
    }
  | {
      type: 'REMOVE_FINDER_SHORTCUT';
      folderId: string;
      shortcutId: string;
    }
  | {
      type: 'ADD_WIDGET';
      widget: WidgetConfig;
      targetPlacement?: CellTarget;
    }
  | {
      type: 'UPDATE_WIDGET';
      widgetId: string;
      patch: Partial<WidgetConfig>;
    }
  | {
      type: 'DELETE_WIDGET';
      widgetId: string;
    };

export const DEFAULT_INITIAL_WIDGETS: WidgetConfig[] = [
  {
    id: 'default-widget-music',
    type: 'music',
    size: '2x1',
    settings: { style: 'minimal' },
  },
  {
    id: 'default-widget-weather',
    type: 'weather',
    size: '2x1',
    settings: { style: 'compact', cityName: 'Bari, Italia', latitude: 41.1171, longitude: 16.8719 },
  },
  {
    id: 'default-widget-clock',
    type: 'clock',
    size: '1x1',
    settings: { style: 'analog' },
  },
  {
    id: 'default-widget-hardware',
    type: 'hardware',
    size: '2x1',
    settings: { style: 'gauges' },
  },
];

export const DEFAULT_WIDGET_PLACEMENTS: GridCellPlacement[] = [
  {
    id: 'placement-default-music',
    pageIndex: 0,
    row: 0,
    col: 0,
    rowSpan: 1,
    colSpan: 2,
    itemType: 'widget',
    itemId: 'default-widget-music',
  },
  {
    id: 'placement-default-weather',
    pageIndex: 0,
    row: 0,
    col: 2,
    rowSpan: 1,
    colSpan: 2,
    itemType: 'widget',
    itemId: 'default-widget-weather',
  },
  {
    id: 'placement-default-clock',
    pageIndex: 0,
    row: 0,
    col: 4,
    rowSpan: 1,
    colSpan: 1,
    itemType: 'widget',
    itemId: 'default-widget-clock',
  },
  {
    id: 'placement-default-hardware',
    pageIndex: 0,
    row: 0,
    col: 5,
    rowSpan: 1,
    colSpan: 2,
    itemType: 'widget',
    itemId: 'default-widget-hardware',
  },
];

const initialState: LauncherState = {
  activeSpaceId: DEFAULT_GLOBAL_SETTINGS.activeSpaceId,
  spaces: [createDefaultSpace('default', 'Predefinito', DEFAULT_WIDGET_PLACEMENTS, [], [], DEFAULT_THEME_WALLPAPER, DEFAULT_INITIAL_WIDGETS)],
  workflows: [],
  widgets: DEFAULT_INITIAL_WIDGETS,
  searchQuery: '',
  settings: DEFAULT_GLOBAL_SETTINGS,
  apps: [],
  scanStatus: 'idle',
  iconRevision: 0,
  grid: { cols: GRID_DEFAULTS.cols, rows: GRID_DEFAULTS.rows },
  placements: DEFAULT_WIDGET_PLACEMENTS,
  hiddenAppIds: [],
  launchHistory: {},
  theme: DEFAULT_THEME_WALLPAPER,
  editMode: false,
  viewIndex: 0,
  folders: [],
  openFolderId: null,
  isBatchCreatorOpen: false,
  isThemeModalOpen: false,
  customizingAppId: null,
  isSpaceModalOpen: false,
  isWorkflowModalOpen: false,
  editingWorkflowId: null,
  uninstallingAppId: null,
  notchMetrics: DEFAULT_NOTCH_METRICS,
};

function launcherReducer(state: LauncherState, action: LauncherAction): LauncherState {
  switch (action.type) {
    case 'SET_NOTCH_METRICS':
      return { ...state, notchMetrics: action.metrics };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };

    case 'SET_ACTIVE_SPACE':
      return {
        ...state,
        activeSpaceId: action.spaceId,
        settings: { ...state.settings, activeSpaceId: action.spaceId },
      };

    case 'PATCH_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'HYDRATE': {
      const p = action.data;
      const initialSpaces: SpaceProfile[] =
        p.spaces && p.spaces.length > 0
          ? p.spaces
          : [
              createDefaultSpace(
                'default',
                'Predefinito',
                p.placements,
                p.folders ?? [],
                p.workflows ?? [],
                { ...state.theme, ...p.theme },
              ),
            ];
      const activeId =
        p.activeSpaceId && initialSpaces.some((s) => s.id === p.activeSpaceId)
          ? p.activeSpaceId
          : initialSpaces[0]?.id ?? 'default';
      const activeSpace = initialSpaces.find((s) => s.id === activeId) ?? initialSpaces[0];

      const hydratedWidgets =
        activeSpace?.widgets && activeSpace.widgets.length > 0
          ? activeSpace.widgets
          : p.widgets && p.widgets.length > 0
          ? p.widgets
          : DEFAULT_INITIAL_WIDGETS;

      let hydratedPlacements = activeSpace ? activeSpace.placements : p.placements;
      const hasWidgetPlacement = hydratedPlacements.some((pl) => pl.itemType === 'widget');
      if (!hasWidgetPlacement) {
        hydratedPlacements = [...DEFAULT_WIDGET_PLACEMENTS, ...hydratedPlacements];
      }

      return {
        ...state,
        spaces: initialSpaces,
        activeSpaceId: activeId,
        placements: hydratedPlacements,
        grid: p.grid,
        hiddenAppIds: p.hiddenAppIds,
        launchHistory: p.launchHistory,
        folders: activeSpace ? activeSpace.folders : (p.folders ?? []),
        workflows: activeSpace ? activeSpace.workflows : (p.workflows ?? []),
        widgets: hydratedWidgets,
        theme: activeSpace
          ? { ...state.theme, ...activeSpace.themeWallpaper }
          : { ...state.theme, ...p.theme },
      };
    }

    case 'OPEN_UNINSTALLER':
      return { ...state, uninstallingAppId: action.appId };

    case 'CLOSE_UNINSTALLER':
      return { ...state, uninstallingAppId: null };

    case 'APP_UNINSTALLED': {
      const targetApp = state.apps.find((a) => a.id === action.appId);
      const appName = targetApp?.name ?? 'Applicazione';
      const updatedApps = state.apps.filter((a) => a.id !== action.appId);
      const updatedPlacements = state.placements.filter(
        (p) => !(p.itemType === 'app' && p.itemId === action.appId),
      );
      const updatedFolders = state.folders.map((f) => ({
        ...f,
        appIds: f.appIds.filter((id) => id !== action.appId),
      }));
      const updatedHidden = state.hiddenAppIds.filter((id) => id !== action.appId);

      return {
        ...state,
        apps: updatedApps,
        placements: updatedPlacements,
        folders: updatedFolders,
        hiddenAppIds: updatedHidden,
        uninstallingAppId: null,
        lastNotice: `"${appName}" rimossa e spostata nel Cestino`,
      };
    }

    case 'SWITCH_SPACE': {
      if (action.spaceId === state.activeSpaceId) {
        return { ...state, isSpaceModalOpen: false };
      }
      const targetSpace = state.spaces.find((s) => s.id === action.spaceId);
      if (!targetSpace) return state;

      // Aggiorna lo snapshot dello space uscente
      const updatedSpaces = state.spaces.map((sp) => {
        if (sp.id === state.activeSpaceId) {
          return {
            ...sp,
            placements: state.placements,
            folders: state.folders,
            workflows: state.workflows,
            widgets: state.widgets,
            themeWallpaper: state.theme,
          };
        }
        return sp;
      });

      return {
        ...state,
        spaces: updatedSpaces,
        activeSpaceId: targetSpace.id,
        placements: targetSpace.placements,
        folders: targetSpace.folders,
        workflows: targetSpace.workflows,
        widgets: targetSpace.widgets ?? [],
        theme: {
          ...state.theme,
          ...targetSpace.themeWallpaper,
        },
        viewIndex: 0,
        openFolderId: null,
        isSpaceModalOpen: false,
        lastNotice: `Passato allo spazio "${targetSpace.name}"`,
      };
    }

    case 'CREATE_SPACE': {
      const newId = `space-${Date.now()}`;
      const newSpace: SpaceProfile = createDefaultSpace(
        newId,
        action.name.trim() || `Space ${state.spaces.length + 1}`,
        action.duplicateCurrent ? [...state.placements] : [],
        action.duplicateCurrent ? [...state.folders] : [],
        action.duplicateCurrent ? [...state.workflows] : [],
        action.duplicateCurrent ? { ...state.theme } : DEFAULT_THEME_WALLPAPER,
        action.duplicateCurrent ? [...state.widgets] : [],
      );
      if (action.hotkey) newSpace.hotkey = action.hotkey;
      if (action.scheduleTime) newSpace.scheduleTime = action.scheduleTime;

      // Salva snapshot dello spazio attuale
      const updatedSpaces = state.spaces.map((sp) => {
        if (sp.id === state.activeSpaceId) {
          return {
            ...sp,
            placements: state.placements,
            folders: state.folders,
            workflows: state.workflows,
            widgets: state.widgets,
            themeWallpaper: state.theme,
          };
        }
        return sp;
      });

      return {
        ...state,
        spaces: [...updatedSpaces, newSpace],
        activeSpaceId: newSpace.id,
        placements: newSpace.placements,
        folders: newSpace.folders,
        workflows: newSpace.workflows,
        widgets: newSpace.widgets,
        theme: newSpace.themeWallpaper,
        viewIndex: 0,
        isSpaceModalOpen: false,
        lastNotice: `Creato nuovo spazio "${newSpace.name}"`,
      };
    }

    case 'UPDATE_SPACE': {
      const updatedSpaces = state.spaces.map((sp) => {
        if (sp.id === action.spaceId) {
          return {
            ...sp,
            name: action.name !== undefined ? action.name : sp.name,
            hotkey: action.hotkey !== undefined ? action.hotkey : sp.hotkey,
            scheduleTime:
              action.scheduleTime !== undefined ? action.scheduleTime : sp.scheduleTime,
          };
        }
        return sp;
      });
      return {
        ...state,
        spaces: updatedSpaces,
        lastNotice: 'Spazio aggiornato',
      };
    }

    case 'DELETE_SPACE': {
      if (state.spaces.length <= 1) return state; // Non si può eliminare l'ultimo spazio
      const remainingSpaces = state.spaces.filter((sp) => sp.id !== action.spaceId);
      if (state.activeSpaceId === action.spaceId) {
        const nextSpace = remainingSpaces[0]!;
        return {
          ...state,
          spaces: remainingSpaces,
          activeSpaceId: nextSpace.id,
          placements: nextSpace.placements,
          folders: nextSpace.folders,
          workflows: nextSpace.workflows,
          theme: nextSpace.themeWallpaper,
          viewIndex: 0,
          lastNotice: `Spazio eliminato, attivo "${nextSpace.name}"`,
        };
      }
      return {
        ...state,
        spaces: remainingSpaces,
        lastNotice: 'Spazio eliminato',
      };
    }

    case 'SET_SPACE_MODAL_OPEN':
      return { ...state, isSpaceModalOpen: action.open };

    case 'OPEN_WORKFLOW_BUILDER':
      return {
        ...state,
        isWorkflowModalOpen: true,
        editingWorkflowId: action.workflowId ?? null,
      };

    case 'CLOSE_WORKFLOW_BUILDER':
      return {
        ...state,
        isWorkflowModalOpen: false,
        editingWorkflowId: null,
      };

    case 'SAVE_WORKFLOW': {
      const existingIndex = state.workflows.findIndex((w) => w.id === action.workflow.id);
      let updatedWorkflows: WorkflowItem[];
      let updatedPlacements = [...state.placements];

      if (existingIndex >= 0) {
        // Modifica
        updatedWorkflows = [...state.workflows];
        updatedWorkflows[existingIndex] = action.workflow;
      } else {
        // Creazione
        updatedWorkflows = [...state.workflows, action.workflow];
        const occ = buildOccupancy(updatedPlacements);
        const targetCell =
          action.targetPlacement ??
          firstFreeCell(occ, state.grid, state.viewIndex) ?? {
            pageIndex: state.viewIndex,
            row: 0,
            col: 0,
          };
        updatedPlacements.push({
          id: `wf-placement-${action.workflow.id}`,
          pageIndex: targetCell.pageIndex,
          row: targetCell.row,
          col: targetCell.col,
          rowSpan: 1,
          colSpan: 1,
          itemType: 'workflow',
          itemId: action.workflow.id,
        });
      }

      return {
        ...state,
        workflows: updatedWorkflows,
        placements: updatedPlacements,
        isWorkflowModalOpen: false,
        editingWorkflowId: null,
        lastNotice: `Workflow "${action.workflow.name}" salvato`,
      };
    }

    case 'DELETE_WORKFLOW': {
      const updatedWorkflows = state.workflows.filter((w) => w.id !== action.workflowId);
      const updatedPlacements = state.placements.filter(
        (p) => !(p.itemType === 'workflow' && p.itemId === action.workflowId),
      );
      return {
        ...state,
        workflows: updatedWorkflows,
        placements: updatedPlacements,
        lastNotice: 'Workflow eliminato',
      };
    }

    case 'ADD_WIDGET': {
      const updatedWidgets = [...state.widgets, action.widget];
      const occ = buildOccupancy(state.placements);
      const targetCell =
        action.targetPlacement ??
        firstFreeCell(occ, state.grid, state.viewIndex) ?? {
          pageIndex: state.viewIndex,
          row: 0,
          col: 0,
        };

      const rowSpan =
        action.widget.size === '2x2' || action.widget.size === '4x2' || action.widget.size === '3x2'
          ? 2
          : action.widget.size === '4x4'
          ? 4
          : 1;
      const colSpan =
        action.widget.size === '2x1' || action.widget.size === '2x2'
          ? 2
          : action.widget.size === '4x2' || action.widget.size === '4x4'
          ? 4
          : action.widget.size === '3x2'
          ? 3
          : 1;

      const widgetPlacement: GridCellPlacement = {
        id: `widget-placement-${action.widget.id}`,
        pageIndex: targetCell.pageIndex,
        row: targetCell.row,
        col: targetCell.col,
        rowSpan,
        colSpan,
        itemType: 'widget',
        itemId: action.widget.id,
      };

      return {
        ...state,
        widgets: updatedWidgets,
        placements: [...state.placements, widgetPlacement],
        lastNotice: 'Widget aggiunto alla griglia',
      };
    }

    case 'UPDATE_WIDGET': {
      const updatedWidgets = state.widgets.map((w) => {
        if (w.id === action.widgetId) {
          return {
            ...w,
            ...action.patch,
            settings: { ...w.settings, ...(action.patch.settings || {}) },
          };
        }
        return w;
      });
      return { ...state, widgets: updatedWidgets };
    }

    case 'DELETE_WIDGET': {
      const updatedWidgets = state.widgets.filter((w) => w.id !== action.widgetId);
      const updatedPlacements = state.placements.filter(
        (p) => !(p.itemType === 'widget' && p.itemId === action.widgetId),
      );
      return {
        ...state,
        widgets: updatedWidgets,
        placements: updatedPlacements,
        lastNotice: 'Widget rimosso',
      };
    }

    case 'SCAN_STARTED':
      return { ...state, scanStatus: 'scanning', scanError: undefined };

    case 'APPS_LOADED': {
      const appMap = new Map<string, AppItem>();
      const initialHidden = new Set(state.hiddenAppIds);

      const mappedApps: AppItem[] = action.scanned.map((s) => {
        if (s.isHidden) initialHidden.add(s.id);
        const item: AppItem = {
          id: s.id,
          name: s.name,
          path: s.path,
          iconCachePath: s.iconCachePath,
          category: s.category as AppCategory,
          isHidden: initialHidden.has(s.id),
          lastLaunchedAt: state.launchHistory[s.id],
        };
        appMap.set(s.id, item);
        return item;
      });

      // Le app già raggruppate in una cartella non devono essere auto-piazzate come singole icone
      const appsInFolders = new Set(state.folders.flatMap((f) => f.appIds));
      const visibleAppIds = mappedApps
        .filter((a) => !initialHidden.has(a.id) && !appsInFolders.has(a.id))
        .map((a) => a.id);

      // Gli ID validi per reconcile includono le app visibili, tutte le cartelle e i workflow creati
      const folderIds = state.folders.map((f) => f.id);
      const workflowIds = state.workflows.map((w) => w.id);
      const validSet = new Set([...visibleAppIds, ...folderIds, ...workflowIds]);

      const reconciled = reconcile(state.placements, validSet, state.grid);
      const placed = autoPlace(reconciled.placements, visibleAppIds, state.grid);
      const normalized = normalizePages(placed.placements);

      return {
        ...state,
        apps: mappedApps,
        scanStatus: 'ready',
        lastScanAt: Date.now(),
        hiddenAppIds: Array.from(initialHidden),
        placements: normalized.placements,
      };
    }

    case 'SCAN_FAILED':
      return { ...state, scanStatus: 'error', scanError: action.error };

    case 'ICONS_REFRESHED':
      return { ...state, iconRevision: state.iconRevision + 1 };

    case 'SET_EDIT_MODE':
      return {
        ...state,
        editMode: action.enabled,
        lastNotice: action.enabled ? 'Modalità Modifica attivata' : 'Modifiche salvate',
      };

    case 'SET_VIEW':
      return { ...state, viewIndex: Math.max(0, action.viewIndex) };

    case 'MOVE_ITEM': {
      const res = moveOrSwap(state.placements, action.placementId, action.target, state.grid);
      if (res.outcome === 'rejected') {
        return { ...state, lastNotice: res.reason ?? 'Spostamento non consentito' };
      }
      return {
        ...state,
        placements: res.placements,
        lastNotice: res.outcome === 'swapped' ? 'Elementi scambiati' : 'Elemento riposizionato',
      };
    }

    case 'HIDE_APP': {
      if (state.hiddenAppIds.includes(action.appId)) return state;
      const nextHidden = [...state.hiddenAppIds, action.appId];
      const nextPlacements = state.placements.filter(
        (p) => !(p.itemType === 'app' && p.itemId === action.appId),
      );
      const normalized = normalizePages(nextPlacements);
      const nextApps = state.apps.map((a) =>
        a.id === action.appId ? { ...a, isHidden: true } : a,
      );

      return {
        ...state,
        hiddenAppIds: nextHidden,
        placements: normalized.placements,
        apps: nextApps,
        lastNotice: 'Applicazione nascosta',
      };
    }

    case 'UNHIDE_APP': {
      const nextHidden = state.hiddenAppIds.filter((id) => id !== action.appId);
      const nextApps = state.apps.map((a) =>
        a.id === action.appId ? { ...a, isHidden: false } : a,
      );
      const placed = autoPlace(state.placements, [action.appId], state.grid);

      return {
        ...state,
        hiddenAppIds: nextHidden,
        placements: placed.placements,
        apps: nextApps,
        lastNotice: 'Applicazione ripristinata nella griglia',
      };
    }

    case 'RECORD_LAUNCH': {
      const now = Date.now();
      const nextHistory = { ...state.launchHistory, [action.appId]: now };
      const nextApps = state.apps.map((a) =>
        a.id === action.appId ? { ...a, lastLaunchedAt: now } : a,
      );
      return { ...state, launchHistory: nextHistory, apps: nextApps };
    }

    case 'NORMALIZE_PAGES': {
      const norm = normalizePages(state.placements);
      if (!norm.changed) return state;
      return { ...state, placements: norm.placements };
    }

    case 'TOGGLE_CATEGORIES_PAGE': {
      const nextVal = !state.theme.showCategoriesPageOnLaunch;
      return {
        ...state,
        theme: { ...state.theme, showCategoriesPageOnLaunch: nextVal },
      };
    }

    case 'DISMISS_PERSIST_ERROR':
      return { ...state, persistError: undefined };

    case 'OPEN_FOLDER':
      return { ...state, openFolderId: action.folderId };

    case 'CLOSE_FOLDER':
      return { ...state, openFolderId: null };

    case 'SET_BATCH_CREATOR_OPEN':
      return { ...state, isBatchCreatorOpen: action.open };

    case 'CREATE_FOLDER': {
      const folderId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newFolder: FolderItem = {
        id: folderId,
        name: action.name.trim() || 'Nuova Cartella',
        appIds: action.appIds,
        finderShortcuts: action.finderShortcuts ?? [],
        style: action.style ?? { type: 'default' },
      };
      // Rimuovi i singoli placement per le app ora raggruppate
      const appIdsSet = new Set(action.appIds);
      const keptPlacements = state.placements.filter(
        (p) => !(p.itemType === 'app' && appIdsSet.has(p.itemId)),
      );
      // Posiziona la cartella
      let target = action.targetPlacement;
      if (!target) {
        const occ = buildOccupancy(keptPlacements);
        target = firstFreeCell(occ, state.grid, state.viewIndex) ?? {
          pageIndex: state.viewIndex,
          row: 0,
          col: 0,
        };
      }
      const folderPlacement: GridCellPlacement = {
        id: `placement-${folderId}`,
        pageIndex: target.pageIndex,
        row: target.row,
        col: target.col,
        rowSpan: 1,
        colSpan: 1,
        itemType: 'folder',
        itemId: folderId,
      };
      const normalized = normalizePages([...keptPlacements, folderPlacement]);
      return {
        ...state,
        folders: [...state.folders, newFolder],
        placements: normalized.placements,
        isBatchCreatorOpen: false,
        lastNotice: `Cartella '${newFolder.name}' creata`,
      };
    }

    case 'MERGE_INTO_FOLDER': {
      const source = state.placements.find((p) => p.id === action.sourcePlacementId);
      const target = state.placements.find((p) => p.id === action.targetPlacementId);
      if (!source || !target || source.id === target.id) return state;

      // Se il target è già una cartella
      if (target.itemType === 'folder') {
        const folder = state.folders.find((f) => f.id === target.itemId);
        if (!folder) return state;
        if (source.itemType === 'app') {
          const nextFolders = state.folders.map((f) =>
            f.id === folder.id
              ? { ...f, appIds: Array.from(new Set([...f.appIds, source.itemId])) }
              : f,
          );
          const nextPlacements = state.placements.filter((p) => p.id !== source.id);
          return {
            ...state,
            folders: nextFolders,
            placements: normalizePages(nextPlacements).placements,
            lastNotice: `Aggiunta a '${folder.name}'`,
          };
        }
        return state;
      }

      // Se entrambi sono app, creiamo una nuova cartella
      if (source.itemType === 'app' && target.itemType === 'app') {
        const appA = state.apps.find((a) => a.id === target.itemId);
        const appB = state.apps.find((a) => a.id === source.itemId);
        const folderId = `folder-${Date.now()}`;

        let folderName = 'Nuova Cartella';
        if (appA && appB && appA.category === appB.category && appA.category !== 'other') {
          const catMap: Record<string, string> = {
            productivity: 'Produttività',
            development: 'Sviluppo',
            games: 'Giochi',
            media: 'Media',
            utilities: 'Utility',
          };
          folderName = catMap[appA.category] ?? 'Nuova Cartella';
        }

        const newFolder: FolderItem = {
          id: folderId,
          name: folderName,
          appIds: [target.itemId, source.itemId],
          finderShortcuts: [],
          style: { type: 'default' },
        };

        const nextPlacements = state.placements
          .filter((p) => p.id !== source.id)
          .map((p) =>
            p.id === target.id ? { ...p, itemType: 'folder' as const, itemId: folderId } : p,
          );

        return {
          ...state,
          folders: [...state.folders, newFolder],
          placements: normalizePages(nextPlacements).placements,
          lastNotice: `Cartella '${folderName}' creata`,
        };
      }

      return state;
    }

    case 'ADD_APP_TO_FOLDER': {
      const folder = state.folders.find((f) => f.id === action.folderId);
      if (!folder) return state;
      const nextFolders = state.folders.map((f) =>
        f.id === action.folderId
          ? { ...f, appIds: Array.from(new Set([...f.appIds, action.appId])) }
          : f,
      );
      const nextPlacements = action.sourcePlacementId
        ? state.placements.filter((p) => p.id !== action.sourcePlacementId)
        : state.placements;
      return {
        ...state,
        folders: nextFolders,
        placements: normalizePages(nextPlacements).placements,
        lastNotice: `Aggiunta a '${folder.name}'`,
      };
    }

    case 'REMOVE_APP_FROM_FOLDER': {
      const folder = state.folders.find((f) => f.id === action.folderId);
      if (!folder) return state;
      const nextFolders = state.folders.map((f) =>
        f.id === action.folderId ? { ...f, appIds: f.appIds.filter((id) => id !== action.appId) } : f,
      );
      const placed = autoPlace(state.placements, [action.appId], state.grid);
      return {
        ...state,
        folders: nextFolders,
        placements: placed.placements,
        lastNotice: 'Elemento rimosso dalla cartella',
      };
    }

    case 'DELETE_FOLDER': {
      const folder = state.folders.find((f) => f.id === action.folderId);
      if (!folder) return state;
      const nextFolders = state.folders.filter((f) => f.id !== action.folderId);
      const keptPlacements = state.placements.filter(
        (p) => !(p.itemType === 'folder' && p.itemId === action.folderId),
      );
      const hiddenSet = new Set(state.hiddenAppIds);
      const appsToRestore = folder.appIds.filter((id) => !hiddenSet.has(id));
      const placed = autoPlace(keptPlacements, appsToRestore, state.grid);
      return {
        ...state,
        folders: nextFolders,
        placements: placed.placements,
        openFolderId: state.openFolderId === action.folderId ? null : state.openFolderId,
        lastNotice: `Cartella '${folder.name}' eliminata`,
      };
    }

    case 'UPDATE_FOLDER': {
      const nextFolders = state.folders.map((f) => {
        if (f.id !== action.folderId) return f;
        return {
          ...f,
          name: action.name !== undefined ? action.name.trim() || f.name : f.name,
          style: action.style !== undefined ? action.style : f.style,
        };
      });
      return { ...state, folders: nextFolders, lastNotice: 'Cartella aggiornata' };
    }

    case 'ADD_FINDER_SHORTCUT': {
      const nextFolders = state.folders.map((f) => {
        if (f.id !== action.folderId) return f;
        return {
          ...f,
          finderShortcuts: [...f.finderShortcuts, action.shortcut],
        };
      });
      return {
        ...state,
        folders: nextFolders,
        lastNotice: `Collegamento '${action.shortcut.name}' aggiunto`,
      };
    }

    case 'REMOVE_FINDER_SHORTCUT': {
      const nextFolders = state.folders.map((f) => {
        if (f.id !== action.folderId) return f;
        return {
          ...f,
          finderShortcuts: f.finderShortcuts.filter((sc) => sc.id !== action.shortcutId),
        };
      });
      return { ...state, folders: nextFolders, lastNotice: 'Collegamento rimosso' };
    }

    case 'SET_THEME_MODAL_OPEN':
      return { ...state, isThemeModalOpen: action.open };

    case 'UPDATE_THEME':
      return {
        ...state,
        theme: {
          ...state.theme,
          ...action.patch,
          // Se viene aggiornato il wallpaper parzialmente, fa merge
          wallpaper: action.patch.wallpaper
            ? { ...state.theme.wallpaper, ...action.patch.wallpaper }
            : state.theme.wallpaper,
        },
        lastNotice: 'Tema aggiornato',
      };

    case 'OPEN_APP_CUSTOMIZER':
      return { ...state, customizingAppId: action.appId };

    case 'CLOSE_APP_CUSTOMIZER':
      return { ...state, customizingAppId: null };

    case 'SET_APP_CUSTOM_ICON': {
      const nextApps = state.apps.map((a) => {
        if (a.id !== action.appId) return a;
        return {
          ...a,
          customIconPath: action.customIconPath,
          removeIconBg: action.removeIconBg,
        };
      });
      return {
        ...state,
        apps: nextApps,
        customizingAppId: null,
        iconRevision: state.iconRevision + 1,
        lastNotice: 'Icona personalizzata salvata',
      };
    }

    default: {
      const unreachable: never = action;
      console.error('[LauncherState] azione sconosciuta:', unreachable);
      return state;
    }
  }
}

const LauncherStateContext = createContext<LauncherState | null>(null);
const LauncherDispatchContext = createContext<Dispatch<LauncherAction> | null>(null);

export const LauncherStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(launcherReducer, initialState);
  const hydratedRef = useRef(false);

  // 1. Hydrate on initial mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const res = loadLayout();
    if (res.status === 'ok' && res.data) {
      dispatch({ type: 'HYDRATE', data: res.data });
    } else if (res.status === 'corrupt') {
      console.warn('[LauncherState] Layout corrotto, fallback ai default');
      dispatch({ type: 'HYDRATE', data: defaultPersisted() });
    }
  }, []);

  // 2. Persist with debounce
  useEffect(() => {
    if (!hydratedRef.current) return;
    const timer = setTimeout(() => {
      // Aggiorna lo snapshot dello spazio attivo prima di persistere
      const updatedSpaces = state.spaces.map((sp) => {
        if (sp.id === state.activeSpaceId) {
          return {
            ...sp,
            placements: state.placements,
            folders: state.folders,
            workflows: state.workflows,
            widgets: state.widgets,
            themeWallpaper: state.theme,
          };
        }
        return sp;
      });

      const payload: PersistedLauncherV1 = {
        version: 1,
        placements: state.placements,
        grid: state.grid,
        hiddenAppIds: state.hiddenAppIds,
        launchHistory: state.launchHistory,
        folders: state.folders,
        workflows: state.workflows,
        widgets: state.widgets,
        spaces: updatedSpaces,
        activeSpaceId: state.activeSpaceId,
        theme: state.theme,
      };
      const res = saveLayout(payload);
      if (!res.ok && res.error) {
        console.error('[LauncherState] Errore salvataggio:', res.error);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [
    state.placements,
    state.grid,
    state.hiddenAppIds,
    state.launchHistory,
    state.folders,
    state.workflows,
    state.widgets,
    state.spaces,
    state.activeSpaceId,
    state.theme,
  ]);

  // 3. Micro-daemon Schedule Cron (controllo ogni 15 secondi per auto-switch dello Space)
  const lastScheduledTriggerRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydratedRef.current) return;

    const checkSchedule = () => {
      const now = new Date();
      const currentHHmm = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      for (const space of state.spaces) {
        if (
          space.scheduleTime &&
          space.scheduleTime === currentHHmm &&
          space.id !== state.activeSpaceId
        ) {
          const triggerKey = `${space.id}@${currentHHmm}`;
          if (lastScheduledTriggerRef.current !== triggerKey) {
            lastScheduledTriggerRef.current = triggerKey;
            console.info(
              `[LauncherState] Auto-switch programmato allo spazio "${space.name}" (${currentHHmm})`,
            );
            dispatch({ type: 'SWITCH_SPACE', spaceId: space.id });
          }
          break;
        }
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 15000);

    return () => clearInterval(interval);
  }, [state.spaces, state.activeSpaceId]);

  // 4. Inizializzazione metriche Notch hardware e ascolto resize
  useEffect(() => {
    let mounted = true;
    const fetchMetrics = () => {
      getNotchMetrics()
        .then((metrics) => {
          if (mounted) {
            dispatch({ type: 'SET_NOTCH_METRICS', metrics });
          }
        })
        .catch((err) => {
          console.error('[LauncherState] Errore caricamento metriche notch:', err);
        });
    };

    fetchMetrics();
    window.addEventListener('resize', fetchMetrics);
    return () => {
      mounted = false;
      window.removeEventListener('resize', fetchMetrics);
    };
  }, []);

  return (
    <LauncherStateContext.Provider value={state}>
      <LauncherDispatchContext.Provider value={dispatch}>
        {children}
      </LauncherDispatchContext.Provider>
    </LauncherStateContext.Provider>
  );
};

export function useLauncherState(): LauncherState {
  const ctx = useContext(LauncherStateContext);
  if (ctx === null) {
    throw new Error('useLauncherState deve essere usato dentro <LauncherStateProvider>');
  }
  return ctx;
}

export function useLauncherDispatch(): Dispatch<LauncherAction> {
  const ctx = useContext(LauncherDispatchContext);
  if (ctx === null) {
    throw new Error('useLauncherDispatch deve essere usato dentro <LauncherStateProvider>');
  }
  return ctx;
}

// ───────────────────── Selettori derivati memoizzati ─────────────────────

export function useVisibleApps(): AppItem[] {
  const { apps, hiddenAppIds } = useLauncherState();
  return useMemo(() => {
    const hiddenSet = new Set(hiddenAppIds);
    return apps.filter((a) => !hiddenSet.has(a.id));
  }, [apps, hiddenAppIds]);
}

export function useCategoryBuckets(): Record<CategoryCardId, AppItem[]> {
  const { apps, hiddenAppIds, launchHistory } = useLauncherState();

  return useMemo(() => {
    const hiddenSet = new Set(hiddenAppIds);
    const recent = [...apps]
      .filter((a) => launchHistory[a.id] !== undefined)
      .sort((a, b) => (launchHistory[b.id] ?? 0) - (launchHistory[a.id] ?? 0))
      .slice(0, 16);

    const hidden = apps.filter((a) => hiddenSet.has(a.id));

    const buckets: Record<CategoryCardId, AppItem[]> = {
      recent,
      hidden,
      productivity: [],
      development: [],
      games: [],
      media: [],
      utilities: [],
    };

    for (const app of apps) {
      if (hiddenSet.has(app.id)) continue;
      if (app.category !== 'other' && app.category in buckets) {
        buckets[app.category as CategoryCardId].push(app);
      }
    }

    return buckets;
  }, [apps, hiddenAppIds, launchHistory]);
}
