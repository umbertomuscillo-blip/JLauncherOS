import React, { useMemo, useState } from 'react';
import { Check, FolderPlus, Search, X } from 'lucide-react';
import { useLauncherDispatch, useLauncherState, useVisibleApps } from '@/context/LauncherStateContext';
import AppIcon from '@/components/grid/AppIcon';

export const BatchFolderCreator: React.FC = () => {
  const dispatch = useLauncherDispatch();
  const { isBatchCreatorOpen, iconRevision, folders } = useLauncherState();
  const visibleApps = useVisibleApps();

  const [folderName, setFolderName] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());

  // Non mostrare app che sono già dentro un'altra cartella
  const appsAlreadyInFolder = useMemo(() => {
    return new Set(folders.flatMap((f) => f.appIds));
  }, [folders]);

  const availableApps = useMemo(() => {
    return visibleApps.filter((a) => !appsAlreadyInFolder.has(a.id));
  }, [visibleApps, appsAlreadyInFolder]);

  const filteredApps = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return availableApps;
    return availableApps.filter((a) => a.name.toLowerCase().includes(q));
  }, [availableApps, filterQuery]);

  if (!isBatchCreatorOpen) return null;

  const handleClose = () => {
    dispatch({ type: 'SET_BATCH_CREATOR_OPEN', open: false });
  };

  const toggleSelect = (appId: string) => {
    setSelectedAppIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedAppIds.size === filteredApps.length) {
      setSelectedAppIds(new Set());
    } else {
      setSelectedAppIds(new Set(filteredApps.map((a) => a.id)));
    }
  };

  const handleCreate = () => {
    const ids = Array.from(selectedAppIds);
    if (ids.length === 0) return;
    dispatch({
      type: 'CREATE_FOLDER',
      name: folderName.trim() || 'Nuova Cartella',
      appIds: ids,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-folder-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col gap-4 p-6 rounded-3xl bg-neutral-900/90 border border-white/20 shadow-2xl text-white select-none">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus size={20} className="text-blue-400" />
            <h2 id="batch-folder-title" className="text-base font-semibold">
              Crea Cartella in Batch
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

        {/* Input Nome Cartella */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="batch-folder-name" className="text-xs text-white/70">
            Nome della cartella:
          </label>
          <input
            id="batch-folder-name"
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="es. Sviluppo, Grafica, Utility..."
            className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Ricerca e pulsante Seleziona Tutto */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-white/40" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Cerca app..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-1 focus:ring-white/40"
            />
          </div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-3 py-1.5 text-xs rounded-xl bg-white/10 hover:bg-white/15 text-white/80 transition-colors cursor-pointer shrink-0"
          >
            {selectedAppIds.size === filteredApps.length && filteredApps.length > 0
              ? 'Deseleziona tutte'
              : 'Seleziona visibili'}
          </button>
        </div>

        {/* Lista App con Checkbox */}
        <div className="flex-1 min-h-[220px] max-h-[340px] overflow-y-auto flex flex-col gap-1 pr-1">
          {filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-xs text-white/40">
              Nessuna applicazione trovata
            </div>
          ) : (
            filteredApps.map((app) => {
              const isSelected = selectedAppIds.has(app.id);
              return (
                <div
                  key={app.id}
                  onClick={() => toggleSelect(app.id)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-600/30 border border-blue-400/40' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AppIcon
                      id={app.id}
                      name={app.name}
                      iconCachePath={app.iconCachePath}
                      sizePx={32}
                      iconRevision={iconRevision}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-white/90">{app.name}</span>
                      <span className="text-[10px] text-white/40 capitalize">{app.category}</span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    {isSelected && <Check size={13} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="text-xs text-white/50">
            {selectedAppIds.size} {selectedAppIds.size === 1 ? 'app selezionata' : 'app selezionate'}
          </span>
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
              disabled={selectedAppIds.size === 0}
              onClick={handleCreate}
              className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                selectedAppIds.size > 0
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Crea Cartella
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchFolderCreator;
