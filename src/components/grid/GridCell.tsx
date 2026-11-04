import React, { memo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Edit3, EyeOff, FolderOpen, FolderPlus, Palette, Trash2 } from 'lucide-react';
import type {
  AppItem,
  CalendarWidgetStyle,
  ClockWidgetStyle,
  FolderItem,
  GridCellPlacement,
  HardwareWidgetStyle,
  MusicWidgetStyle,
  WeatherWidgetStyle,
  WidgetConfig,
  WorkflowItem,
} from '~types';
import AppIcon from './AppIcon';
import FolderIcon from '@/components/folders/FolderIcon';
import WorkflowIcon from '@/components/spaces/WorkflowIcon';
import MusicWidget from '@/components/widgets/MusicWidget';
import WeatherWidget from '@/components/widgets/WeatherWidget';
import HardwareWidget from '@/components/widgets/SystemWidgets/HardwareWidget';
import ClockWidget from '@/components/widgets/SystemWidgets/ClockWidget';
import CalendarWidget from '@/components/widgets/SystemWidgets/CalendarWidget';
import { useLauncherDispatch, useLauncherState } from '@/context/LauncherStateContext';
import { executeWorkflow, launchApp, showInFinder } from '@/services/tauriBridge';
import { stepTarget } from '@/lib/gridLayout';

interface GridCellProps {
  placement?: GridCellPlacement;
  app?: AppItem;
  folder?: FolderItem;
  workflow?: WorkflowItem;
  widget?: WidgetConfig;
  appsMap?: Map<string, AppItem>;
  pageIndex: number;
  row: number;
  col: number;
  isHovered?: boolean;
  isMergeTarget?: boolean;
  isDraggingThis?: boolean;
  onPointerDownDrag?: (
    e: PointerEvent<HTMLElement>,
    placementId: string,
    itemId: string,
    title: string,
    page: number,
  ) => void;
}

export const GridCell: React.FC<GridCellProps> = memo(
  ({
    placement,
    app,
    folder,
    workflow,
    widget,
    appsMap,
    pageIndex,
    row,
    col,
    isHovered = false,
    isMergeTarget = false,
    isDraggingThis = false,
    onPointerDownDrag,
  }) => {
    const dispatch = useLauncherDispatch();
    const { editMode, theme, iconRevision, grid } = useLauncherState();
    const longPressTimerRef = useRef<number | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isFolder = placement?.itemType === 'folder' && folder !== undefined;
    const isWorkflow = placement?.itemType === 'workflow' && workflow !== undefined;
    const isApp = placement?.itemType === 'app' && app !== undefined;
    const isWidget = placement?.itemType === 'widget' && widget !== undefined;
    const itemTitle = isFolder
      ? folder.name
      : isWorkflow
      ? workflow.name
      : isApp
      ? app.name
      : isWidget
      ? widget.type === 'music'
        ? 'Musica'
        : widget.type === 'weather'
        ? 'Meteo'
        : widget.type === 'hardware'
        ? 'Hardware'
        : widget.type === 'clock'
        ? 'Orologio'
        : 'Calendario'
      : '';
    const itemId = isFolder
      ? folder.id
      : isWorkflow
      ? workflow.id
      : isApp
      ? app.id
      : isWidget
      ? widget.id
      : '';

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
      if (!placement || (!app && !folder && !workflow && !widget)) return;

      if (editMode) {
        onPointerDownDrag?.(e, placement.id, itemId, itemTitle, pageIndex);
      } else {
        // Start long press timer to trigger edit mode
        longPressTimerRef.current = window.setTimeout(() => {
          dispatch({ type: 'SET_EDIT_MODE', enabled: true });
        }, 500);
      }
    };

    const handlePointerUpOrCancel = () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const handleClick = () => {
      if (editMode) return;
      if (isFolder) {
        dispatch({ type: 'OPEN_FOLDER', folderId: folder.id });
      } else if (isWorkflow) {
        void executeWorkflow(workflow);
      } else if (isApp) {
        dispatch({ type: 'RECORD_LAUNCH', appId: app.id });
        void launchApp(app.path);
      }
    };

    const handleHide = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isApp) {
        dispatch({ type: 'HIDE_APP', appId: app.id });
      } else if (isFolder) {
        dispatch({ type: 'DELETE_FOLDER', folderId: folder.id });
      } else if (isWorkflow) {
        dispatch({ type: 'DELETE_WORKFLOW', workflowId: workflow.id });
      } else if (isWidget) {
        dispatch({ type: 'DELETE_WIDGET', widgetId: widget.id });
      }
    };

    const cycleWidgetStyle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isWidget) return;
      if (widget.type === 'music') {
        const currentStyle = (widget.settings?.style as MusicWidgetStyle) || 'minimal';
        const styles: MusicWidgetStyle[] = ['minimal', 'full_cover', 'vinyl'];
        const nextStyle = styles[(styles.indexOf(currentStyle) + 1) % styles.length];
        dispatch({
          type: 'UPDATE_WIDGET',
          widgetId: widget.id,
          patch: { settings: { ...widget.settings, style: nextStyle } },
        });
      } else if (widget.type === 'weather') {
        const currentStyle = (widget.settings?.style as WeatherWidgetStyle) || 'compact';
        const styles: WeatherWidgetStyle[] = [
          'compact',
          'minimal',
          'forecast',
          'panel',
          'almanac',
          'horizon',
          'bold',
          'story',
        ];
        const nextStyle = styles[(styles.indexOf(currentStyle) + 1) % styles.length];
        dispatch({
          type: 'UPDATE_WIDGET',
          widgetId: widget.id,
          patch: { settings: { ...widget.settings, style: nextStyle } },
        });
      } else if (widget.type === 'hardware') {
        const currentStyle = (widget.settings?.style as HardwareWidgetStyle) || 'gauges';
        const styles: HardwareWidgetStyle[] = ['gauges', 'graphs', 'minimal'];
        const nextStyle = styles[(styles.indexOf(currentStyle) + 1) % styles.length];
        dispatch({
          type: 'UPDATE_WIDGET',
          widgetId: widget.id,
          patch: { settings: { ...widget.settings, style: nextStyle } },
        });
      } else if (widget.type === 'clock') {
        const currentStyle = (widget.settings?.style as ClockWidgetStyle) || 'analog';
        const styles: ClockWidgetStyle[] = ['analog', 'digital_flip', 'world_clock'];
        const nextStyle = styles[(styles.indexOf(currentStyle) + 1) % styles.length];
        dispatch({
          type: 'UPDATE_WIDGET',
          widgetId: widget.id,
          patch: { settings: { ...widget.settings, style: nextStyle } },
        });
      } else if (widget.type === 'calendar') {
        const currentStyle = (widget.settings?.style as CalendarWidgetStyle) || 'month';
        const styles: CalendarWidgetStyle[] = ['month', 'agenda'];
        const nextStyle = styles[(styles.indexOf(currentStyle) + 1) % styles.length];
        dispatch({
          type: 'UPDATE_WIDGET',
          widgetId: widget.id,
          patch: { settings: { ...widget.settings, style: nextStyle } },
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (!placement || (!app && !folder && !workflow && !widget)) return;

      if (!editMode) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
        return;
      }

      // Keyboard reordering in edit mode
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const dir =
          e.key === 'ArrowUp'
            ? 'up'
            : e.key === 'ArrowDown'
            ? 'down'
            : e.key === 'ArrowLeft'
            ? 'left'
            : 'right';

        const next = stepTarget(
          { pageIndex: placement.pageIndex, row: placement.row, col: placement.col },
          dir,
          grid,
          10,
        );

        dispatch({
          type: 'MOVE_ITEM',
          placementId: placement.id,
          target: next,
        });
      }
    };

    return (
      <div
        data-row={row}
        data-col={col}
        style={{
          gridColumnStart: col + 1,
          gridRowStart: row + 1,
          gridColumnEnd: `span ${placement?.colSpan ?? 1}`,
          gridRowEnd: `span ${placement?.rowSpan ?? 1}`,
        }}
        className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-150 ${
          isMergeTarget
            ? 'bg-blue-500/25 ring-4 ring-blue-400 shadow-xl shadow-blue-500/40 scale-110 z-20'
            : isHovered
            ? 'bg-white/20 ring-2 ring-white/50 scale-105'
            : ''
        }`}
      >
        {isWidget ? (
          <div
            role="region"
            aria-label={`Widget ${widget.type}`}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
            className={`relative w-full h-full flex flex-col justify-center items-center select-none ${
              editMode ? 'edit-wiggle cursor-grab active:cursor-grabbing' : ''
            }`}
          >
            {editMode && (
              <>
                <button
                  type="button"
                  onClick={handleHide}
                  aria-label="Elimina widget"
                  className="absolute -top-1.5 -right-1.5 z-30 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                  title="Elimina widget"
                >
                  <EyeOff size={14} />
                </button>
                <button
                  type="button"
                  onClick={cycleWidgetStyle}
                  aria-label="Cambia stile widget"
                  className="absolute -bottom-1.5 -left-1.5 z-30 p-1.5 bg-amber-500/90 hover:bg-amber-600 text-black rounded-full shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                  title="Cambia stile widget"
                >
                  <Palette size={14} />
                </button>
              </>
            )}
            {widget.type === 'music' ? (
              <MusicWidget widget={widget} size={widget.size} />
            ) : widget.type === 'weather' ? (
              <WeatherWidget widget={widget} size={widget.size} />
            ) : widget.type === 'hardware' ? (
              <HardwareWidget widget={widget} size={widget.size} />
            ) : widget.type === 'clock' ? (
              <ClockWidget widget={widget} size={widget.size} />
            ) : widget.type === 'calendar' ? (
              <CalendarWidget widget={widget} size={widget.size} />
            ) : null}
          </div>
        ) : placement && (app || folder || workflow) ? (
          <div
            role="button"
            tabIndex={0}
            aria-label={`${itemTitle}${editMode ? ', trascina o usa le frecce per spostare' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onContextMenu={(e) => {
              if (isApp) {
                e.preventDefault();
                setIsMenuOpen(true);
              } else if (isWorkflow) {
                e.preventDefault();
                dispatch({ type: 'OPEN_WORKFLOW_BUILDER', workflowId: workflow.id });
              }
            }}
            style={{
              touchAction: editMode ? 'none' : 'auto',
              WebkitUserSelect: 'none',
              opacity: isDraggingThis ? 0.3 : 1,
            }}
            className={`group relative flex flex-col items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-white rounded-2xl p-2 select-none ${
              editMode ? 'edit-wiggle cursor-grab active:cursor-grabbing' : 'hover:scale-105 transition-transform'
            }`}
          >
            {/* Context Menu Clic Destro su App */}
            {isMenuOpen && isApp && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 w-48 p-1.5 rounded-2xl bg-neutral-900/95 border border-white/20 shadow-2xl backdrop-blur-2xl text-white text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 cursor-default">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      dispatch({ type: 'OPEN_APP_CUSTOMIZER', appId: app.id });
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <Palette size={13} className="text-amber-400" />
                    <span>Personalizza Icona...</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      void showInFinder(app.path);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <FolderOpen size={13} className="text-blue-400" />
                    <span>Mostra nel Finder</span>
                  </button>

                  <div className="h-[1px] bg-white/10 my-0.5" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      dispatch({ type: 'OPEN_UNINSTALLER', appId: app.id });
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-left cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Disinstalla (Clean)...</span>
                  </button>
                </div>
              </>
            )}

            {editMode && (
              <>
                <button
                  type="button"
                  onClick={handleHide}
                  aria-label={
                    isFolder
                      ? `Elimina cartella ${folder.name}`
                      : isWorkflow
                      ? `Elimina workflow ${workflow.name}`
                      : `Nascondi ${app?.name}`
                  }
                  className="absolute -top-1 -right-1 z-10 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full shadow-md backdrop-blur-md transition-colors"
                >
                  <EyeOff size={14} />
                </button>

                {isApp && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'OPEN_APP_CUSTOMIZER', appId: app.id });
                      }}
                      aria-label={`Personalizza icona ${app.name}`}
                      className="absolute -bottom-1 -left-1 z-10 p-1 bg-amber-500/80 hover:bg-amber-600 text-white rounded-full shadow-md backdrop-blur-md transition-colors"
                      title="Personalizza icona"
                    >
                      <Palette size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'OPEN_UNINSTALLER', appId: app.id });
                      }}
                      aria-label={`Disinstalla ${app.name}`}
                      className="absolute -bottom-1 -right-1 z-10 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full shadow-md backdrop-blur-md transition-colors"
                      title="Disinstalla (Clean Uninstaller)"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}

                {isWorkflow && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'OPEN_WORKFLOW_BUILDER', workflowId: workflow.id });
                    }}
                    aria-label={`Modifica workflow ${workflow.name}`}
                    className="absolute -bottom-1 -left-1 z-10 p-1 bg-amber-500/80 hover:bg-amber-600 text-white rounded-full shadow-md backdrop-blur-md transition-colors"
                    title="Modifica workflow"
                  >
                    <Edit3 size={13} />
                  </button>
                )}
              </>
            )}

            {isMergeTarget && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-semibold shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95">
                <FolderPlus size={11} />
                <span>{isFolder ? 'Aggiungi' : 'Raggruppa'}</span>
              </div>
            )}

            {isFolder ? (
              <FolderIcon
                folder={folder}
                appsMap={appsMap ?? new Map()}
                sizePx={theme.iconSizePx}
                iconRevision={iconRevision}
              />
            ) : isWorkflow ? (
              <WorkflowIcon workflow={workflow} sizePx={theme.iconSizePx} />
            ) : (
              <AppIcon
                id={app!.id}
                name={app!.name}
                iconCachePath={app!.iconCachePath}
                customIconPath={app!.customIconPath}
                removeIconBg={app!.removeIconBg}
                sizePx={theme.iconSizePx}
                iconRevision={iconRevision}
              />
            )}

            {!theme.hideAppTitles && (
              <span className="text-xs text-white/90 font-medium text-center truncate max-w-[90px] drop-shadow-md">
                {itemTitle}
              </span>
            )}
          </div>
        ) : (
          <div className="w-full h-full min-h-[90px]" />
        )}
      </div>
    );
  },
);

GridCell.displayName = 'GridCell';
export default GridCell;
