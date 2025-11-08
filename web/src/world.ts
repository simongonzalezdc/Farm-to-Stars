import {
  DEFAULT_SEASON_ID,
  getSeasonDefinition,
  getNextSeason,
  type SeasonDefinition,
  type SeasonId
} from './config/seasons';
import { processConstruction } from './systems/construction';
import { processEconomyTick } from './systems/economy';
import type {
  BuildingDefinition,
  BuildingId,
  ConstructionJob,
  GameEvent,
  GameState,
  RecipeDefinition,
  RecipeId,
  ResourceId,
  Resources,
  Structure
} from './types';

export const EVENT_RESOURCE_PRODUCED = 'world.resource.produced';
export const EVENT_RESOURCES_UPDATED = 'world.resources.updated';
export const EVENT_BUILD_COMPLETE = 'world.build.complete';
export const EVENT_SEASON_CHANGED = 'world.season.changed';

export interface ResourceProducedDetail {
  resource: ResourceId;
  amount: number;
}

export interface ResourcesUpdatedDetail {
  resources: Resources;
}

export interface BuildCompleteDetail {
  buildingId: BuildingId;
  structure: Structure;
}

export interface SeasonChangedDetail {
  season: SeasonId;
  definition: SeasonDefinition;
  year: number;
  cycle: number;
}

export const gameEvents = new EventTarget();

export const SIM_DT = 0.1; // 10 Hz

const resourceRemainder: Partial<Record<ResourceId, number>> = {};
const lastTotals: Partial<Record<ResourceId, number>> = {};

const RESOURCE_PER_SEC: Partial<Record<ResourceId, number>> = {
  wood: 0.1
};

type SeasonSegment = { season: SeasonId; duration: number };

type SeasonAdvanceResult = {
  changed: boolean;
  seasonsEntered: SeasonId[];
  segments: SeasonSegment[];
};

export function initWorld(state: GameState) {
  const activeConstructionIds = new Set(state.constructionQueue.map((job) => job.id));
  for (const job of state.buildQueue) {
    if (job.status !== 'building' || activeConstructionIds.has(job.id)) {
      continue;
    }
    const duration = job.duration > 0 ? job.duration : 0;
    const remaining = job.remaining > 0 ? job.remaining : duration;
    const constructionJob: ConstructionJob = {
      id: job.id,
      buildingId: job.type as BuildingId,
      duration,
      remaining,
      footprint: job.footprint
    };
    state.constructionQueue.push(constructionJob);
    activeConstructionIds.add(job.id);
  }

  resetResourceTracking(state);
}

export function tick(
  state: GameState,
  dt: number,
  buildingDefs: Partial<Record<BuildingId, BuildingDefinition>> = {},
  recipes: Record<RecipeId, RecipeDefinition> = {}
): GameEvent[] {
  const events: GameEvent[] = [];

  const seasonTransitions = advanceSeason(state, dt);
  const finalSeasonDefinition = getSeasonDefinition(state.season.active);

  const segments = seasonTransitions.segments.length > 0
    ? seasonTransitions.segments
    : [{ season: state.season.active, duration: dt }];

  const resourceAccum: Partial<Record<ResourceId, number>> = {};
  let accumulatedConstruction = 0;

  for (const segment of segments) {
    if (segment.duration <= 0) continue;
    const definition = getSeasonDefinition(segment.season);
    const multipliers = definition.multipliers;
    accumulatedConstruction += segment.duration * (multipliers.constructionSpeed ?? 1);
    for (const [resource, perSec] of Object.entries(RESOURCE_PER_SEC) as [ResourceId, number][]) {
      if (!perSec) continue;
      const gain = perSec * segment.duration * (multipliers.resourceRate ?? 1);
      resourceAccum[resource] = (resourceAccum[resource] ?? 0) + gain;
    }
  }

  const effectiveConstructionMultiplier =
    dt > 1e-6
      ? accumulatedConstruction / dt
      : (finalSeasonDefinition.multipliers.constructionSpeed ?? 1);

  if (seasonTransitions.changed) {
    for (const seasonId of seasonTransitions.seasonsEntered) {
      events.push({ type: 'season.changed', season: seasonId });
      const detail: SeasonChangedDetail = {
        season: seasonId,
        definition: getSeasonDefinition(seasonId),
        year: state.season.year,
        cycle: state.season.cycle
      };
      gameEvents.dispatchEvent(new CustomEvent(EVENT_SEASON_CHANGED, { detail }));
    }
  }

  for (const [resource, gain] of Object.entries(resourceAccum) as [ResourceId, number][]) {
    if (state.resources[resource] == null) {
      state.resources[resource] = 0;
    }
    const slot = ensureStorageSlot(state, resource);
    const next = Math.min(slot.capacity, Math.max(0, (state.resources[resource] ?? 0) + gain));
    state.resources[resource] = next;
    slot.current = next;
    if (!state.resources[resource]) {
      state.resources[resource] = 0;
    }
    state.resources[resource] += gain;
  }

  const economy = processEconomyTick(state, dt, recipes);
  events.push(...economy.events);

  const existingConstructionIds = new Set(state.constructionQueue.map((job) => job.id));
  for (const job of state.buildQueue) {
    if (job.status !== 'building') continue;
    if (existingConstructionIds.has(job.id)) continue;
    const duration = job.duration > 0 ? job.duration : buildingDefs[job.type]?.buildTime ?? 0;
    const remaining = Math.min(job.remaining > 0 ? job.remaining : duration, duration);
    const constructionJob: ConstructionJob = {
      id: job.id,
      buildingId: job.type,
      duration,
      remaining,
      footprint: job.footprint
    };
    state.constructionQueue.push(constructionJob);
    existingConstructionIds.add(job.id);
  }

  const { completed } = processConstruction(state, dt, buildingDefs, {
    speedMultiplier: effectiveConstructionMultiplier
  });

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
      const detail: BuildCompleteDetail = {
        buildingId: job.type,
        structure: {
          id: job.id,
          type: job.type,
          x: job.x,
          y: job.y,
          footprint: job.footprint
        }
      };
      gameEvents.dispatchEvent(new CustomEvent(EVENT_BUILD_COMPLETE, { detail }));
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

    const detail: BuildCompleteDetail = { buildingId: result.job.buildingId, structure };
    gameEvents.dispatchEvent(new CustomEvent(EVENT_BUILD_COMPLETE, { detail }));

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
  }

  emitResourceEvents(state, events);

  return events;
}

export function fmt(n: number) {
  return Math.floor(n).toLocaleString();
}

function advanceSeason(state: GameState, dt: number): SeasonAdvanceResult {
  let remaining = dt;
  let active = state.season.active;
  let elapsed = state.season.elapsed;
  const entered: SeasonId[] = [];
  const segments: SeasonSegment[] = [];

  while (remaining > 1e-6) {
    const definition = getSeasonDefinition(active);
    if (definition.durationSeconds <= 0) {
      segments.push({ season: active, duration: remaining });
      elapsed += remaining;
      remaining = 0;
      break;
    }

    const timeToTransition = definition.durationSeconds - elapsed;
    if (timeToTransition <= remaining + 1e-6) {
      if (timeToTransition > 0) {
        segments.push({ season: active, duration: timeToTransition });
        remaining -= timeToTransition;
      } else {
        segments.push({ season: active, duration: 0 });
      }
      state.season.cycle += 1;
      const next = getNextSeason(active);
      if (next === DEFAULT_SEASON_ID) {
        state.season.year += 1;
      }
      active = next;
      state.season.active = active;
      elapsed = 0;
      entered.push(active);
      continue;
    }

    segments.push({ season: active, duration: remaining });
    elapsed += remaining;
    remaining = 0;
  }

  state.season.active = active;
  state.season.elapsed = elapsed;

  if (segments.length === 0 && dt > 0) {
    segments.push({ season: state.season.active, duration: dt });
  }

  return { changed: entered.length > 0, seasonsEntered: entered, segments };
}

function resetResourceTracking(state: GameState) {
  for (const key of Object.keys(resourceRemainder) as ResourceId[]) {
    delete resourceRemainder[key];
  }
  for (const key of Object.keys(lastTotals) as ResourceId[]) {
    delete lastTotals[key];
  }
  for (const resource of Object.keys(state.resources) as ResourceId[]) {
    resourceRemainder[resource] = 0;
    lastTotals[resource] = state.resources[resource] ?? 0;
    ensureStorageSlot(state, resource);
    syncStorageSlot(state, resource);
  }
  for (const resource of Object.keys(RESOURCE_PER_SEC) as ResourceId[]) {
    if (!(resource in state.resources)) {
      state.resources[resource] = 0;
    }
    if (!(resource in resourceRemainder)) {
      resourceRemainder[resource] = 0;
      lastTotals[resource] = state.resources[resource] ?? 0;
    }
    ensureStorageSlot(state, resource);
    syncStorageSlot(state, resource);
  }
}

function emitResourceEvents(state: GameState, events: GameEvent[]) {
  let updated = false;
  for (const resource of Object.keys(state.resources) as ResourceId[]) {
    ensureStorageSlot(state, resource);
    const total = state.resources[resource] ?? 0;
    const previous = lastTotals[resource] ?? 0;
    const delta = total - previous;
    if (Math.abs(delta) > 1e-6) {
      updated = true;
    }
    if (delta > 0) {
      resourceRemainder[resource] = (resourceRemainder[resource] ?? 0) + delta;
      while ((resourceRemainder[resource] ?? 0) >= 1 - 1e-6) {
        resourceRemainder[resource] = (resourceRemainder[resource] ?? 0) - 1;
        events.push({ type: 'resource.collected', resource, amount: 1 });
        const detail: ResourceProducedDetail = { resource, amount: 1 };
        gameEvents.dispatchEvent(new CustomEvent(EVENT_RESOURCE_PRODUCED, { detail }));
      }
    } else if (delta < 0) {
      resourceRemainder[resource] = Math.max(0, (resourceRemainder[resource] ?? 0) + delta);
    }
    lastTotals[resource] = total;
    syncStorageSlot(state, resource);
  }

  if (updated) {
    const detail: ResourcesUpdatedDetail = { resources: { ...state.resources } };
    gameEvents.dispatchEvent(new CustomEvent(EVENT_RESOURCES_UPDATED, { detail }));
  }
}

function ensureStorageSlot(state: GameState, resource: ResourceId) {
  const slot = state.resourceStorage[resource];
  if (slot) {
    return slot;
  }
  const created = {
    current: state.resources[resource] ?? 0,
    capacity: Number.POSITIVE_INFINITY
  };
  state.resourceStorage[resource] = created;
  return created;
}

function syncStorageSlot(state: GameState, resource: ResourceId) {
  const slot = ensureStorageSlot(state, resource);
  const current = state.resources[resource] ?? 0;
  slot.current = Math.min(Math.max(0, current), slot.capacity);
}
