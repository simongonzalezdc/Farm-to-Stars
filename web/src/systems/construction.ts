import type {
  BuildingDefinition,
  BuildingId,
  BuildingInstance,
  ConstructionJob,
  GameState
} from '../types';

export type ConstructionResult = {
  completed: BuildingInstance[];
};

export function processConstruction(
  state: GameState,
  dt: number,
  buildingDefs: Record<BuildingId, BuildingDefinition>
): ConstructionResult {
  const completed: BuildingInstance[] = [];
  const nextQueue: ConstructionJob[] = [];

  for (const job of state.constructionQueue) {
    const remaining = Math.max(0, job.remaining - dt);
    if (remaining > 0) {
      nextQueue.push({ ...job, remaining });
      continue;
    }

    const def = buildingDefs[job.buildingId];
    if (!def) {
      // Unknown building, drop the job but keep progressing the queue.
      continue;
    }

    const instance: BuildingInstance = {
      id: state.nextBuildingInstanceId++,
      buildingId: job.buildingId,
      recipeId: def.recipeId
    };
    completed.push(instance);
    state.buildings.push(instance);
  }

  state.constructionQueue = nextQueue;

  return { completed };
}
