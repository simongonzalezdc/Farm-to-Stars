import type {
  BuildingDefinition,
  BuildingId,
  BuildingInstance,
  ConstructionJob,
  GameState
} from '../types';

export type CompletedConstruction =
  | { job: ConstructionJob; instance: BuildingInstance; reason?: undefined }
  | { job: ConstructionJob; instance?: undefined; reason: 'unknown-building' };

export type ConstructionResult = {
  completed: CompletedConstruction[];
};

export function processConstruction(
  state: GameState,
  dt: number,
  buildingDefs: Partial<Record<BuildingId, BuildingDefinition>>
): ConstructionResult {
  const completed: CompletedConstruction[] = [];
  const nextQueue: ConstructionJob[] = [];

  for (const job of state.constructionQueue) {
    const remaining = Math.max(0, job.remaining - dt);
    if (remaining > 0) {
      nextQueue.push({ ...job, remaining });
      continue;
    }

    const def = buildingDefs[job.buildingId];
    if (!def) {
      completed.push({ job, reason: 'unknown-building' });
      continue;
    }

    const instance: BuildingInstance = {
      id: state.nextBuildingInstanceId++,
      buildingId: job.buildingId,
      recipeId: def.recipeId
    };
    completed.push({ job: { ...job, remaining: 0 }, instance });
    state.buildings.push(instance);
  }

  state.constructionQueue = nextQueue;

  return { completed };
}
