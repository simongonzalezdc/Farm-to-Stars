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
  GameEvent,
  GameState,
  ConstructionJob,
  RecipeDefinition,
  RecipeId,
  ResourceId,
  Resources,
  Structure
} from './types';

export const EVENT_RESOURCE_PRODUCED = 'world.resource.produced';
export const EVENT_BUILD_COMPLETE = 'world.build.complete';

export interface ResourceProducedDetail {
  resource: ResourceId;
  amount: number;
}

export interface BuildCompleteDetail {
  buildingId: BuildingId;
  structure: Structure;
}

export const gameEvents = new EventTarget();

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

export const EVENT_RESOURCE_PRODUCED = 'world:resource-produced';
export const EVENT_BUILD_COMPLETE = 'world:build-complete';
export const EVENT_SEASON_CHANGED = 'world:season-changed';

export interface ResourceProducedDetail {
  resource: ResourceId;
  amount: number;
}

export interface BuildCompleteDetail {
  buildingId: BuildingId;
}

export interface SeasonChangedDetail {
  season: SeasonId;
  definition: SeasonDefinition;
  year: number;
  cycle: number;
}

export const gameEvents = new EventTarget();

export function initWorld(state: GameState) {
  for (const key of Object.keys(resourceRemainder) as ResourceId[]) {
    resourceRemainder[key] = 0;
    lastTotals[key] = state.resources[key] ?? 0;
  }

  const activeConstructionIds = new Set(state.constructionQueue.map((job) => job.id));
  for (const job of state.buildQueue) {
    if (job.status !== 'building' || activeConstructionIds.has(job.id)) {
      continue;
    }
    state.constructionQueue.push({
      id: job.id,
      buildingId: job.type as BuildingId,
      duration: job.duration,
      remaining: job.remaining,
      footprint: job.footprint
    });
  }
  resetResourceTracking(state);
}

export function tick(
  state: GameState,
  dt: number,
  buildingDefs: Partial<Record<BuildingId, BuildingDefinition>> = {}
  buildingDefs: Record<BuildingId, BuildingDefinition> = {}
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
    for (const resource of Object.keys(RESOURCE_PER_SEC) as ResourceId[]) {
      const perSec = RESOURCE_PER_SEC[resource] ?? 0;
      if (perSec <= 0) continue;
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
        gameEvents.dispatchEvent(new CustomEvent(EVENT_RESOURCE_PRODUCED, { detail }));
      }
    }
    lastTotals[resource] = total;
  }
  buildingDefs: Record<BuildingId, BuildingDefinition>,
  recipes: Record<RecipeId, RecipeDefinition>
): GameEvent[] {
  const events: GameEvent[] = [];

  const economy = processEconomyTick(state, dt, recipes);
  events.push(...economy.events);

  const existingConstructionIds = new Set(state.constructionQueue.map((job) => job.id));
  for (const job of state.buildQueue) {
    if (existingConstructionIds.has(job.id)) continue;
    if (job.status !== 'building') continue;
    const duration = job.duration > 0 ? job.duration : buildingDefs[job.type]?.buildTime ?? 0;
    const remaining = Math.min(job.remaining, duration);
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
      const detail: BuildCompleteDetail = { buildingId: job.type };
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
    const buildDetail: BuildCompleteDetail = { buildingId: result.job.buildingId, structure };
    if (result.reason === 'unknown-building') {
      gameEvents.dispatchEvent(
        new CustomEvent<BuildCompleteDetail>(EVENT_BUILD_COMPLETE, { detail: buildDetail })
      );
      continue;
    }
    state.structures.push(structure);
    events.push({ type: 'construction.completed', building: structure });
    gameEvents.dispatchEvent(
      new CustomEvent<BuildCompleteDetail>(EVENT_BUILD_COMPLETE, { detail: buildDetail })
    );
    const detail: BuildCompleteDetail = { buildingId: structure.type };
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

    const detail: BuildCompleteDetail = { structureId: structure.id, buildingId: structure.type };
    gameEvents.dispatchEvent(new CustomEvent<BuildCompleteDetail>(EVENT_BUILD_COMPLETE, { detail }));
  }

  emitResourceEvents(state, events);

  return events;
}

export function fmt(n: number) {
  return Math.floor(n).toLocaleString();
}

type SeasonSegment = { season: SeasonId; duration: number };

type SeasonAdvanceResult = {
  changed: boolean;
  seasonsEntered: SeasonId[];
  segments: SeasonSegment[];
};

function advanceSeason(state: GameState, dt: number): SeasonAdvanceResult {
  let remaining = dt;
  let active = state.season.active;
  let elapsed = state.season.elapsed;
  const entered: SeasonId[] = [];
  const segments: SeasonSegment[] = [];

  while (remaining > 0) {
    const definition = getSeasonDefinition(active);
    if (definition.durationSeconds <= 0) {
      if (remaining > 0) {
        segments.push({ season: active, duration: remaining });
      }
      elapsed = 0;
      remaining = 0;
      break;
    }

    const timeToTransition = definition.durationSeconds - elapsed;
    if (timeToTransition <= 1e-6) {
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

    const segmentDuration = Math.min(remaining, timeToTransition);
    if (segmentDuration > 0) {
      segments.push({ season: active, duration: segmentDuration });
      elapsed += segmentDuration;
      remaining -= segmentDuration;
    } else {
      // Should not happen, but guard against infinite loops.
      remaining = 0;
    }

    if (elapsed >= definition.durationSeconds - 1e-6) {
      state.season.cycle += 1;
      const next = getNextSeason(active);
      if (next === DEFAULT_SEASON_ID) {
        state.season.year += 1;
      }
      active = next;
      state.season.active = active;
      elapsed = 0;
      entered.push(active);
    }
  }

  state.season.active = active;
  state.season.elapsed = elapsed;

  if (segments.length === 0 && dt > 0) {
    segments.push({ season: state.season.active, duration: dt });
  }

  return { changed: entered.length > 0, seasonsEntered: entered, segments };
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
