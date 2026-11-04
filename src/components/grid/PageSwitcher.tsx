import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';
import { useLauncherDispatch, useLauncherState } from '@/context/LauncherStateContext';

interface PageSwitcherProps {
  totalPages: number;
}

export const PageSwitcher: React.FC<PageSwitcherProps> = ({ totalPages }) => {
  const dispatch = useLauncherDispatch();
  const { viewIndex, theme } = useLauncherState();
  const hasCategories = theme.showCategoriesPageOnLaunch;

  // Total items in switcher: 1 if categories enabled + total grid pages (minimum 1)
  const gridPagesCount = Math.max(1, totalPages);
  const totalItems = hasCategories ? 1 + gridPagesCount : gridPagesCount;

  return (
    <nav
      role="tablist"
      aria-label="Pagine del Launcher"
      className="flex items-center justify-center gap-3 py-3 px-6 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg select-none"
    >
      {Array.from({ length: totalItems }, (_, index) => {
        const isCategoriesTab = hasCategories && index === 0;
        const isSelected = viewIndex === index;

        return (
          <button
            key={index}
            role="tab"
            aria-selected={isSelected}
            aria-label={
              isCategoriesTab
                ? 'Pagina Categorie'
                : `Pagina ${hasCategories ? index : index + 1} di ${gridPagesCount}`
            }
            onClick={() => dispatch({ type: 'SET_VIEW', viewIndex: index })}
            className="relative flex items-center justify-center min-w-[32px] min-h-[32px] cursor-pointer focus-visible:outline-2 focus-visible:outline-white rounded-full transition-transform hover:scale-110"
          >
            {isCategoriesTab ? (
              <LayoutGrid
                size={16}
                className={`transition-colors ${isSelected ? 'text-white' : 'text-white/40'}`}
              />
            ) : (
              <motion.div
                layout
                animate={{
                  width: isSelected ? 24 : 8,
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.3)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="h-2 rounded-full"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default PageSwitcher;
