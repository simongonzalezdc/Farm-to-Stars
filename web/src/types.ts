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
export type ResourceCaps = Partial<Record<ResourceId, number>>;

export type BuildingId = 'foresterHut' | 'stoneQuarry' | 'farmstead';

export type ConstructionJob = {
  buildingId: BuildingId;
  remaining: number;
};

export type RecipeId = 'gatherLogs' | 'quarryStone' | 'growFood';

export type RecipeIO = Partial<Record<ResourceId, number>>;

export type BuildingType = 'cottage';

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

export type SaveV1 = {
  v: 1;
  seed: number;
  resources: Resources;
  structures: Structure[];
  buildQueue: BuildJob[];
  nextBuildId: number;
};

export type GameState = SaveV1;
export type RecipeDefinition = {
  id: RecipeId;
  label: string;
  duration: number;
  inputs: RecipeIO;
  outputs: RecipeIO;
  outputCaps: Partial<Record<ResourceId, number>>;
};

export type BuildingDefinition = {
  id: BuildingId;
  label: string;
  buildTime: number;
  recipeId?: RecipeId;
};

export type BuildingInstance = {
  id: number;
  buildingId: BuildingId;
  recipeId?: RecipeId;
  productionNodeId?: number;
};

export type ProductionNode = {
  id: number;
  recipeId: RecipeId;
  progress: number;
  active: boolean;
};

export type GameEvent =
  | { type: 'construction.completed'; building: BuildingInstance }
  | { type: 'production.cycle'; nodeId: number; recipeId: RecipeId; outputs: RecipeIO };

export type GameState = {
  v: 1;
  seed: number;
  tick: number;
  resources: Resources;
  resourceCaps: ResourceCaps;
  buildings: BuildingInstance[];
  constructionQueue: ConstructionJob[];
  productionNodes: ProductionNode[];
  nextBuildingInstanceId: number;
  nextProductionNodeId: number;
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

export type SaveV0 = { seed: number } & Resources;
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
  resources: { wood: 0, stone: 0, food: 0, coins: 0 },
  structures: [
    {
      id: 0,
      type: 'cottage',
      x: 10,
      y: 10,
      footprint: { w: 1, h: 1 }
    }
  ],
  buildQueue: [],
  nextBuildId: 1
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
