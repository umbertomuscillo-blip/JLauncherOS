import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clipboard,
  ExternalLink,
  FileText,
  Folder,
  Link,
  Pin,
  PinOff,
  Trash2,
  X,
} from 'lucide-react';
import type { ClipboardCategory, ClipboardEntry } from '~types';
import {
  clearClipboardHistory,
  copyToClipboard,
  getClipboardHistory,
  quicklookPreview,
  showInFinder,
  toggleFavoriteClipboard,
} from '@/services/tauriBridge';

interface ClipboardDropdownProps {
  onClose: () => void;
}

export const ClipboardDropdown: React.FC<ClipboardDropdownProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<ClipboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<ClipboardCategory | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const list = await getClipboardHistory();
      setEntries(list);
    } catch (err) {
      console.warn('[ClipboardDropdown] Lettura cronologia fallita:', err);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const filteredEntries = useMemo(() => {
    if (activeTab === 'all') return entries;
    if (activeTab === 'favorites') return entries.filter((e) => e.isFavorite);
    return entries.filter((e) => e.category === activeTab);
  }, [entries, activeTab]);

  const handleCopy = async (entry: ClipboardEntry) => {
    await copyToClipboard(entry.content);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    try {
      const isFav = await toggleFavoriteClipboard(entryId);
      setEntries((prev) =>
        prev.map((item) => (item.id === entryId ? { ...item, is_favorite: isFav } : item)),
      );
    } catch (err) {
      console.error('[ClipboardDropdown] Toggle preferito fallito:', err);
    }
  };

  const handleClear = async () => {
    try {
      await clearClipboardHistory();
      await loadHistory();
    } catch (err) {
      console.error('[ClipboardDropdown] Svuotamento fallito:', err);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Cronologia Appunti"
      onClick={(e) => e.stopPropagation()}
      className="absolute top-12 left-1/2 -translate-x-1/2 w-[440px] max-h-[500px] flex flex-col p-4 rounded-3xl bg-neutral-900/95 border border-white/20 shadow-2xl backdrop-blur-2xl z-50 text-white select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Clipboard size={18} className="text-blue-400" />
          <h2 className="text-xs font-semibold tracking-wide uppercase">Cronologia Appunti</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs Categorie */}
      <div className="flex items-center gap-1.5 py-2 overflow-x-auto text-[11px] font-medium border-b border-white/10">
        {[
          { id: 'all', label: 'Tutti' },
          { id: 'favorites', label: 'Fissati (Pin)' },
          { id: 'colors', label: 'Colori' },
          { id: 'links', label: 'Link' },
          { id: 'files', label: 'File' },
          { id: 'text', label: 'Testo' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as ClipboardCategory | 'all')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? 'bg-white/20 text-white font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista Elementi Appunti */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 py-2 pr-1 max-h-[350px]">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-xs text-white/40">
            Nessun elemento negli appunti per questa categoria
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isCopied = copiedId === entry.id;
            const isColor = entry.category === 'colors' && entry.colorHex;
            const isFile = entry.category === 'files';

            return (
              <div
                key={entry.id}
                onClick={() => handleCopy(entry)}
                className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-500/20 border-emerald-400/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                  {/* Swatch Colore */}
                  {isColor && (
                    <div
                      style={{ backgroundColor: entry.colorHex! }}
                      className="w-7 h-7 rounded-xl border border-white/30 shadow-md shrink-0"
                    />
                  )}

                  {/* Icona Tipo */}
                  {!isColor && (
                    <div className="p-2 rounded-xl bg-white/5 text-white/60 shrink-0">
                      {isFile ? (
                        <Folder size={16} />
                      ) : entry.category === 'links' ? (
                        <Link size={16} />
                      ) : (
                        <FileText size={16} />
                      )}
                    </div>
                  )}

                  {/* Testo / Contenuto */}
                  <div className="flex flex-col overflow-hidden flex-1">
                    <span className="text-xs text-white/90 font-mono truncate">
                      {entry.content}
                    </span>
                    <span className="text-[10px] text-white/40 capitalize">
                      {entry.category} · {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Quick Actions su hover */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isFile && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void quicklookPreview(entry.content);
                        }}
                        className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                        title="Anteprima QuickLook (Spazio)"
                      >
                        <ExternalLink size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void showInFinder(entry.content);
                        }}
                        className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                        title="Mostra nel Finder"
                      >
                        <Folder size={13} />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(e, entry.id)}
                    className={`p-1 rounded-lg transition-colors ${
                      entry.isFavorite
                        ? 'text-amber-400 bg-amber-400/10'
                        : 'text-white/40 hover:text-white hover:bg-white/10'
                    }`}
                    title={entry.isFavorite ? 'Rimuovi dai preferiti' : 'Fissa in cima'}
                  >
                    {entry.isFavorite ? <Pin size={13} /> : <PinOff size={13} />}
                  </button>

                  {isCopied && <Check size={14} className="text-emerald-400 ml-1" />}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer con Svuota Cronologia */}
      <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
        <span className="text-[11px] text-white/40">{entries.length} elementi salvati</span>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg text-red-300 hover:bg-red-500/15 transition-colors cursor-pointer"
        >
          <Trash2 size={12} />
          <span>Svuota (tranne fissati)</span>
        </button>
      </div>
    </div>
  );
};

export default ClipboardDropdown;
