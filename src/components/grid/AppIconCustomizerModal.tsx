import React, { useMemo, useState } from 'react';
import { Image, RotateCcw, Sparkles, X } from 'lucide-react';
import { useLauncherDispatch, useLauncherState } from '@/context/LauncherStateContext';
import AppIcon from './AppIcon';

export const AppIconCustomizerModal: React.FC = () => {
  const dispatch = useLauncherDispatch();
  const { customizingAppId, apps, iconRevision } = useLauncherState();

  const targetApp = useMemo(() => {
    return apps.find((a) => a.id === customizingAppId);
  }, [apps, customizingAppId]);

  const [customPath, setCustomPath] = useState(targetApp?.customIconPath || '');
  const [removeBg, setRemoveBg] = useState(targetApp?.removeIconBg || false);

  if (!targetApp) return null;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_APP_CUSTOMIZER' });
  };

  const handleSave = () => {
    dispatch({
      type: 'SET_APP_CUSTOM_ICON',
      appId: targetApp.id,
      customIconPath: customPath.trim() || undefined,
      removeIconBg: removeBg,
    });
  };

  const handleReset = () => {
    dispatch({
      type: 'SET_APP_CUSTOM_ICON',
      appId: targetApp.id,
      customIconPath: undefined,
      removeIconBg: false,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="icon-customizer-title"
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md flex flex-col gap-5 p-6 rounded-3xl bg-neutral-900/90 border border-white/20 shadow-2xl text-white select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h2 id="icon-customizer-title" className="text-base font-semibold">
              Personalizza Icona: {targetApp.name}
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

        {/* Anteprima Live Icona */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 gap-2">
          <AppIcon
            id={targetApp.id}
            name={targetApp.name}
            iconCachePath={targetApp.iconCachePath}
            customIconPath={customPath.trim() || undefined}
            removeIconBg={removeBg}
            sizePx={84}
            iconRevision={iconRevision}
          />
          <span className="text-xs text-white/60">Anteprima in tempo reale</span>
        </div>

        {/* Percorso File Custom */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="custom-icon-path" className="text-xs text-white/70">
            Percorso file PNG/JPG o URL:
          </label>
          <div className="flex items-center gap-2">
            <Image size={16} className="text-white/40 shrink-0" />
            <input
              id="custom-icon-path"
              type="text"
              placeholder="/Users/.../custom_icon.png"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-1 focus:ring-white/40 font-mono"
            />
          </div>
        </div>

        {/* Switch Rimozione Sfondo */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white">Rimozione Sfondo</span>
            <span className="text-[11px] text-white/50">
              Applica maschera di trasparenza automatica (screen blend).
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={removeBg}
            onClick={() => setRemoveBg(!removeBg)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              removeBg ? 'bg-blue-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 left-0.5 ${
                removeBg ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs rounded-xl bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-white text-black hover:bg-white/90 shadow-md transition-colors cursor-pointer"
            >
              Salva Icona
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppIconCustomizerModal;
