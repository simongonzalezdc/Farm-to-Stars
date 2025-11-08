import { describe, expect, it } from 'vitest';
import { initWorld, tick } from '../../src/world.ts';
import {
  defaultState,
  type BuildingDefinition,
  type BuildingId,
  type GameEvent,
  type GameState,
  type RecipeDefinition,
  type RecipeId,
  type ResourceId
} from '../../src/types.ts';
import { harvestCrop, plantCrop } from '../../src/systems/cropLifecycle.ts';
import rawBuildings from '../../src/data/buildings.json';
import rawRecipes from '../../src/data/recipes.json';
import rawCrops from '../../src/data/crops.json';
import rawLivestock from '../../src/data/livestock.json';
import type { CropsTable, LivestockDefinition, LivestockTable } from '../../src/types.ts';

interface RawBuildingDefinition {
  label: string;
  category?: string;
  buildTime: number;
  size: [number, number];
  cost?: Partial<Record<string, number>>;
  effects?: Record<string, number>;
  production?: string;
}

interface RawRecipeDefinition {
  inputs: [string, number][];
  duration: number;
  outputs: [string, number][];
}

interface RawCropStage {
  id: string;
  duration: number;
  minMoisture: number;
  moistureConsumptionPerSecond: number;
  wiltThreshold: number;
}

interface RawCropDefinition {
  label: string;
  stages: RawCropStage[];
  yields: [string, number][];
  regrow: boolean;
}

interface RawLivestockDefinition extends Omit<LivestockDefinition, 'id'> {}

const buildingDefs: Partial<Record<BuildingId, BuildingDefinition>> = Object.fromEntries(
  Object.entries(rawBuildings as Record<string, RawBuildingDefinition>).map(([id, def]) => {
    const [w, h] = def.size;
    const normalized: BuildingDefinition = {
      id,
      label: def.label,
      buildTime: def.buildTime,
      footprint: { w, h },
      recipeId: def.production,
      effects: def.effects,
      cost: def.cost,
      category: def.category
    };
    return [id, normalized];
  })
);

const recipeDefs: Record<RecipeId, RecipeDefinition> = Object.fromEntries(
  Object.entries(rawRecipes as Record<string, RawRecipeDefinition>).map(([id, def]) => {
    const toRecord = (entries: [string, number][]) =>
      entries.reduce<Partial<Record<ResourceId, number>>>((acc, [resource, amount]) => {
        acc[resource as ResourceId] = amount;
        return acc;
      }, {});

    const normalized: RecipeDefinition = {
      id,
      duration: def.duration,
      inputs: toRecord(def.inputs),
      outputs: toRecord(def.outputs),
      outputCaps: {}
    };
    return [id, normalized];
  })
);

const cropDefs: CropsTable = Object.fromEntries(
  Object.entries(rawCrops as Record<string, RawCropDefinition>).map(([id, def]) => {
    const normalized = {
      id,
      label: def.label,
      stages: def.stages.map((stage) => ({
        id: stage.id,
        duration: stage.duration,
        minMoisture: stage.minMoisture,
        moistureConsumptionPerSecond: stage.moistureConsumptionPerSecond,
        wiltThreshold: stage.wiltThreshold
      })),
      yields: def.yields.reduce<Partial<Record<ResourceId, number>>>((acc, [resource, amount]) => {
        acc[resource as ResourceId] = amount;
        return acc;
      }, {}),
      regrow: def.regrow
    };
    return [id, normalized];
  })
) as CropsTable;

const livestockDefs: LivestockTable = Object.fromEntries(
  Object.entries(rawLivestock as Record<string, RawLivestockDefinition>).map(([id, def]) => [
    id,
    { id, ...def }
  ])
) as LivestockTable;

function irrigateField(state: GameState) {
  for (const tile of Object.values(state.homestead.field.tiles)) {
    if (tile) {
      tile.moisture = Math.max(tile.moisture ?? 0, 0.75);
    }
  }
}

function processEvents(state: GameState, events: GameEvent[]) {
  for (const event of events) {
    if (event.type !== 'homestead.crop.matured') {
      continue;
    }
    const harvested = harvestCrop(state.homestead.field, event.x, event.y, cropDefs);
    if (!harvested) {
      continue;
    }
    const definition = cropDefs[harvested.cropId];
    if (definition) {
      for (const [resource, amount] of Object.entries(definition.yields)) {
        const key = resource as ResourceId;
        const value = amount ?? 0;
        state.resources[key] = (state.resources[key] ?? 0) + value;
      }
      if (!definition.regrow) {
        plantCrop(state.homestead.field, event.x, event.y, harvested.cropId);
        const key = `${event.x},${event.y}`;
        const tile = state.homestead.field.tiles[key];
        if (tile) {
          tile.moisture = 0.85;
        }
      }
    }
  }
}

describe('homestead soak simulation', () => {
  it('maintains a healthy colony over a month of simulated days', () => {
    const state = defaultState();
    initWorld(state);

    state.resources.wheat = 400;
    state.resources.food = 400;
    state.resources.eggs = 0;
    state.resources.milk = 0;

    const plots: Array<{ x: number; y: number; cropId: string }> = [
      { x: 2, y: 2, cropId: 'wheat' },
      { x: 3, y: 2, cropId: 'potato' },
      { x: 4, y: 2, cropId: 'berry' }
    ];

    for (const { x, y, cropId } of plots) {
      plantCrop(state.homestead.field, x, y, cropId);
      const key = `${x},${y}`;
      const tile = state.homestead.field.tiles[key];
      if (tile) {
        tile.moisture = 0.9;
      }
    }

    const totalDays = 30;
    const secondsPerDay = state.homestead.time.secondsPerDay;
    const step = 30;

    for (let day = 0; day < totalDays; day += 1) {
      let remaining = secondsPerDay;
      while (remaining > 0) {
        const dt = Math.min(step, remaining);
        irrigateField(state);
        const events = tick(state, dt, buildingDefs, recipeDefs, cropDefs, livestockDefs);
        processEvents(state, events);
        remaining -= dt;
      }
    }

    expect(state.homestead.time.day).toBeGreaterThanOrEqual(1 + totalDays);
    expect(state.homestead.livestock.animals.every((animal) => animal.alive)).toBe(true);
    expect(state.resources.wheat).toBeGreaterThan(0);
    expect(state.resources.food).toBeGreaterThan(0);
    expect(state.resources.eggs).toBeGreaterThan(0);
    expect(state.resources.milk).toBeGreaterThan(0);

    for (const value of Object.values(state.resources)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });
});
