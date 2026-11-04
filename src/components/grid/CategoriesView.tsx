import React, { useState } from 'react';
import { ArrowLeft, Clock, EyeOff, Folder, RotateCcw } from 'lucide-react';
import type { AppItem, CategoryCardId } from '~types';
import { useCategoryBuckets, useLauncherDispatch } from '@/context/LauncherStateContext';
import AppIcon from './AppIcon';
import { launchApp } from '@/services/tauriBridge';

const CATEGORY_TITLES: Record<CategoryCardId, { label: string; icon: React.ReactNode }> = {
  recent: { label: 'Usate di recente', icon: <Clock size={18} /> },
  hidden: { label: 'Nascoste', icon: <EyeOff size={18} /> },
  productivity: { label: 'Produttività', icon: <Folder size={18} /> },
  development: { label: 'Sviluppo', icon: <Folder size={18} /> },
  games: { label: 'Giochi', icon: <Folder size={18} /> },
  media: { label: 'Media & Creatività', icon: <Folder size={18} /> },
  utilities: { label: 'Utility di sistema', icon: <Folder size={18} /> },
};

export const CategoriesView: React.FC = () => {
  const buckets = useCategoryBuckets();
  const dispatch = useLauncherDispatch();
  const [selectedCategory, setSelectedCategory] = useState<CategoryCardId | null>(null);

  const handleLaunch = (app: AppItem) => {
    dispatch({ type: 'RECORD_LAUNCH', appId: app.id });
    void launchApp(app.path);
  };

  const handleUnhide = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    dispatch({ type: 'UNHIDE_APP', appId });
  };

  if (selectedCategory) {
    const list = buckets[selectedCategory] || [];
    const info = CATEGORY_TITLES[selectedCategory];

    return (
      <div className="flex flex-col flex-1 w-full max-w-5xl mx-auto px-6 py-4 animate-in fade-in duration-200">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium backdrop-blur-xl transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Tutte le categorie</span>
          </button>
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            {info.icon}
            <span>{info.label}</span>
            <span className="text-white/40 text-sm">({list.length})</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4 overflow-y-auto max-h-[65vh] p-2">
          {list.map((app) => (
            <div
              key={app.id}
              onClick={() => (selectedCategory === 'hidden' ? undefined : handleLaunch(app))}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-transform hover:scale-105 select-none ${
                selectedCategory === 'hidden' ? '' : 'cursor-pointer'
              }`}
            >
              <AppIcon id={app.id} name={app.name} iconCachePath={app.iconCachePath} sizePx={64} />
              <span className="text-xs text-white/90 font-medium text-center truncate max-w-[90px] mt-2">
                {app.name}
              </span>

              {selectedCategory === 'hidden' && (
                <button
                  type="button"
                  onClick={(e) => handleUnhide(e, app.id)}
                  className="mt-2 flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] text-white border border-white/20 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  Ripristina
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Cards Overview
  const activeCategories = (Object.keys(buckets) as CategoryCardId[]).filter(
    (cat) => buckets[cat].length > 0,
  );

  return (
    <div className="flex flex-col flex-1 w-full max-w-5xl mx-auto px-6 py-4 justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto max-h-[70vh] p-2">
        {activeCategories.map((cat) => {
          const apps = buckets[cat];
          const info = CATEGORY_TITLES[cat];
          const previewApps = apps.slice(0, 4);

          return (
            <div
              key={cat}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCategory(cat)}
              className="flex flex-col justify-between p-5 rounded-3xl backdrop-blur-2xl bg-black/40 border border-white/15 hover:border-white/30 shadow-xl transition-all hover:scale-[1.02] cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <span className="text-white/70 group-hover:text-white transition-colors">
                    {info.icon}
                  </span>
                  <span>{info.label}</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70 font-mono">
                  {apps.length}
                </span>
              </div>

              {/* 2x2 preview grid */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 aspect-square">
                {previewApps.map((a) => (
                  <div key={a.id} className="flex items-center justify-center">
                    <AppIcon id={a.id} name={a.name} iconCachePath={a.iconCachePath} sizePx={44} />
                  </div>
                ))}
                {Array.from({ length: 4 - previewApps.length }, (_, i) => (
                  <div key={i} className="rounded-xl bg-white/5" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesView;
