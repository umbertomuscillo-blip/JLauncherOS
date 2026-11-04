import { type FC } from 'react';
import { Play, Pause, SkipBack, SkipForward, Disc } from 'lucide-react';
import type { MediaTrackInfo, WidgetSize } from '~types';

interface FullCoverMusicWidgetProps {
  track: MediaTrackInfo | null;
  isPlaying: boolean;
  size?: WidgetSize;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const FullCoverMusicWidget: FC<FullCoverMusicWidgetProps> = ({
  track,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
}) => {
  const progressPercent =
    track && track.durationSecs > 0
      ? Math.min(100, (track.positionSecs / track.durationSecs) * 100)
      : 0;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 rounded-3xl overflow-hidden text-white select-none shadow-2xl border border-white/20 group">
      {/* Full-bleed background cover */}
      {track?.artworkUrl ? (
        <img
          src={track.artworkUrl}
          alt={track.album}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-950 to-neutral-950" />
      )}

      {/* Dark frosted overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30 backdrop-blur-[2px]" />

      {/* Top bar: Player Badge & Live Indicator */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[11px] font-medium text-white/90 shadow-md">
          <Disc size={13} className={isPlaying ? 'animate-spin text-green-400' : 'text-white/50'} />
          <span className="capitalize">{track?.player === 'spotify' ? 'Spotify' : track?.player === 'apple_music' ? 'Apple Music' : 'Musica'}</span>
        </div>
        {isPlaying && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        )}
      </div>

      {/* Center & Bottom: Track details and Floating Glass Controls */}
      <div className="relative z-10 flex flex-col gap-3 mt-auto">
        <div>
          <h3 className="text-base font-bold text-white leading-snug drop-shadow-md truncate">
            {track?.title || 'Nessun brano in riproduzione'}
          </h3>
          <p className="text-xs text-white/80 font-medium truncate drop-shadow-sm">
            {track?.artist ? `${track.artist} • ${track.album}` : 'Avvia Spotify o Musica'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full flex flex-col gap-1">
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
            <div
              className="h-full bg-white rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/60 font-mono">
            <span>{formatTime(track?.positionSecs || 0)}</span>
            <span>{formatTime(track?.durationSecs || 0)}</span>
          </div>
        </div>

        {/* Glassmorphic Playback Controls */}
        <div className="flex items-center justify-center gap-3 py-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className="p-2.5 rounded-full bg-black/30 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg"
            title="Precedente"
          >
            <SkipBack size={18} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            className="p-3.5 rounded-full bg-white text-black hover:bg-white/90 shadow-xl transition-all active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pausa' : 'Riproduci'}
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" className="translate-x-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="p-2.5 rounded-full bg-black/30 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg"
            title="Successiva"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
