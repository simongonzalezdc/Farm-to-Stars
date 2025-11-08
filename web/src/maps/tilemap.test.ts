import { describe, expect, it } from 'vitest';

import {
  createOccupancyMap,
  markJob,
  markStructure,
  validatePlacement
} from './tilemap';

describe('validatePlacement', () => {
  it('accepts placements fully inside free tiles', () => {
    const map = createOccupancyMap(8, 8);
    const result = validatePlacement(map, 2, 3, 2, 2);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('flags tiles that fall outside the map bounds', () => {
    const map = createOccupancyMap(5, 5);
    const result = validatePlacement(map, 4, 4, 2, 2);
    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ x: 5, y: 4, reason: 'out-of-bounds' }),
        expect.objectContaining({ x: 4, y: 5, reason: 'out-of-bounds' })
      ])
    );
  });

  it('identifies overlaps with existing structures and jobs', () => {
    const map = createOccupancyMap(6, 6);
    markStructure(map, 1, 1, 2, 2, 'cottage', 1);
    markJob(map, 3, 1, 2, 1, 'road', 99);

    const overlapStructure = validatePlacement(map, 1, 1, 2, 2);
    expect(overlapStructure.ok).toBe(false);
    expect(overlapStructure.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ x: 1, y: 1, reason: 'occupied' })])
    );

    const overlapJob = validatePlacement(map, 3, 1, 2, 1);
    expect(overlapJob.ok).toBe(false);
    expect(overlapJob.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ x: 3, y: 1, reason: 'occupied' })])
    );
  });
});
