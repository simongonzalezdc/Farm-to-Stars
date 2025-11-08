import type {
  GameEvent,
  GameState,
  LivestockDefinition,
  LivestockId,
  LivestockTable,
  ResourceId
} from '../../types';
import type { LivestockTickResult } from '../events';

const EPSILON = 1e-6;

export function tickLivestock(state: GameState, dt: number, definitions: LivestockTable): LivestockTickResult {
  if (dt <= 0) {
    return { events: [], feedConsumed: {} };
  }

  const herd = state.homestead.livestock;
  const secondsPerDay = state.homestead.time.secondsPerDay;
  const currentDay = state.homestead.time.day;
  const events: GameEvent[] = [];
  const feed: Partial<Record<ResourceId, number>> = {};

  for (const animal of herd.animals) {
    if (!animal.alive) continue;
    const definition = definitions[animal.speciesId];
    if (!definition) continue;

    advanceGrowth(animal, definition, dt, secondsPerDay);
    applyFeeding(state, animal, definition, currentDay, feed);

    if (!animal.alive) {
      continue;
    }

    advanceProduction(state, animal, definition, dt, events);

    if (animal.hunger >= 1 - EPSILON) {
      animal.alive = false;
      events.push({ type: 'livestock.starved', livestockId: animal.id, speciesId: animal.speciesId });
    }
  }

  return { events, feedConsumed: feed };
}

function advanceGrowth(
  animal: GameState['homestead']['livestock']['animals'][number],
  definition: LivestockDefinition,
  dt: number,
  secondsPerDay: number
) {
  const growthDays = Math.max(definition.growthDays, EPSILON);
  animal.ageDays += dt / secondsPerDay;
  animal.growth = Math.min(1, animal.growth + dt / (growthDays * secondsPerDay));
}

function applyFeeding(
  state: GameState,
  animal: GameState['homestead']['livestock']['animals'][number],
  definition: LivestockDefinition,
  currentDay: number,
  feedConsumed: Partial<Record<ResourceId, number>>
) {
  if (animal.lastFedDay >= currentDay) {
    return;
  }

  const missedDays = Math.max(0, currentDay - animal.lastFedDay);
  const requiredFeed = definition.feedPerDay * missedDays;
  const resourceId = definition.feedResource;
  const available = Math.max(0, state.resources[resourceId] ?? 0);

  if (available >= requiredFeed) {
    state.resources[resourceId] = available - requiredFeed;
    feedConsumed[resourceId] = (feedConsumed[resourceId] ?? 0) + requiredFeed;
    animal.hunger = Math.max(0, animal.hunger - 0.25 * missedDays);
  } else {
    if (available > 0) {
      state.resources[resourceId] = 0;
      feedConsumed[resourceId] = (feedConsumed[resourceId] ?? 0) + available;
    }
    const tolerance = Math.max(EPSILON, definition.hungerToleranceDays);
    animal.hunger = Math.min(1, animal.hunger + missedDays / tolerance);
  }

  animal.lastFedDay = currentDay;
}

function advanceProduction(
  state: GameState,
  animal: GameState['homestead']['livestock']['animals'][number],
  definition: LivestockDefinition,
  dt: number,
  events: GameEvent[]
) {
  if (animal.growth < 1 - EPSILON) {
    return;
  }

  animal.produceProgress += dt;
  const interval = Math.max(EPSILON, definition.produceIntervalSeconds);
  if (animal.produceProgress < interval) {
    return;
  }

  const cycles = Math.floor(animal.produceProgress / interval);
  if (cycles <= 0) {
    return;
  }

  animal.produceProgress -= cycles * interval;
  const totalAmount = definition.produceAmount * cycles;
  const resource = definition.produceResource as ResourceId;
  state.resources[resource] = (state.resources[resource] ?? 0) + totalAmount;
  events.push({
    type: 'livestock.produce',
    livestockId: animal.id,
    speciesId: animal.speciesId as LivestockId,
    resource,
    amount: totalAmount
  });
}
