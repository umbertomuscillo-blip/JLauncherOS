import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderPlus,
  MinusCircle,
  Palette,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { AppItem, FinderFolderShortcut } from '~types';
import { useLauncherDispatch, useLauncherState } from '@/context/LauncherStateContext';
import AppIcon from '@/components/grid/AppIcon';
import FolderCustomizer from './FolderCustomizer';
import { launchApp } from '@/services/tauriBridge';

const FINDER_PRESETS: Array<{ name: string; path: string }> = [
  { name: 'Scrivania', path: '~/Desktop' },
  { name: 'Documenti', path: '~/Documents' },
  { name: 'Download', path: '~/Downloads' },
  { name: 'Immagini', path: '~/Pictures' },
  { name: 'Musica', path: '~/Music' },
  { name: 'Home Utente', path: '~' },
];

export const FolderModal: React.FC = () => {
  const dispatch = useLauncherDispatch();
  const { openFolderId, folders, apps, editMode, iconRevision, theme } = useLauncherState();

  const [activeTab, setActiveTab] = useState<'apps' | 'finder'>('apps');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customFinderPath, setCustomFinderPath] = useState('');
  const [customFinderName, setCustomFinderName] = useState('');

  const activeFolder = useMemo(() => {
    return folders.find((f) => f.id === openFolderId);
  }, [folders, openFolderId]);

  const appMap = useMemo(() => {
    return new Map(apps.map((a) => [a.id, a]));
  }, [apps]);

  const folderApps = useMemo(() => {
    if (!activeFolder) return [];
    return activeFolder.appIds
      .map((id) => appMap.get(id))
      .filter((a): a is AppItem => a !== undefined);
  }, [activeFolder, appMap]);

  if (!activeFolder) return null;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_FOLDER' });
  };

  const handleLaunchApp = (app: AppItem) => {
    dispatch({ type: 'RECORD_LAUNCH', appId: app.id });
    dispatch({ type: 'CLOSE_FOLDER' });
    void launchApp(app.path);
  };

  const handleLaunchFinderShortcut = (path: string) => {
    dispatch({ type: 'CLOSE_FOLDER' });
    void launchApp(path);
  };

  const handleRename = () => {
    if (customTitle.trim()) {
      dispatch({
        type: 'UPDATE_FOLDER',
        folderId: activeFolder.id,
        name: customTitle.trim(),
      });
    }
    setIsEditingTitle(false);
  };

  const handleDeleteFolder = () => {
    dispatch({ type: 'DELETE_FOLDER', folderId: activeFolder.id });
  };

  const handleRemoveApp = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    dispatch({
      type: 'REMOVE_APP_FROM_FOLDER',
      folderId: activeFolder.id,
      appId,
    });
  };

  const handleAddPreset = (preset: { name: string; path: string }) => {
    const sc: FinderFolderShortcut = {
      id: `shortcut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: preset.name,
      finderPath: preset.path,
      customStyle: { type: 'default' },
    };
    dispatch({
      type: 'ADD_FINDER_SHORTCUT',
      folderId: activeFolder.id,
      shortcut: sc,
    });
  };

  const handleAddCustomFinder = () => {
    if (!customFinderPath.trim()) return;
    const name = customFinderName.trim() || customFinderPath.split('/').filter(Boolean).pop() || 'Cartella';
    const sc: FinderFolderShortcut = {
      id: `shortcut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      finderPath: customFinderPath.trim(),
      customStyle: { type: 'default' },
    };
    dispatch({
      type: 'ADD_FINDER_SHORTCUT',
      folderId: activeFolder.id,
      shortcut: sc,
    });
    setCustomFinderPath('');
    setCustomFinderName('');
  };

  const handleRemoveFinderShortcut = (shortcutId: string) => {
    dispatch({
      type: 'REMOVE_FINDER_SHORTCUT',
      folderId: activeFolder.id,
      shortcutId,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Cartella ${activeFolder.name}`}
      onClick={handleClose}
      className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col gap-4 p-6 rounded-3xl bg-neutral-900/90 border border-white/20 shadow-2xl text-white select-none overflow-hidden"
      >
        {/* Header con Titolo Modificabile e Pulsanti */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 flex-1">
            <Folder size={20} className="text-blue-400 shrink-0" />
            {isEditingTitle ? (
              <input
                type="text"
                value={customTitle}
                autoFocus
                onChange={(e) => setCustomTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                className="px-2 py-0.5 text-base font-semibold bg-white/10 rounded-lg border border-white/20 focus:outline-none"
              />
            ) : (
              <h2
                onClick={() => {
                  setCustomTitle(activeFolder.name);
                  setIsEditingTitle(true);
                }}
                className="text-base font-semibold cursor-pointer hover:underline underline-offset-4 decoration-white/40"
                title="Clicca per rinominare"
              >
                {activeFolder.name}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-white/10 hover:bg-white/15 transition-colors cursor-pointer text-white/90"
            >
              <Palette size={14} />
              <span>Stile</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteFolder}
              className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 transition-colors cursor-pointer"
              title="Elimina cartella (le app torneranno nella griglia)"
            >
              <Trash2 size={16} />
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switcher: App vs Cartelle Finder */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10 self-start text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('apps')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'apps' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Applicazioni ({folderApps.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('finder')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'finder' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Cartelle Finder ({activeFolder.finderShortcuts.length})
          </button>
        </div>

        {/* Contenuto Tab 1: Applicazioni */}
        {activeTab === 'apps' && (
          <div className="flex-1 min-h-[260px] max-h-[460px] overflow-y-auto p-2">
            {folderApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-xs text-white/40">
                Nessuna app in questa cartella. Trascina un'app qui dentro o usa la creazione in batch.
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 items-start justify-items-center">
                {folderApps.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => handleLaunchApp(app)}
                    className="relative flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group select-none text-center"
                  >
                    {editMode && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveApp(e, app.id)}
                        className="absolute -top-1 -right-1 z-10 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors"
                        title="Rimuovi dalla cartella"
                      >
                        <MinusCircle size={14} />
                      </button>
                    )}

                    <AppIcon
                      id={app.id}
                      name={app.name}
                      iconCachePath={app.iconCachePath}
                      sizePx={Math.min(68, theme.iconSizePx)}
                      iconRevision={iconRevision}
                    />

                    <span className="text-xs text-white/90 font-medium truncate max-w-[85px]">
                      {app.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contenuto Tab 2: Cartelle Finder */}
        {activeTab === 'finder' && (
          <div className="flex-1 min-h-[260px] max-h-[460px] overflow-y-auto flex flex-col gap-4 p-2">
            {/* Lista collegamenti attivi */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/60 uppercase tracking-wider font-mono">
                Collegamenti nel Finder
              </span>

              {activeFolder.finderShortcuts.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/5 text-xs text-white/40 text-center">
                  Nessuna directory collegata. Usa i preset sottostanti per aggiungere cartelle del Mac.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeFolder.finderShortcuts.map((sc) => (
                    <div
                      key={sc.id}
                      onClick={() => handleLaunchFinderShortcut(sc.finderPath)}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <Folder size={18} className="text-amber-400 shrink-0" />
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-semibold text-white truncate">{sc.name}</span>
                          <span className="text-[10px] text-white/50 truncate font-mono">
                            {sc.finderPath}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFinderShortcut(sc.id);
                          }}
                          className="p-1 rounded-lg text-white/40 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                          title="Rimuovi"
                        >
                          <X size={14} />
                        </button>
                        <Play size={12} className="text-white/40 group-hover:text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preset Rapidi macOS */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <span className="text-xs text-white/60">Aggiungi rapidamente una cartella di sistema:</span>
              <div className="flex flex-wrap gap-2">
                {FINDER_PRESETS.map((p) => (
                  <button
                    key={p.path}
                    type="button"
                    onClick={() => handleAddPreset(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white/80"
                  >
                    <FolderPlus size={13} className="text-blue-400" />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aggiunta Percorso Custom */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <span className="text-xs text-white/60">O inserisci un percorso personalizzato sul disco:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome (opzionale)"
                  value={customFinderName}
                  onChange={(e) => setCustomFinderName(e.target.value)}
                  className="w-1/3 px-3 py-1.5 text-xs rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-1 focus:ring-white/40"
                />
                <input
                  type="text"
                  placeholder="Percorso (es. ~/Projects o /Volumes/...)"
                  value={customFinderPath}
                  onChange={(e) => setCustomFinderPath(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-1 focus:ring-white/40 font-mono"
                />
                <button
                  type="button"
                  disabled={!customFinderPath.trim()}
                  onClick={handleAddCustomFinder}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    customFinderPath.trim()
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  <Plus size={14} />
                  <span>Aggiungi</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Sotto-Modale Personalizzatore Stile */}
      <AnimatePresence>
        {isCustomizerOpen && (
          <FolderCustomizer
            currentStyle={activeFolder.style}
            folderName={activeFolder.name}
            onSave={(updatedStyle) => {
              dispatch({
                type: 'UPDATE_FOLDER',
                folderId: activeFolder.id,
                style: updatedStyle,
              });
            }}
            onClose={() => setIsCustomizerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FolderModal;
