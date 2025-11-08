import { DEFAULT_SEASON_ID, getSeasonDefinition, type SeasonId } from './config/seasons';

export type ResourceId = string;
export type BuildingId = string;
export type RecipeId = string;

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

export type Resources = Record<ResourceId, number>;
export type ResourceCaps = Partial<Record<ResourceId, number>>;

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

export type GameEvent =
  | { type: 'construction.completed'; building: Structure }
  | { type: 'resource.collected'; resource: ResourceId; amount: number }
  | { type: 'season.changed'; season: SeasonId };

export const CURRENT_SCHEMA_VERSION = 4;

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
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  structures: Structure[];
  buildQueue: BuildJob[];
  constructionQueue: ConstructionJob[];
  buildings: BuildingInstance[];
  nextBuildId: number;
  nextBuildingInstanceId: number;
  season: SeasonState;
}

export type GameState = SaveV4;

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

export function defaultState(resourceTable?: ResourcesTable): GameState {
  return {
    v: 1,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    seed: 12345,
    resources: createEmptyResources(resourceTable),
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
    nextBuildId: 1,
    nextBuildingInstanceId: 1,
    season: createDefaultSeasonState()
  };
}
