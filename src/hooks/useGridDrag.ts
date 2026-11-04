import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { CellTarget } from '@/lib/gridLayout';
import { cellFromPoint, type Rect2D } from '@/lib/gridLayout';
import { useLauncherDispatch, useLauncherState } from '@/context/LauncherStateContext';
import { isPointerInNotchZone } from '@/components/notch/DynamicNotchOverlay';

const DRAG_THRESHOLD_PX = 4;
const EDGE_ZONE_PX = 56;
const EDGE_DWELL_MS = 600;

export interface DraggedItemState {
  placementId: string;
  appId: string;
  title: string;
  initialPage: number;
  currentPage: number;
  pointerX: number;
  pointerY: number;
  offsetX: number;
  offsetY: number;
  hoverCell: CellTarget | null;
  mergeTargetPlacementId: string | null;
}

export function useGridDrag(gridContainerRef: React.RefObject<HTMLDivElement | null>) {
  const dispatch = useLauncherDispatch();
  const { grid, viewIndex, editMode, placements, notchMetrics } = useLauncherState();

  const [dragState, setDragState] = useState<DraggedItemState | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const pendingStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    placementId: string;
    appId: string;
    title: string;
    page: number;
  } | null>(null);

  const edgeTimerRef = useRef<number | null>(null);
  const lastEdgeDirRef = useRef<'left' | 'right' | null>(null);

  const clearEdgeTimer = (): void => {
    if (edgeTimerRef.current !== null) {
      window.clearTimeout(edgeTimerRef.current);
      edgeTimerRef.current = null;
    }
    lastEdgeDirRef.current = null;
  };

  const handlePointerDown = useCallback(
    (
      e: ReactPointerEvent<HTMLElement>,
      placementId: string,
      appId: string,
      title: string,
      pageIndex: number,
    ) => {
      if (!editMode || e.button !== 0) return;
      const targetElem = e.currentTarget;
      const rect = targetElem.getBoundingClientRect();

      pendingStartRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        placementId,
        appId,
        title,
        page: pageIndex,
      };

      try {
        targetElem.setPointerCapture(e.pointerId);
        activePointerIdRef.current = e.pointerId;
      } catch (err) {
        console.warn('[useGridDrag] setPointerCapture fallito:', err);
      }
    },
    [editMode],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const pending = pendingStartRef.current;
      if (pending && activePointerIdRef.current === e.pointerId && !dragState) {
        const dist = Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY);
        if (dist >= DRAG_THRESHOLD_PX) {
          // Enter drag state
          setDragState({
            placementId: pending.placementId,
            appId: pending.appId,
            title: pending.title,
            initialPage: pending.page,
            currentPage: viewIndex,
            pointerX: e.clientX,
            pointerY: e.clientY,
            offsetX: pending.offsetX,
            offsetY: pending.offsetY,
            hoverCell: null,
            mergeTargetPlacementId: null,
          });
        }
      }

      if (!dragState || activePointerIdRef.current !== e.pointerId) return;

      const container = gridContainerRef.current;
      let hoverCell: CellTarget | null = null;
      let mergeTargetPlacementId: string | null = null;

      if (container) {
        const cRect = container.getBoundingClientRect();
        const rect2D: Rect2D = {
          left: cRect.left,
          top: cRect.top,
          width: cRect.width,
          height: cRect.height,
        };

        const res = cellFromPoint(rect2D, e.clientX, e.clientY, grid);
        if (res.inside) {
          hoverCell = {
            pageIndex: viewIndex,
            row: res.row,
            col: res.col,
          };

          // Verifica se nella cella hover c'è un elemento su cui raggruppare (merge)
          const targetPl = placements.find(
            (p) =>
              p.pageIndex === viewIndex &&
              p.row === res.row &&
              p.col === res.col &&
              p.id !== dragState.placementId,
          );

          if (targetPl) {
            const cellW = rect2D.width / grid.cols;
            const cellH = rect2D.height / grid.rows;
            const centerX = rect2D.left + (res.col + 0.5) * cellW;
            const centerY = rect2D.top + (res.row + 0.5) * cellH;
            const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
            const mergeThreshold = Math.min(cellW, cellH) * 0.38;
            if (dist <= mergeThreshold) {
              mergeTargetPlacementId = targetPl.id;
            }
          }
        }

        // Protezione anti-collisione con l'area cieca del Notch (Step 6)
        const screenW = typeof window !== 'undefined' ? window.innerWidth : 1920;
        if (isPointerInNotchZone(e.clientX, e.clientY, screenW, notchMetrics)) {
          hoverCell = null;
          mergeTargetPlacementId = null;
        }

        // Edge dwell detection for page change
        const isLeftEdge = e.clientX <= cRect.left + EDGE_ZONE_PX;
        const isRightEdge = e.clientX >= cRect.right - EDGE_ZONE_PX;
        const currentDir = isLeftEdge ? 'left' : isRightEdge ? 'right' : null;

        if (currentDir !== lastEdgeDirRef.current) {
          clearEdgeTimer();
          lastEdgeDirRef.current = currentDir;

          if (currentDir) {
            edgeTimerRef.current = window.setTimeout(() => {
              if (currentDir === 'left' && viewIndex > 0) {
                dispatch({ type: 'SET_VIEW', viewIndex: viewIndex - 1 });
              } else if (currentDir === 'right') {
                dispatch({ type: 'SET_VIEW', viewIndex: viewIndex + 1 });
              }
              clearEdgeTimer();
            }, EDGE_DWELL_MS);
          }
        }
      }

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              pointerX: e.clientX,
              pointerY: e.clientY,
              currentPage: viewIndex,
              hoverCell,
              mergeTargetPlacementId,
            }
          : null,
      );
    },
    [dragState, dispatch, grid, gridContainerRef, notchMetrics, placements, viewIndex],
  );

  const cleanupDrag = useCallback(() => {
    clearEdgeTimer();
    pendingStartRef.current = null;
    activePointerIdRef.current = null;
    setDragState(null);
  }, []);

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (activePointerIdRef.current !== e.pointerId) return;

      if (dragState) {
        if (dragState.mergeTargetPlacementId) {
          dispatch({
            type: 'MERGE_INTO_FOLDER',
            sourcePlacementId: dragState.placementId,
            targetPlacementId: dragState.mergeTargetPlacementId,
          });
        } else if (dragState.hoverCell) {
          dispatch({
            type: 'MOVE_ITEM',
            placementId: dragState.placementId,
            target: dragState.hoverCell,
          });
        }
      }

      cleanupDrag();
    },
    [cleanupDrag, dispatch, dragState],
  );

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', cleanupDrag);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', cleanupDrag);
      clearEdgeTimer();
    };
  }, [cleanupDrag, handlePointerMove, handlePointerUp]);

  return {
    dragState,
    handlePointerDown,
  };
}
