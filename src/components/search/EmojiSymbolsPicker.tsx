import React, { useMemo, useState } from 'react';
import { Check, Pin, PinOff, Search, X } from 'lucide-react';
import { copyToClipboard } from '@/services/tauriBridge';

const EMOJI_CATEGORIES: Record<string, Array<{ char: string; name: string }>> = {
  Popolari: [
    { char: '🚀', name: 'razzo rocket' },
    { char: '🔥', name: 'fuoco fire flame' },
    { char: '✨', name: 'scintille sparkle stars' },
    { char: '💡', name: 'lampadina idea bulb' },
    { char: '⚡', name: 'fulmine lightning bolt' },
    { char: '❤️', name: 'cuore red heart love' },
    { char: '👍', name: 'pollice in su thumbs up like' },
    { char: '🎉', name: 'festa party tada celebration' },
    { char: '🎯', name: 'bersaglio target bullseye' },
    { char: '☕', name: 'caffe coffee cup' },
  ],
  Faccine: [
    { char: '😀', name: 'sorriso grin smile' },
    { char: '😂', name: 'lacrime gioia laugh tears' },
    { char: '🥰', name: 'innamorato in love hearts' },
    { char: '😎', name: 'occhiali sole cool sunglasses' },
    { char: '🤔', name: 'pensieroso thinking wonder' },
    { char: '😴', name: 'sonno sleep zzz' },
    { char: '🥳', name: 'festa party face' },
    { char: '🤩', name: 'occhi a stella star eyes' },
    { char: '😇', name: 'angelo angel halo' },
    { char: '🤯', name: 'esplosione testa mind blown' },
  ],
  Lavoro: [
    { char: '💻', name: 'laptop computer mac' },
    { char: '📁', name: 'cartella folder' },
    { char: '💼', name: 'valigetta briefcase work' },
    { char: '📊', name: 'grafico chart stats bar' },
    { char: '📈', name: 'crescita trend up' },
    { char: '📝', name: 'nota memo document' },
    { char: '📅', name: 'calendario date calendar' },
    { char: '🔒', name: 'lucchetto lock secure' },
    { char: '🛠️', name: 'attrezzi tools wrench' },
    { char: '📦', name: 'pacco box package' },
  ],
  Simboli: [
    { char: '→', name: 'freccia destra arrow right' },
    { char: '←', name: 'freccia sinistra arrow left' },
    { char: '↑', name: 'freccia su arrow up' },
    { char: '↓', name: 'freccia giu arrow down' },
    { char: '↔', name: 'freccia orizzontale arrow horizontal' },
    { char: '✓', name: 'spunta check mark v' },
    { char: '✗', name: 'croce cross x' },
    { char: '★', name: 'stella star' },
    { char: '•', name: 'punto elenco bullet dot' },
    { char: '—', name: 'trattino lungo em dash' },
    { char: '©', name: 'copyright c' },
    { char: '®', name: 'marchio registrato registered r' },
    { char: '™', name: 'trademark tm' },
  ],
  Matematica: [
    { char: '±', name: 'piu meno plus minus' },
    { char: '×', name: 'moltiplicazione times multiply' },
    { char: '÷', name: 'divisione divide' },
    { char: '√', name: 'radice quadrata square root' },
    { char: '∞', name: 'infinito infinity' },
    { char: '≈', name: 'approssimato approx equal' },
    { char: '≠', name: 'diverso not equal' },
    { char: '≤', name: 'minore uguale less equal' },
    { char: '≥', name: 'maggiore uguale greater equal' },
    { char: 'π', name: 'pi greco pi' },
    { char: '∑', name: 'sommatoria sum' },
    { char: '∆', name: 'delta triangolo triangle' },
  ],
  Valute: [
    { char: '€', name: 'euro eur' },
    { char: '$', name: 'dollaro dollar usd' },
    { char: '£', name: 'sterlina pound gbp' },
    { char: '¥', name: 'yen jpy' },
    { char: '₿', name: 'bitcoin btc crypto' },
    { char: '¢', name: 'cent centesimo' },
  ],
};

const PINNED_STORAGE_KEY = 'launchme.clone.pinned_emojis';
const RECENT_STORAGE_KEY = 'launchme.clone.recent_emojis';

interface EmojiSymbolsPickerProps {
  onClose: () => void;
}

export const EmojiSymbolsPicker: React.FC<EmojiSymbolsPickerProps> = ({ onClose }) => {
  const [search, setSearch] = useState('');
  const [copiedChar, setCopiedChar] = useState<string | null>(null);

  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(PINNED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : ['🚀', '✨', '🔥', '→', '✓', '€'];
    } catch {
      return ['🚀', '✨', '🔥', '→', '✓', '€'];
    }
  });

  const [recents, setRecents] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : ['💡', '👍', '💻'];
    } catch {
      return ['💡', '👍', '💻'];
    }
  });

  const allItems = useMemo(() => {
    const list: Array<{ char: string; name: string }> = [];
    for (const items of Object.values(EMOJI_CATEGORIES)) {
      list.push(...items);
    }
    return list;
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return allItems.filter(
      (item) => item.char.includes(q) || item.name.toLowerCase().includes(q),
    );
  }, [allItems, search]);

  const handleSelect = async (char: string) => {
    await copyToClipboard(char);
    setCopiedChar(char);

    // Salva in recents
    const nextRecents = [char, ...recents.filter((c) => c !== char)].slice(0, 14);
    setRecents(nextRecents);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(nextRecents));

    setTimeout(() => {
      setCopiedChar(null);
    }, 1200);
  };

  const togglePin = (e: React.MouseEvent, char: string) => {
    e.stopPropagation();
    const next = pinned.includes(char) ? pinned.filter((c) => c !== char) : [...pinned, char];
    setPinned(next);
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div
      role="dialog"
      aria-label="Emoji & Simboli"
      onClick={(e) => e.stopPropagation()}
      className="absolute top-12 left-1/2 -translate-x-1/2 w-96 max-h-[460px] flex flex-col p-4 rounded-3xl bg-neutral-900/95 border border-white/20 shadow-2xl backdrop-blur-2xl z-50 text-white select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header & Search */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-white/40" />
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca emoji o simboli..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Copied Feedback Banner */}
      {copiedChar && (
        <div className="flex items-center justify-center gap-1.5 py-1 px-3 my-2 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 animate-in fade-in">
          <Check size={13} />
          <span>Copiato negli appunti: {copiedChar}</span>
        </div>
      )}

      {/* Griglia Contenuto Scrollabile */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-2 pr-1 max-h-[340px]">
        {filteredItems ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-white/50 uppercase">Risultati di ricerca</span>
            {filteredItems.length === 0 ? (
              <span className="text-xs text-white/40 text-center py-6">Nessun simbolo trovato</span>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {filteredItems.map((item) => (
                  <button
                    key={item.char}
                    type="button"
                    onClick={() => handleSelect(item.char)}
                    title={item.name}
                    className="h-10 rounded-xl flex items-center justify-center text-xl hover:bg-white/15 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  >
                    {item.char}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Sezione Pinned */}
            {pinned.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 uppercase">
                  <Pin size={11} />
                  <span>Fissati (Pin)</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {pinned.map((char) => (
                    <div
                      key={char}
                      onClick={() => handleSelect(char)}
                      className="group relative h-10 rounded-xl flex items-center justify-center text-xl hover:bg-white/15 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>{char}</span>
                      <button
                        type="button"
                        onClick={(e) => togglePin(e, char)}
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded-full bg-black/80 text-amber-300 transition-opacity"
                        title="Rimuovi dai fissati"
                      >
                        <PinOff size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sezione Recenti */}
            {recents.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-white/50 uppercase">Usati di recente</span>
                <div className="grid grid-cols-7 gap-1.5">
                  {recents.map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => handleSelect(char)}
                      className="h-10 rounded-xl flex items-center justify-center text-xl hover:bg-white/15 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categorie Standard */}
            {Object.entries(EMOJI_CATEGORIES).map(([cat, items]) => (
              <div key={cat} className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-white/50 uppercase">{cat}</span>
                <div className="grid grid-cols-7 gap-1.5">
                  {items.map((item) => (
                    <div
                      key={item.char}
                      onClick={() => handleSelect(item.char)}
                      title={item.name}
                      className="group relative h-10 rounded-xl flex items-center justify-center text-xl hover:bg-white/15 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>{item.char}</span>
                      <button
                        type="button"
                        onClick={(e) => togglePin(e, item.char)}
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded-full bg-black/80 text-white/60 hover:text-amber-300 transition-opacity"
                        title="Fissa in cima"
                      >
                        <Pin size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default EmojiSymbolsPicker;
