import React, { useMemo, useRef, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLauncherState } from '@/context/LauncherStateContext';
import GridCell from './GridCell';
import AppIcon from './AppIcon';
import { useGridDrag } from '@/hooks/useGridDrag';

interface FreeLayoutGridProps {
  currentGridPage: number;
  pageDirection?: 1 | -1;
}

const slideVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? 70 : -70,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? -70 : 70,
    opacity: 0,
  }),
};

export const FreeLayoutGrid: FC<FreeLayoutGridProps> = ({
  currentGridPage,
  pageDirection = 1,
}) => {
  const { grid, placements, apps, folders, workflows, widgets, theme, iconRevision } = useLauncherState();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { dragState, handlePointerDown } = useGridDrag(containerRef);

  const appMap = useMemo(() => {
    return new Map(apps.map((a) => [a.id, a]));
  }, [apps]);

  const folderMap = useMemo(() => {
    return new Map(folders.map((f) => [f.id, f]));
  }, [folders]);

  const workflowMap = useMemo(() => {
    return new Map(workflows.map((w) => [w.id, w]));
  }, [workflows]);

  const widgetMap = useMemo(() => {
    return new Map(widgets.map((w) => [w.id, w]));
  }, [widgets]);

  // Filter placements for current grid page
  const pagePlacements = useMemo(() => {
    return placements.filter((p) => p.pageIndex === currentGridPage);
  }, [placements, currentGridPage]);

  // Set of coordinates covered by multi-span placements (to avoid overlapping dummy cells)
  const coveredCells = useMemo(() => {
    const set = new Set<string>();
    for (const p of pagePlacements) {
      const rSpan = p.rowSpan ?? 1;
      const cSpan = p.colSpan ?? 1;
      if (rSpan > 1 || cSpan > 1) {
        for (let r = p.row; r < p.row + rSpan; r++) {
          for (let c = p.col; c < p.col + cSpan; c++) {
            if (r !== p.row || c !== p.col) {
              set.add(`${r}:${c}`);
            }
          }
        }
      }
    }
    return set;
  }, [pagePlacements]);

  const placementByCoord = useMemo(() => {
    const map = new Map<string, (typeof placements)[0]>();
    for (const p of pagePlacements) {
      map.set(`${p.row}:${p.col}`, p);
    }
    return map;
  }, [pagePlacements]);

  // Generate 7x5 grid cells
  const cells = useMemo(() => {
    const list: React.ReactNode[] = [];
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (coveredCells.has(`${r}:${c}`)) {
          continue;
        }

        const p = placementByCoord.get(`${r}:${c}`);
        const app = p && p.itemType === 'app' ? appMap.get(p.itemId) : undefined;
        const folder = p && p.itemType === 'folder' ? folderMap.get(p.itemId) : undefined;
        const workflow = p && p.itemType === 'workflow' ? workflowMap.get(p.itemId) : undefined;
        const widget = p && p.itemType === 'widget' ? widgetMap.get(p.itemId) : undefined;

        const isHovered =
          dragState?.hoverCell?.pageIndex === currentGridPage &&
          dragState.hoverCell.row === r &&
          dragState.hoverCell.col === c;
        const isDraggingThis = dragState?.placementId === p?.id;
        const isMergeTarget = dragState?.mergeTargetPlacementId === p?.id;

        list.push(
          <GridCell
            key={`${r}:${c}`}
            placement={p}
            app={app}
            folder={folder}
            workflow={workflow}
            widget={widget}
            appsMap={appMap}
            pageIndex={currentGridPage}
            row={r}
            col={c}
            isHovered={isHovered}
            isMergeTarget={isMergeTarget}
            isDraggingThis={isDraggingThis}
            onPointerDownDrag={handlePointerDown}
          />,
        );
      }
    }
    return list;
  }, [
    grid.rows,
    grid.cols,
    coveredCells,
    placementByCoord,
    appMap,
    folderMap,
    workflowMap,
    widgetMap,
    dragState?.hoverCell,
    dragState?.placementId,
    dragState?.mergeTargetPlacementId,
    currentGridPage,
    handlePointerDown,
  ]);

  const draggedApp = dragState ? appMap.get(dragState.appId) : undefined;

  return (
    <div className="relative flex-1 flex items-center justify-center w-full max-w-6xl mx-auto px-6 overflow-hidden">
      <AnimatePresence mode="wait" custom={pageDirection} initial={false}>
        <motion.div
          key={currentGridPage}
          custom={pageDirection}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
          ref={containerRef}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
          }}
          className="w-full h-full max-h-[75vh] gap-3 p-4 select-none touch-none"
        >
          {cells}
        </motion.div>
      </AnimatePresence>

      {/* Floating Drag Overlay */}
      {dragState && draggedApp && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            transform: `translate3d(${dragState.pointerX - dragState.offsetX}px, ${
              dragState.pointerY - dragState.offsetY
            }px, 0)`,
            pointerEvents: 'none',
            zIndex: 1000,
          }}
          className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/30 shadow-2xl scale-110 rotate-3"
        >
          <AppIcon
            id={draggedApp.id}
            name={draggedApp.name}
            iconCachePath={draggedApp.iconCachePath}
            sizePx={theme.iconSizePx}
            iconRevision={iconRevision}
          />
          {!theme.hideAppTitles && (
            <span className="text-xs text-white font-semibold text-center truncate max-w-[90px] mt-2 drop-shadow-lg">
              {draggedApp.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FreeLayoutGrid;
