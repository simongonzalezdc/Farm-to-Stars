import { describe, expect, it } from 'vitest';
import buildings from '../buildings.json';
import recipes from '../recipes.json';
import { SEASON_DEFINITIONS, SEASON_ORDER } from '../../config/seasons';

type BuildingCost = Record<string, number> | undefined;

type RecipeTuple = [string, number];

type RecipeRaw = {
  inputs: RecipeTuple[];
  duration: number;
  outputs: RecipeTuple[];
};

const BASE_WOOD_PER_SECOND = 0.1;
const BUILDING_SET: (keyof typeof buildings)[] = ['road', 'plot', 'market', 'cottage'];

function getCost(buildingId: keyof typeof buildings, resource: string): number {
  const cost = (buildings[buildingId] as { cost?: BuildingCost })?.cost;
  return cost?.[resource] ?? 0;
}

function toMap(entries: RecipeTuple[]): Record<string, number> {
  return entries.reduce<Record<string, number>>((acc, [resource, amount]) => {
    acc[resource] = amount;
    return acc;
  }, {});
}

describe('balance sanity', () => {
  it('keeps the Week 3 building set affordable within the 8-10 minute window', () => {
    const totalWood = BUILDING_SET.reduce((acc, id) => acc + getCost(id, 'wood'), 0);
    const totalCoins = BUILDING_SET.reduce((acc, id) => acc + getCost(id, 'coins'), 0);

    const orderedSeasons = SEASON_ORDER.map((id) => SEASON_DEFINITIONS[id]);
    const totalDuration = orderedSeasons.reduce((acc, def) => acc + def.durationSeconds, 0);
    const weightedResourceMultiplier =
      orderedSeasons.reduce(
        (acc, def) => acc + def.durationSeconds * def.multipliers.resourceRate,
        0
      ) / totalDuration;

    const woodPerSecond = BASE_WOOD_PER_SECOND * weightedResourceMultiplier;
    const woodInEightMinutes = woodPerSecond * 8 * 60;
    const woodInTenMinutes = woodPerSecond * 10 * 60;

    expect(totalWood).toBeLessThanOrEqual(woodInTenMinutes);
    expect(totalWood).toBeLessThanOrEqual(woodInEightMinutes * 1.05);

    const wheat = recipes.wheat as RecipeRaw;
    const sell = recipes.sell as RecipeRaw;
    const wheatOutputs = toMap(wheat.outputs);
    const sellOutputs = toMap(sell.outputs);
    const sellInputs = toMap(sell.inputs);

    const foodPerSecond = (wheatOutputs.food ?? 0) / wheat.duration;
    const coinsPerCycle = sellOutputs.coins ?? 0;
    const foodPerCycle = sellInputs.food ?? 0;
    const coinsPerSecondLimitedByInput =
      foodPerCycle > 0 ? (foodPerSecond / foodPerCycle) * coinsPerCycle : Infinity;
    const coinsPerSecondRecipe = sell.duration > 0 ? coinsPerCycle / sell.duration : 0;
    const coinsPerSecond = Math.min(coinsPerSecondLimitedByInput, coinsPerSecondRecipe);

    const coinsInEightMinutes = coinsPerSecond * 8 * 60;
    const coinsInTenMinutes = coinsPerSecond * 10 * 60;

    expect(coinsPerSecond).toBeGreaterThan(0);
    expect(totalCoins).toBeLessThanOrEqual(coinsInTenMinutes);
    expect(totalCoins).toBeLessThanOrEqual(coinsInEightMinutes * 1.1);
  });

  it('delivers the first harvest within four minutes of starting construction', () => {
    const plotBuildTime = (buildings.plot as { buildTime: number }).buildTime;
    const wheatDuration = (recipes.wheat as RecipeRaw).duration;
    const firstHarvestSeconds = plotBuildTime + wheatDuration;

    expect(firstHarvestSeconds).toBeLessThanOrEqual(4 * 60);
  });

  it('uses consistent 2.5 minute seasons for the pacing assumptions', () => {
    for (const id of SEASON_ORDER) {
      expect(SEASON_DEFINITIONS[id].durationSeconds).toBe(150);
    }
  });
});
