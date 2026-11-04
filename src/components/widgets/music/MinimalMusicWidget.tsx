import { type FC } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music2 } from 'lucide-react';
import type { MediaTrackInfo, WidgetSize } from '~types';

interface MinimalMusicWidgetProps {
  track: MediaTrackInfo | null;
  isPlaying: boolean;
  size: WidgetSize;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const MinimalMusicWidget: FC<MinimalMusicWidgetProps> = ({
  track,
  isPlaying,
  size,
  onPlayPause,
  onNext,
  onPrevious,
}) => {
  const is1x1 = size === '1x1';
  const progressPercent =
    track && track.durationSecs > 0
      ? Math.min(100, (track.positionSecs / track.durationSecs) * 100)
      : 0;

  if (is1x1) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-between p-2 rounded-2xl bg-neutral-900/60 backdrop-blur-xl border border-white/15 overflow-hidden text-white select-none">
        {track?.artworkUrl ? (
          <img
            src={track.artworkUrl}
            alt={track.title}
            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xs"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black/40" />
        )}
        <div className="relative z-10 w-full flex items-center justify-between text-[10px] text-white/60">
          <Music2 size={12} className={isPlaying ? 'text-green-400 animate-pulse' : 'text-white/40'} />
          <span className="uppercase text-[9px] font-mono tracking-wider">{track?.player === 'spotify' ? 'Spotify' : 'Music'}</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlayPause();
          }}
          className="relative z-10 p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white shadow-lg backdrop-blur-md transition-all active:scale-95"
          aria-label={isPlaying ? 'Pausa' : 'Riproduci'}
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="translate-x-0.5" />}
        </button>
        <div className="relative z-10 w-full text-center">
          <p className="text-[11px] font-semibold truncate leading-tight">{track?.title || 'Nessun brano'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-900/70 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none group">
      {/* Dynamic ambient backdrop */}
      {track?.artworkUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 blur-xl pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url(${track.artworkUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 pointer-events-none" />

      {/* Main horizontal content */}
      <div className="relative z-10 flex items-center gap-3 w-full">
        {/* Cover thumbnail */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-800/80 border border-white/10 shrink-0 shadow-md">
          {track?.artworkUrl ? (
            <img src={track.artworkUrl} alt={track.album} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-800 text-white/80">
              <Music2 size={20} />
            </div>
          )}
        </div>

        {/* Track & Artist Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-sm font-semibold truncate text-white drop-shadow-sm">
            {track?.title || 'Inattivo'}
          </p>
          <p className="text-xs text-white/70 truncate drop-shadow-xs">
            {track?.artist ? `${track.artist} — ${track.album}` : 'Nessun player attivo'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
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
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pausa' : 'Riproduci'}
          >
            {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="translate-x-0.5" />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
            title="Successiva"
          >
            <SkipForward size={15} />
          </button>
        </div>
      </div>

      {/* Progress timeline bar */}
      <div className="relative z-10 w-full mt-2 flex flex-col gap-1">
        <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {size !== '2x1' && (
          <div className="flex justify-between text-[10px] text-white/50 font-mono">
            <span>{formatTime(track?.positionSecs || 0)}</span>
            <span>{formatTime(track?.durationSecs || 0)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
