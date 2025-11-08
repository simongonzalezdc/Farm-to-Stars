import {
  CURRENT_SCHEMA_VERSION,
  LEGACY_SCHEMA_VERSION,
  PREVIOUS_SCHEMA_VERSION,
  clamp01,
  clampSeasonElapsed,
  createDefaultHomesteadState,
  createDefaultJobQueueState,
  createDefaultLivestockState,
  createDefaultMailState,
  createDefaultSeasonState,
  createDefaultStaminaState,
  createDefaultTimeState,
  createDefaultWeatherState,
  createEmptyFieldState,
  createEmptyResourceStorage,
  createEmptyResources,
  defaultState,
  isWeatherType,
  parseTileKey,
  LEGACY_RESOURCE_IDS,
  type BackgroundJobQueueState,
  type BuildJob,
  type ConstructionJob,
  type Orientation,
  type CropTileState,
  type FieldState,
  type GameState,
  type HomesteadState,
  type LivestockHerdState,
  type MailState,
  type ProductionModifiers,
  type ProductionNode,
  type ProductionQueueItem,
  type Resources,
  type ResourceId,
  type ResourcesTable,
  type ResourceStorageState,
  type ToolPerkId,
  type ToolId,
  type SaveV0,
  type SaveV1,
  type SaveV2,
  type SaveV3,
  type SaveV4,
  type SaveV5,
  type SaveV6,
  type SeasonState,
  type WeatherEventsState,
  type WeatherState
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

function isSaveV6(candidate: unknown): candidate is SaveV6 {
  if (!isRecord(candidate)) return false;
  return candidate.v === 1 && candidate.schemaVersion === CURRENT_SCHEMA_VERSION;
}

function isSaveV5(candidate: unknown): candidate is SaveV5 {
  if (!isRecord(candidate)) return false;
  return candidate.v === 1 && candidate.schemaVersion === PREVIOUS_SCHEMA_VERSION;
}

function isSaveV4(candidate: unknown): candidate is SaveV4 {
  if (!isRecord(candidate)) return false;
  return candidate.v === 1 && candidate.schemaVersion === LEGACY_SCHEMA_VERSION;
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

function cloneStructure(structure: SaveV3['structures'][number]): SaveV3['structures'][number] {
  return {
    ...structure,
    orientation: coerceOrientation(structure.orientation, 0),
    footprint: { ...structure.footprint }
  };
}

function normalizeStructures(
  candidate: SaveV3['structures'] | unknown,
  fallback: SaveV3['structures']
): SaveV3['structures'] {
  const baseFallback = fallback.length > 0
    ? cloneStructure(fallback[0])
    : { id: 0, type: 'cottage', x: 0, y: 0, footprint: { w: 1, h: 1 }, orientation: 0 };

  if (!Array.isArray(candidate)) {
    return fallback.map(cloneStructure);
  }

  return candidate.map((structure, index) => {
    const source = fallback[index] ? cloneStructure(fallback[index]) : { ...baseFallback, id: index };

    const id =
      typeof structure?.id === 'number' && Number.isFinite(structure.id) ? structure.id : source.id ?? index;
    const type = typeof structure?.type === 'string' ? structure.type : source.type ?? 'cottage';
    const x = typeof structure?.x === 'number' && Number.isFinite(structure.x) ? structure.x : source.x ?? 0;
    const y = typeof structure?.y === 'number' && Number.isFinite(structure.y) ? structure.y : source.y ?? 0;

    const footprint =
      structure && typeof structure === 'object' && 'footprint' in structure && structure.footprint
        ? {
            w:
              typeof structure.footprint.w === 'number' && Number.isFinite(structure.footprint.w) &&
              structure.footprint.w > 0
                ? structure.footprint.w
                : source.footprint.w,
            h:
              typeof structure.footprint.h === 'number' && Number.isFinite(structure.footprint.h) &&
              structure.footprint.h > 0
                ? structure.footprint.h
                : source.footprint.h
          }
        : { ...source.footprint };

    const orientation = coerceOrientation((structure as { orientation?: unknown })?.orientation, source.orientation);

    return { id, type, x, y, footprint, orientation };
  });
}

function normalizeBuildQueue(candidate: SaveV3['buildQueue'] | unknown): SaveV3['buildQueue'] {
  if (!Array.isArray(candidate)) {
    return [];
  }
  return candidate.map((job, index) => ({
    id: typeof job?.id === 'number' ? job.id : index,
    type: typeof job?.type === 'string' ? job.type : 'cottage',
    x: typeof job?.x === 'number' ? job.x : 0,
    y: typeof job?.y === 'number' ? job.y : 0,
    orientation: coerceOrientation((job as { orientation?: unknown })?.orientation),
    footprint:
      job && typeof job === 'object' && job.footprint
        ? {
            w: typeof job.footprint.w === 'number' ? job.footprint.w : 1,
            h: typeof job.footprint.h === 'number' ? job.footprint.h : 1
          }
        : { w: 1, h: 1 },
    duration:
      typeof job?.duration === 'number' && Number.isFinite(job.duration) && job.duration >= 0
        ? job.duration
        : 10,
    remaining:
      typeof job?.remaining === 'number' && Number.isFinite(job.remaining) && job.remaining >= 0
        ? job.remaining
        : 10,
    status: job?.status === 'building' ? 'building' : 'queued'
  }));
}

function convertBuildJobToConstructionJob(job: BuildJob): ConstructionJob {
  return {
    id: job.id,
    buildingId: job.type,
    duration: job.duration,
    remaining: job.remaining,
    footprint: job.footprint,
    orientation: job.orientation
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
    orientation: coerceOrientation((job as { orientation?: unknown })?.orientation, buildQueueFallback[index]?.orientation ?? 0),
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

function normalizeHomesteadState(candidate: unknown): HomesteadState {
  const fallback = createDefaultHomesteadState();
  if (!isRecord(candidate)) {
    return fallback;
  }

  const field = normalizeFieldState((candidate as { field?: unknown }).field, fallback.field);
  const time = normalizeTimeState((candidate as { time?: unknown }).time);
  const stamina = normalizeStaminaState((candidate as { stamina?: unknown }).stamina);
  const weather = normalizeWeatherState((candidate as { weather?: unknown }).weather);
  const livestock = normalizeLivestockState((candidate as { livestock?: unknown }).livestock);

  return { field, time, stamina, weather, livestock };
}

function normalizeFieldState(candidate: unknown, fallback: FieldState): FieldState {
  const base = createEmptyFieldState(fallback.width, fallback.height);
  if (!isRecord(candidate)) {
    return { ...base };
  }

  const width =
    typeof (candidate as FieldState).width === 'number' && Number.isFinite((candidate as FieldState).width)
      ? Math.max(1, Math.floor((candidate as FieldState).width))
      : fallback.width;
  const height =
    typeof (candidate as FieldState).height === 'number' && Number.isFinite((candidate as FieldState).height)
      ? Math.max(1, Math.floor((candidate as FieldState).height))
      : fallback.height;

  const tiles: FieldState['tiles'] = {};
  const rawTiles = (candidate as FieldState).tiles;
  if (isRecord(rawTiles)) {
    for (const [key, value] of Object.entries(rawTiles)) {
      if (!isRecord(value) || parseTileKey(key) == null) {
        continue;
      }
      const tilled = typeof (value as { tilled?: unknown }).tilled === 'boolean' ? (value as { tilled: boolean }).tilled : false;
      const moistureRaw = (value as { moisture?: unknown }).moisture;
      const moisture = typeof moistureRaw === 'number' && Number.isFinite(moistureRaw) ? clamp01(moistureRaw) : 0;
      const crop = normalizeCropTileState((value as { crop?: unknown }).crop);
      if (tilled || crop) {
        tiles[key] = { tilled, moisture, crop };
      }
    }
  }

  return { width, height, tiles };
}

function normalizeLivestockState(candidate: unknown): LivestockHerdState {
  const fallback = createDefaultLivestockState();
  if (!isRecord(candidate)) {
    return fallback;
  }

  const animals: LivestockHerdState['animals'] = [];
  if (Array.isArray((candidate as LivestockHerdState).animals)) {
    for (const entry of (candidate as LivestockHerdState).animals ?? []) {
      if (!isRecord(entry)) continue;
      const id = typeof entry.id === 'number' && Number.isFinite(entry.id) ? Math.max(0, Math.floor(entry.id)) : animals.length;
      const speciesId = typeof entry.speciesId === 'string' ? entry.speciesId : 'chicken';
      const ageDays =
        typeof entry.ageDays === 'number' && Number.isFinite(entry.ageDays) ? Math.max(0, entry.ageDays) : 0;
      const growth =
        typeof entry.growth === 'number' && Number.isFinite(entry.growth) ? clamp01(entry.growth) : 0;
      const hunger =
        typeof entry.hunger === 'number' && Number.isFinite(entry.hunger) ? clamp01(entry.hunger) : 0;
      const produceProgress =
        typeof entry.produceProgress === 'number' && Number.isFinite(entry.produceProgress)
          ? Math.max(0, entry.produceProgress)
          : 0;
      const lastFedDay =
        typeof entry.lastFedDay === 'number' && Number.isFinite(entry.lastFedDay)
          ? Math.max(1, Math.floor(entry.lastFedDay))
          : 1;
      const alive = entry.alive !== false;
      animals.push({ id, speciesId, ageDays, growth, hunger, produceProgress, lastFedDay, alive });
    }
  }

  const nextAnimalId =
    typeof (candidate as LivestockHerdState).nextAnimalId === 'number' &&
    Number.isFinite((candidate as LivestockHerdState).nextAnimalId)
      ? Math.max(animals.length, Math.floor((candidate as LivestockHerdState).nextAnimalId))
      : Math.max(animals.length, fallback.nextAnimalId);

  if (animals.length === 0) {
    return { ...fallback };
  }

  return { animals, nextAnimalId };
}

function normalizeMailState(candidate: unknown): MailState {
  const fallback = createDefaultMailState();
  if (!isRecord(candidate)) {
    return fallback;
  }

  const inbox: MailState['inbox'] = [];
  if (Array.isArray((candidate as MailState).inbox)) {
    for (const entry of (candidate as MailState).inbox ?? []) {
      if (!isRecord(entry)) continue;
      const id = typeof entry.id === 'number' && Number.isFinite(entry.id) ? Math.max(0, Math.floor(entry.id)) : inbox.length;
      const sender = typeof entry.sender === 'string' ? entry.sender : 'unknown';
      const subject = typeof entry.subject === 'string' ? entry.subject : 'Untitled';
      const body = typeof entry.body === 'string' ? entry.body : '';
      const deliveredAtSeconds =
        typeof entry.deliveredAtSeconds === 'number' && Number.isFinite(entry.deliveredAtSeconds)
          ? Math.max(0, entry.deliveredAtSeconds)
          : 0;
      const read = entry.read === true;
      const attachments = normalizeResourceMap((entry as { attachments?: unknown }).attachments);
      inbox.push({ id, sender, subject, body, attachments, deliveredAtSeconds, read });
    }
  }

  const scheduled: MailState['scheduled'] = [];
  if (Array.isArray((candidate as MailState).scheduled)) {
    for (const entry of (candidate as MailState).scheduled ?? []) {
      if (!isRecord(entry)) continue;
      const id = typeof entry.id === 'number' && Number.isFinite(entry.id) ? Math.max(0, Math.floor(entry.id)) : scheduled.length;
      const templateId = typeof entry.templateId === 'string' ? entry.templateId : 'unknown';
      const npcId = typeof entry.npcId === 'string' ? entry.npcId : 'unknown';
      const subject = typeof entry.subject === 'string' ? entry.subject : 'Untitled';
      const body = typeof entry.body === 'string' ? entry.body : '';
      const scheduledAtSeconds =
        typeof entry.scheduledAtSeconds === 'number' && Number.isFinite(entry.scheduledAtSeconds)
          ? Math.max(0, entry.scheduledAtSeconds)
          : 0;
      const attachments = normalizeResourceMap((entry as { attachments?: unknown }).attachments);
      scheduled.push({ id, templateId, npcId, subject, body, scheduledAtSeconds, attachments });
    }
  }

  const nextId =
    typeof (candidate as MailState).nextId === 'number' && Number.isFinite((candidate as MailState).nextId)
      ? Math.max(inbox.length + scheduled.length, Math.floor((candidate as MailState).nextId))
      : Math.max(inbox.length + scheduled.length, fallback.nextId);
  const lastGeneratedDay =
    typeof (candidate as MailState).lastGeneratedDay === 'number' && Number.isFinite((candidate as MailState).lastGeneratedDay)
      ? Math.max(0, Math.floor((candidate as MailState).lastGeneratedDay))
      : fallback.lastGeneratedDay;

  return { nextId, inbox, scheduled, lastGeneratedDay };
}

function normalizeJobQueueState(candidate: unknown): BackgroundJobQueueState {
  const fallback = createDefaultJobQueueState();
  if (!isRecord(candidate)) {
    return fallback;
  }

  const jobs: BackgroundJobQueueState['jobs'] = [];
  if (Array.isArray((candidate as BackgroundJobQueueState).jobs)) {
    for (const entry of (candidate as BackgroundJobQueueState).jobs ?? []) {
      if (!isRecord(entry)) continue;
      const id = typeof entry.id === 'number' && Number.isFinite(entry.id) ? Math.max(0, Math.floor(entry.id)) : jobs.length;
      const type = typeof entry.type === 'string' ? entry.type : 'generic';
      const scheduledAt =
        typeof entry.scheduledAt === 'number' && Number.isFinite(entry.scheduledAt)
          ? Math.max(0, entry.scheduledAt)
          : 0;
      const payload = isRecord(entry.payload) ? { ...entry.payload } : {};
      jobs.push({ id, type, scheduledAt, payload });
    }
  }

  const nextJobId =
    typeof (candidate as BackgroundJobQueueState).nextJobId === 'number' &&
    Number.isFinite((candidate as BackgroundJobQueueState).nextJobId)
      ? Math.max(jobs.length, Math.floor((candidate as BackgroundJobQueueState).nextJobId))
      : Math.max(jobs.length, fallback.nextJobId);

  return { nextJobId, jobs };
}

function normalizeResourceMap(candidate: unknown): Partial<Record<ResourceId, number>> {
  if (!isRecord(candidate)) {
    return {};
  }
  const entries: [ResourceId, number][] = [];
  for (const [key, value] of Object.entries(candidate)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      entries.push([key as ResourceId, value]);
    }
  }
  return Object.fromEntries(entries);
}

function normalizeCropTileState(candidate: unknown): CropTileState | null {
  if (!isRecord(candidate)) {
    return null;
  }
  const cropId = typeof (candidate as CropTileState).cropId === 'string' ? (candidate as CropTileState).cropId : null;
  if (!cropId) {
    return null;
  }
  const stageIndex =
    typeof (candidate as CropTileState).stageIndex === 'number' && Number.isFinite((candidate as CropTileState).stageIndex)
      ? Math.max(0, Math.floor((candidate as CropTileState).stageIndex))
      : 0;
  const stageElapsed =
    typeof (candidate as CropTileState).stageElapsed === 'number' && Number.isFinite((candidate as CropTileState).stageElapsed)
      ? Math.max(0, (candidate as CropTileState).stageElapsed)
      : 0;
  const ready = (candidate as CropTileState).ready === true;
  const withered = (candidate as CropTileState).withered === true;
  return { cropId, stageIndex, stageElapsed, ready, withered };
}

function normalizeTimeState(candidate: unknown) {
  const fallback = createDefaultTimeState();
  if (!isRecord(candidate)) {
    return fallback;
  }

  const secondsPerDay =
    typeof (candidate as { secondsPerDay?: number }).secondsPerDay === 'number' &&
    Number.isFinite((candidate as { secondsPerDay?: number }).secondsPerDay) &&
    (candidate as { secondsPerDay?: number }).secondsPerDay! > 0
      ? (candidate as { secondsPerDay: number }).secondsPerDay
      : fallback.secondsPerDay;
  const elapsedRaw =
    typeof (candidate as { elapsed?: number }).elapsed === 'number' && Number.isFinite((candidate as { elapsed?: number }).elapsed)
      ? Math.max(0, (candidate as { elapsed?: number }).elapsed!)
      : fallback.elapsed;
  const elapsed = Math.min(elapsedRaw, secondsPerDay);
  const day =
    typeof (candidate as { day?: number }).day === 'number' && Number.isFinite((candidate as { day?: number }).day)
      ? Math.max(1, Math.floor((candidate as { day?: number }).day!))
      : fallback.day;

  return { secondsPerDay, elapsed, day };
}

function normalizeStaminaState(candidate: unknown) {
  const fallback = createDefaultStaminaState();
  if (!isRecord(candidate)) {
    return fallback;
  }

  const max =
    typeof (candidate as { max?: number }).max === 'number' && Number.isFinite((candidate as { max?: number }).max)
      ? Math.max(1, Math.floor((candidate as { max?: number }).max!))
      : fallback.max;
  const currentRaw =
    typeof (candidate as { current?: number }).current === 'number' &&
    Number.isFinite((candidate as { current?: number }).current)
      ? Math.max(0, (candidate as { current?: number }).current!)
      : fallback.current;
  const current = Math.min(currentRaw, max);
  const regenPerSecond =
    typeof (candidate as { regenPerSecond?: number }).regenPerSecond === 'number' &&
    Number.isFinite((candidate as { regenPerSecond?: number }).regenPerSecond) &&
    (candidate as { regenPerSecond?: number }).regenPerSecond! >= 0
      ? (candidate as { regenPerSecond: number }).regenPerSecond
      : fallback.regenPerSecond;
  const exhausted = (candidate as { exhausted?: boolean }).exhausted === true && current <= 0;

  return { max, current, regenPerSecond, exhausted };
}

function normalizeWeatherState(candidate: unknown): WeatherState {
  const fallback = createDefaultWeatherState();
  if (!isRecord(candidate)) {
    return fallback;
  }

  const current = isWeatherType((candidate as WeatherState).current) ? (candidate as WeatherState).current : fallback.current;
  const duration =
    typeof (candidate as WeatherState).duration === 'number' &&
    Number.isFinite((candidate as WeatherState).duration) &&
    (candidate as WeatherState).duration > 0
      ? (candidate as WeatherState).duration
      : fallback.duration;
  const elapsed =
    typeof (candidate as WeatherState).elapsed === 'number' &&
    Number.isFinite((candidate as WeatherState).elapsed) &&
    (candidate as WeatherState).elapsed >= 0
      ? Math.min((candidate as WeatherState).elapsed, duration)
      : fallback.elapsed;
  const moistureDelta =
    typeof (candidate as WeatherState).moistureDeltaPerSecond === 'number' &&
    Number.isFinite((candidate as WeatherState).moistureDeltaPerSecond)
      ? (candidate as WeatherState).moistureDeltaPerSecond
      : fallback.moistureDeltaPerSecond;
  const events = normalizeWeatherEvents((candidate as WeatherState).events);
  const rngState =
    typeof (candidate as WeatherState).rngState === 'number' && Number.isFinite((candidate as WeatherState).rngState)
      ? (candidate as WeatherState).rngState >>> 0
      : fallback.rngState;

  return { current, duration, elapsed, moistureDeltaPerSecond: moistureDelta, events, rngState };
}

function normalizeWeatherEvents(candidate: unknown): WeatherEventsState {
  const fallback = createDefaultWeatherState().events;
  if (!isRecord(candidate)) {
    return { ...fallback, active: [] };
  }

  const nextRollIn =
    typeof (candidate as WeatherEventsState).nextRollIn === 'number' &&
    Number.isFinite((candidate as WeatherEventsState).nextRollIn)
      ? Math.max(0, (candidate as WeatherEventsState).nextRollIn)
      : fallback.nextRollIn;
  const serial =
    typeof (candidate as WeatherEventsState).serial === 'number' && Number.isFinite((candidate as WeatherEventsState).serial)
      ? Math.max(0, Math.floor((candidate as WeatherEventsState).serial))
      : fallback.serial;

  const active: WeatherEventsState['active'] = [];
  if (Array.isArray((candidate as WeatherEventsState).active)) {
    for (const entry of (candidate as WeatherEventsState).active ?? []) {
      if (!isRecord(entry)) continue;
      const id = typeof entry.id === 'string' ? entry.id : `wx-${serial}`;
      const type = typeof entry.type === 'string' ? entry.type : 'gusts';
      const duration =
        typeof entry.duration === 'number' && Number.isFinite(entry.duration) && entry.duration > 0
          ? entry.duration
          : 60;
      const remaining =
        typeof entry.remaining === 'number' && Number.isFinite(entry.remaining) && entry.remaining >= 0
          ? Math.min(entry.remaining, duration)
          : duration;
      const intensity =
        typeof entry.intensity === 'number' && Number.isFinite(entry.intensity) ? entry.intensity : 1;
      active.push({ id, type: type as WeatherEventsState['active'][number]['type'], duration, remaining, intensity });
    }
  }

  return { active, nextRollIn, serial };
}

function assembleLatestState(save: Partial<SaveV6> & SaveV3, resourceTable: ResourcesTable): SaveV6 {
  const baseState = defaultState(resourceTable);
  const resources = sanitizeResources(save.resources ?? {}, resourceTable);
  const structures = normalizeStructures(save.structures, baseState.structures);
  const buildQueue = normalizeBuildQueue(save.buildQueue);
  const constructionQueue = normalizeConstructionQueue(save.constructionQueue, buildQueue);
  const buildings = normalizeBuildingInstances(save.buildings);
  const productionNodes = normalizeProductionNodes((save as Partial<SaveV6>).productionNodes);
  const productionQueue = normalizeProductionQueue((save as Partial<SaveV6>).productionQueue);
  const productionModifiers = normalizeProductionModifiers((save as Partial<SaveV6>).productionModifiers);
  const resourceStorage = normalizeResourceStorage(
    (save as Partial<SaveV6>).resourceStorage,
    resourceTable,
    resources
  );
  const season = normalizeSeasonState((save as Partial<SaveV6>).season);
  const homestead = normalizeHomesteadState((save as Partial<SaveV6>).homestead);
  const mail = normalizeMailState((save as Partial<SaveV6>).mail);
  const jobQueue = normalizeJobQueueState((save as Partial<SaveV6>).jobQueue);

  const nodeIds = new Set<number>();
  for (const node of productionNodes) {
    nodeIds.add(node.id);
  }

  let nextProductionNodeId =
    typeof (save as Partial<SaveV5>).nextProductionNodeId === 'number' &&
    Number.isFinite((save as Partial<SaveV5>).nextProductionNodeId)
      ? (save as Partial<SaveV5>).nextProductionNodeId
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
    season,
    homestead,
    mail,
    jobQueue
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
  if (isSaveV6(raw)) {
    return assembleLatestState(raw, resourceTable);
  }

  if (isSaveV5(raw)) {
    return assembleLatestState(raw as unknown as Partial<SaveV6> & SaveV3, resourceTable);
  }

  if (isSaveV4(raw)) {
    return assembleLatestState(raw as unknown as Partial<SaveV6> & SaveV3, resourceTable);
  }

  if (isSaveV3(raw)) {
    return assembleLatestState(raw as unknown as Partial<SaveV6> & SaveV3, resourceTable);
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
    return assembleLatestState(partial as unknown as Partial<SaveV6> & SaveV3, resourceTable);
  }

  if (isSaveV1(raw)) {
    return assembleLatestState(migrateV1ToV3(raw, resourceTable) as unknown as Partial<SaveV6> & SaveV3, resourceTable);
  }

  if (isSaveV0(raw)) {
    return assembleLatestState(migrateV0ToV3(raw, resourceTable) as unknown as Partial<SaveV6> & SaveV3, resourceTable);
  }

  return null;
}

export function migrateOrDefault(raw: unknown, resourceTable: ResourcesTable): GameState {
  return migrateSave(raw, resourceTable) ?? defaultState(resourceTable);
}
