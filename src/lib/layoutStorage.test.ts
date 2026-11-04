import { beforeEach, describe, expect, it } from 'vitest';
import {
  defaultPersisted,
  loadLayout,
  saveLayout,
  STORAGE_KEY,
  validatePersisted,
} from './layoutStorage';
import { DEFAULT_THEME_WALLPAPER, type PersistedLauncherV1 } from '~types';

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

describe('layoutStorage', () => {
  beforeEach(() => {
    const mock = new MockStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: mock,
      writable: true,
      configurable: true,
    });
  });

  it('validates default persisted structure', () => {
    const def = defaultPersisted();
    expect(validatePersisted(def)).toBe(true);
  });

  it('rejects invalid or future version structures', () => {
    expect(validatePersisted({ version: 2 })).toBe(false);
    expect(validatePersisted(null)).toBe(false);
    expect(validatePersisted({ version: 1, placements: 'not-array' })).toBe(false);
  });

  it('saves and loads layout accurately', () => {
    const def: PersistedLauncherV1 = {
      ...defaultPersisted(),
      hiddenAppIds: ['com.apple.Terminal'],
      launchHistory: { 'com.apple.Safari': 123456789 },
    };

    const saveRes = saveLayout(def);
    expect(saveRes.ok).toBe(true);

    const loadRes = loadLayout();
    expect(loadRes.status).toBe('ok');
    expect(loadRes.data).toEqual(def);
  });

  it('handles corrupt JSON gracefully by preserving backup', () => {
    localStorage.setItem(STORAGE_KEY, '{ invalid json');
    const loadRes = loadLayout();
    expect(loadRes.status).toBe('corrupt');

    let backupKey: string | undefined;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${STORAGE_KEY}.corrupt-`)) {
        backupKey = k;
        break;
      }
    }
    expect(backupKey).toBeDefined();
    expect(localStorage.getItem(backupKey!)).toBe('{ invalid json');
  });

  it('validates and preserves folders with shortcuts', () => {
    const withFolders: PersistedLauncherV1 = {
      ...defaultPersisted(),
      folders: [
        {
          id: 'folder-1',
          name: 'Sviluppo & File',
          appIds: ['com.apple.Terminal', 'com.visualstudio.code'],
          finderShortcuts: [
            {
              id: 'sc-1',
              name: 'Desktop',
              finderPath: '~/Desktop',
              customStyle: { type: 'default' },
            },
          ],
          style: { type: 'color', colorHex: '#007AFF' },
        },
      ],
    };

    expect(validatePersisted(withFolders)).toBe(true);
    const saveRes = saveLayout(withFolders);
    expect(saveRes.ok).toBe(true);

    const loadRes = loadLayout();
    expect(loadRes.status).toBe('ok');
    const loadedFolders = loadRes.data?.folders;
    expect(loadedFolders).toBeDefined();
    expect(loadedFolders).toHaveLength(1);
    const firstFolder = loadedFolders?.[0];
    expect(firstFolder).toBeDefined();
    if (firstFolder) {
      expect(firstFolder.name).toBe('Sviluppo & File');
      expect(firstFolder.finderShortcuts[0]?.finderPath).toBe('~/Desktop');
    }
  });

  it('validates and preserves advanced theme and wallpaper settings', () => {
    const withTheme: PersistedLauncherV1 = {
      ...defaultPersisted(),
      theme: {
        ...defaultPersisted().theme,
        uiTheme: 'liquid_glass',
        glassMode: 'tinted',
        glassTintColorHex: '#FF9500',
        iconAppearance: 'clear_colored',
        disableGlassOnIconsForGpu: true,
        wallpaper: {
          type: 'live_video',
          filePath: '/Users/test/wallpaper.mp4',
          blurIntensity: 45,
        },
      },
    };

    expect(validatePersisted(withTheme)).toBe(true);
    const saveRes = saveLayout(withTheme);
    expect(saveRes.ok).toBe(true);

    const loadRes = loadLayout();
    expect(loadRes.status).toBe('ok');
    expect(loadRes.data?.theme.glassMode).toBe('tinted');
    expect(loadRes.data?.theme.glassTintColorHex).toBe('#FF9500');
    expect(loadRes.data?.theme.iconAppearance).toBe('clear_colored');
    expect(loadRes.data?.theme.disableGlassOnIconsForGpu).toBe(true);
    expect(loadRes.data?.theme.wallpaper?.type).toBe('live_video');
    expect(loadRes.data?.theme.wallpaper?.blurIntensity).toBe(45);
  });

  it('validates and preserves spaces and workflows (Step 4A)', () => {
    const withSpacesAndWorkflows: PersistedLauncherV1 = {
      ...defaultPersisted(),
      activeSpaceId: 'space-work',
      workflows: [
        {
          id: 'wf-1',
          name: 'Sessione Coding',
          iconStyle: { type: 'color', colorHex: '#8B5CF6', emoji: '⚡' },
          targetAppPaths: ['/Applications/Visual Studio Code.app', '/Applications/iTerm.app'],
          targetFinderPaths: ['/Users/test/Projects/LaunchMeClone'],
        },
      ],
      spaces: [
        {
          id: 'space-default',
          name: 'Predefinito',
          hotkey: 'CommandOrControl+1',
          placements: [],
          folders: [],
          workflows: [],
          widgets: [],
          themeWallpaper: DEFAULT_THEME_WALLPAPER,
          notchConfig: {
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
          },
        },
        {
          id: 'space-work',
          name: 'Lavoro',
          hotkey: 'CommandOrControl+2',
          scheduleTime: '09:00',
          placements: [],
          folders: [],
          workflows: [
            {
              id: 'wf-1',
              name: 'Sessione Coding',
              iconStyle: { type: 'color', colorHex: '#8B5CF6', emoji: '⚡' },
              targetAppPaths: ['/Applications/Visual Studio Code.app', '/Applications/iTerm.app'],
              targetFinderPaths: ['/Users/test/Projects/LaunchMeClone'],
            },
          ],
          widgets: [],
          themeWallpaper: DEFAULT_THEME_WALLPAPER,
          notchConfig: {
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
          },
        },
      ],
    };

    expect(validatePersisted(withSpacesAndWorkflows)).toBe(true);
    const saveRes = saveLayout(withSpacesAndWorkflows);
    expect(saveRes.ok).toBe(true);

    const loadRes = loadLayout();
    expect(loadRes.status).toBe('ok');
    expect(loadRes.data?.activeSpaceId).toBe('space-work');
    expect(loadRes.data?.workflows).toHaveLength(1);
    expect(loadRes.data?.workflows?.[0]?.name).toBe('Sessione Coding');
    expect(loadRes.data?.spaces).toHaveLength(2);
    expect(loadRes.data?.spaces?.[1]?.scheduleTime).toBe('09:00');
  });

  it('persists and validates widgets correctly', () => {
    const withWidgets: PersistedLauncherV1 = {
      ...defaultPersisted(),
      widgets: [
        {
          id: 'widget-music-1',
          type: 'music',
          size: '2x1',
          settings: { style: 'vinyl' },
        },
        {
          id: 'widget-weather-1',
          type: 'weather',
          size: '2x2',
          settings: { style: 'panel', cityName: 'Bari, Italia' },
        },
        {
          id: 'widget-hardware-1',
          type: 'hardware',
          size: '2x1',
          settings: { style: 'gauges' },
        },
        {
          id: 'widget-clock-1',
          type: 'clock',
          size: '1x1',
          settings: { style: 'analog' },
        },
        {
          id: 'widget-calendar-1',
          type: 'calendar',
          size: '2x2',
          settings: { style: 'month' },
        },
      ],
      placements: [
        {
          id: 'placement-w1',
          pageIndex: 0,
          row: 0,
          col: 0,
          rowSpan: 1,
          colSpan: 2,
          itemType: 'widget',
          itemId: 'widget-music-1',
        },
        {
          id: 'placement-w2',
          pageIndex: 0,
          row: 1,
          col: 0,
          rowSpan: 2,
          colSpan: 2,
          itemType: 'widget',
          itemId: 'widget-weather-1',
        },
      ],
    };

    expect(validatePersisted(withWidgets)).toBe(true);
    const saveRes = saveLayout(withWidgets);
    expect(saveRes.ok).toBe(true);

    const loadRes = loadLayout();
    expect(loadRes.status).toBe('ok');
    expect(loadRes.data?.widgets).toHaveLength(5);
    expect(loadRes.data?.widgets?.[0]?.type).toBe('music');
    expect(loadRes.data?.widgets?.[0]?.settings.style).toBe('vinyl');
    expect(loadRes.data?.widgets?.[1]?.type).toBe('weather');
    expect(loadRes.data?.widgets?.[2]?.type).toBe('hardware');
    expect(loadRes.data?.widgets?.[3]?.type).toBe('clock');
    expect(loadRes.data?.widgets?.[4]?.type).toBe('calendar');
  });

  it('returns empty when no data present', () => {
    const loadRes = loadLayout();
    expect(loadRes.status).toBe('empty');
  });
});

