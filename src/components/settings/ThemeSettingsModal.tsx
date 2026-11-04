import React, { useState } from 'react';
import {
  Check,
  CloudRain,
  Eye,
  EyeOff,
  Image,
  Layers,
  Palette,
  Sliders,
  Sparkles,
  Sun,
  Video,
  X,
  Zap,
} from 'lucide-react';
import type {
  GlassMode,
  IconAppearance,
  ThemeAndWallpaperConfig,
  UiTheme,
  WallpaperType,
} from '~types';
import { useLauncherDispatch, useLauncherState } from '@/context/LauncherStateContext';

const PRESET_TINT_COLORS = [
  { name: 'Apple Blue', hex: '#007AFF' },
  { name: 'Purple', hex: '#5856D6' },
  { name: 'Pink', hex: '#FF2D55' },
  { name: 'Orange', hex: '#FF9500' },
  { name: 'Yellow', hex: '#FFCC00' },
  { name: 'Green', hex: '#34C759' },
  { name: 'Mint', hex: '#00C7BE' },
  { name: 'Cyan', hex: '#32ADE6' },
  { name: 'Graphite', hex: '#8E8E93' },
  { name: 'Midnight', hex: '#1C1C1E' },
];

export const ThemeSettingsModal: React.FC = () => {
  const dispatch = useLauncherDispatch();
  const { isThemeModalOpen, theme } = useLauncherState();

  const [activeTab, setActiveTab] = useState<'theme' | 'icons' | 'wallpaper'>('theme');

  if (!isThemeModalOpen) return null;

  const handleClose = () => {
    dispatch({ type: 'SET_THEME_MODAL_OPEN', open: false });
  };

  const handleUpdate = (patch: Partial<ThemeAndWallpaperConfig>) => {
    dispatch({ type: 'UPDATE_THEME', patch });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col gap-5 p-6 rounded-3xl bg-neutral-900/90 border border-white/20 shadow-2xl text-white select-none overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Palette size={20} className="text-amber-400" />
            <h2 id="theme-modal-title" className="text-base font-semibold">
              Personalizzazione Tema & Sfondo
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Chiudi"
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'theme' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Tema & Vetro</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('icons')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'icons' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>Icone & GPU</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wallpaper')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'wallpaper' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Image size={14} />
            <span>Wallpaper Engine</span>
          </button>
        </div>

        {/* Contenuto Tab 1: Tema & Vetro */}
        {activeTab === 'theme' && (
          <div className="flex flex-col gap-5 overflow-y-auto max-h-[50vh] pr-1">
            {/* Scelta Liquid Glass vs Flat */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-white/80">Stile Interfaccia:</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleUpdate({ uiTheme: 'liquid_glass' as UiTheme })}
                  className={`flex flex-col items-start gap-1 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    theme.uiTheme === 'liquid_glass'
                      ? 'bg-white/15 border-white/40 ring-2 ring-white/50 shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-semibold text-white">Liquid Glass (macOS Tahoe)</span>
                  <span className="text-[11px] text-white/50">
                    Vetro ad alta rifrazione con riflessi dinamici e profondità tridimensionale.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdate({ uiTheme: 'flat' as UiTheme })}
                  className={`flex flex-col items-start gap-1 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    theme.uiTheme === 'flat'
                      ? 'bg-white/15 border-white/40 ring-2 ring-white/50 shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-semibold text-white">Flat Minimal</span>
                  <span className="text-[11px] text-white/50">
                    Design solido e opaco privo di rifrazioni, ideale per massima sobrietà.
                  </span>
                </button>
              </div>
            </div>

            {/* Modalità Vetro: Clear vs Tinted */}
            {theme.uiTheme === 'liquid_glass' && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-white/80">Modalità Vetro:</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpdate({ glassMode: 'clear' as GlassMode })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      theme.glassMode === 'clear'
                        ? 'bg-white/15 border-white/40 ring-1 ring-white/40'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <span className="text-xs font-semibold block text-white">Clear Glass</span>
                    <span className="text-[11px] text-white/50">Vetro neutro trasparente ad altissima purezza.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdate({ glassMode: 'tinted' as GlassMode })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      theme.glassMode === 'tinted'
                        ? 'bg-white/15 border-white/40 ring-1 ring-white/40'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <span className="text-xs font-semibold block text-white">Tinted Glass</span>
                    <span className="text-[11px] text-white/50">Vetro colorato armonizzato con la sfumatura HEX.</span>
                  </button>
                </div>
              </div>
            )}

            {/* Selezione Colore Tinted */}
            {theme.glassMode === 'tinted' && (
              <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs font-semibold text-white/80">Sfumatura Vetro Personalizzata:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TINT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => handleUpdate({ glassTintColorHex: c.hex })}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                        theme.glassTintColorHex?.toLowerCase() === c.hex.toLowerCase()
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900'
                          : ''
                      }`}
                      aria-label={c.name}
                    >
                      {theme.glassTintColorHex?.toLowerCase() === c.hex.toLowerCase() && (
                        <Check size={14} className="text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={theme.glassTintColorHex || '#007AFF'}
                    onChange={(e) => handleUpdate({ glassTintColorHex: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    aria-label="Colore personalizzato"
                  />
                  <input
                    type="text"
                    value={theme.glassTintColorHex || '#007AFF'}
                    onChange={(e) => handleUpdate({ glassTintColorHex: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white/10 border border-white/15 focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contenuto Tab 2: Icone & Prestazioni */}
        {activeTab === 'icons' && (
          <div className="flex flex-col gap-5 overflow-y-auto max-h-[50vh] pr-1">
            {/* Stile Aspetto Icone */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-white/80">Aspetto delle Icone di Sistema:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['light', 'dark', 'tinted', 'clear_colored'] as IconAppearance[]).map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => handleUpdate({ iconAppearance: app })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium capitalize transition-all cursor-pointer ${
                      theme.iconAppearance === app
                        ? 'bg-white/20 border-white/40 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {app.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Ottimizzazione GPU M4 */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-400" />
                  <span className="text-xs font-semibold text-white">Ottimizzazione GPU Apple Silicon M4</span>
                </div>
                <span className="text-[11px] text-white/50 max-w-sm">
                  Disattiva il calcolo del vetro trasparente sotto le singole icone per alleggerire la GPU e mantenere 120 FPS.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={theme.disableGlassOnIconsForGpu}
                onClick={() =>
                  handleUpdate({ disableGlassOnIconsForGpu: !theme.disableGlassOnIconsForGpu })
                }
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  theme.disableGlassOnIconsForGpu ? 'bg-amber-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 left-0.5 ${
                    theme.disableGlassOnIconsForGpu ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Dimensione Icone Slider */}
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sliders size={14} className="text-blue-400" />
                  <span className="text-xs font-semibold text-white">Dimensione Icone Griglia</span>
                </div>
                <span className="text-xs font-mono text-white/70">{theme.iconSizePx}px</span>
              </div>
              <input
                type="range"
                min={60}
                max={110}
                step={2}
                value={theme.iconSizePx}
                onChange={(e) => handleUpdate({ iconSizePx: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Toggle Titoli App */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                {theme.hideAppTitles ? <EyeOff size={16} /> : <Eye size={16} />}
                <span className="text-xs font-semibold text-white">Nascondi Titoli sotto le Icone</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={theme.hideAppTitles}
                onClick={() => handleUpdate({ hideAppTitles: !theme.hideAppTitles })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  theme.hideAppTitles ? 'bg-blue-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 left-0.5 ${
                    theme.hideAppTitles ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Contenuto Tab 3: Wallpaper Engine */}
        {activeTab === 'wallpaper' && (
          <div className="flex flex-col gap-5 overflow-y-auto max-h-[50vh] pr-1">
            {/* Scelta Tipo Sfondo */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-white/80">Tipo di Sfondo:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'static', label: 'Statico', icon: <Image size={14} /> },
                  { id: 'dynamic_heic', label: 'Giorno / Notte', icon: <Sun size={14} /> },
                  { id: 'live_video', label: 'Live Video', icon: <Video size={14} /> },
                  { id: 'dynamic_sun', label: 'Sole Dinamico', icon: <Sun size={14} /> },
                  { id: 'dynamic_weather', label: 'Meteo Dinamico', icon: <CloudRain size={14} /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      handleUpdate({
                        wallpaper: {
                          ...theme.wallpaper,
                          type: item.id as WallpaperType,
                        },
                      })
                    }
                    className={`flex items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-medium transition-all cursor-pointer ${
                      theme.wallpaper.type === item.id
                        ? 'bg-white/20 border-white/40 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Percorso File per Static o Live Video */}
            {(theme.wallpaper.type === 'static' || theme.wallpaper.type === 'live_video') && (
              <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <label htmlFor="wallpaper-path-input" className="text-xs font-semibold text-white/80">
                  Percorso file locale o URL video/immagine:
                </label>
                <input
                  id="wallpaper-path-input"
                  type="text"
                  placeholder="/Users/.../wallpaper.jpg o .mp4"
                  value={theme.wallpaper.filePath || ''}
                  onChange={(e) =>
                    handleUpdate({
                      wallpaper: {
                        ...theme.wallpaper,
                        filePath: e.target.value.trim() || undefined,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/15 focus:outline-none font-mono"
                />
              </div>
            )}

            {/* Slider Wallpaper Blur */}
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Intensità Sfocatura Sfondo (Blur)</span>
                <span className="text-xs font-mono text-white/70">{theme.wallpaper.blurIntensity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={2}
                value={theme.wallpaper.blurIntensity}
                onChange={(e) =>
                  handleUpdate({
                    wallpaper: {
                      ...theme.wallpaper,
                      blurIntensity: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
              <span className="text-[11px] text-white/40">
                Regola la sfocatura dello sfondo per garantire la massima leggibilità delle icone.
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-white text-black hover:bg-white/90 shadow-md transition-colors cursor-pointer"
          >
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettingsModal;
