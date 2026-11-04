import { type FC } from 'react';
import { Play, Pause, SkipBack, SkipForward, Disc } from 'lucide-react';
import type { MediaTrackInfo, WidgetSize } from '~types';
import { useVisibilityPause } from '@/context/VisibilityPauseContext';

interface VinylMusicWidgetProps {
  track: MediaTrackInfo | null;
  isPlaying: boolean;
  size?: WidgetSize;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const VinylMusicWidget: FC<VinylMusicWidgetProps> = ({
  track,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
}) => {
  const { isAnimationPaused } = useVisibilityPause();
  const shouldSpin = isPlaying && !isAnimationPaused;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-950/80 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none group">
      {/* Dynamic ambient color glow */}
      {track?.artworkUrl && (
        <div
          className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-20 blur-2xl pointer-events-none"
          style={{ backgroundImage: `url(${track.artworkUrl})`, backgroundSize: 'cover' }}
        />
      )}

      {/* Main Turntable Layout */}
      <div className="relative z-10 flex-1 flex items-center justify-around gap-2 overflow-hidden">
        {/* Turntable Platter & Vinyl Disc */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
          {/* Vinyl Record */}
          <div
            className="relative w-full h-full rounded-full bg-neutral-950 border border-neutral-800 shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-700"
            style={{
              animation: 'spin 2.2s linear infinite',
              animationPlayState: shouldSpin ? 'running' : 'paused',
              willChange: 'transform',
              transform: 'translateZ(0)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.08)',
              background:
                'repeating-radial-gradient(circle at center, #111 0px, #1c1c1c 1px, #0e0e0e 3px, #181818 4px)',
            }}
          >
            {/* Vinyl Sheen Highlight (Conic Gradient) */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none opacity-40 mix-blend-overlay"
              style={{
                background:
                  'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.25) 50deg, transparent 100deg, transparent 180deg, rgba(255,255,255,0.25) 230deg, transparent 280deg)',
              }}
            />

            {/* Center Album Art Label */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-neutral-800 shadow-md flex items-center justify-center bg-neutral-900">
              {track?.artworkUrl ? (
                <img
                  src={track.artworkUrl}
                  alt={track.album}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Disc size={20} className="text-white/60" />
              )}
              {/* Spindle hole */}
              <div className="absolute w-2 h-2 rounded-full bg-neutral-900 border border-neutral-700 shadow-inner" />
            </div>
          </div>

          {/* Tonearm (Braccio della testina) */}
          <div
            className="absolute top-1 right-1 w-6 h-18 pointer-events-none origin-top-right transition-transform duration-700 ease-out"
            style={{
              transform: shouldSpin ? 'rotate(24deg)' : 'rotate(0deg)',
            }}
          >
            {/* Pivot base */}
            <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-neutral-300 border border-neutral-400 shadow-md" />
            {/* Metal arm */}
            <div className="absolute top-2 right-1.5 w-1 h-16 bg-gradient-to-b from-neutral-300 via-neutral-400 to-neutral-200 rounded-full shadow-sm" />
            {/* Headshell / Cartridge */}
            <div className="absolute bottom-0 right-0 w-2.5 h-4 bg-amber-400 rounded-sm shadow-md" />
          </div>
        </div>

        {/* Info & Secondary details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center px-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 font-semibold flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${shouldSpin ? 'bg-amber-400 animate-ping' : 'bg-white/30'}`} />
            33 RPM • {track?.player === 'spotify' ? 'Spotify' : 'Apple Music'}
          </span>
          <h4 className="text-sm font-bold text-white truncate drop-shadow-sm mt-0.5">
            {track?.title || 'Giradischi pronto'}
          </h4>
          <p className="text-xs text-white/70 truncate">
            {track?.artist ? `${track.artist}` : 'Seleziona un album'}
          </p>
        </div>
      </div>

      {/* Playback Controls Footer */}
      <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/10 mt-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
            title="Precedente"
          >
            <SkipBack size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            className="p-2 rounded-xl bg-amber-500/80 hover:bg-amber-500 text-black shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pausa' : 'Riproduci'}
          >
            {isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" className="translate-x-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
            title="Successiva"
          >
            <SkipForward size={15} />
          </button>
        </div>

        <div className="text-[10px] text-white/40 font-mono">
          Vinyl Edition
        </div>
      </div>
    </div>
  );
};
