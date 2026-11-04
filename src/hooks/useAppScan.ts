import { useEffect, useRef } from 'react';
import { isTauriRuntime, onIconsProgress, prefetchAppIcons, scanApps } from '@/services/tauriBridge';
import { useLauncherDispatch, useLauncherState } from '@/context/LauncherStateContext';
import { MOCK_APPS } from '@/dev/mockApps';

const RESCAN_INTERVAL_MS = 30_000;

export function useAppScan(isLauncherVisible: boolean): void {
  const dispatch = useLauncherDispatch();
  const { scanStatus, lastScanAt, settings } = useLauncherState();
  const runningRef = useRef(false);

  const runScan = async (): Promise<void> => {
    if (runningRef.current) return;
    runningRef.current = true;
    dispatch({ type: 'SCAN_STARTED' });

    try {
      if (!isTauriRuntime()) {
        console.warn('[useAppScan] Ambiente mock browser: carico app fittizie');
        dispatch({ type: 'APPS_LOADED', scanned: MOCK_APPS });
        return;
      }

      const result = await scanApps(settings.extraAppSources);
      dispatch({ type: 'APPS_LOADED', scanned: result.apps });

      // Avvia prefetch icone in background per le app che non hanno l'icona pronta
      const missing = result.apps
        .filter((a) => !a.iconReady)
        .map((a) => ({ id: a.id, path: a.path }));

      if (missing.length > 0) {
        prefetchAppIcons(missing)
          .then(() => {
            dispatch({ type: 'ICONS_REFRESHED' });
          })
          .catch((err: unknown) => {
            console.error('[useAppScan] Errore prefetch icone:', err);
          });
      }
    } catch (err) {
      const errStr = err instanceof Error ? err.message : String(err);
      console.error('[useAppScan] Errore durante scanApps:', err);
      dispatch({ type: 'SCAN_FAILED', error: errStr });
    } finally {
      runningRef.current = false;
    }
  };

  // 1. Initial scan on mount
  useEffect(() => {
    if (scanStatus === 'idle') {
      void runScan();
    }
  }, [scanStatus]);

  // 2. Re-scan on launcher open if >30s passed
  useEffect(() => {
    if (!isLauncherVisible) return;
    const now = Date.now();
    if (lastScanAt && now - lastScanAt > RESCAN_INTERVAL_MS) {
      void runScan();
    }
  }, [isLauncherVisible, lastScanAt]);

  // 3. Listen to icon progress events
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let cancelled = false;

    onIconsProgress(() => {
      dispatch({ type: 'ICONS_REFRESHED' });
    })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch((err: unknown) => {
        console.error('[useAppScan] Impossibile ascoltare progresso icone:', err);
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [dispatch]);
}
