import type { BuildingType } from '../types';

export const MAP_WIDTH = 20;
export const MAP_HEIGHT = 20;

type OccupancyKind = 'structure' | 'job';

export interface OccupancyCell {
  kind: OccupancyKind;
  building: BuildingType;
  id: number;
}

export interface OccupancyMap {
  width: number;
  height: number;
  tiles: (OccupancyCell | null)[][];
}

export interface PlacementIssue {
  x: number;
  y: number;
  reason: 'occupied' | 'out-of-bounds';
}

export interface PlacementResult {
  ok: boolean;
  issues: PlacementIssue[];
}

export function createOccupancyMap(width = MAP_WIDTH, height = MAP_HEIGHT): OccupancyMap {
  return {
    width,
    height,
    tiles: Array.from({ length: height }, () => Array.from({ length: width }, () => null))
  };
}

export function withinBounds(map: OccupancyMap, x: number, y: number, w = 1, h = 1) {
  return x >= 0 && y >= 0 && x + w <= map.width && y + h <= map.height;
}

export function validatePlacement(
  map: OccupancyMap,
  x: number,
  y: number,
  w: number,
  h: number
): PlacementResult {
  const issues: PlacementIssue[] = [];
  if (!withinBounds(map, x, y, w, h)) {
    for (let iy = 0; iy < h; iy++) {
      for (let ix = 0; ix < w; ix++) {
        const tx = x + ix;
        const ty = y + iy;
        if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) {
          issues.push({ x: tx, y: ty, reason: 'out-of-bounds' });
        }
      }
    }
    return { ok: false, issues };
  }

  for (let iy = 0; iy < h; iy++) {
    for (let ix = 0; ix < w; ix++) {
      const tx = x + ix;
      const ty = y + iy;
      if (map.tiles[ty][tx]) {
        issues.push({ x: tx, y: ty, reason: 'occupied' });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

function fillArea(
  map: OccupancyMap,
  x: number,
  y: number,
  w: number,
  h: number,
  cell: OccupancyCell | null
) {
  for (let iy = 0; iy < h; iy++) {
    for (let ix = 0; ix < w; ix++) {
      const tx = x + ix;
      const ty = y + iy;
      if (tx >= 0 && ty >= 0 && tx < map.width && ty < map.height) {
        map.tiles[ty][tx] = cell;
      }
    }
  }
}

export function markJob(
  map: OccupancyMap,
  x: number,
  y: number,
  w: number,
  h: number,
  building: BuildingType,
  id: number
) {
  fillArea(map, x, y, w, h, { kind: 'job', building, id });
}

export function markStructure(
  map: OccupancyMap,
  x: number,
  y: number,
  w: number,
  h: number,
  building: BuildingType,
  id: number
) {
  fillArea(map, x, y, w, h, { kind: 'structure', building, id });
}

export function clearArea(map: OccupancyMap, x: number, y: number, w: number, h: number) {
  fillArea(map, x, y, w, h, null);
}
