import React, { useState } from 'react';
import { Check, Image as ImageIcon, Palette, Smile, Sparkles, X } from 'lucide-react';
import type { CustomFolderStyle, CustomFolderStyleType } from '~types';

const PRESET_COLORS = [
  { name: 'Apple Blue', hex: '#007AFF' },
  { name: 'Purple', hex: '#5856D6' },
  { name: 'Pink', hex: '#FF2D55' },
  { name: 'Orange', hex: '#FF9500' },
  { name: 'Yellow', hex: '#FFCC00' },
  { name: 'Green', hex: '#34C759' },
  { name: 'Mint', hex: '#00C7BE' },
  { name: 'Teal', hex: '#30B0C7' },
  { name: 'Cyan', hex: '#32ADE6' },
  { name: 'Graphite', hex: '#8E8E93' },
  { name: 'Obsidian', hex: '#2C2C2E' },
];

const PRESET_EMOJIS = [
  '📁', '🚀', '💼', '💻', '🎮', '🎨', '🎵', '⚙️',
  '📚', '🎬', '💡', '🔥', '🛠️', '📊', '🌐', '🔒',
  '📦', '☕', '⚡', '✨', '📸', '🎧', '🎯', '🧪',
];

interface FolderCustomizerProps {
  currentStyle: CustomFolderStyle;
  folderName: string;
  onSave: (style: CustomFolderStyle) => void;
  onClose: () => void;
}

export const FolderCustomizer: React.FC<FolderCustomizerProps> = ({
  currentStyle,
  folderName,
  onSave,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<CustomFolderStyleType>(currentStyle.type);
  const [colorHex, setColorHex] = useState<string>(currentStyle.colorHex ?? '#007AFF');
  const [emoji, setEmoji] = useState<string>(currentStyle.emoji ?? '📁');
  const [imagePath, setImagePath] = useState<string>(currentStyle.coverImagePath ?? '');

  const handleSave = () => {
    const updated: CustomFolderStyle = {
      type: selectedType,
      colorHex: selectedType === 'color' ? colorHex : undefined,
      emoji: selectedType === 'emoji' ? emoji : undefined,
      coverImagePath: selectedType === 'image' ? imagePath : undefined,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customizer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md flex flex-col gap-5 p-6 rounded-3xl bg-neutral-900/90 border border-white/20 shadow-2xl text-white select-none">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h2 id="customizer-title" className="text-base font-semibold">
              Personalizza Cartella: {folderName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector Stile */}
        <div className="grid grid-cols-4 gap-2 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-medium">
          <button
            type="button"
            onClick={() => setSelectedType('default')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors cursor-pointer ${
              selectedType === 'default' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>2×2 Glass</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('color')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors cursor-pointer ${
              selectedType === 'color' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Palette size={14} />
            <span>Colore</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('emoji')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors cursor-pointer ${
              selectedType === 'emoji' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Smile size={14} />
            <span>Emoji</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('image')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors cursor-pointer ${
              selectedType === 'image' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <ImageIcon size={14} />
            <span>Cover</span>
          </button>
        </div>

        {/* Opzioni Stile Colore */}
        {selectedType === 'color' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs text-white/70">Scegli una tonalità macOS o inserisci un HEX:</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColorHex(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                    colorHex.toLowerCase() === c.hex.toLowerCase() ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : ''
                  }`}
                  aria-label={c.name}
                >
                  {colorHex.toLowerCase() === c.hex.toLowerCase() && <Check size={14} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                aria-label="Selettore colore personalizzato"
              />
              <input
                type="text"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                placeholder="#007AFF"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-1 focus:ring-white/40 font-mono"
              />
            </div>
          </div>
        )}

        {/* Opzioni Stile Emoji */}
        {selectedType === 'emoji' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs text-white/70">Seleziona un'icona emoji:</span>
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                    emoji === e ? 'bg-white/25 ring-2 ring-white' : 'bg-white/5 hover:bg-white/15'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Opzioni Stile Cover Image */}
        {selectedType === 'image' && (
          <div className="flex flex-col gap-2">
            <label htmlFor="image-path-input" className="text-xs text-white/70">
              Percorso file o URL immagine:
            </label>
            <input
              id="image-path-input"
              type="text"
              value={imagePath}
              onChange={(e) => setImagePath(e.target.value)}
              placeholder="/Users/.../cover.png o https://..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-1 focus:ring-white/40"
            />
          </div>
        )}

        {/* Stile Default */}
        {selectedType === 'default' && (
          <p className="text-xs text-white/60 leading-relaxed">
            La cartella utilizzerà l'aspetto nativo Liquid Glass trasparente con l'anteprima delle icone 2×2 delle prime 4 app interne.
          </p>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-xl bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-white text-black hover:bg-white/90 shadow-md transition-colors cursor-pointer"
          >
            Salva Stile
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderCustomizer;
