import { describe, expect, it } from 'vitest';
import { fmt, initWorld, tick } from '../world';
import { defaultState, type BuildingDefinition, type BuildingId } from '../types';

const buildingDefs = {
  cottage: {
    id: 'cottage',
    label: 'Cottage',
    buildTime: 1,
    footprint: { w: 1, h: 1 }
  }
} as Record<BuildingId, BuildingDefinition>;

describe('world simulation', () => {
  it('increments wood based on elapsed time', () => {
    const state = defaultState();
    initWorld(state);
    tick(state, 1.0, buildingDefs);
    expect(state.resources.wood).toBeGreaterThan(0);
    expect(state.resources.wood).toBeCloseTo(0.1, 5);
  });

  it('formats resource counts for display', () => {
    expect(fmt(1234.56)).toBe('1,234');
  });
});
