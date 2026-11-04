import { describe, expect, it } from 'vitest';
import {
  autoPlace,
  buildOccupancy,
  cellFromPoint,
  firstFreeCell,
  moveOrSwap,
  normalizePages,
  reconcile,
  stepTarget,
} from './gridLayout';
import type { GridCellPlacement, GridDimensions } from '~types';

const grid: GridDimensions = { cols: 7, rows: 5 };

function samplePlacement(id: string, pageIndex: number, row: number, col: number): GridCellPlacement {
  return {
    id,
    pageIndex,
    row,
    col,
    rowSpan: 1,
    colSpan: 1,
    itemType: 'app',
    itemId: id.replace('app:', ''),
  };
}

describe('gridLayout', () => {
  it('occupancy builds correctly and tracks cells', () => {
    const p1 = samplePlacement('app:p1', 0, 0, 0);
    const p2 = samplePlacement('app:p2', 0, 1, 1);
    const occ = buildOccupancy([p1, p2]);
    expect(occ.get('0:0:0')).toBe('app:p1');
    expect(occ.get('0:1:1')).toBe('app:p2');
    expect(occ.get('0:0:1')).toBeUndefined();
  });

  it('firstFreeCell finds free spot on grid', () => {
    const p1 = samplePlacement('app:p1', 0, 0, 0);
    const occ = buildOccupancy([p1]);
    const free = firstFreeCell(occ, grid, 0);
    expect(free).toEqual({ pageIndex: 0, row: 0, col: 1 });
  });

  it('autoPlace puts new apps into consecutive free slots', () => {
    const initial: GridCellPlacement[] = [samplePlacement('app:a', 0, 0, 0)];
    const result = autoPlace(initial, ['a', 'b', 'c'], grid);
    expect(result.excluded).toHaveLength(0);
    expect(result.placements).toHaveLength(3);
    expect(result.placements[1]).toMatchObject({ itemId: 'b', pageIndex: 0, row: 0, col: 1 });
    expect(result.placements[2]).toMatchObject({ itemId: 'c', pageIndex: 0, row: 0, col: 2 });
  });

  it('reconcile removes deleted apps and duplicates', () => {
    const p1 = samplePlacement('app:a', 0, 0, 0);
    const p2 = samplePlacement('app:b', 0, 0, 1);
    const pDuplicate = samplePlacement('app:dup', 0, 1, 0);
    pDuplicate.itemId = 'a'; // Duplicate app 'a'

    const validApps = new Set(['a']);
    const result = reconcile([p1, p2, pDuplicate], validApps, grid);
    expect(result.placements).toHaveLength(1);
    expect(result.placements[0]?.itemId).toBe('a');
    expect(result.dropped).toHaveLength(2);
  });

  it('moveOrSwap moves to empty cell', () => {
    const p1 = samplePlacement('app:a', 0, 0, 0);
    const result = moveOrSwap([p1], 'app:a', { pageIndex: 0, row: 2, col: 3 }, grid);
    expect(result.outcome).toBe('moved');
    expect(result.placements[0]).toMatchObject({ pageIndex: 0, row: 2, col: 3 });
  });

  it('moveOrSwap swaps with existing cell', () => {
    const p1 = samplePlacement('app:a', 0, 0, 0);
    const p2 = samplePlacement('app:b', 0, 0, 1);
    const result = moveOrSwap([p1, p2], 'app:a', { pageIndex: 0, row: 0, col: 1 }, grid);
    expect(result.outcome).toBe('swapped');
    const a = result.placements.find((p) => p.itemId === 'a');
    const b = result.placements.find((p) => p.itemId === 'b');
    expect(a).toMatchObject({ pageIndex: 0, row: 0, col: 1 });
    expect(b).toMatchObject({ pageIndex: 0, row: 0, col: 0 });
  });

  it('moveOrSwap rejects out of bounds target', () => {
    const p1 = samplePlacement('app:a', 0, 0, 0);
    const result = moveOrSwap([p1], 'app:a', { pageIndex: 0, row: 5, col: 7 }, grid);
    expect(result.outcome).toBe('rejected');
    expect(result.reason).toBeDefined();
  });

  it('normalizePages removes empty intermediate pages and renumbers', () => {
    const p1 = samplePlacement('app:a', 0, 0, 0);
    const p2 = samplePlacement('app:b', 2, 0, 0); // page 1 is empty
    const result = normalizePages([p1, p2]);
    expect(result.changed).toBe(true);
    expect(result.pageCount).toBe(2);
    expect(result.placements.find((p) => p.itemId === 'b')?.pageIndex).toBe(1);
  });

  it('cellFromPoint accurately maps pixel coordinates', () => {
    const rect = { left: 100, top: 50, width: 700, height: 500 };
    // Cell width = 100, height = 100
    const point1 = cellFromPoint(rect, 150, 90, grid);
    expect(point1).toEqual({ col: 0, row: 0, inside: true });

    const point2 = cellFromPoint(rect, 350, 250, grid);
    expect(point2).toEqual({ col: 2, row: 2, inside: true });

    const pointOutside = cellFromPoint(rect, 50, 10, grid);
    expect(pointOutside.inside).toBe(false);
  });

  it('stepTarget supports keyboard arrow navigation', () => {
    const start = { pageIndex: 0, row: 0, col: 0 };
    expect(stepTarget(start, 'right', grid, 1)).toEqual({ pageIndex: 0, row: 0, col: 1 });
    expect(stepTarget(start, 'down', grid, 1)).toEqual({ pageIndex: 0, row: 1, col: 0 });
    expect(stepTarget(start, 'left', grid, 1)).toEqual(start); // hit boundary

    const rightEdge = { pageIndex: 0, row: 0, col: 6 };
    expect(stepTarget(rightEdge, 'right', grid, 2)).toEqual({ pageIndex: 1, row: 0, col: 0 });
  });
});
