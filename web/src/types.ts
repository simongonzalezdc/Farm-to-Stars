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
  category: string;
  buildTime: number;
  size: [number, number];
  production?: RecipeId;
  effects?: BuildingEffects;
}

export type BuildingsTable = Record<BuildingId, BuildingDefinition>;

export type RecipeIO = [ResourceId, number];

export interface RecipeDefinition {
  inputs: RecipeIO[];
  duration: number;
  outputs: RecipeIO[];
}

export type RecipesTable = Record<RecipeId, RecipeDefinition>;

export type Resources = Record<ResourceId, number>;

export interface WorldBuilding {
  id: string;
  building: BuildingId;
  position: { x: number; y: number };
  startedAt: number;
  completedAt: number | null;
}

export interface WorldState {
  buildings: WorldBuilding[];
}

export interface BuildQueueItem {
  building: BuildingId;
  position: { x: number; y: number };
  startedAt: number;
  duration: number;
}

export interface ProductionQueueItem {
  recipe: RecipeId;
  buildingId: string;
  startedAt: number;
  duration: number;
}

export type SaveV1 = { v: 1; seed: number; resources: Resources };

export const CURRENT_SCHEMA_VERSION = 2;

export type SaveV2 = SaveV1 & {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  resources: Resources;
  world: WorldState;
  buildQueue: BuildQueueItem[];
  productionQueue: ProductionQueueItem[];
};

export type GameState = SaveV2;

export const defaultState = (resourceTable?: ResourcesTable): GameState => ({
  v: 1,
  schemaVersion: CURRENT_SCHEMA_VERSION,
  seed: 12345,
  resources: createEmptyResources(resourceTable),
  world: { buildings: [] },
  buildQueue: [],
  productionQueue: []
});

export const createEmptyResources = (resourceTable?: ResourcesTable): Resources => {
  if (!resourceTable) {
    return { wood: 0, stone: 0, food: 0, coins: 0 };
  }
  const entries = Object.keys(resourceTable).map((id) => [id, 0]);
  return Object.fromEntries(entries) as Resources;
};
