import { describe, expect, it } from 'vitest';
import { processConstruction } from '../construction';
import { defaultState, type BuildingDefinition, type BuildingId } from '../../types';

const buildingDefs = {
  cottage: {
    id: 'cottage',
    label: 'Cottage',
    buildTime: 5,
    footprint: { w: 1, h: 1 }
  }
} as Record<BuildingId, BuildingDefinition>;

describe('processConstruction', () => {
  it('decrements remaining time for active jobs', () => {
    const state = defaultState();
    state.constructionQueue.push({
      id: 1,
      buildingId: 'cottage',
      duration: 5,
      remaining: 5,
      footprint: { w: 1, h: 1 },
      orientation: 0
    });

    const result = processConstruction(state, 1, buildingDefs);

    expect(result.completed).toHaveLength(0);
    expect(state.constructionQueue).toHaveLength(1);
    expect(state.constructionQueue[0]?.remaining).toBeCloseTo(4);
  });

  it('completes jobs and creates building instances when time elapses', () => {
    const state = defaultState();
    state.constructionQueue.push({
      id: 2,
      buildingId: 'cottage',
      duration: 1,
      remaining: 0.5,
      footprint: { w: 1, h: 1 },
      orientation: 0
    });

    const result = processConstruction(state, 1, buildingDefs);

    expect(result.completed).toHaveLength(1);
    const [completion] = result.completed;
    expect(completion.instance?.buildingId).toBe('cottage');
    expect(state.constructionQueue).toHaveLength(0);
    expect(state.buildings).toHaveLength(1);
  });

  it('drops jobs with unknown building definitions', () => {
    const state = defaultState();
    state.constructionQueue.push({
      id: 3,
      buildingId: 'unknown',
      duration: 1,
      remaining: 0,
      footprint: { w: 1, h: 1 },
      orientation: 0
    });

    const result = processConstruction(state, 0, buildingDefs);

    expect(result.completed).toEqual([
      { job: expect.objectContaining({ id: 3 }), reason: 'unknown-building' }
    ]);
    expect(state.constructionQueue).toHaveLength(0);
    expect(state.buildings).toHaveLength(0);
  });

  it('applies speed multipliers when provided', () => {
    const state = defaultState();
    state.constructionQueue.push({
      id: 4,
      buildingId: 'cottage',
      duration: 10,
      remaining: 10,
      footprint: { w: 1, h: 1 },
      orientation: 0
    });

    processConstruction(state, 1, buildingDefs, { speedMultiplier: 2 });

    expect(state.constructionQueue[0]?.remaining).toBeCloseTo(8);
  });
});
