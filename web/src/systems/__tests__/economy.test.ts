import { describe, expect, it } from 'vitest';
import { processEconomyTick } from '../economy';
import {
  CURRENT_SCHEMA_VERSION,
  createEmptyResourceStorage,
  createEmptyResources,
  type GameState,
  type RecipeDefinition,
  type RecipeId
} from '../../types';

function createState(): GameState {
  const resources = createEmptyResources({
    water: { display: 'Water', stack: 10 },
    food: { display: 'Food', stack: 10 }
  });
  const resourceStorage = createEmptyResourceStorage({
    water: { display: 'Water', stack: 10 },
    food: { display: 'Food', stack: 10 }
  });
  return {
    v: 1,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    seed: 1,
    resources,
    resourceStorage,
    structures: [],
    buildQueue: [],
    constructionQueue: [],
    buildings: [],
    productionNodes: [],
    productionQueue: [],
    productionModifiers: { speedMultiplier: 1, outputMultiplier: 1 },
    nextBuildId: 1,
    nextBuildingInstanceId: 1,
    nextProductionNodeId: 1
  };
}

const recipes: Record<RecipeId, RecipeDefinition> = {
  harvest: {
    id: 'harvest',
    duration: 5,
    inputs: { water: 1 },
    outputs: { food: 2 },
    outputCaps: {}
  }
};

describe('processEconomyTick', () => {
  it('consumes inputs and produces outputs when capacity allows', () => {
    const state = createState();
    state.resources.water = 5;
    state.productionNodes.push({ id: 1, recipeId: 'harvest', progress: 0, active: false });
    state.productionQueue.push({ nodeId: 1, recipeId: 'harvest' });

    const result = processEconomyTick(state, 5, recipes);

    expect(result.events).toEqual([
      {
        type: 'production.cycle',
        nodeId: 1,
        recipeId: 'harvest',
        outputs: { food: 2 }
      }
    ]);
    expect(state.resources.water).toBeCloseTo(4);
    expect(state.resources.food).toBeCloseTo(2);
  });

  it('clamps outputs when storage capacity would overflow', () => {
    const state = createState();
    state.resources.water = 3;
    state.productionNodes.push({ id: 2, recipeId: 'harvest', progress: 0, active: false });
    state.productionQueue.push({ nodeId: 2, recipeId: 'harvest' });
    state.resourceStorage.food.capacity = 1;

    const result = processEconomyTick(state, 5, recipes);

    expect(result.events).toEqual([
      {
        type: 'production.cycle',
        nodeId: 2,
        recipeId: 'harvest',
        outputs: { food: 1 }
      }
    ]);
    expect(state.resources.food).toBeCloseTo(1);
    expect(state.resourceStorage.food.current).toBe(1);
    expect(state.resources.water).toBeCloseTo(2);
  });
});
