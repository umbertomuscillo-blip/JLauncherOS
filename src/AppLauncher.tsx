import { useCallback, useEffect, useState, type FC } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useVisibilityPause } from '@/context/VisibilityPauseContext';
import { useLauncherDispatch, useLauncherState } from '@/context/LauncherStateContext';
import { useAppScan } from '@/hooks/useAppScan';
import { useTrackpadSwipe } from '@/hooks/useTrackpadSwipe';
import { LauncherTopBar } from '@/components/grid/LauncherTopBar';
import { FreeLayoutGrid } from '@/components/grid/FreeLayoutGrid';
import { CategoriesView } from '@/components/grid/CategoriesView';
import { PageSwitcher } from '@/components/grid/PageSwitcher';
import FolderModal from '@/components/folders/FolderModal';
import BatchFolderCreator from '@/components/folders/BatchFolderCreator';
import WallpaperRenderer from '@/components/wallpaper/WallpaperRenderer';
import ThemeSettingsModal from '@/components/settings/ThemeSettingsModal';
import AppIconCustomizerModal from '@/components/grid/AppIconCustomizerModal';
import SpaceSwitcherModal from '@/components/spaces/SpaceSwitcherModal';
import WorkflowBuilderModal from '@/components/spaces/WorkflowBuilderModal';
import CleanUninstallModal from '@/components/settings/CleanUninstallModal';
import DynamicNotchOverlay from '@/components/notch/DynamicNotchOverlay';
import { pageCountOf } from '@/lib/gridLayout';

const AppLauncher: FC = () => {
  const { isLauncherVisible } = useVisibilityPause();
  const {
    viewIndex,
    editMode,
    theme,
    placements,
    openFolderId,
    isBatchCreatorOpen,
    isThemeModalOpen,
    customizingAppId,
    isSpaceModalOpen,
    isWorkflowModalOpen,
    uninstallingAppId,
    spaces,
    activeSpaceId,
    notchMetrics,
  } = useLauncherState();
  const dispatch = useLauncherDispatch();

  // Direzione dello slide per animazione Framer Motion: 1 = avanti (verso sinistra), -1 = indietro (verso destra)
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);

  // Scansione e prefetch automatici coordinati con la visibilità
  useAppScan(isLauncherVisible);

  // Gestione tasto Esc gerarchica (Modal tema/icone/cartelle -> Edit Mode -> Chiusura Launcher)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      // Scorciatoie ⌘1, ⌘2, ⌘3... per switch rapido tra gli Spaces
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        !event.altKey &&
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(event.key)
      ) {
        const spaceIndex = Number(event.key) - 1;
        const targetSpace = spaces[spaceIndex];
        if (targetSpace) {
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'SWITCH_SPACE', spaceId: targetSpace.id });
          return;
        }
      }

      if (event.key === 'Escape') {
        if (uninstallingAppId !== null) {
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'CLOSE_UNINSTALLER' });
          return;
        }

        if (isSpaceModalOpen) {
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'SET_SPACE_MODAL_OPEN', open: false });
          return;
        }

        if (isWorkflowModalOpen) {
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'CLOSE_WORKFLOW_BUILDER' });
          return;
        }

        if (isThemeModalOpen) {
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'SET_THEME_MODAL_OPEN', open: false });
          return;
        }

        if (customizingAppId !== null) {
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'CLOSE_APP_CUSTOMIZER' });
          return;
        }

        if (openFolderId !== null) {
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'CLOSE_FOLDER' });
          return;
        }

        if (isBatchCreatorOpen) {
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'SET_BATCH_CREATOR_OPEN', open: false });
          return;
        }

        if (editMode) {
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'SET_EDIT_MODE', enabled: false });
          return;
        }
      }
    };

    // Usiamo capture phase per intercettare prima del listener globale di chiusura finestra
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [
    editMode,
    openFolderId,
    isBatchCreatorOpen,
    isThemeModalOpen,
    customizingAppId,
    isSpaceModalOpen,
    isWorkflowModalOpen,
    uninstallingAppId,
    spaces,
    dispatch,
  ]);

  const hasCategories = theme.showCategoriesPageOnLaunch;
  const isCategoriesView = hasCategories && viewIndex === 0;
  const currentGridPage = hasCategories ? Math.max(0, viewIndex - 1) : viewIndex;
  const totalGridPages = Math.max(1, pageCountOf(placements));
  const totalItems = hasCategories ? 1 + totalGridPages : totalGridPages;

  // Gestione Swipe orizzontale a due dita da Trackpad macOS
  const handleSwipeLeft = useCallback(() => {
    if (viewIndex < totalItems - 1) {
      setPageDirection(1);
      dispatch({ type: 'SET_VIEW', viewIndex: viewIndex + 1 });
    } else if (spaces.length > 1) {
      // Al termine delle pagine, passa allo Space successivo
      const currentSpaceIdx = spaces.findIndex((s) => s.id === activeSpaceId);
      const nextSpaceIdx = (currentSpaceIdx + 1) % spaces.length;
      const nextSpace = spaces[nextSpaceIdx];
      if (nextSpace) {
        setPageDirection(1);
        dispatch({ type: 'SWITCH_SPACE', spaceId: nextSpace.id });
      }
    }
  }, [viewIndex, totalItems, spaces, activeSpaceId, dispatch]);

  const handleSwipeRight = useCallback(() => {
    if (viewIndex > 0) {
      setPageDirection(-1);
      dispatch({ type: 'SET_VIEW', viewIndex: viewIndex - 1 });
    } else if (spaces.length > 1) {
      // Alla prima pagina, passa allo Space precedente
      const currentSpaceIdx = spaces.findIndex((s) => s.id === activeSpaceId);
      const prevSpaceIdx = (currentSpaceIdx - 1 + spaces.length) % spaces.length;
      const prevSpace = spaces[prevSpaceIdx];
      if (prevSpace) {
        setPageDirection(-1);
        dispatch({ type: 'SWITCH_SPACE', spaceId: prevSpace.id });
      }
    }
  }, [viewIndex, spaces, activeSpaceId, dispatch]);

  const isModalOpen = Boolean(
    openFolderId !== null ||
    isBatchCreatorOpen ||
    isThemeModalOpen ||
    customizingAppId !== null ||
    isSpaceModalOpen ||
    isWorkflowModalOpen ||
    uninstallingAppId !== null
  );

  useTrackpadSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    disabled: isModalOpen,
    threshold: 45,
    cooldownMs: 400,
  });

  // Stile dinamico Liquid Glass vs Flat
  const isFlat = theme.uiTheme === 'flat';

  return (
    <div
      className={`fixed inset-0 flex flex-col text-white select-none overflow-hidden transition-all duration-300 ${
        isFlat ? 'bg-neutral-950/80' : 'bg-black/35 backdrop-blur-3xl'
      }`}
    >
      {/* Motore Wallpaper (Statico, Dinamico HEIC, Live Video, Sole, Meteo) */}
      <WallpaperRenderer />

      {/* Dynamic Notch Engine (Step 6) */}
      <DynamicNotchOverlay />

      {/* Area di rispetto per il Notch hardware di macOS */}
      <div
        style={{
          height: notchMetrics.hasNotch
            ? `${Math.max(notchMetrics.topInset, 32) + 4}px`
            : '36px',
        }}
        className="shrink-0 transition-all duration-300"
        aria-hidden="true"
      />

      {/* Barra superiore: controlli Edit Mode, Categorie, Chiudi, + Cartella, Tema */}
      <LauncherTopBar />

      {/* Contenuto principale: Categorie o Griglia Free-Layout */}
      <main className="flex-1 flex flex-col items-center justify-center relative w-full overflow-hidden px-6">
        {isCategoriesView ? (
          <CategoriesView />
        ) : (
          <FreeLayoutGrid currentGridPage={currentGridPage} pageDirection={pageDirection} />
        )}
      </main>

      {/* Barra inferiore: Switcher di pagina paginato */}
      <footer className="flex justify-center items-center pb-6 z-20">
        <PageSwitcher totalPages={totalGridPages} />
      </footer>

      {/* Modale Spazi di Lavoro (Spaces) */}
      <AnimatePresence>
        {isSpaceModalOpen && <SpaceSwitcherModal />}
      </AnimatePresence>

      {/* Modale Creazione / Modifica Workflow 1-Click */}
      <AnimatePresence>
        {isWorkflowModalOpen && <WorkflowBuilderModal />}
      </AnimatePresence>

      {/* Modale Cartella Ibrida (App + Finder Folders) */}
      <AnimatePresence>
        {openFolderId !== null && <FolderModal />}
      </AnimatePresence>

      {/* Modale Creazione Cartelle in Batch */}
      <AnimatePresence>
        {isBatchCreatorOpen && <BatchFolderCreator />}
      </AnimatePresence>

      {/* Modale Impostazioni Tema & Wallpaper Engine */}
      <AnimatePresence>
        {isThemeModalOpen && <ThemeSettingsModal />}
      </AnimatePresence>

      {/* Modale Personalizzazione Singola Icona App */}
      <AnimatePresence>
        {customizingAppId !== null && <AppIconCustomizerModal />}
      </AnimatePresence>

      {/* Modale Clean Uninstaller (Step 4B) */}
      <AnimatePresence>
        {uninstallingAppId !== null && <CleanUninstallModal />}
      </AnimatePresence>
    </div>
  );
};

export default AppLauncher;
