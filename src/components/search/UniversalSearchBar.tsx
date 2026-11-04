import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator,
  Clipboard,
  Eye,
  File,
  Folder,
  Search,
  Smile,
  Trash2,
  X,
} from 'lucide-react';
import type { AppItem, FileSearchResult } from '~types';
import { useLauncherDispatch, useLauncherState } from '@/context/LauncherStateContext';
import {
  copyToClipboard,
  launchApp,
  quicklookPreview,
  searchFiles,
  showInFinder,
  trashFile,
} from '@/services/tauriBridge';
import { evaluateMathExpression, type MathEvaluationResult } from '@/services/calculatorEngine';
import AppIcon from '@/components/grid/AppIcon';
import ClipboardDropdown from './ClipboardDropdown';
import EmojiSymbolsPicker from './EmojiSymbolsPicker';

export const UniversalSearchBar: React.FC = () => {
  const dispatch = useLauncherDispatch();
  const { apps, iconRevision } = useLauncherState();

  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [fileResults, setFileResults] = useState<FileSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Shortcut globale Cmd+K per mettere a fuoco la barra
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // 1. Calcolo matematico in tempo reale
  const mathResult: MathEvaluationResult | null = useMemo(() => {
    return evaluateMathExpression(query);
  }, [query]);

  // 2. Filtraggio App in memoria (<1ms)
  const matchedApps: AppItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || mathResult) return [];
    return apps
      .filter((a) => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
      .slice(0, 6);
  }, [apps, query, mathResult]);

  // 3. Ricerca File con mdfind (debounced 120ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || mathResult) {
      setFileResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await searchFiles(trimmed, 8);
        setFileResults(res);
      } catch (err) {
        console.warn('[UniversalSearchBar] Ricerca file fallita:', err);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, mathResult]);

  // Totale elementi navigabili da tastiera
  const totalNavItems = (mathResult ? 1 : 0) + matchedApps.length + fileResults.length;

  // Gestione tastiera (Frecce, Invio, Spazio per QuickLook, Esc)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (totalNavItems > 0 ? (prev + 1) % totalNavItems : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (totalNavItems > 0 ? (prev - 1 + totalNavItems) % totalNavItems : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSelected();
    } else if (e.key === ' ' && !query.trim()) {
      // Ignora spazio vuoto
    } else if (e.key === ' ' && fileResults.length > 0) {
      // Se l'elemento selezionato è un file, la barra spaziatrice apre QuickLook
      const fileIndex = selectedIndex - (mathResult ? 1 : 0) - matchedApps.length;
      const targetFile = fileResults[fileIndex];
      if (fileIndex >= 0 && targetFile) {
        e.preventDefault();
        void quicklookPreview(targetFile.path);
      }
    } else if (e.key === 'Escape') {
      if (isClipboardOpen) {
        setIsClipboardOpen(false);
      } else if (isEmojiPickerOpen) {
        setIsEmojiPickerOpen(false);
      } else if (query) {
        setQuery('');
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const handleExecuteSelected = async () => {
    let currentIndex = 0;

    // 1. Math result
    if (mathResult) {
      if (selectedIndex === currentIndex) {
        await copyToClipboard(mathResult.formatted);
        dispatch({ type: 'DISMISS_PERSIST_ERROR' });
        setQuery(mathResult.formatted);
        return;
      }
      currentIndex++;
    }

    // 2. Apps
    for (const app of matchedApps) {
      if (selectedIndex === currentIndex) {
        dispatch({ type: 'RECORD_LAUNCH', appId: app.id });
        void launchApp(app.path);
        return;
      }
      currentIndex++;
    }

    // 3. Files
    for (const file of fileResults) {
      if (selectedIndex === currentIndex) {
        void launchApp(file.path);
        return;
      }
      currentIndex++;
    }
  };

  const hasDropdownContent = isFocused && (mathResult !== null || matchedApps.length > 0 || fileResults.length > 0);

  return (
    <div className="relative flex items-center justify-center w-full max-w-xl mx-auto z-30">
      {/* Search Input Bar Liquid Glass */}
      <div
        className={`relative flex items-center w-full h-10 px-3.5 rounded-full backdrop-blur-2xl border transition-all select-none ${
          isFocused
            ? 'bg-black/50 border-white/40 ring-2 ring-white/25 shadow-2xl scale-[1.01]'
            : 'bg-white/10 border-white/15 hover:bg-white/15'
        }`}
      >
        <Search size={15} className="text-white/40 mr-2.5 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Piccolo delay per consentire i clic sui risultati
            setTimeout(() => setIsFocused(false), 200);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Cerca app, file, calcola o digita :emoji (⌘K)..."
          className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-1 rounded-full text-white/40 hover:text-white mr-1 cursor-pointer"
          >
            <X size={13} />
          </button>
        )}

        {/* Pulsanti Rapidi Clipboard & Emoji */}
        <div className="flex items-center gap-1 pl-2 border-l border-white/15 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsEmojiPickerOpen(false);
              setIsClipboardOpen(!isClipboardOpen);
            }}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isClipboardOpen ? 'bg-white/20 text-blue-400' : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
            title="Cronologia Appunti"
          >
            <Clipboard size={14} />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsClipboardOpen(false);
              setIsEmojiPickerOpen(!isEmojiPickerOpen);
            }}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isEmojiPickerOpen ? 'bg-white/20 text-amber-400' : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
            title="Emoji & Simboli"
          >
            <Smile size={14} />
          </button>
        </div>
      </div>

      {/* Dropdown Risultati Polimorfici (Calcolo / App / File) */}
      {hasDropdownContent && (
        <div className="absolute top-12 left-0 right-0 max-h-[460px] overflow-y-auto flex flex-col gap-3 p-3 rounded-3xl bg-neutral-900/95 border border-white/20 shadow-2xl backdrop-blur-2xl text-white select-none animate-in fade-in zoom-in-95 duration-150">
          {/* Sezione 1: Risultato Calcolo Matematico */}
          {mathResult && (
            <div
              onClick={handleExecuteSelected}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                selectedIndex === 0 ? 'bg-blue-600/30 border-blue-400/50 shadow-md' : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                  <Calculator size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-white/50 font-mono">{mathResult.expression} =</span>
                  <span className="text-base font-bold text-white font-mono">{mathResult.formatted}</span>
                </div>
              </div>
              <span className="text-[10px] text-white/40 font-mono">Premi Invio per copiare</span>
            </div>
          )}

          {/* Sezione 2: Applicazioni Trovate */}
          {matchedApps.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-white/40 uppercase px-2">Applicazioni</span>
              {matchedApps.map((app, idx) => {
                const itemIndex = (mathResult ? 1 : 0) + idx;
                const isSelected = selectedIndex === itemIndex;

                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      dispatch({ type: 'RECORD_LAUNCH', appId: app.id });
                      void launchApp(app.path);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/80'
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
                        <span className="text-xs font-semibold text-white">{app.name}</span>
                        <span className="text-[10px] text-white/40 capitalize">{app.category}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">Apri</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sezione 3: File e Cartelle Spotlight */}
          {fileResults.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-white/10 pt-2">
              <span className="text-[10px] font-mono text-white/40 uppercase px-2">File e Documenti</span>
              {fileResults.map((file, idx) => {
                const itemIndex = (mathResult ? 1 : 0) + matchedApps.length + idx;
                const isSelected = selectedIndex === itemIndex;

                return (
                  <div
                    key={file.path}
                    onClick={() => void launchApp(file.path)}
                    className={`group flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                      <div className="p-2 rounded-xl bg-white/5 text-white/60 shrink-0">
                        {file.is_directory ? <Folder size={15} /> : <File size={15} />}
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1">
                        <span className="text-xs font-semibold text-white truncate">{file.name}</span>
                        <span className="text-[10px] text-white/40 font-mono truncate">{file.path}</span>
                      </div>
                    </div>

                    {/* Quick Actions su File */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void quicklookPreview(file.path);
                        }}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        title="Anteprima QuickLook (Spazio)"
                      >
                        <Eye size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void showInFinder(file.path);
                        }}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        title="Mostra nel Finder"
                      >
                        <Folder size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await trashFile(file.path);
                          setFileResults((prev) => prev.filter((f) => f.path !== file.path));
                        }}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                        title="Sposta nel Cestino"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dropdown Clipboard History */}
      {isClipboardOpen && <ClipboardDropdown onClose={() => setIsClipboardOpen(false)} />}

      {/* Emoji & Symbols Picker */}
      {isEmojiPickerOpen && <EmojiSymbolsPicker onClose={() => setIsEmojiPickerOpen(false)} />}
    </div>
  );
};

export default UniversalSearchBar;
