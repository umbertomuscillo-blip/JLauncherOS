import React from "react";

export interface AppSquircleIconProps {
  name: string;
  category?: string;
  size?: number;
}

/**
 * Renders an authentic macOS squircle icon with bespoke vector artwork
 * (Zero emoji compliance per Impeccable & Apple HIG).
 */
export const MacAppSquircleIcon: React.FC<AppSquircleIconProps> = ({
  name,
  category = "Productivity",
  size = 60,
}) => {
  const lower = name.toLowerCase();
  const r = Math.round(size * 0.225);

  if (lower.includes("spotify") || lower.includes("music")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="spotGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1ED760" />
            <stop offset="100%" stopColor="#119942" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx={r} fill="#121316" />
        <circle cx="32" cy="32" r="22" fill="url(#spotGrad)" />
        <path
          d="M21 26.5C27.5 24.5 36.5 25 43 28.5"
          stroke="#0B0C0E"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <path
          d="M23 32.5C28.5 31 35.5 31.5 40.5 34.2"
          stroke="#0B0C0E"
          strokeWidth="3.1"
          strokeLinecap="round"
        />
        <path
          d="M25 38.2C29.5 37 34.5 37.4 38.5 39.5"
          stroke="#0B0C0E"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (lower.includes("safari") || lower.includes("browser") || lower.includes("chrome")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="safGrad" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38B6FF" />
            <stop offset="100%" stopColor="#0066EE" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx={r} fill="#FFFFFF" />
        <circle cx="32" cy="32" r="25" fill="url(#safGrad)" />
        <circle cx="32" cy="32" r="22" stroke="rgba(255,255,255,0.45)" strokeWidth="1" strokeDasharray="2 3" />
        <polygon points="32,14 36,32 32,35 28,32" fill="#FF3B30" />
        <polygon points="32,50 36,32 32,29 28,32" fill="#FFFFFF" />
        <circle cx="32" cy="32" r="2.5" fill="#E5E5EA" />
      </svg>
    );
  }

  if (lower.includes("code") || lower.includes("vscode") || lower.includes("cursor")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="vsGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#24ADF3" />
            <stop offset="100%" stopColor="#0065A9" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx={r} fill="#181A20" />
        <path
          d="M44 13L23 32L15 25L11 27.5V36.5L15 39L23 32L44 51L52 47V17L44 13Z"
          fill="url(#vsGrad)"
        />
      </svg>
    );
  }

  if (lower.includes("terminal") || lower.includes("iterm") || lower.includes("warp")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx={r} fill="#141519" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
        <path
          d="M17 22L27 30L17 38"
          stroke="#30D158"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="30" y1="39" x2="44" y2="39" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (lower.includes("figma") || lower.includes("sketch") || lower.includes("design")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx={r} fill="#1E1E24" />
        <rect x="21" y="13" width="11" height="12" rx="5.5" fill="#F24E1E" />
        <rect x="32" y="13" width="11" height="12" rx="5.5" fill="#FF7262" />
        <rect x="21" y="25" width="11" height="12" rx="5.5" fill="#A259FF" />
        <circle cx="37.5" cy="31" r="5.5" fill="#1ABCFE" />
        <path d="M21 42.5C21 39.5 23.5 37 26.5 37H32V42.5C32 45.5 29.5 48 26.5 48C23.5 48 21 45.5 21 42.5Z" fill="#0ACF83" />
      </svg>
    );
  }

  if (lower.includes("whatsapp") || lower.includes("messages") || lower.includes("telegram")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#52E575" />
            <stop offset="100%" stopColor="#25B946" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx={r} fill="url(#msgGrad)" />
        <path
          d="M32 15C21.5 15 13 22.1 13 30.8C13 35.1 15.1 39 18.6 41.8L16.5 48.5L24.1 45.5C26.6 46.3 29.2 46.7 32 46.7C42.5 46.7 51 39.6 51 30.8C51 22.1 42.5 15 32 15Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (lower.includes("slack") || lower.includes("discord")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx={r} fill="#5865F2" />
        <rect x="15" y="21" width="34" height="22" rx="11" fill="#FFFFFF" />
        <circle cx="25.5" cy="32" r="3.5" fill="#5865F2" />
        <circle cx="38.5" cy="32" r="3.5" fill="#5865F2" />
      </svg>
    );
  }

  if (lower.includes("antigravity") || lower.includes("jarvis") || lower.includes("chatgpt")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="agyGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0A84FF" />
            <stop offset="50%" stopColor="#5E5CE6" />
            <stop offset="100%" stopColor="#BF5AF2" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx={r} fill="url(#agyGrad)" />
        <circle cx="32" cy="32" r="16" stroke="#FFFFFF" strokeWidth="2.8" strokeOpacity="0.9" />
        <path d="M32 19L41 39H23L32 19Z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (lower.includes("notes") || lower.includes("notion") || lower.includes("reminders")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx={r} fill="#F5F5F7" />
        <path d="M0 14C0 6.268 6.268 0 14 0H50C57.732 0 64 6.268 64 14V19H0V14Z" fill="#FFCC00" />
        <line x1="14" y1="30" x2="50" y2="30" stroke="#C7C7CC" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="14" y1="40" x2="50" y2="40" stroke="#C7C7CC" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="14" y1="50" x2="38" y2="50" stroke="#C7C7CC" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Fallback category-tuned macOS Squircle
  const palette =
    category === "Dev"
      ? ["#0A84FF", "#0040DD"]
      : category === "Design"
      ? ["#FF375F", "#BF5AF2"]
      : category === "Media"
      ? ["#FF9F0A", "#FF3B30"]
      : ["#32ADE6", "#0A84FF"];

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id={`cat_${name.replace(/\W/g, "")}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette[0]} />
          <stop offset="100%" stopColor={palette[1]} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx={r} fill={`url(#cat_${name.replace(/\W/g, "")})`} />
      <rect
        x="17"
        y="17"
        width="30"
        height="30"
        rx="8"
        fill="rgba(255,255,255,0.22)"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="2"
      />
      <circle cx="32" cy="32" r="6" fill="#FFFFFF" />
    </svg>
  );
};

/**
 * Bright Cyan macOS Finder Folder Icon matching IMG_0149.PNG
 */
export const CyanMacFolderIcon: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="cyanFolderBack" x1="0" y1="10" x2="0" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2797D8" />
        <stop offset="100%" stopColor="#1A75B8" />
      </linearGradient>
      <linearGradient id="cyanFolderFront" x1="0" y1="20" x2="0" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#69D2FF" />
        <stop offset="100%" stopColor="#26A9F2" />
      </linearGradient>
    </defs>
    <path
      d="M6 16C6 12.6863 8.68629 10 12 10H24.5C26.4 10 28.1 10.9 29.2 12.4L31.4 15.2C32.1 16.1 33.2 16.6 34.4 16.6H52C55.3137 16.6 58 19.2863 58 22.6V48C58 51.3137 55.3137 54 52 54H12C8.68629 54 6 51.3137 6 48V16Z"
      fill="url(#cyanFolderBack)"
    />
    <rect
      x="6"
      y="20"
      width="52"
      height="34"
      rx="6"
      fill="url(#cyanFolderFront)"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth="1"
    />
  </svg>
);

/**
 * 3D Tactile Space Icons matching IMG_0149.PNG (Design Palette, Dev Laptop, Study Book)
 */
export const Space3DIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 64 }) => {
  if (type.includes("palette") || type.toLowerCase().includes("design")) {
    return (
      <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
        <defs>
          <linearGradient id="woodPal" x1="10" y1="10" x2="62" y2="62" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5C384" />
            <stop offset="100%" stopColor="#C98845" />
          </linearGradient>
        </defs>
        <path
          d="M36 10C20.5 10 8 21.6 8 36C8 50.4 20.5 62 36 62C41.2 62 45 58.2 45 53.6C45 51.4 44.1 49.5 42.8 48C41.6 46.6 41 44.8 42.2 43.2C43.3 41.7 45.2 41 47.4 41H52C59.7 41 64 35.4 64 28.5C64 17.8 51.5 10 36 10Z"
          fill="url(#woodPal)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
        />
        <circle cx="22" cy="28" r="5" fill="#FF3B30" />
        <circle cx="33" cy="21" r="5" fill="#FFCC00" />
        <circle cx="46" cy="24" r="5" fill="#0A84FF" />
        <circle cx="21" cy="41" r="5" fill="#30D158" />
        <circle cx="34" cy="49" r="4.5" fill="#18191D" />
      </svg>
    );
  }

  if (type.includes("book") || type.toLowerCase().includes("study")) {
    return (
      <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
        <defs>
          <linearGradient id="bookGrad" x1="14" y1="10" x2="58" y2="62" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF7A2F" />
            <stop offset="100%" stopColor="#D9381E" />
          </linearGradient>
        </defs>
        <rect x="16" y="10" width="42" height="52" rx="6" fill="url(#bookGrad)" />
        <rect x="16" y="10" width="8" height="52" rx="3" fill="rgba(0,0,0,0.28)" />
        <rect x="20" y="54" width="36" height="5" rx="2.5" fill="#F5F5F7" />
        <rect x="29" y="20" width="20" height="8" rx="2" fill="rgba(255,255,255,0.25)" />
      </svg>
    );
  }

  // Dev Laptop 3D Icon
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <linearGradient id="screenGrad" x1="14" y1="14" x2="58" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#252836" />
          <stop offset="100%" stopColor="#11131A" />
        </linearGradient>
      </defs>
      <rect x="14" y="14" width="44" height="30" rx="4" fill="url(#screenGrad)" stroke="#8E8E93" strokeWidth="2" />
      <path d="M26 25L21 29L26 33" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M46 25L51 29L46 33" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="38" y1="23" x2="34" y2="35" stroke="#FF9F0A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 45H64L59 53H13L8 45Z" fill="#C7C7CC" />
      <rect x="30" y="45" width="12" height="2" rx="1" fill="#636366" />
    </svg>
  );
};

/**
 * Weather Moon & Stars Icon (IMG_0141.jpg) and Sun Cloud Icon (IMG_0139.PNG)
 */
export const WeatherArtworkIcon: React.FC<{ isNight?: boolean; size?: number }> = ({
  isNight = true,
  size = 38,
}) => {
  if (isNight) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path
          d="M31.5 29.8C24.6 29.8 19 24.2 19 17.3C19 14.3 20.1 11.5 21.9 9.4C14.8 10.6 9.5 16.7 9.5 24.1C9.5 32.4 16.2 39.1 24.5 39.1C31.2 39.1 36.9 34.7 38.8 28.6C36.6 29.4 34.1 29.8 31.5 29.8Z"
          fill="#FFD60A"
        />
        <circle cx="36" cy="14" r="1.8" fill="#FFFFFF" />
        <circle cx="41" cy="21" r="1.3" fill="rgba(255,255,255,0.75)" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="20" cy="20" r="9" fill="#FFD60A" />
      <path
        d="M18 35H35C38.9 35 42 31.9 42 28C42 24.4 39.3 21.4 35.8 21.1C34.5 16.5 30.3 13 25.2 13C19.1 13 14.2 17.9 14.2 24C14.2 24.4 14.2 24.8 14.3 25.2C11.3 26.1 9.2 28.8 9.2 32C9.2 33.7 13.1 35 18 35Z"
        fill="#FFFFFF"
        fillOpacity="0.92"
      />
    </svg>
  );
};
