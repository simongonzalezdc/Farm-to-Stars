import {
  CURRENT_SCHEMA_VERSION,
  createEmptyResources,
  defaultState,
  LEGACY_RESOURCE_IDS,
  type GameState,
  type Resources,
  type ResourceId,
  type ResourcesTable,
  type SaveV0,
  type SaveV1,
  type SaveV2
} from './types';

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

function isSaveV2(candidate: unknown): candidate is SaveV2 {
  if (!isRecord(candidate)) return false;
  return candidate.v === 1 && candidate.schemaVersion === CURRENT_SCHEMA_VERSION;
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

function normalizeStructures(candidate: SaveV2['structures'] | unknown): SaveV2['structures'] {
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

function normalizeBuildQueue(candidate: SaveV2['buildQueue'] | unknown): SaveV2['buildQueue'] {
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

function migrateV1ToV2(save: SaveV1, resourceTable: ResourcesTable): SaveV2 {
  const base = defaultState(resourceTable);
  return {
    ...base,
    seed: save.seed,
    resources: sanitizeResources(save.resources, resourceTable)
  };
}

function migrateV0ToV2(save: SaveV0, resourceTable: ResourcesTable): SaveV2 {
  const base = defaultState(resourceTable);
  return {
    ...base,
    seed: save.seed,
    resources: sanitizeResources(save, resourceTable)
  };
}

export function migrateSave(raw: unknown, resourceTable: ResourcesTable): GameState | null {
  if (isSaveV2(raw)) {
    return {
      v: 1,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      seed: typeof raw.seed === 'number' ? raw.seed : 0,
      resources: sanitizeResources(raw.resources ?? {}, resourceTable),
      structures: normalizeStructures(raw.structures),
      buildQueue: normalizeBuildQueue(raw.buildQueue),
      nextBuildId: typeof raw.nextBuildId === 'number' ? raw.nextBuildId : 1
    };
  }

  if (isSaveV1(raw)) {
    return migrateV1ToV2(raw, resourceTable);
  }

  if (isSaveV0(raw)) {
    return migrateV0ToV2(raw, resourceTable);
  }

  return null;
}

export function migrateOrDefault(raw: unknown, resourceTable: ResourcesTable): GameState {
  return migrateSave(raw, resourceTable) ?? defaultState(resourceTable);
}
