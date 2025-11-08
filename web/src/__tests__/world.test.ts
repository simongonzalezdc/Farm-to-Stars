import { describe, expect, it } from 'vitest';
import { fmt, initWorld, tick } from '../world';
import {
  defaultState,
  type BuildingDefinition,
  type BuildingId,
  type RecipeDefinition,
  type RecipeId
} from '../types';

const buildingDefs = {
  cottage: {
    id: 'cottage',
    label: 'Cottage',
    buildTime: 1,
    footprint: { w: 1, h: 1 }
  }
} as Record<BuildingId, BuildingDefinition>;

describe('world simulation', () => {
  it('emits resource collection events when resources increase externally', () => {
    const state = defaultState();
    initWorld(state);
    state.resources.wood = 1.25;

    const events = tick(state, 0.1, buildingDefs, {} as Record<RecipeId, RecipeDefinition>);

    expect(events).toEqual([
      { type: 'resource.collected', resource: 'wood', amount: 1 }
    ]);
  });

  it('formats resource counts for display', () => {
    expect(fmt(1234.56)).toBe('1,234');
  });
});
