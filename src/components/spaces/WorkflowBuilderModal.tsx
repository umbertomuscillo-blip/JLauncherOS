import React, { useMemo, useState } from 'react';
import { Check, Folder, Plus, Search, X, Zap } from 'lucide-react';
import type { CustomFolderStyle, WorkflowItem } from '~types';
import { useLauncherDispatch, useLauncherState, useVisibleApps } from '@/context/LauncherStateContext';
import AppIcon from '@/components/grid/AppIcon';

const PRESET_EMOJIS = ['⚡', '🚀', '💻', '🎧', '🎮', '✍️', '☕', '🔬', '📊', '🎨'];
const PRESET_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4'];

export const WorkflowBuilderModal: React.FC = () => {
  const dispatch = useLauncherDispatch();
  const { isWorkflowModalOpen, editingWorkflowId, workflows, iconRevision } = useLauncherState();
  const visibleApps = useVisibleApps();

  const existingWorkflow = useMemo(() => {
    return editingWorkflowId ? workflows.find((w) => w.id === editingWorkflowId) : undefined;
  }, [editingWorkflowId, workflows]);

  const [name, setName] = useState(existingWorkflow?.name ?? '');
  const [iconStyle, setIconStyle] = useState<CustomFolderStyle>(
    existingWorkflow?.iconStyle ?? { type: 'default' },
  );
  const [selectedAppPaths, setSelectedAppPaths] = useState<string[]>(
    existingWorkflow?.targetAppPaths ?? [],
  );
  const [finderPaths, setFinderPaths] = useState<string[]>(
    existingWorkflow?.targetFinderPaths ?? [],
  );
  const [customPathInput, setCustomPathInput] = useState('');
  const [appSearch, setAppSearch] = useState('');

  const filteredApps = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    if (!q) return visibleApps;
    return visibleApps.filter((a) => a.name.toLowerCase().includes(q));
  }, [visibleApps, appSearch]);

  if (!isWorkflowModalOpen) return null;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_WORKFLOW_BUILDER' });
  };

  const toggleAppSelection = (appPath: string) => {
    setSelectedAppPaths((prev) =>
      prev.includes(appPath) ? prev.filter((p) => p !== appPath) : [...prev, appPath],
    );
  };

  const handleAddFinderPath = () => {
    const trimmed = customPathInput.trim();
    if (!trimmed || finderPaths.includes(trimmed)) return;
    setFinderPaths((prev) => [...prev, trimmed]);
    setCustomPathInput('');
  };

  const handleRemoveFinderPath = (pathToRemove: string) => {
    setFinderPaths((prev) => prev.filter((p) => p !== pathToRemove));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const workflowToSave: WorkflowItem = {
      id: existingWorkflow?.id ?? `wf-${Date.now()}`,
      name: name.trim(),
      iconStyle,
      targetAppPaths: selectedAppPaths,
      targetFinderPaths: finderPaths,
    };

    dispatch({
      type: 'SAVE_WORKFLOW',
      workflow: workflowToSave,
    });
  };

  const totalActions = selectedAppPaths.length + finderPaths.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workflow-builder-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl max-h-[88vh] flex flex-col gap-4 p-6 rounded-3xl bg-neutral-900/90 border border-white/20 shadow-2xl text-white select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
              <Zap size={20} />
            </div>
            <div>
              <h2 id="workflow-builder-title" className="text-base font-semibold">
                {existingWorkflow ? 'Modifica Workflow 1-Click' : 'Crea Workflow 1-Click'}
              </h2>
              <p className="text-xs text-white/50">
                Lancia simultaneamente app e apri percorsi su disco con un solo clic
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body Scrollabile */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Nome Workflow */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/70 font-medium">Nome del Workflow</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Sviluppo Web, Studio Mattutino, Gaming..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Stile & Icona */}
          <div className="space-y-2">
            <label className="text-xs text-white/70 font-medium">Icona o Emoji</label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIconStyle({ type: 'default' })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  iconStyle.type === 'default'
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                Predefinito ⚡
              </button>

              {PRESET_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setIconStyle({ type: 'color', colorHex: col })}
                  style={{ backgroundColor: col }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    iconStyle.type === 'color' && iconStyle.colorHex === col
                      ? 'scale-125 border-white shadow-lg'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  title={col}
                />
              ))}

              <div className="h-4 w-[1px] bg-white/20 mx-1" />

              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIconStyle({ type: 'emoji', emoji })}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm border transition-all ${
                    iconStyle.type === 'emoji' && iconStyle.emoji === emoji
                      ? 'bg-white/20 border-white scale-110 shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Selezione Applicazioni */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white/70 font-medium">
                Applicazioni Target ({selectedAppPaths.length})
              </label>
              <span className="text-[11px] text-white/40">Seleziona una o più app</span>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-white/40" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Filtra applicazioni..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-white/10 rounded-2xl bg-white/5">
              {filteredApps.map((app) => {
                const isSelected = selectedAppPaths.includes(app.path);
                return (
                  <div
                    key={app.id}
                    onClick={() => toggleAppSelection(app.path)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400/40 text-white'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <div className="w-5 h-5 shrink-0">
                      <AppIcon
                        id={app.id}
                        name={app.name}
                        iconCachePath={app.iconCachePath}
                        sizePx={20}
                        iconRevision={iconRevision}
                      />
                    </div>
                    <span className="text-xs truncate flex-1">{app.name}</span>
                    {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Percorsi File / Cartelle Finder */}
          <div className="space-y-2">
            <label className="text-xs text-white/70 font-medium">
              File o Cartelle del Finder ({finderPaths.length})
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customPathInput}
                onChange={(e) => setCustomPathInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFinderPath();
                  }
                }}
                placeholder="Inserisci percorso es. ~/Projects/App o ~/Documents..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={handleAddFinderPath}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium border border-white/15 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Aggiungi</span>
              </button>
            </div>

            {finderPaths.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {finderPaths.map((p) => (
                  <div
                    key={p}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-white/90"
                  >
                    <Folder size={12} className="text-blue-400" />
                    <span className="truncate max-w-[200px]" title={p}>
                      {p}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFinderPath(p)}
                      className="p-0.5 rounded hover:bg-white/20 text-white/50 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="text-xs text-white/50 font-mono">
            {totalActions} {totalActions === 1 ? 'azione configurata' : 'azioni configurate'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim() || totalActions === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer ${
                name.trim() && totalActions > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/20'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Zap size={14} />
              <span>Salva Workflow</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilderModal;
