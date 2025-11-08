import {
  CURRENT_SCHEMA_VERSION,
  clampSeasonElapsed,
  createDefaultSeasonState,
  createEmptyResourceStorage,
  createEmptyResources,
  defaultState,
  LEGACY_RESOURCE_IDS,
  type BuildJob,
  type ConstructionJob,
  type GameState,
  type ProductionModifiers,
  type ProductionNode,
  type ProductionQueueItem,
  type Resources,
  type ResourceId,
  type ResourcesTable,
  type ResourceStorageState,
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

function convertBuildJobToConstructionJob(job: BuildJob): ConstructionJob {
  return {
    id: job.id,
    buildingId: job.type,
    duration: job.duration,
    remaining: job.remaining,
    footprint: job.footprint
  };
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
  candidate: SaveV3['buildings'] | SaveV4['buildings'] | unknown
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

  const rawElapsed =
    typeof candidate.elapsed === 'number' && Number.isFinite(candidate.elapsed)
      ? candidate.elapsed
      : fallback.elapsed;
  const elapsed = Math.max(0, Math.min(rawElapsed, definition.durationSeconds));

  const rawCycle =
    typeof candidate.cycle === 'number' && Number.isFinite(candidate.cycle)
      ? Math.max(0, Math.floor(candidate.cycle))
      : fallback.cycle;

  const rawYear =
    typeof candidate.year === 'number' && Number.isFinite(candidate.year)
      ? Math.max(0, Math.floor(candidate.year))
      : fallback.year;

  return clampSeasonElapsed({ active, elapsed, cycle: rawCycle, year: rawYear });
}

function normalizeProductionNodes(candidate: unknown): ProductionNode[] {
  if (!Array.isArray(candidate)) {
    return [];
  }
  return candidate.reduce<ProductionNode[]>((acc, node, index) => {
    if (!node || typeof node !== 'object') return acc;
    const id = typeof (node as ProductionNode).id === 'number' ? (node as ProductionNode).id : index;
    const recipeId = typeof (node as ProductionNode).recipeId === 'string'
      ? (node as ProductionNode).recipeId
      : undefined;
    if (!recipeId) {
      return acc;
    }
    const progress =
      typeof (node as ProductionNode).progress === 'number' && Number.isFinite((node as ProductionNode).progress)
        ? (node as ProductionNode).progress
        : 0;
    const active = typeof (node as ProductionNode).active === 'boolean'
      ? (node as ProductionNode).active
      : false;
    acc.push({ id, recipeId, progress, active });
    return acc;
  }, []);
}

function normalizeProductionQueue(candidate: unknown): ProductionQueueItem[] {
  if (!Array.isArray(candidate)) {
    return [];
  }
  return candidate.reduce<ProductionQueueItem[]>((acc, item) => {
    if (!item || typeof item !== 'object') return acc;
    const nodeId = typeof (item as ProductionQueueItem).nodeId === 'number'
      ? (item as ProductionQueueItem).nodeId
      : undefined;
    const recipeId = typeof (item as ProductionQueueItem).recipeId === 'string'
      ? (item as ProductionQueueItem).recipeId
      : undefined;
    if (nodeId == null || !recipeId) {
      return acc;
    }
    acc.push({ nodeId, recipeId });
    return acc;
  }, []);
}

function normalizeProductionModifiers(candidate: unknown): ProductionModifiers {
  const defaults: ProductionModifiers = { speedMultiplier: 1, outputMultiplier: 1 };
  if (!candidate || typeof candidate !== 'object') {
    return defaults;
  }
  const speed = (candidate as ProductionModifiers).speedMultiplier;
  const output = (candidate as ProductionModifiers).outputMultiplier;
  return {
    speedMultiplier: typeof speed === 'number' && Number.isFinite(speed) && speed > 0 ? speed : 1,
    outputMultiplier: typeof output === 'number' && Number.isFinite(output) && output > 0 ? output : 1
  };
}

function normalizeResourceStorage(
  candidate: unknown,
  resourceTable: ResourcesTable,
  resources: Resources
): ResourceStorageState {
  const base = createEmptyResourceStorage(resourceTable);
  if (!candidate || typeof candidate !== 'object') {
    for (const key of Object.keys(base) as ResourceId[]) {
      base[key].current = resources[key] ?? 0;
    }
    return base;
  }

  const storage = { ...base };
  for (const key of Object.keys(storage) as ResourceId[]) {
    const slot = (candidate as ResourceStorageState)[key];
    const capacity =
      typeof slot?.capacity === 'number' && Number.isFinite(slot.capacity) && slot.capacity > 0
        ? slot.capacity
        : storage[key].capacity;
    const currentRaw = typeof slot?.current === 'number' && Number.isFinite(slot.current) ? slot.current : resources[key] ?? 0;
    storage[key] = {
      capacity,
      current: Math.min(Math.max(0, currentRaw), capacity)
    };
  }
  return storage;
}

function assembleV4State(save: Partial<SaveV4> & SaveV3, resourceTable: ResourcesTable): SaveV4 {
  const resources = sanitizeResources(save.resources ?? {}, resourceTable);
  const structures = normalizeStructures(save.structures);
  const buildQueue = normalizeBuildQueue(save.buildQueue);
  const constructionQueue = normalizeConstructionQueue(save.constructionQueue, buildQueue);
  const buildings = normalizeBuildingInstances(save.buildings);
  const productionNodes = normalizeProductionNodes((save as Partial<SaveV4>).productionNodes);
  const productionQueue = normalizeProductionQueue((save as Partial<SaveV4>).productionQueue);
  const productionModifiers = normalizeProductionModifiers((save as Partial<SaveV4>).productionModifiers);
  const resourceStorage = normalizeResourceStorage(
    (save as Partial<SaveV4>).resourceStorage,
    resourceTable,
    resources
  );
  const season = normalizeSeasonState((save as Partial<SaveV4>).season);

  const nodeIds = new Set<number>();
  for (const node of productionNodes) {
    nodeIds.add(node.id);
  }

  let nextProductionNodeId =
    typeof (save as Partial<SaveV4>).nextProductionNodeId === 'number' &&
    Number.isFinite((save as Partial<SaveV4>).nextProductionNodeId)
      ? (save as Partial<SaveV4>).nextProductionNodeId
      : productionNodes.reduce((max, node) => Math.max(max, node.id), 0) + 1;

  for (const building of buildings) {
    if (!building.recipeId) {
      building.productionNodeId = undefined;
      continue;
    }
    if (building.productionNodeId && nodeIds.has(building.productionNodeId)) {
      continue;
    }
    const nodeId = nextProductionNodeId++;
    productionNodes.push({ id: nodeId, recipeId: building.recipeId, progress: 0, active: false });
    productionQueue.push({ nodeId, recipeId: building.recipeId });
    building.productionNodeId = nodeId;
    nodeIds.add(nodeId);
  }

  const validNodeIds = new Set(productionNodes.map((node) => node.id));
  const filteredQueue = productionQueue.filter((item, index, arr) => {
    if (!validNodeIds.has(item.nodeId)) {
      return false;
    }
    const firstIndex = arr.findIndex((entry) => entry.nodeId === item.nodeId);
    return firstIndex === index;
  });

  for (const key of Object.keys(resourceStorage) as ResourceId[]) {
    const cap = resourceStorage[key].capacity;
    const current = resources[key] ?? 0;
    resourceStorage[key].current = Math.min(Math.max(0, current), cap);
  }

  const nextBuildId =
    typeof save.nextBuildId === 'number' && Number.isFinite(save.nextBuildId)
      ? save.nextBuildId
      : structures.reduce((max, structure) => Math.max(max, structure.id), 0) + 1;

  const nextBuildingInstanceId =
    typeof save.nextBuildingInstanceId === 'number' && Number.isFinite(save.nextBuildingInstanceId)
      ? save.nextBuildingInstanceId
      : buildings.reduce((max, building) => Math.max(max, building.id), 0) + 1;

  return {
    v: 1,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    seed: typeof save.seed === 'number' && Number.isFinite(save.seed) ? save.seed : 0,
    resources,
    resourceStorage,
    structures,
    buildQueue,
    constructionQueue,
    buildings,
    productionNodes,
    productionQueue: filteredQueue,
    productionModifiers,
    nextBuildId,
    nextBuildingInstanceId,
    nextProductionNodeId,
    season
  };
}

function migrateV1ToV3(save: SaveV1, resourceTable: ResourcesTable): SaveV3 {
  const baseStructures = defaultState(resourceTable).structures;
  return {
    v: 1,
    schemaVersion: 3,
    seed: save.seed,
    resources: sanitizeResources(save.resources, resourceTable),
    structures: baseStructures,
    buildQueue: [],
    constructionQueue: [],
    buildings: [],
    nextBuildId: 1,
    nextBuildingInstanceId: 1
  };
}

function migrateV0ToV3(save: SaveV0, resourceTable: ResourcesTable): SaveV3 {
  const baseStructures = defaultState(resourceTable).structures;
  return {
    v: 1,
    schemaVersion: 3,
    seed: save.seed,
    resources: sanitizeResources(save, resourceTable),
    structures: baseStructures,
    buildQueue: [],
    constructionQueue: [],
    buildings: [],
    nextBuildId: 1,
    nextBuildingInstanceId: 1
  };
}

export function migrateSave(raw: unknown, resourceTable: ResourcesTable): GameState | null {
  if (isSaveV4(raw)) {
    return assembleV4State(raw, resourceTable);
  }

  if (isSaveV3(raw)) {
    return assembleV4State(raw, resourceTable);
  }

  if (isSaveV2(raw)) {
    const buildQueue = normalizeBuildQueue(raw.buildQueue);
    const partial: SaveV3 = {
      v: 1,
      schemaVersion: 3,
      seed: typeof raw.seed === 'number' ? raw.seed : 0,
      resources: sanitizeResources(raw.resources ?? {}, resourceTable),
      structures: normalizeStructures(raw.structures),
      buildQueue,
      constructionQueue: buildQueue.map(convertBuildJobToConstructionJob),
      buildings: [],
      nextBuildId: typeof raw.nextBuildId === 'number' ? raw.nextBuildId : 1,
      nextBuildingInstanceId: 1
    };
    return assembleV4State(partial, resourceTable);
  }

  if (isSaveV1(raw)) {
    return assembleV4State(migrateV1ToV3(raw, resourceTable), resourceTable);
  }

  if (isSaveV0(raw)) {
    return assembleV4State(migrateV0ToV3(raw, resourceTable), resourceTable);
  }

  return null;
}

export function migrateOrDefault(raw: unknown, resourceTable: ResourcesTable): GameState {
  return migrateSave(raw, resourceTable) ?? defaultState(resourceTable);
}
