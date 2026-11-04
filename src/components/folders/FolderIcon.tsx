import React, { memo } from 'react';
import { Folder } from 'lucide-react';
import type { AppItem, FolderItem } from '~types';
import AppIcon from '@/components/grid/AppIcon';

interface FolderIconProps {
  folder: FolderItem;
  appsMap: Map<string, AppItem>;
  sizePx?: number;
  iconRevision?: number;
}

export const FolderIcon: React.FC<FolderIconProps> = memo(
  ({ folder, appsMap, sizePx = 80, iconRevision = 0 }) => {
    const { style } = folder;
    const miniIconSize = Math.max(16, Math.floor(sizePx / 2.7));

    // Prime 4 app per l'anteprima 2×2
    const previewApps = folder.appIds
      .slice(0, 4)
      .map((id) => appsMap.get(id))
      .filter((a): a is AppItem => a !== undefined);

    // Stile Emoji
    if (style.type === 'emoji' && style.emoji) {
      return (
        <div
          style={{ width: sizePx, height: sizePx }}
          className="relative flex items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/30 overflow-hidden"
        >
          <span style={{ fontSize: Math.floor(sizePx * 0.52) }} role="img" aria-label={folder.name}>
            {style.emoji}
          </span>
        </div>
      );
    }

    // Stile Cover Image
    if (style.type === 'image' && style.coverImagePath) {
      return (
        <div
          style={{ width: sizePx, height: sizePx }}
          className="relative flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/30 overflow-hidden"
        >
          <img
            src={style.coverImagePath}
            alt={folder.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback se l'immagine locale o URL fallisce
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      );
    }

    // Stile Colore Custom
    if (style.type === 'color' && style.colorHex) {
      return (
        <div
          style={{
            width: sizePx,
            height: sizePx,
            background: `linear-gradient(135deg, ${style.colorHex}dd, ${style.colorHex}66)`,
          }}
          className="relative p-2 flex items-center justify-center rounded-2xl backdrop-blur-xl border border-white/30 shadow-lg shadow-black/30 overflow-hidden"
        >
          {previewApps.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5 w-full h-full items-center justify-items-center">
              {previewApps.map((app) => (
                <AppIcon
                  key={app.id}
                  id={app.id}
                  name={app.name}
                  iconCachePath={app.iconCachePath}
                  sizePx={miniIconSize}
                  iconRevision={iconRevision}
                />
              ))}
            </div>
          ) : (
            <Folder size={Math.floor(sizePx * 0.45)} className="text-white drop-shadow" />
          )}
        </div>
      );
    }

    // Stile Default: Liquid Glass 2×2 Preview
    return (
      <div
        style={{ width: sizePx, height: sizePx }}
        className="relative p-2 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-2xl border border-white/20 shadow-xl shadow-black/25 overflow-hidden transition-all duration-200"
      >
        {previewApps.length > 0 ? (
          <div className="grid grid-cols-2 gap-1.5 w-full h-full items-center justify-items-center">
            {previewApps.map((app) => (
              <AppIcon
                key={app.id}
                id={app.id}
                name={app.name}
                iconCachePath={app.iconCachePath}
                sizePx={miniIconSize}
                iconRevision={iconRevision}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-white/50">
            <Folder size={Math.floor(sizePx * 0.45)} />
          </div>
        )}
      </div>
    );
  },
);

FolderIcon.displayName = 'FolderIcon';
export default FolderIcon;
