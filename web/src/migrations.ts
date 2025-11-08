import {
  CURRENT_SCHEMA_VERSION,
  clampSeasonElapsed,
  createDefaultSeasonState,
  createEmptyResources,
  defaultState,
  LEGACY_RESOURCE_IDS,
  type BuildJob,
  type ConstructionJob,
  type GameState,
  type Resources,
  type ResourceId,
  type ResourcesTable,
  type SaveV0,
  type SaveV1,
  type SaveV2,
  type SaveV3,
  type SaveV4,
  type SeasonState
} from './types';
import { getSeasonDefinition, isSeasonId } from './config/seasons';

function sanitizeResources(
  candidate: Partial<Record<ResourceId, unknown>>,
  resourceTable: ResourcesTable
): Resources {
  const base = createEmptyResources(resourceTable);
  for (const key of Object.keys(base) as ResourceId[]) {
    const value = candidate[key];
    base[key] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }
  return base;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSaveV4(candidate: unknown): candidate is SaveV4 {
  if (!isRecord(candidate)) return false;
  return candidate.v === 1 && candidate.schemaVersion === CURRENT_SCHEMA_VERSION;
}

function isSaveV3(candidate: unknown): candidate is SaveV3 {
  if (!isRecord(candidate)) return false;
  return candidate.v === 1 && candidate.schemaVersion === 3;
}

function isSaveV2(candidate: unknown): candidate is SaveV2 {
  if (!isRecord(candidate)) return false;
  return candidate.v === 1 && candidate.schemaVersion === 2;
}

function isSaveV1(candidate: unknown): candidate is SaveV1 {
  if (!isRecord(candidate)) return false;
  return candidate.v === 1 && typeof candidate.seed === 'number' && isRecord(candidate.resources);
}

function isSaveV0(candidate: unknown): candidate is SaveV0 {
  if (!isRecord(candidate)) return false;
  if (typeof candidate.seed !== 'number' || !Number.isFinite(candidate.seed)) {
    return false;
  }
  return LEGACY_RESOURCE_IDS.every((id) => typeof candidate[id] === 'number');
}

function normalizeStructures(candidate: SaveV3['structures'] | unknown): SaveV3['structures'] {
  if (!Array.isArray(candidate)) {
    return defaultState().structures;
  }
  return candidate.map((structure, index) => ({
    id: typeof structure?.id === 'number' ? structure.id : index,
    type: structure?.type === 'cottage' ? 'cottage' : 'cottage',
    x: typeof structure?.x === 'number' ? structure.x : 0,
    y: typeof structure?.y === 'number' ? structure.y : 0,
    footprint:
      structure && typeof structure === 'object' && structure.footprint
        ? {
            w:
              typeof structure.footprint.w === 'number' && Number.isFinite(structure.footprint.w)
                ? structure.footprint.w
                : 1,
            h:
              typeof structure.footprint.h === 'number' && Number.isFinite(structure.footprint.h)
                ? structure.footprint.h
                : 1
          }
        : { w: 1, h: 1 }
  }));
}

function normalizeBuildQueue(candidate: SaveV3['buildQueue'] | unknown): SaveV3['buildQueue'] {
  if (!Array.isArray(candidate)) {
    return [];
  }
  return candidate.map((job, index) => ({
    id: typeof job?.id === 'number' ? job.id : index,
    type: job?.type === 'cottage' ? 'cottage' : 'cottage',
    x: typeof job?.x === 'number' ? job.x : 0,
    y: typeof job?.y === 'number' ? job.y : 0,
    footprint:
      job && typeof job === 'object' && job.footprint
        ? {
            w: typeof job.footprint.w === 'number' ? job.footprint.w : 1,
            h: typeof job.footprint.h === 'number' ? job.footprint.h : 1
          }
        : { w: 1, h: 1 },
    duration: typeof job?.duration === 'number' ? job.duration : 10,
    remaining: typeof job?.remaining === 'number' ? job.remaining : 10,
    status: job?.status === 'building' ? 'building' : 'queued'
  }));
}

function normalizeConstructionQueue(
  candidate: SaveV3['constructionQueue'] | unknown,
  buildQueueFallback: BuildJob[]
): SaveV3['constructionQueue'] {
  if (!Array.isArray(candidate)) {
    return buildQueueFallback.map(convertBuildJobToConstructionJob);
  }

  return candidate.map((job, index) => ({
    id: typeof job?.id === 'number' ? job.id : buildQueueFallback[index]?.id ?? index,
    buildingId:
      typeof job?.buildingId === 'string'
        ? job.buildingId
        : buildQueueFallback[index]?.type ?? 'cottage',
    duration:
      typeof job?.duration === 'number' && Number.isFinite(job.duration)
        ? job.duration
        : buildQueueFallback[index]?.duration ?? 0,
    remaining:
      typeof job?.remaining === 'number' && Number.isFinite(job.remaining)
        ? job.remaining
        : buildQueueFallback[index]?.remaining ?? 0,
    footprint:
      job && typeof job === 'object' && job.footprint
        ? {
            w:
              typeof job.footprint.w === 'number' && Number.isFinite(job.footprint.w)
                ? job.footprint.w
                : buildQueueFallback[index]?.footprint.w ?? 1,
            h:
              typeof job.footprint.h === 'number' && Number.isFinite(job.footprint.h)
                ? job.footprint.h
                : buildQueueFallback[index]?.footprint.h ?? 1
          }
        : buildQueueFallback[index]?.footprint ?? { w: 1, h: 1 }
  }));
}

function normalizeBuildingInstances(
  candidate: SaveV3['buildings'] | unknown
): SaveV3['buildings'] {
  if (!Array.isArray(candidate)) {
    return [];
  }
  return candidate.map((instance, index) => ({
    id: typeof instance?.id === 'number' ? instance.id : index,
    buildingId:
      typeof instance?.buildingId === 'string' ? instance.buildingId : 'cottage',
    recipeId: typeof instance?.recipeId === 'string' ? instance.recipeId : undefined,
    productionNodeId:
      typeof instance?.productionNodeId === 'number' ? instance.productionNodeId : undefined
  }));
}

function normalizeSeasonState(candidate: unknown): SeasonState {
  const fallback = createDefaultSeasonState();
  if (!isRecord(candidate)) {
    return fallback;
  }

  const rawActive = candidate.active;
  const active = isSeasonId(rawActive) ? rawActive : fallback.active;
  const definition = getSeasonDefinition(active);

  const rawElapsed = typeof candidate.elapsed === 'number' && Number.isFinite(candidate.elapsed)
    ? candidate.elapsed
    : fallback.elapsed;
  const elapsed = Math.max(0, Math.min(rawElapsed, definition.durationSeconds));

  const rawCycle = typeof candidate.cycle === 'number' && Number.isFinite(candidate.cycle)
    ? Math.max(0, Math.floor(candidate.cycle))
    : fallback.cycle;

  const rawYear = typeof candidate.year === 'number' && Number.isFinite(candidate.year)
    ? Math.max(0, Math.floor(candidate.year))
    : fallback.year;

  return clampSeasonElapsed({ active, elapsed, cycle: rawCycle, year: rawYear });
}

function convertBuildJobToConstructionJob(job: BuildJob): ConstructionJob {
  return {
    id: job.id,
    buildingId: job.type,
    duration: job.duration,
    remaining: job.remaining,
    footprint: job.footprint
  };
}

function migrateV1ToV3(save: SaveV1, resourceTable: ResourcesTable): SaveV4 {
  const base = defaultState(resourceTable);
  return {
    ...base,
    seed: save.seed,
    resources: sanitizeResources(save.resources, resourceTable)
  };
}

function migrateV0ToV3(save: SaveV0, resourceTable: ResourcesTable): SaveV4 {
  const base = defaultState(resourceTable);
  return {
    ...base,
    seed: save.seed,
    resources: sanitizeResources(save, resourceTable)
  };
}

export function migrateSave(raw: unknown, resourceTable: ResourcesTable): GameState | null {
  if (isSaveV4(raw)) {
    const buildQueue = normalizeBuildQueue(raw.buildQueue);
    return {
      v: 1,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      seed: typeof raw.seed === 'number' ? raw.seed : 0,
      resources: sanitizeResources(raw.resources ?? {}, resourceTable),
      structures: normalizeStructures(raw.structures),
      buildQueue,
      constructionQueue: normalizeConstructionQueue(raw.constructionQueue, buildQueue),
      buildings: normalizeBuildingInstances(raw.buildings),
      nextBuildId: typeof raw.nextBuildId === 'number' ? raw.nextBuildId : 1,
      nextBuildingInstanceId:
        typeof raw.nextBuildingInstanceId === 'number' ? raw.nextBuildingInstanceId : 1,
      season: normalizeSeasonState(raw.season)
    };
  }

  if (isSaveV3(raw)) {
    const buildQueue = normalizeBuildQueue(raw.buildQueue);
    return {
      v: 1,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      seed: typeof raw.seed === 'number' ? raw.seed : 0,
      resources: sanitizeResources(raw.resources ?? {}, resourceTable),
      structures: normalizeStructures(raw.structures),
      buildQueue,
      constructionQueue: normalizeConstructionQueue(raw.constructionQueue, buildQueue),
      buildings: normalizeBuildingInstances(raw.buildings),
      nextBuildId: typeof raw.nextBuildId === 'number' ? raw.nextBuildId : 1,
      nextBuildingInstanceId:
        typeof raw.nextBuildingInstanceId === 'number' ? raw.nextBuildingInstanceId : 1,
      season: createDefaultSeasonState()
    };
  }

  if (isSaveV2(raw)) {
    const buildQueue = normalizeBuildQueue(raw.buildQueue);
    return {
      ...defaultState(resourceTable),
      seed: typeof raw.seed === 'number' ? raw.seed : 0,
      resources: sanitizeResources(raw.resources ?? {}, resourceTable),
      structures: normalizeStructures(raw.structures),
      buildQueue,
      constructionQueue: buildQueue.map(convertBuildJobToConstructionJob),
      nextBuildId: typeof raw.nextBuildId === 'number' ? raw.nextBuildId : 1,
      season: createDefaultSeasonState()
    };
  }

  if (isSaveV1(raw)) {
    const migrated = migrateV1ToV3(raw, resourceTable);
    return { ...migrated, season: createDefaultSeasonState(), schemaVersion: CURRENT_SCHEMA_VERSION };
  }

  if (isSaveV0(raw)) {
    const migrated = migrateV0ToV3(raw, resourceTable);
    return { ...migrated, season: createDefaultSeasonState(), schemaVersion: CURRENT_SCHEMA_VERSION };
  }

  return null;
}

export function migrateOrDefault(raw: unknown, resourceTable: ResourcesTable): GameState {
  return migrateSave(raw, resourceTable) ?? defaultState(resourceTable);
}
