/**
 * Layout engine della griglia Free Layout: funzioni pure, nessuna dipendenza da React.
 * Coordinate 0-based: pageIndex, row, col. Nessun compattamento automatico.
 */
import { GRID_DEFAULTS, type GridCellPlacement, type GridDimensions } from '~types';

export interface CellTarget {
  pageIndex: number;
  row: number;
  col: number;
}

export type MoveOutcome = 'moved' | 'swapped' | 'unchanged' | 'rejected';

export interface MoveResult {
  placements: GridCellPlacement[];
  outcome: MoveOutcome;
  /** Placement scambiato (solo outcome 'swapped'). */
  swappedWith?: GridCellPlacement;
  /** Motivo del rifiuto (solo outcome 'rejected'). */
  reason?: string;
}

export interface Rect2D {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type Direction = 'left' | 'right' | 'up' | 'down';

const cellKey = (page: number, row: number, col: number): string => `${page}:${row}:${col}`;

export function appPlacementId(appId: string): string {
  return `app:${appId}`;
}

function cellKeysOf(p: GridCellPlacement): string[] {
  const keys: string[] = [];
  for (let r = p.row; r < p.row + p.rowSpan; r += 1) {
    for (let c = p.col; c < p.col + p.colSpan; c += 1) {
      keys.push(cellKey(p.pageIndex, r, c));
    }
  }
  return keys;
}

/** Ritorna il motivo per cui il rettangolo esce dalla griglia, oppure null se è valido. */
function boundsError(t: CellTarget, rowSpan: number, colSpan: number, grid: GridDimensions): string | null {
  if (!Number.isInteger(t.pageIndex) || t.pageIndex < 0 || t.pageIndex >= GRID_DEFAULTS.maxPages) {
    return `pagina ${t.pageIndex + 1} fuori dal limite di ${GRID_DEFAULTS.maxPages} pagine`;
  }
  if (!Number.isInteger(t.row) || !Number.isInteger(t.col) || t.row < 0 || t.col < 0) {
    return 'coordinate di cella non valide';
  }
  if (t.row + rowSpan > grid.rows || t.col + colSpan > grid.cols) {
    return 'la cella non entra nella griglia';
  }
  return null;
}

/** Numero di pagine usate (0 se non c'è nessun posizionamento). */
export function pageCountOf(placements: readonly GridCellPlacement[]): number {
  return placements.reduce((max, p) => Math.max(max, p.pageIndex + 1), 0);
}

/** Mappa cella → id del placement. Le sovrapposizioni vengono segnalate e vince il primo. */
export function buildOccupancy(placements: readonly GridCellPlacement[]): Map<string, string> {
  const occ = new Map<string, string>();
  for (const p of placements) {
    for (const key of cellKeysOf(p)) {
      const existing = occ.get(key);
      if (existing !== undefined && existing !== p.id) {
        console.error(`[gridLayout] sovrapposizione in ${key}: '${existing}' e '${p.id}'`);
      } else {
        occ.set(key, p.id);
      }
    }
  }
  return occ;
}

export interface ReconcileResult {
  placements: GridCellPlacement[];
  /** Descrizione di ogni posizionamento scartato (per il log e per l'utente). */
  dropped: string[];
}

/** Rimuove posizionamenti di app inesistenti, duplicati, fuori griglia o sovrapposti. */
export function reconcile(
  placements: readonly GridCellPlacement[],
  validAppIds: ReadonlySet<string>,
  grid: GridDimensions,
): ReconcileResult {
  const kept: GridCellPlacement[] = [];
  const dropped: string[] = [];
  const seen = new Set<string>();
  const occ = new Set<string>();
  for (const p of placements) {
    const identity = `${p.itemType}:${p.itemId}`;
    let reason: string | null = null;
    if (p.itemType === 'app' && !validAppIds.has(p.itemId)) reason = 'app non più presente';
    else if (seen.has(identity)) reason = 'duplicato';
    else reason = boundsError(p, p.rowSpan, p.colSpan, grid);
    if (reason === null && cellKeysOf(p).some((k) => occ.has(k))) reason = 'cella già occupata';
    if (reason !== null) {
      dropped.push(`${p.itemId} (${reason})`);
      continue;
    }
    seen.add(identity);
    for (const k of cellKeysOf(p)) occ.add(k);
    kept.push(p);
  }
  if (dropped.length > 0) {
    console.warn(`[gridLayout] reconcile: scartati ${dropped.length} posizionamenti:`, dropped);
  }
  return { placements: kept, dropped };
}

/** Prima cella 1×1 libera in una pagina (oppure nella prima pagina con spazio se `pageIndex` è omesso). */
export function firstFreeCell(
  occ: ReadonlyMap<string, string>,
  grid: GridDimensions,
  pageIndex?: number,
): CellTarget | null {
  const pages =
    pageIndex === undefined ? Array.from({ length: GRID_DEFAULTS.maxPages }, (_, i) => i) : [pageIndex];
  for (const page of pages) {
    for (let row = 0; row < grid.rows; row += 1) {
      for (let col = 0; col < grid.cols; col += 1) {
        if (!occ.has(cellKey(page, row, col))) return { pageIndex: page, row, col };
      }
    }
  }
  return null;
}

export interface AutoPlaceResult {
  placements: GridCellPlacement[];
  /** App rimaste senza cella (griglia piena). */
  excluded: string[];
}

/** Assegna una cella libera alle app (nell'ordine dato) che non hanno ancora un posizionamento. */
export function autoPlace(
  placements: readonly GridCellPlacement[],
  appIds: readonly string[],
  grid: GridDimensions,
): AutoPlaceResult {
  const placed = new Set(placements.filter((p) => p.itemType === 'app').map((p) => p.itemId));
  const occ = buildOccupancy(placements);
  const result = [...placements];
  const excluded: string[] = [];
  for (const appId of appIds) {
    if (placed.has(appId)) continue;
    const cell = firstFreeCell(occ, grid);
    if (cell === null) {
      excluded.push(appId);
      continue;
    }
    const placement: GridCellPlacement = {
      id: appPlacementId(appId),
      pageIndex: cell.pageIndex,
      row: cell.row,
      col: cell.col,
      rowSpan: 1,
      colSpan: 1,
      itemType: 'app',
      itemId: appId,
    };
    occ.set(cellKey(cell.pageIndex, cell.row, cell.col), placement.id);
    result.push(placement);
  }
  if (excluded.length > 0) {
    console.error(`[gridLayout] griglia piena: ${excluded.length} app senza cella:`, excluded);
  }
  return { placements: result, excluded };
}

/** Sposta un elemento su una cella (libera → sposta, occupata da un elemento di pari dimensioni → scambia). */
export function moveOrSwap(
  placements: readonly GridCellPlacement[],
  placementId: string,
  target: CellTarget,
  grid: GridDimensions,
): MoveResult {
  const current = placements.find((p) => p.id === placementId);
  if (current === undefined) {
    const reason = `elemento '${placementId}' non trovato`;
    console.error(`[gridLayout] moveOrSwap: ${reason}`);
    return { placements: [...placements], outcome: 'rejected', reason };
  }
  if (current.pageIndex === target.pageIndex && current.row === target.row && current.col === target.col) {
    return { placements: [...placements], outcome: 'unchanged' };
  }
  const bounds = boundsError(target, current.rowSpan, current.colSpan, grid);
  if (bounds !== null) {
    return { placements: [...placements], outcome: 'rejected', reason: bounds };
  }
  const moved: GridCellPlacement = { ...current, ...target };
  const occ = buildOccupancy(placements.filter((p) => p.id !== placementId));
  const blockerIds = new Set<string>();
  for (const key of cellKeysOf(moved)) {
    const id = occ.get(key);
    if (id !== undefined) blockerIds.add(id);
  }
  if (blockerIds.size === 0) {
    return { placements: placements.map((p) => (p.id === placementId ? moved : p)), outcome: 'moved' };
  }
  const [onlyId] = [...blockerIds];
  const blocker = blockerIds.size === 1 ? placements.find((p) => p.id === onlyId) : undefined;
  if (blocker === undefined || blocker.rowSpan !== current.rowSpan || blocker.colSpan !== current.colSpan) {
    return {
      placements: [...placements],
      outcome: 'rejected',
      reason: 'cella occupata da elementi di dimensioni diverse',
    };
  }
  const swapped: GridCellPlacement = {
    ...blocker,
    pageIndex: current.pageIndex,
    row: current.row,
    col: current.col,
  };
  return {
    placements: placements.map((p) => (p.id === placementId ? moved : p.id === blocker.id ? swapped : p)),
    outcome: 'swapped',
    swappedWith: blocker,
  };
}

export interface NormalizeResult {
  placements: GridCellPlacement[];
  pageCount: number;
  /** Vecchio indice di pagina → nuovo indice. */
  remap: Map<number, number>;
  changed: boolean;
}

/** Rimuove le pagine vuote e rinumera gli indici (nessuna cella cambia posizione all'interno della pagina). */
export function normalizePages(placements: readonly GridCellPlacement[]): NormalizeResult {
  const used = [...new Set(placements.map((p) => p.pageIndex))].sort((a, b) => a - b);
  const remap = new Map<number, number>(used.map((page, index) => [page, index]));
  const changed = used.some((page, index) => page !== index);
  const next = changed
    ? placements.map((p) => {
        const pageIndex = remap.get(p.pageIndex) ?? p.pageIndex;
        return pageIndex === p.pageIndex ? p : { ...p, pageIndex };
      })
    : [...placements];
  return { placements: next, pageCount: used.length, remap, changed };
}

/** Cella sotto un punto, rispetto al rettangolo della griglia. `inside` è false se il punto è fuori. */
export function cellFromPoint(
  rect: Rect2D,
  x: number,
  y: number,
  grid: GridDimensions,
): { row: number; col: number; inside: boolean } {
  const inside = x >= rect.left && x < rect.left + rect.width && y >= rect.top && y < rect.top + rect.height;
  const cellW = rect.width / grid.cols;
  const cellH = rect.height / grid.rows;
  const clamp = (v: number, max: number): number => Math.min(Math.max(v, 0), max);
  return {
    col: clamp(Math.floor((x - rect.left) / cellW), grid.cols - 1),
    row: clamp(Math.floor((y - rect.top) / cellH), grid.rows - 1),
    inside,
  };
}

/** Cella adiacente per lo spostamento da tastiera (può attraversare le pagine, anche verso una nuova). */
export function stepTarget(t: CellTarget, dir: Direction, grid: GridDimensions, pageCount: number): CellTarget {
  const lastPage = Math.min(pageCount, GRID_DEFAULTS.maxPages - 1);
  switch (dir) {
    case 'left':
      if (t.col > 0) return { ...t, col: t.col - 1 };
      return t.pageIndex > 0 ? { pageIndex: t.pageIndex - 1, row: t.row, col: grid.cols - 1 } : t;
    case 'right':
      if (t.col < grid.cols - 1) return { ...t, col: t.col + 1 };
      return t.pageIndex < lastPage ? { pageIndex: t.pageIndex + 1, row: t.row, col: 0 } : t;
    case 'up':
      return t.row > 0 ? { ...t, row: t.row - 1 } : t;
    case 'down':
      return t.row < grid.rows - 1 ? { ...t, row: t.row + 1 } : t;
  }
}
