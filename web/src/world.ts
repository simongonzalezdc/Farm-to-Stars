import type {
  BuildingType,
  GameEvent,
  GameState,
  ResourceId,
  Resources,
  Structure
} from './types';

export const EVENT_RESOURCE_PRODUCED = 'resource.produced';
export const EVENT_BUILD_COMPLETE = 'construction.completed';

export type ResourceProducedDetail = {
  resource: ResourceId;
  amount: number;
};

export type BuildCompleteDetail = {
  buildingId: BuildingType;
  structure: Structure;
};

export const gameEvents = new EventTarget();

export const SIM_DT = 0.1; // 10 Hz

const resourceRemainder: Resources = { wood: 0, stone: 0, food: 0, coins: 0 };
const lastTotals: Resources = { wood: 0, stone: 0, food: 0, coins: 0 };

const RESOURCE_PER_SEC: Partial<Record<ResourceId, number>> = {
  wood: 0.1
};

export function initWorld(state: GameState) {
  for (const key of Object.keys(resourceRemainder) as ResourceId[]) {
    resourceRemainder[key] = 0;
    lastTotals[key] = state.resources[key] ?? 0;
  }
}

export function tick(state: GameState, dt: number): GameEvent[] {
  const events: GameEvent[] = [];

  for (const resource of Object.keys(RESOURCE_PER_SEC) as ResourceId[]) {
    const perSec = RESOURCE_PER_SEC[resource] ?? 0;
    if (perSec <= 0) continue;
    const gain = perSec * dt;
    state.resources[resource] = (state.resources[resource] ?? 0) + gain;
  }

  for (const resource of Object.keys(state.resources) as ResourceId[]) {
    const total = state.resources[resource];
    const delta = total - lastTotals[resource];
    if (delta > 0) {
      resourceRemainder[resource] += delta;
      while (resourceRemainder[resource] >= 1) {
        resourceRemainder[resource] -= 1;
        events.push({ type: 'resource.collected', resource, amount: 1 });
        const detail: ResourceProducedDetail = { resource, amount: 1 };
        gameEvents.dispatchEvent(
          new CustomEvent<ResourceProducedDetail>(EVENT_RESOURCE_PRODUCED, { detail })
        );
      }
    }
    lastTotals[resource] = total;
  }

  const job = state.buildQueue[0];
  if (job) {
    if (job.status === 'queued') {
      job.status = 'building';
    }
    job.remaining = Math.max(0, job.remaining - dt);
    if (job.remaining === 0) {
      const structure: Structure = {
        id: job.id,
        type: job.type,
        x: job.x,
        y: job.y,
        footprint: job.footprint
      };
      state.structures.push(structure);
      state.buildQueue.shift();
      events.push({ type: 'construction.completed', building: structure });
      const detail: BuildCompleteDetail = { buildingId: structure.type, structure };
      gameEvents.dispatchEvent(
        new CustomEvent<BuildCompleteDetail>(EVENT_BUILD_COMPLETE, { detail })
      );
    }
  }

  return events;
}

export function fmt(n: number) {
  return Math.floor(n).toLocaleString();
}
