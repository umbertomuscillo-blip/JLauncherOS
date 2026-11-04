import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Info,
  Layers,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Trash2,
  Zap,
} from 'lucide-react';
import { useLauncherState } from '@/context/LauncherStateContext';
import { useVisibilityPause } from '@/context/VisibilityPauseContext';
import {
  getMediaStatus,
  mediaNextTrack,
  mediaPlayPause,
  mediaPreviousTrack,
} from '@/services/tauriBridge';
import type { MediaTrackInfo, NotchMetrics } from '~types';

export type NotchVisualState = 'alert' | 'media-expanded' | 'media' | 'idle';

/**
 * Calcola le dimensioni e il raggio di curvatura del Notch in base allo stato interattivo
 * e alle caratteristiche fisiche dello schermo rilevate da Cocoa.
 */
export function computeNotchDimensions(
  visualState: NotchVisualState,
  notchMetrics: NotchMetrics,
) {
  const hasNotch = notchMetrics.hasNotch;
  switch (visualState) {
    case 'alert':
      return {
        width: 360,
        height: Math.max(notchMetrics.notchHeight, 44),
        borderRadius: 24,
      };
    case 'media-expanded':
      return {
        width: 440,
        height: 104,
        borderRadius: 28,
      };
    case 'media':
      return {
        width: 390,
        height: Math.max(notchMetrics.notchHeight, 48),
        borderRadius: 24,
      };
    case 'idle':
    default:
      return {
        width: hasNotch ? notchMetrics.notchWidth : 180,
        height: hasNotch ? notchMetrics.notchHeight : 32,
        borderRadius: hasNotch ? 16 : 24,
      };
  }
}

/**
 * Determina se un punto (cursore mouse) si trova all'interno della zona cieca del Notch.
 */
export function isPointerInNotchZone(
  pointerX: number,
  pointerY: number,
  screenWidth: number,
  metrics: NotchMetrics,
): boolean {
  const screenCenterX = screenWidth / 2;
  const notchHalfWidth = (metrics.hasNotch ? metrics.notchWidth : 180) / 2 + 16;
  const notchMaxY = metrics.hasNotch ? metrics.notchHeight + 24 : 48;
  return pointerY <= notchMaxY && Math.abs(pointerX - screenCenterX) <= notchHalfWidth;
}

export const DynamicNotchOverlay: React.FC = () => {
  const { notchMetrics, lastNotice } = useLauncherState();
  const { isAnimationPaused, isLauncherVisible } = useVisibilityPause();

  const [mediaInfo, setMediaInfo] = useState<MediaTrackInfo | null>(null);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [isMediaExpanded, setIsMediaExpanded] = useState(false);

  const alertTimerRef = useRef<number | null>(null);

  // 1. Gestione Action Alert da lastNotice (auto-dismiss dopo 3.5s)
  useEffect(() => {
    if (lastNotice) {
      setActiveAlert(lastNotice);
      if (alertTimerRef.current !== null) {
        window.clearTimeout(alertTimerRef.current);
      }
      alertTimerRef.current = window.setTimeout(() => {
        setActiveAlert(null);
        alertTimerRef.current = null;
      }, 3500);
    }
  }, [lastNotice]);

  // 2. Polling Media nativo: attivo SOLO se il launcher è visibile e le animazioni non sono in pausa (0% CPU)
  useEffect(() => {
    if (!isLauncherVisible || isAnimationPaused) return;

    let isMounted = true;
    const fetchMedia = async () => {
      try {
        const status = await getMediaStatus();
        if (isMounted) {
          setMediaInfo(status);
        }
      } catch (err) {
        console.warn('[DynamicNotch] Lettura media fallita:', err);
      }
    };

    void fetchMedia();
    const interval = window.setInterval(fetchMedia, 2500);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [isLauncherVisible, isAnimationPaused]);

  // Handler controlli multimediali
  const handleTogglePlay = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await mediaPlayPause();
    const updated = await getMediaStatus();
    setMediaInfo(updated);
  }, []);

  const handleNext = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await mediaNextTrack();
    const updated = await getMediaStatus();
    setMediaInfo(updated);
  }, []);

  const handlePrev = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await mediaPreviousTrack();
    const updated = await getMediaStatus();
    setMediaInfo(updated);
  }, []);

  const hasNotch = notchMetrics.hasNotch;
  const isPlaying = mediaInfo?.state === 'playing';
  const hasTrack = Boolean(mediaInfo?.title);

  // Selezione icona per gli alert
  const getAlertIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('disinstallat') || lower.includes('cestin')) {
      return <Trash2 size={15} className="text-red-400 shrink-0" />;
    }
    if (lower.includes('spazio') || lower.includes('space')) {
      return <Layers size={15} className="text-purple-400 shrink-0" />;
    }
    if (lower.includes('workflow')) {
      return <Zap size={15} className="text-amber-400 shrink-0" />;
    }
    if (lower.includes('salvat') || lower.includes('applicat') || lower.includes('copiat')) {
      return <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />;
    }
    return <Info size={15} className="text-blue-400 shrink-0" />;
  };

  // Determinazione stato visivo corrente
  type NotchVisualState = 'alert' | 'media-expanded' | 'media' | 'idle';
  let visualState: NotchVisualState = 'idle';

  if (activeAlert) {
    visualState = 'alert';
  } else if (isMediaExpanded && isPlaying && hasTrack) {
    visualState = 'media-expanded';
  } else if (isPlaying && hasTrack) {
    visualState = 'media';
  } else {
    visualState = 'idle';
  }

  const dim = computeNotchDimensions(visualState, notchMetrics);

  // Fisica Apple-grade a molla richiesta
  const springTransition = {
    type: 'spring' as const,
    stiffness: 350,
    damping: 25,
    mass: 1.2,
  };

  return (
    <div
      className={`fixed top-0 left-1/2 -translate-x-1/2 z-50 flex items-start justify-center pointer-events-auto select-none ${
        !hasNotch ? 'pt-2' : ''
      }`}
    >
      <motion.div
        layout
        initial={false}
        animate={{
          width: dim.width,
          height: dim.height,
          borderRadius: dim.borderRadius,
        }}
        style={{
          overflow: 'hidden',
        }}
        transition={springTransition}
        onClick={() => {
          if (visualState === 'media') {
            setIsMediaExpanded(true);
          } else if (visualState === 'media-expanded') {
            setIsMediaExpanded(false);
          }
        }}
        className={`relative flex items-center justify-between overflow-hidden shadow-2xl transition-colors duration-200 cursor-pointer ${
          hasNotch
            ? 'bg-black text-white'
            : 'bg-black/90 text-white backdrop-blur-2xl border border-white/10 shadow-black/80'
        }`}
        title={
          visualState === 'media'
            ? 'Fai clic per aprire i controlli multimediali'
            : visualState === 'media-expanded'
              ? 'Fai clic per comprimere'
              : undefined
        }
      >
        <AnimatePresence mode="wait">
          {/* STATO 1: ACTION ALERT (DROP-DOWN BANNER) */}
          {visualState === 'alert' && activeAlert && (
            <motion.div
              key="alert"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5 px-4 w-full h-full text-xs font-medium text-white/95"
            >
              {getAlertIcon(activeAlert)}
              <span className="truncate flex-1 tracking-tight">{activeAlert}</span>
            </motion.div>
          )}

          {/* STATO 2: MEDIA COMPACT */}
          {visualState === 'media' && mediaInfo && (
            <motion.div
              key="media-compact"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between w-full h-full px-3.5 gap-3"
            >
              {/* Sinistra: Copertina / Icona + Titolo */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {mediaInfo.artworkUrl ? (
                  <img
                    src={mediaInfo.artworkUrl}
                    alt={mediaInfo.title}
                    className="w-6 h-6 rounded-md object-cover border border-white/20 shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Music size={12} className="text-white" />
                  </div>
                )}
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="text-xs font-semibold text-white/95 truncate">
                    {mediaInfo.title}
                  </span>
                  <span className="text-[10px] text-white/60 truncate">
                    {mediaInfo.artist || 'In riproduzione'}
                  </span>
                </div>
              </div>

              {/* Destra: Equalizzatore Audio animato a 4 barre (0% CPU se isAnimationPaused) */}
              <div className="flex items-end gap-1 h-3.5 shrink-0 px-1" aria-hidden="true">
                {[
                  { id: 'b1', h: [4, 14, 6, 12, 4], dur: 0.65 },
                  { id: 'b2', h: [8, 4, 14, 6, 8], dur: 0.55 },
                  { id: 'b3', h: [6, 14, 8, 4, 6], dur: 0.75 },
                  { id: 'b4', h: [12, 6, 4, 14, 12], dur: 0.6 },
                ].map((bar) => (
                  <motion.span
                    key={bar.id}
                    animate={
                      isAnimationPaused
                        ? { height: 6 }
                        : { height: bar.h }
                    }
                    transition={
                      isAnimationPaused
                        ? { duration: 0 }
                        : {
                            repeat: Infinity,
                            duration: bar.dur,
                            ease: 'easeInOut',
                          }
                    }
                    className="w-[2.5px] rounded-full bg-emerald-400"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* STATO 3: MEDIA EXPANDED (CONTROLLI COMPLETI) */}
          {visualState === 'media-expanded' && mediaInfo && (
            <motion.div
              key="media-expanded"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col justify-between w-full h-full px-4 pt-3 pb-3 gap-2"
            >
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {mediaInfo.artworkUrl ? (
                    <img
                      src={mediaInfo.artworkUrl}
                      alt={mediaInfo.title}
                      className="w-10 h-10 rounded-lg object-cover border border-white/20 shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                      <Music size={18} className="text-white" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate leading-tight">
                      {mediaInfo.title}
                    </span>
                    <span className="text-[11px] text-white/60 truncate leading-tight">
                      {mediaInfo.artist}
                    </span>
                  </div>
                </div>

                {/* Badge Player */}
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/15 shrink-0">
                  {mediaInfo.player}
                </span>
              </div>

              {/* Riga Controlli Play / Next / Prev */}
              <div className="flex items-center justify-center gap-6 w-full pb-0.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Traccia precedente"
                >
                  <SkipBack size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
                  title={isPlaying ? 'Pausa' : 'Riproduci'}
                >
                  {isPlaying ? <Pause size={15} fill="black" /> : <Play size={15} fill="black" className="ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Traccia successiva"
                >
                  <SkipForward size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STATO 4: IDLE */}
          {visualState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center w-full h-full text-white/40"
            >
              {!hasNotch && (
                <div className="flex items-center gap-2 px-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
                  <span className="text-[11px] font-medium tracking-wider text-white/70">
                    LaunchMe
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DynamicNotchOverlay;
