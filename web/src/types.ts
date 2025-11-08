import { DEFAULT_SEASON_ID, getSeasonDefinition, type SeasonId } from './config/seasons';

export type ResourceId = string;
export type BuildingId = string;
export type RecipeId = string;
export type CropId = string;
export type ToolId = string;

export interface ResourceDefinition {
  display: string;
  stack: number;
}

export type ResourcesTable = Record<ResourceId, ResourceDefinition>;

export interface BuildingEffects {
  moveMul?: number;
  popCap?: number;
  [key: string]: number | undefined;
}

export interface BuildingDefinition {
  id: BuildingId;
  label: string;
  buildTime: number;
  footprint: Footprint;
  recipeId?: RecipeId;
  effects?: BuildingEffects;
  cost?: Partial<Resources>;
  category?: string;
}

export type BuildingsTable = Record<BuildingId, BuildingDefinition>;

export type RecipeIO = Partial<Record<ResourceId, number>>;

export interface RecipeDefinition {
  id: RecipeId;
  duration: number;
  inputs: RecipeIO;
  outputs: RecipeIO;
  outputCaps: Partial<Record<ResourceId, number>>;
}

export type RecipesTable = Record<RecipeId, RecipeDefinition>;

export interface CropStageDefinition {
  id: string;
  /** Seconds required to progress through the stage under ideal conditions. */
  duration: number;
  /** Minimum soil moisture (0-1) required for growth to proceed. */
  minMoisture: number;
  /** Moisture consumed per in-game second while the crop is in this stage. */
  moistureConsumptionPerSecond: number;
  /** Moisture threshold (0-1) below which the crop immediately withers. */
  wiltThreshold: number;
}

export interface CropDefinition {
  id: CropId;
  label: string;
  stages: CropStageDefinition[];
  /** Harvest yields mapped to resource IDs. */
  yields: RecipeIO;
  /** Whether the crop regrows after harvest (remains at final stage). */
  regrow: boolean;
}

export type CropsTable = Record<CropId, CropDefinition>;

export interface ToolDefinition {
  id: ToolId;
  label: string;
  /** Primary verb used for analytics/UX copy (e.g., "Till", "Water"). */
  action: string;
  /** Base stamina cost applied per use. */
  staminaCost: number;
  /** Optional moisture delta applied per use (e.g., watering can adds moisture). */
  moistureDelta?: number;
  /** Optional note for UI tooltips. */
  description?: string;
}

export type ToolsTable = Record<ToolId, ToolDefinition>;

export type Resources = Record<ResourceId, number>;

export interface ResourceStorageSlot {
  current: number;
  capacity: number;
}

export type ResourceStorageState = Record<ResourceId, ResourceStorageSlot>;

export type BuildingType = BuildingId;

export interface Footprint {
  w: number;
  h: number;
}

export interface Structure {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  footprint: Footprint;
}

export interface BuildJob {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  footprint: Footprint;
  duration: number;
  remaining: number;
  status: 'queued' | 'building';
}

export interface BuildingInstance {
  id: number;
  buildingId: BuildingId;
  recipeId?: RecipeId;
  productionNodeId?: number;
}

export interface ConstructionJob {
  id: number;
  buildingId: BuildingId;
  duration: number;
  remaining: number;
  footprint: Footprint;
}

export interface ProductionNode {
  id: number;
  recipeId: RecipeId;
  progress: number;
  active: boolean;
}

export interface SeasonState {
  active: SeasonId;
  elapsed: number;
  /** Count of total season transitions that have occurred. */
  cycle: number;
  /** Completed yearly loops (each loop is a full season order). */
  year: number;
}

export const HOMESTEAD_FIELD_WIDTH = 200;
export const HOMESTEAD_FIELD_HEIGHT = 200;

export const WEATHER_TYPES = ['clear', 'rain', 'storm'] as const;
export type WeatherType = (typeof WEATHER_TYPES)[number];

export interface TimeOfDayState {
  /** In-game day counter starting at 1. */
  day: number;
  /** Seconds elapsed within the current day. */
  elapsed: number;
  /** Seconds that make up a full in-game day. */
  secondsPerDay: number;
}

export interface StaminaState {
  current: number;
  max: number;
  regenPerSecond: number;
  exhausted: boolean;
}

export interface CropTileState {
  cropId: CropId;
  stageIndex: number;
  stageElapsed: number;
  ready: boolean;
  withered: boolean;
}

export interface SoilTileState {
  tilled: boolean;
  moisture: number;
  crop: CropTileState | null;
}

export interface FieldState {
  width: number;
  height: number;
  tiles: Record<string, SoilTileState>;
}

export interface WeatherState {
  current: WeatherType;
  elapsed: number;
  duration: number;
  /** Net moisture delta applied to tiles per simulated second. */
  moistureDeltaPerSecond: number;
}

export interface HomesteadState {
  field: FieldState;
  time: TimeOfDayState;
  stamina: StaminaState;
  weather: WeatherState;
}

export interface ProductionQueueItem {
  nodeId: number;
  recipeId: RecipeId;
}

export interface ProductionModifiers {
  speedMultiplier: number;
  outputMultiplier: number;
}

export type GameEvent =
  | { type: 'construction.completed'; building: Structure }
  | { type: 'resource.collected'; resource: ResourceId; amount: number }
  | { type: 'season.changed'; season: SeasonId }
  | { type: 'homestead.time.advanced'; day: number; normalizedTime: number }
  | { type: 'homestead.weather.changed'; weather: WeatherType; moistureDeltaPerSecond: number }
  | { type: 'homestead.crop.matured'; cropId: CropId; x: number; y: number }
  | { type: 'homestead.crop.withered'; cropId: CropId; x: number; y: number }
  | { type: 'production.cycle'; nodeId: number; recipeId: RecipeId; outputs: RecipeIO };

export const CURRENT_SCHEMA_VERSION = 5;

export const LEGACY_SCHEMA_VERSION = 4;

export type SaveV0 = { seed: number } & Record<ResourceId, number>;

export interface SaveV1 {
  v: 1;
  seed: number;
  resources: Resources;
}

export interface SaveV2 extends SaveV1 {
  schemaVersion: 2;
  structures: Structure[];
  buildQueue: BuildJob[];
  nextBuildId: number;
}

export interface SaveV3 extends SaveV1 {
  schemaVersion: 3;
  structures: Structure[];
  buildQueue: BuildJob[];
  constructionQueue: ConstructionJob[];
  buildings: BuildingInstance[];
  nextBuildId: number;
  nextBuildingInstanceId: number;
}

export interface SaveV4 extends SaveV1 {
  schemaVersion: typeof LEGACY_SCHEMA_VERSION;
  structures: Structure[];
  buildQueue: BuildJob[];
  constructionQueue: ConstructionJob[];
  buildings: BuildingInstance[];
  productionNodes: ProductionNode[];
  productionQueue: ProductionQueueItem[];
  resourceStorage: ResourceStorageState;
  productionModifiers: ProductionModifiers;
  nextBuildId: number;
  nextBuildingInstanceId: number;
  season: SeasonState;
  nextProductionNodeId: number;
}

export interface SaveV5 extends SaveV4 {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  homestead: HomesteadState;
}

export type GameState = SaveV5;

export const LEGACY_RESOURCE_IDS: ResourceId[] = ['wood', 'stone', 'food', 'coins'];

export function createEmptyResources(resourceTable?: ResourcesTable): Resources {
  if (!resourceTable) {
    return LEGACY_RESOURCE_IDS.reduce<Resources>((acc, id) => {
      acc[id] = 0;
      return acc;
    }, {} as Resources);
  }

  const entries = Object.keys(resourceTable).map((id) => [id, 0]);
  return Object.fromEntries(entries) as Resources;
}

export function createDefaultSeasonState(): SeasonState {
  return {
    active: DEFAULT_SEASON_ID,
    elapsed: 0,
    cycle: 0,
    year: 0
  };
}

export function clampSeasonElapsed(state: SeasonState): SeasonState {
  const definition = getSeasonDefinition(state.active);
  const clampedElapsed = Math.max(
    0,
    Math.min(state.elapsed, Number.isFinite(definition.durationSeconds) ? definition.durationSeconds : state.elapsed)
  );
  return { ...state, elapsed: clampedElapsed };
}

export function isWeatherType(value: unknown): value is WeatherType {
  return typeof value === 'string' && (WEATHER_TYPES as readonly string[]).includes(value);
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}

export function createDefaultTimeState(): TimeOfDayState {
  return {
    day: 1,
    elapsed: 0,
    secondsPerDay: 900
  };
}

export function createDefaultStaminaState(): StaminaState {
  return {
    current: 100,
    max: 100,
    regenPerSecond: 12,
    exhausted: false
  };
}

export function createEmptyFieldState(
  width: number = HOMESTEAD_FIELD_WIDTH,
  height: number = HOMESTEAD_FIELD_HEIGHT
): FieldState {
  return {
    width: Math.max(1, Math.floor(width)),
    height: Math.max(1, Math.floor(height)),
    tiles: {}
  };
}

export function createDefaultWeatherState(): WeatherState {
  return {
    current: 'clear',
    elapsed: 0,
    duration: 180,
    moistureDeltaPerSecond: -0.005
  };
}

export function createDefaultHomesteadState(): HomesteadState {
  return {
    field: createEmptyFieldState(),
    time: createDefaultTimeState(),
    stamina: createDefaultStaminaState(),
    weather: createDefaultWeatherState()
  };
}

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseTileKey(key: string): { x: number; y: number } | null {
  const [xRaw, yRaw] = key.split(',');
  const x = Number.parseInt(xRaw ?? '', 10);
  const y = Number.parseInt(yRaw ?? '', 10);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return { x, y };
}

export function createEmptyResourceStorage(resourceTable?: ResourcesTable): ResourceStorageState {
  if (!resourceTable) {
    return LEGACY_RESOURCE_IDS.reduce<ResourceStorageState>((acc, id) => {
      acc[id] = { current: 0, capacity: Number.POSITIVE_INFINITY };
      return acc;
    }, {} as ResourceStorageState);
  }

  const entries = Object.entries(resourceTable).map(([id, def]) => [
    id,
    { current: 0, capacity: def.stack }
  ]);
  return Object.fromEntries(entries) as ResourceStorageState;
}

export function defaultState(resourceTable?: ResourcesTable): GameState {
  return {
    v: 1,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    seed: 12345,
    resources: createEmptyResources(resourceTable),
    resourceStorage: createEmptyResourceStorage(resourceTable),
    structures: [
      {
        id: 0,
        type: 'cottage',
        x: 10,
        y: 10,
        footprint: { w: 2, h: 2 }
      }
    ],
    buildQueue: [],
    constructionQueue: [],
    buildings: [],
    productionNodes: [],
    productionQueue: [],
    productionModifiers: { speedMultiplier: 1, outputMultiplier: 1 },
    nextBuildId: 1,
    nextBuildingInstanceId: 1,
    season: createDefaultSeasonState(),
    nextProductionNodeId: 1,
    homestead: createDefaultHomesteadState()
  };
}
