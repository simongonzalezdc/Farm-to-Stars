import { describe, expect, it } from 'vitest';
import { fmt, initWorld, tick } from '../world';
import {
  defaultState,
  type BuildingDefinition,
  type BuildingId,
  type CropsTable,
  type LivestockTable,
  type RecipeDefinition,
  type RecipeId
} from '../types';
import { getSeasonDefinition, getNextSeason, SeasonId } from '../config/seasons';

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
    tick(state, 1.0, buildingDefs, {} as Record<RecipeId, RecipeDefinition>, {} as CropsTable, {} as LivestockTable);
    const springDef = getSeasonDefinition(state.season.active);
    expect(state.resources.wood).toBeGreaterThan(0);
    const baseGain = 0.1 * springDef.multipliers.resourceRate;
    expect(state.resources.wood).toBeCloseTo(baseGain * 2, 5);
    state.resources.wood = 1.25;

    const events = tick(
      state,
      0.1,
      buildingDefs,
      {} as Record<RecipeId, RecipeDefinition>,
      {} as CropsTable,
      {} as LivestockTable
    );

    expect(events).toEqual([
      { type: 'resource.collected', resource: 'wood', amount: 1 }
    ]);
  });

  it('formats resource counts for display', () => {
    expect(fmt(1234.56)).toBe('1,234');
  });

  it('applies seasonal multipliers and emits season change events', () => {
    const state = defaultState();
    initWorld(state);
    const initialDef = getSeasonDefinition(state.season.active);
    state.season.elapsed = initialDef.durationSeconds - 0.01;

    const events = tick(
      state,
      0.02,
      buildingDefs,
      {} as Record<RecipeId, RecipeDefinition>,
      {} as CropsTable,
      {} as LivestockTable
    );

    const expectedSeason = getNextSeason(initialDef.id);
    expect(state.season.active).toBe(expectedSeason);
    expect(events.some((event) => event.type === 'season.changed')).toBe(true);

    const winterState = defaultState();
    winterState.season.active = SeasonId.Winter;
    initWorld(winterState);
    tick(winterState, 1.0, buildingDefs, {} as Record<RecipeId, RecipeDefinition>, {} as CropsTable, {} as LivestockTable);

    const winterDef = getSeasonDefinition(SeasonId.Winter);
    const winterGain = 0.1 * winterDef.multipliers.resourceRate;
    expect(winterState.resources.wood).toBeCloseTo(winterGain * 2, 5);
  });
});
