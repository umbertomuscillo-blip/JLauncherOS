import React, { memo, useState } from 'react';
import { iconSrc } from '@/services/tauriBridge';
import { useLauncherState } from '@/context/LauncherStateContext';

interface AppIconProps {
  id: string;
  name: string;
  iconCachePath: string;
  customIconPath?: string;
  removeIconBg?: boolean;
  sizePx?: number;
  iconRevision?: number;
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return `#${'00000'.substring(0, 6 - c.length)}${c}`;
}

export const AppIcon: React.FC<AppIconProps> = memo(
  ({
    id,
    name,
    iconCachePath,
    customIconPath,
    removeIconBg,
    sizePx = 80,
    iconRevision = 0,
  }) => {
    const { theme } = useLauncherState();
    const { iconAppearance, disableGlassOnIconsForGpu, glassTintColorHex } = theme;
    const [hasError, setHasError] = useState(false);

    // Initial letters fallback
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] || '')
      .join('')
      .toUpperCase();

    // Icon source: custom icon ha la priorità, poi cache nativa
    const effectivePath = customIconPath || iconCachePath;
    const src = effectivePath ? `${iconSrc(effectivePath)}?rev=${iconRevision}` : '';

    // Stile CSS di aspetto dell'icona (dark, tinted, clear_colored)
    let filterStyle = '';
    if (iconAppearance === 'dark') {
      filterStyle = 'brightness(0.82) contrast(1.12) saturate(0.9)';
    } else if (iconAppearance === 'tinted' && glassTintColorHex) {
      filterStyle = 'sepia(0.65) hue-rotate(180deg) saturate(1.8)';
    }

    // Clear colored wrapper: se abilitato, racchiude l'icona in uno squircle traslucido coordinato
    const isClearColored = iconAppearance === 'clear_colored';

    if (!src || hasError) {
      const bgColor = stringToColor(id);
      return (
        <div
          style={{ width: sizePx, height: sizePx, backgroundColor: bgColor }}
          className="flex items-center justify-center rounded-2xl shadow-lg border border-white/20 text-white font-bold text-2xl select-none"
          aria-hidden="true"
        >
          {initials}
        </div>
      );
    }

    const imageElement = (
      <img
        src={src}
        alt=""
        draggable={false}
        decoding="async"
        onError={() => setHasError(true)}
        style={{
          width: isClearColored ? Math.floor(sizePx * 0.78) : sizePx,
          height: isClearColored ? Math.floor(sizePx * 0.78) : sizePx,
          filter: filterStyle || undefined,
          mixBlendMode: removeIconBg ? 'screen' : 'normal',
        }}
        className="rounded-2xl shadow-md select-none pointer-events-none object-contain transition-all duration-150"
      />
    );

    if (isClearColored) {
      return (
        <div
          style={{
            width: sizePx,
            height: sizePx,
            backgroundColor: disableGlassOnIconsForGpu
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(255, 255, 255, 0.18)',
            // Zero-overhead GPU M4: disattiva backdrop-filter se disableGlassOnIconsForGpu è true
            backdropFilter: disableGlassOnIconsForGpu ? 'none' : 'blur(12px)',
            WebkitBackdropFilter: disableGlassOnIconsForGpu ? 'none' : 'blur(12px)',
          }}
          className="flex items-center justify-center rounded-2xl border border-white/25 shadow-lg shadow-black/20 select-none overflow-hidden transition-all"
        >
          {imageElement}
        </div>
      );
    }

    return imageElement;
  },
);

AppIcon.displayName = 'AppIcon';
export default AppIcon;
