import { memo, useCallback, useEffect, useState, type FC } from 'react';
import type { MediaTrackInfo, MusicWidgetStyle, WidgetConfig, WidgetSize } from '~types';
import { useVisibilityPause } from '@/context/VisibilityPauseContext';
import {
  getMediaStatus,
  mediaNextTrack,
  mediaPlayPause,
  mediaPreviousTrack,
} from '@/services/tauriBridge';
import { MinimalMusicWidget } from './music/MinimalMusicWidget';
import { FullCoverMusicWidget } from './music/FullCoverMusicWidget';
import { VinylMusicWidget } from './music/VinylMusicWidget';

interface MusicWidgetProps {
  widget: WidgetConfig;
  size?: WidgetSize;
  onUpdateWidget?: (patch: Partial<WidgetConfig>) => void;
}

export const MusicWidget: FC<MusicWidgetProps> = memo(({ widget, size = widget.size }) => {
  const { isAnimationPaused } = useVisibilityPause();
  const [track, setTrack] = useState<MediaTrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const style: MusicWidgetStyle =
    (widget.settings?.style as MusicWidgetStyle) || 'minimal';

  const fetchStatus = useCallback(async () => {
    try {
      const status = await getMediaStatus();
      if (status) {
        setTrack(status);
        setIsPlaying(status.state === 'playing');
      }
    } catch (err) {
      console.warn('[MusicWidget] Errore recupero stato multimediale:', err);
    }
  }, []);

  useEffect(() => {
    if (isAnimationPaused) return;

    void fetchStatus();
    const interval = window.setInterval(() => {
      void fetchStatus();
    }, 2500);

    return () => window.clearInterval(interval);
  }, [isAnimationPaused, fetchStatus]);

  const handlePlayPause = useCallback(async () => {
    try {
      await mediaPlayPause();
      setIsPlaying((prev) => !prev);
      window.setTimeout(() => {
        void fetchStatus();
      }, 300);
    } catch (err) {
      console.error('[MusicWidget] Play/Pause fallito:', err);
    }
  }, [fetchStatus]);

  const handleNext = useCallback(async () => {
    try {
      await mediaNextTrack();
      window.setTimeout(() => {
        void fetchStatus();
      }, 400);
    } catch (err) {
      console.error('[MusicWidget] Next fallito:', err);
    }
  }, [fetchStatus]);

  const handlePrevious = useCallback(async () => {
    try {
      await mediaPreviousTrack();
      window.setTimeout(() => {
        void fetchStatus();
      }, 400);
    } catch (err) {
      console.error('[MusicWidget] Previous fallito:', err);
    }
  }, [fetchStatus]);

  if (style === 'vinyl') {
    return (
      <VinylMusicWidget
        track={track}
        isPlaying={isPlaying}
        size={size}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    );
  }

  if (style === 'full_cover') {
    return (
      <FullCoverMusicWidget
        track={track}
        isPlaying={isPlaying}
        size={size}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    );
  }

  return (
    <MinimalMusicWidget
      track={track}
      isPlaying={isPlaying}
      size={size}
      onPlayPause={handlePlayPause}
      onNext={handleNext}
      onPrevious={handlePrevious}
    />
  );
});

MusicWidget.displayName = 'MusicWidget';
export default MusicWidget;
