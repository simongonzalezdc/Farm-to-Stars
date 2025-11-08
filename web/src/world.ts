import { processConstruction } from './systems/construction';
import type {
  BuildingDefinition,
  BuildingId,
  GameEvent,
  GameState,
  ResourceId,
  Resources,
  Structure
} from './types';

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

export function tick(
  state: GameState,
  dt: number,
  buildingDefs: Record<BuildingId, BuildingDefinition>
): GameEvent[] {
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
      }
    }
    lastTotals[resource] = total;
  }

  const { completed } = processConstruction(state, dt, buildingDefs);

  const activeJobs = new Map(state.constructionQueue.map((job) => [job.id, job]));
  for (const job of state.buildQueue) {
    const active = activeJobs.get(job.id);
    if (active) {
      job.remaining = Math.max(0, active.remaining);
      job.duration = active.duration;
      job.status = active.remaining < active.duration ? 'building' : 'queued';
    } else {
      job.status = 'queued';
    }
  }

  for (const result of completed) {
    const index = state.buildQueue.findIndex((job) => job.id === result.job.id);
    if (index === -1) {
      continue;
    }
    const [job] = state.buildQueue.splice(index, 1);
    if (result.reason === 'unknown-building') {
      continue;
    }
    const structure: Structure = {
      id: job.id,
      type: job.type,
      x: job.x,
      y: job.y,
      footprint: job.footprint
    };
    state.structures.push(structure);
    events.push({ type: 'construction.completed', building: structure });
  }

  return events;
}

export function fmt(n: number) {
  return Math.floor(n).toLocaleString();
}
