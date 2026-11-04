import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
  type RefObject,
} from 'react';
import * as tauriBridge from '@/services/tauriBridge';

export interface VisibilityPauseValue {
  isLauncherVisible: boolean;
  /** True quando il launcher è nascosto o il documento è in background: animazioni, video e canvas devono fermarsi. */
  isAnimationPaused: boolean;
}

const VisibilityPauseContext = createContext<VisibilityPauseValue | null>(null);

const PAUSED_CLASS = 'launcher-paused';

export const VisibilityPauseProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Nel runtime Tauri il launcher parte nascosto; in browser (vite dev) lo mostriamo per sviluppare la UI.
  const [isLauncherVisible, setIsLauncherVisible] = useState<boolean>(!tauriBridge.isTauriRuntime());
  const [isDocumentHidden, setIsDocumentHidden] = useState<boolean>(document.hidden);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let cancelled = false;
    tauriBridge
      .onLauncherVisibility(setIsLauncherVisible)
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch((err: unknown) => {
        console.error('[VisibilityPause] sottoscrizione evento fallita:', err);
      });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    const onVisibility = (): void => setIsDocumentHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      tauriBridge.setLauncherVisibility(false).catch((err: unknown) => {
        console.error('[VisibilityPause] chiusura con Escape fallita:', err);
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isAnimationPaused = !isLauncherVisible || isDocumentHidden;

  useEffect(() => {
    document.body.classList.toggle(PAUSED_CLASS, isAnimationPaused);
    return () => document.body.classList.remove(PAUSED_CLASS);
  }, [isAnimationPaused]);

  const value = useMemo<VisibilityPauseValue>(
    () => ({ isLauncherVisible, isAnimationPaused }),
    [isLauncherVisible, isAnimationPaused],
  );

  return <VisibilityPauseContext.Provider value={value}>{children}</VisibilityPauseContext.Provider>;
};

/** Hook per mettere in pausa video e loop Canvas (0% CPU/GPU quando nascosto). */
export function useVisibilityPause(): VisibilityPauseValue {
  const ctx = useContext(VisibilityPauseContext);
  if (ctx === null) {
    throw new Error('useVisibilityPause deve essere usato dentro <VisibilityPauseProvider>');
  }
  return ctx;
}

/** Mette in pausa/riprende un <video> in base al Pause Engine. */
export function usePausableVideo(ref: RefObject<HTMLVideoElement | null>): void {
  const { isAnimationPaused } = useVisibilityPause();
  useEffect(() => {
    const video = ref.current;
    if (video === null) return;
    if (isAnimationPaused) {
      video.pause();
      return;
    }
    video.play().catch((err: unknown) => {
      console.error('[VisibilityPause] play() video fallito:', err);
    });
  }, [isAnimationPaused, ref]);
}

/** Loop requestAnimationFrame che si cancella completamente quando il launcher è in pausa. */
export function usePausableRaf(callback: (timeMs: number) => void): void {
  const { isAnimationPaused } = useVisibilityPause();
  useEffect(() => {
    if (isAnimationPaused) return;
    let id = 0;
    const loop = (t: number): void => {
      callback(t);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [isAnimationPaused, callback]);
}
