import React from 'react';
import {
  Check,
  ChevronDown,
  Edit3,
  FolderPlus,
  Layers,
  LayoutGrid,
  Palette,
  X,
  Zap,
} from 'lucide-react';
import { useLauncherDispatch, useLauncherState } from '@/context/LauncherStateContext';
import { setLauncherVisibility } from '@/services/tauriBridge';
import UniversalSearchBar from '@/components/search/UniversalSearchBar';

export const LauncherTopBar: React.FC = () => {
  const dispatch = useLauncherDispatch();
  const { editMode, theme, lastNotice, persistError, spaces, activeSpaceId } = useLauncherState();

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);

  const handleToggleEdit = () => {
    dispatch({ type: 'SET_EDIT_MODE', enabled: !editMode });
  };

  const handleToggleCategories = () => {
    dispatch({ type: 'TOGGLE_CATEGORIES_PAGE' });
  };

  const handleClose = () => {
    void setLauncherVisibility(false);
  };

  return (
    <header className="relative flex flex-col w-full px-8 py-3 select-none z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs font-mono tracking-widest uppercase">
            LaunchMe Clone
          </span>

          {/* Switcher Space Attivo */}
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_SPACE_MODAL_OPEN', open: true })}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-purple-400/30 bg-purple-500/15 text-purple-200 hover:bg-purple-500/25 hover:text-white backdrop-blur-xl transition-all cursor-pointer shadow-sm"
            title="Gestisci o cambia Spazio di Lavoro (Spaces)"
          >
            <Layers size={13} className="text-purple-400" />
            <span className="font-semibold">{activeSpace?.name ?? 'Space'}</span>
            <ChevronDown size={11} className="text-purple-300/60" />
          </button>

          {/* ARIA Live notice indicator */}
          {lastNotice && (
            <div
              role="status"
              aria-live="polite"
              className="px-3 py-1 text-xs rounded-full bg-white/10 text-white/80 border border-white/15 backdrop-blur-md animate-in fade-in"
            >
              {lastNotice}
            </div>
          )}

          {persistError && (
            <div
              role="alert"
              className="px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-200 border border-red-500/30"
            >
              {persistError}
            </div>
          )}
        </div>

        {/* Search Bar Universale 5-in-1 */}
        <div className="flex-1 max-w-lg mx-6">
          <UniversalSearchBar />
        </div>

        <div className="flex items-center gap-3">
          {/* Pulsante Crea Workflow */}
          <button
            type="button"
            onClick={() => dispatch({ type: 'OPEN_WORKFLOW_BUILDER' })}
            aria-label="Crea Workflow 1-Click"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-amber-400/30 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 hover:text-white backdrop-blur-xl transition-all cursor-pointer shadow-sm"
            title="Crea Workflow 1-Click"
          >
            <Zap size={13} className="text-amber-400" />
            <span>+ Workflow</span>
          </button>

          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_THEME_MODAL_OPEN', open: true })}
            aria-label="Personalizza Tema e Sfondo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/15 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white backdrop-blur-xl transition-all cursor-pointer"
          >
            <Palette size={14} className="text-amber-400" />
            <span>Tema</span>
          </button>

          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_BATCH_CREATOR_OPEN', open: true })}
            aria-label="Crea cartella in batch"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-white/15 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white backdrop-blur-xl transition-all cursor-pointer"
          >
            <FolderPlus size={14} className="text-blue-400" />
            <span>+ Cartella</span>
          </button>

          <button
            type="button"
            onClick={handleToggleCategories}
            aria-label="Attiva/Disattiva vista Categorie"
            aria-pressed={theme.showCategoriesPageOnLaunch}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-xl transition-all cursor-pointer ${
              theme.showCategoriesPageOnLaunch
                ? 'bg-white/25 text-white border-white/40 shadow-md'
                : 'bg-white/10 text-white/70 border-white/15 hover:bg-white/20 hover:text-white'
            }`}
          >
            <LayoutGrid size={14} />
            <span>Categorie</span>
          </button>

          <button
            type="button"
            onClick={handleToggleEdit}
            aria-label="Modalità Modifica Griglia"
            aria-pressed={editMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-xl transition-all cursor-pointer ${
              editMode
                ? 'bg-amber-500/30 text-amber-200 border-amber-400/50 shadow-md'
                : 'bg-white/10 text-white/70 border-white/15 hover:bg-white/20 hover:text-white'
            }`}
          >
            {editMode ? <Check size={14} /> : <Edit3 size={14} />}
            <span>{editMode ? 'Fine' : 'Modifica'}</span>
          </button>

          {!theme.hideCloseXButton && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Chiudi Launcher"
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/70 hover:text-white backdrop-blur-xl transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default LauncherTopBar;
