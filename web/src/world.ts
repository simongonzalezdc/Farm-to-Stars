import { processConstruction } from './systems/construction';
import { processEconomyTick } from './systems/economy';
import type {
  BuildingDefinition,
  BuildingId,
  GameEvent,
  GameState,
  RecipeDefinition,
  RecipeId,
  ResourceId,
  Resources,
  Structure
} from './types';

export const SIM_DT = 0.1; // 10 Hz

const resourceRemainder: Resources = {};
const lastTotals: Resources = {};

export const EVENT_RESOURCE_PRODUCED = 'resource.produced';
export const EVENT_RESOURCES_UPDATED = 'resources.updated';
export const EVENT_BUILD_COMPLETE = 'construction.completed';

export interface ResourceProducedDetail {
  resource: ResourceId;
  amount: number;
  total: number;
}

export interface ResourcesUpdatedDetail {
  resources: Resources;
}

export interface BuildCompleteDetail {
  structureId: number;
  buildingId: BuildingId;
}

export const gameEvents = new EventTarget();

export function initWorld(state: GameState) {
  resetResourceTracking(state);
}

export function tick(
  state: GameState,
  dt: number,
  buildingDefs: Record<BuildingId, BuildingDefinition>,
  recipes: Record<RecipeId, RecipeDefinition>
): GameEvent[] {
  const events: GameEvent[] = [];

  const economy = processEconomyTick(state, dt, recipes);
  events.push(...economy.events);

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

    if (result.instance?.recipeId) {
      const nodeId = state.nextProductionNodeId++;
      state.productionNodes.push({
        id: nodeId,
        recipeId: result.instance.recipeId,
        progress: 0,
        active: false
      });
      state.productionQueue.push({ nodeId, recipeId: result.instance.recipeId });
      result.instance.productionNodeId = nodeId;
    }

    const detail: BuildCompleteDetail = { structureId: structure.id, buildingId: structure.type };
    gameEvents.dispatchEvent(new CustomEvent<BuildCompleteDetail>(EVENT_BUILD_COMPLETE, { detail }));
  }

  emitResourceEvents(state, events);

  return events;
}

export function fmt(n: number) {
  return Math.floor(n).toLocaleString();
}

function resetResourceTracking(state: GameState) {
  for (const key of Object.keys(resourceRemainder)) {
    delete resourceRemainder[key as keyof Resources];
  }
  for (const key of Object.keys(lastTotals)) {
    delete lastTotals[key as keyof Resources];
  }
  for (const key of Object.keys(state.resources) as ResourceId[]) {
    resourceRemainder[key] = 0;
    lastTotals[key] = state.resources[key] ?? 0;
    ensureStorageSlot(state, key);
    syncStorageSlot(state, key);
  }
}

function emitResourceEvents(state: GameState, events: GameEvent[]) {
  let updated = false;
  for (const resource of Object.keys(state.resources) as ResourceId[]) {
    if (!(resource in resourceRemainder)) {
      resourceRemainder[resource] = 0;
      lastTotals[resource] = 0;
    }
    syncStorageSlot(state, resource);
    const total = state.resources[resource] ?? 0;
    const delta = total - (lastTotals[resource] ?? 0);
    if (Math.abs(delta) > 1e-6) {
      updated = true;
    }
    if (delta > 0) {
      resourceRemainder[resource] += delta;
      while (resourceRemainder[resource] >= 1 - 1e-6) {
        resourceRemainder[resource] -= 1;
        events.push({ type: 'resource.collected', resource, amount: 1 });
        const detail: ResourceProducedDetail = { resource, amount: 1, total };
        gameEvents.dispatchEvent(
          new CustomEvent<ResourceProducedDetail>(EVENT_RESOURCE_PRODUCED, { detail })
        );
      }
    }
    lastTotals[resource] = total;
  }

  if (updated) {
    const detail: ResourcesUpdatedDetail = { resources: { ...state.resources } };
    gameEvents.dispatchEvent(new CustomEvent<ResourcesUpdatedDetail>(EVENT_RESOURCES_UPDATED, { detail }));
  }
}

function ensureStorageSlot(state: GameState, resource: ResourceId) {
  if (state.resourceStorage[resource]) {
    return;
  }
  state.resourceStorage[resource] = {
    current: state.resources[resource] ?? 0,
    capacity: Number.POSITIVE_INFINITY
  };
}

function syncStorageSlot(state: GameState, resource: ResourceId) {
  const slot = state.resourceStorage[resource];
  if (!slot) {
    ensureStorageSlot(state, resource);
    return syncStorageSlot(state, resource);
  }
  const current = state.resources[resource] ?? 0;
  slot.current = Math.min(Math.max(0, current), slot.capacity);
}
