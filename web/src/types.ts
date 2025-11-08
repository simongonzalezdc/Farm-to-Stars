export type ResourceId = 'wood' | 'stone' | 'food' | 'coins';
export type Resources = Record<ResourceId, number>;
export type ResourceCaps = Partial<Record<ResourceId, number>>;

export type BuildingId = 'foresterHut' | 'stoneQuarry' | 'farmstead';

export type ConstructionJob = {
  buildingId: BuildingId;
  remaining: number;
};

export type RecipeId = 'gatherLogs' | 'quarryStone' | 'growFood';

export type RecipeIO = Partial<Record<ResourceId, number>>;

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
};
