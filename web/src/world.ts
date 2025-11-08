import {
  DEFAULT_SEASON_ID,
  getSeasonDefinition,
  getNextSeason,
  type SeasonDefinition,
  type SeasonId
} from './config/seasons';
import { processConstruction } from './systems/construction';
import type {
  BuildingDefinition,
  BuildingId,
  GameEvent,
  GameState,
  ConstructionJob,
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
}

export function tick(
  state: GameState,
  dt: number,
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
    state.structures.push(structure);
    events.push({ type: 'construction.completed', building: structure });
    const detail: BuildCompleteDetail = { buildingId: structure.type };
    gameEvents.dispatchEvent(new CustomEvent(EVENT_BUILD_COMPLETE, { detail }));
  }

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
}
