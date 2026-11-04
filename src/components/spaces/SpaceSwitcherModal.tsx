import React, { useState } from 'react';
import {
  Clock,
  Command,
  Copy,
  Layers,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useLauncherDispatch, useLauncherState } from '@/context/LauncherStateContext';

export const SpaceSwitcherModal: React.FC = () => {
  const dispatch = useLauncherDispatch();
  const { isSpaceModalOpen, spaces, activeSpaceId } = useLauncherState();

  const [newSpaceName, setNewSpaceName] = useState('');
  const [duplicateCurrent, setDuplicateCurrent] = useState(false);
  const [newHotkey, setNewHotkey] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);

  // Form temporaneo per modifica inline
  const [editName, setEditName] = useState('');
  const [editHotkey, setEditHotkey] = useState('');
  const [editScheduleTime, setEditScheduleTime] = useState('');

  if (!isSpaceModalOpen) return null;

  const handleClose = () => {
    dispatch({ type: 'SET_SPACE_MODAL_OPEN', open: false });
    setEditingSpaceId(null);
  };

  const handleSwitchSpace = (spaceId: string) => {
    dispatch({ type: 'SWITCH_SPACE', spaceId });
  };

  const handleCreateSpace = () => {
    const trimmed = newSpaceName.trim();
    if (!trimmed) return;

    dispatch({
      type: 'CREATE_SPACE',
      name: trimmed,
      duplicateCurrent,
      hotkey: newHotkey.trim() || undefined,
      scheduleTime: newScheduleTime.trim() || undefined,
    });

    setNewSpaceName('');
    setDuplicateCurrent(false);
    setNewHotkey('');
    setNewScheduleTime('');
  };

  const handleDeleteSpace = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_SPACE', spaceId });
  };

  const startEdit = (e: React.MouseEvent, sp: (typeof spaces)[0]) => {
    e.stopPropagation();
    setEditingSpaceId(sp.id);
    setEditName(sp.name);
    setEditHotkey(sp.hotkey ?? '');
    setEditScheduleTime(sp.scheduleTime ?? '');
  };

  const saveEdit = (spaceId: string) => {
    dispatch({
      type: 'UPDATE_SPACE',
      spaceId,
      name: editName.trim() || undefined,
      hotkey: editHotkey.trim() || undefined,
      scheduleTime: editScheduleTime.trim() || undefined,
    });
    setEditingSpaceId(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="spaces-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col gap-4 p-6 rounded-3xl bg-neutral-900/90 border border-white/20 shadow-2xl text-white select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
              <Layers size={20} />
            </div>
            <div>
              <h2 id="spaces-modal-title" className="text-base font-semibold">
                Spazi di Lavoro (Spaces)
              </h2>
              <p className="text-xs text-white/50">
                Preset completi e separati per griglia, app, cartelle, sfondi e Notch
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

        {/* Lista degli Spazi */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[46vh]">
          {spaces.map((sp, idx) => {
            const isActive = sp.id === activeSpaceId;
            const isEditing = sp.id === editingSpaceId;

            if (isEditing) {
              return (
                <div
                  key={sp.id}
                  className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-400/40 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nome spazio"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="time"
                      value={editScheduleTime}
                      onChange={(e) => setEditScheduleTime(e.target.value)}
                      className="px-2 py-1 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none"
                      title="Orario attivazione programmata"
                    />
                    <input
                      type="text"
                      value={editHotkey}
                      onChange={(e) => setEditHotkey(e.target.value)}
                      placeholder="Hotkey (es. ⌘2)"
                      className="w-24 px-2 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSpaceId(null)}
                      className="px-3 py-1 rounded-lg text-xs text-white/60 hover:text-white"
                    >
                      Annulla
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEdit(sp.id)}
                      className="px-3 py-1 rounded-lg bg-purple-500 text-white text-xs font-semibold hover:bg-purple-400"
                    >
                      Salva
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={sp.id}
                onClick={() => handleSwitchSpace(sp.id)}
                className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-500/20 border-purple-400/50 shadow-lg shadow-purple-500/10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isActive ? 'bg-purple-500 text-white shadow-md' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <div className="flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{sp.name}</span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-400 text-black font-bold text-[10px]">
                          Attivo
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-white/40">
                      {sp.placements.length} elementi · {sp.folders.length} cartelle ·{' '}
                      {sp.workflows.length} workflow
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Orario Programmato */}
                  {sp.scheduleTime && (
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-amber-300"
                      title="Attivazione automatica programmata"
                    >
                      <Clock size={11} />
                      <span>{sp.scheduleTime}</span>
                    </div>
                  )}

                  {/* Hotkey */}
                  {sp.hotkey && (
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/60 font-mono"
                      title="Scorciatoia tastiera"
                    >
                      <Command size={11} />
                      <span>{sp.hotkey.replace('CommandOrControl+', '')}</span>
                    </div>
                  )}

                  {/* Pulsante Modifica */}
                  <button
                    type="button"
                    onClick={(e) => startEdit(e, sp)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    title="Modifica parametri spazio"
                  >
                    Modifica
                  </button>

                  {/* Pulsante Elimina (solo se ci sono più spazi) */}
                  {spaces.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSpace(e, sp.id)}
                      className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Elimina spazio"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Creazione Nuovo Spazio */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
            <Plus size={14} className="text-purple-400" />
            <span>Crea Nuovo Spazio</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              placeholder="Nome (es. Lavoro, Studio)"
              className="col-span-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
            />
            <input
              type="time"
              value={newScheduleTime}
              onChange={(e) => setNewScheduleTime(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
              title="Orario attivazione programmata"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={duplicateCurrent}
                onChange={(e) => setDuplicateCurrent(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-purple-500 focus:ring-0 cursor-pointer"
              />
              <Copy size={13} className="text-white/40" />
              <span>Duplica layout e sfondo attuali</span>
            </label>

            <button
              type="button"
              onClick={handleCreateSpace}
              disabled={!newSpaceName.trim()}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer ${
                newSpaceName.trim()
                  ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Plus size={14} />
              <span>Aggiungi Space</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceSwitcherModal;
