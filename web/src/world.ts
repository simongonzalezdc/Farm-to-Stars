import type { GameState, ResourceId, Resources } from './types';
import { processConstruction } from './systems/construction';
import { processEconomy } from './systems/economy';
import type {
  BuildingDefinition,
  BuildingId,
  GameEvent,
  GameState,
  RecipeDefinition,
  RecipeId
} from './types';

export const SIM_DT = 0.1; // 10 Hz

export const EVENT_RESOURCE_PRODUCED = 'resource:produced';
export const EVENT_BUILD_COMPLETE = 'build:complete';

export type ResourceProducedDetail = { resource: ResourceId; amount: number; total: number };
export type BuildCompleteDetail = { buildingId: string; position: { x: number; y: number } };

export const gameEvents = new EventTarget();

const resourceRemainder: Resources = { wood: 0, stone: 0, food: 0, coins: 0 };
let lastTotals: Resources = { wood: 0, stone: 0, food: 0, coins: 0 };
let simTime = 0;
let buildCompleteFired = false;

const RESOURCE_PER_SEC: Partial<Record<ResourceId, number>> = {
  wood: 0.1
};

const BUILD_COMPLETE_AT = 12; // seconds until first cottage is ready

export function initWorld(state: GameState) {
  simTime = 0;
  buildCompleteFired = false;
  Object.keys(resourceRemainder).forEach(key => {
    const resource = key as ResourceId;
    resourceRemainder[resource] = 0;
    lastTotals[resource] = state.resources[resource];
  });
}

function dispatchResource(resource: ResourceId, amount: number, total: number) {
  gameEvents.dispatchEvent(
    new CustomEvent<ResourceProducedDetail>(EVENT_RESOURCE_PRODUCED, {
      detail: { resource, amount, total }
    })
  );
}

export function tick(state: GameState, dt: number) {
  simTime += dt;

  for (const resource of Object.keys(RESOURCE_PER_SEC) as ResourceId[]) {
    const perSec = RESOURCE_PER_SEC[resource] ?? 0;
    if (perSec <= 0) continue;
    const gain = perSec * dt;
    state.resources[resource] += gain;
  }

  for (const key of Object.keys(state.resources) as ResourceId[]) {
    const total = state.resources[key];
    const delta = total - lastTotals[key];
    if (delta > 0) {
      resourceRemainder[key] += delta;
      while (resourceRemainder[key] >= 1) {
        resourceRemainder[key] -= 1;
        dispatchResource(key, 1, total);
      }
    }
    lastTotals[key] = total;
  }

  if (!buildCompleteFired && simTime >= BUILD_COMPLETE_AT) {
    buildCompleteFired = true;
    gameEvents.dispatchEvent(
      new CustomEvent<BuildCompleteDetail>(EVENT_BUILD_COMPLETE, {
        detail: { buildingId: 'cottage', position: { x: 10, y: 10 } }
      })
    );
  }
  // placeholder: gain wood slowly so you see HUD change
  state.resources.wood += 0.1 * dt;

  const job = state.buildQueue[0];
  if (job) {
    if (job.status === 'queued') {
      job.status = 'building';
    }
    job.remaining = Math.max(0, job.remaining - dt);
    if (job.remaining === 0) {
      state.structures.push({
        id: job.id,
        type: job.type,
        x: job.x,
        y: job.y,
        footprint: job.footprint
      });
      state.buildQueue.shift();
    }
  }
export const BUILDING_DEFINITIONS: Record<BuildingId, BuildingDefinition> = {
  foresterHut: {
    id: 'foresterHut',
    label: 'Forester Hut',
    buildTime: 5,
    recipeId: 'gatherLogs'
  },
  stoneQuarry: {
    id: 'stoneQuarry',
    label: 'Stone Quarry',
    buildTime: 8,
    recipeId: 'quarryStone'
  },
  farmstead: {
    id: 'farmstead',
    label: 'Farmstead',
    buildTime: 6,
    recipeId: 'growFood'
  }
};

export const RECIPE_DEFINITIONS: Record<RecipeId, RecipeDefinition> = {
  gatherLogs: {
    id: 'gatherLogs',
    label: 'Gather Logs',
    duration: 3,
    inputs: {},
    outputs: { wood: 3 },
    outputCaps: { wood: 250 }
  },
  quarryStone: {
    id: 'quarryStone',
    label: 'Quarry Stone',
    duration: 6,
    inputs: { wood: 1 },
    outputs: { stone: 1 },
    outputCaps: { stone: 160 }
  },
  growFood: {
    id: 'growFood',
    label: 'Grow Food',
    duration: 5,
    inputs: { stone: 1 },
    outputs: { food: 2 },
    outputCaps: { food: 180 }
  }
};

export function defaultState(): GameState {
  return {
    v: 1,
    seed: 12345,
    tick: 0,
    resources: { wood: 0, stone: 0, food: 0, coins: 0 },
    resourceCaps: { wood: 250, stone: 160, food: 180, coins: 1000 },
    buildings: [],
    constructionQueue: [
      {
        buildingId: 'foresterHut',
        remaining: BUILDING_DEFINITIONS.foresterHut.buildTime
      }
    ],
    productionNodes: [],
    nextBuildingInstanceId: 1,
    nextProductionNodeId: 1
  };
}

export function hydrateState(snapshot: Partial<GameState> | null | undefined): GameState {
  if (!snapshot) return defaultState();
  const base = defaultState();
  return {
    ...base,
    ...snapshot,
    v: 1,
    seed: snapshot.seed ?? base.seed,
    tick: snapshot.tick ?? base.tick,
    resources: { ...base.resources, ...(snapshot.resources ?? {}) },
    resourceCaps: { ...base.resourceCaps, ...(snapshot.resourceCaps ?? {}) },
    buildings: snapshot.buildings ? [...snapshot.buildings] : [...base.buildings],
    constructionQueue: snapshot.constructionQueue
      ? snapshot.constructionQueue.map((job) => ({
          buildingId: job.buildingId ?? 'foresterHut',
          remaining: typeof job.remaining === 'number' ? job.remaining : 0
        }))
      : base.constructionQueue.map((job) => ({ ...job })),
    productionNodes: snapshot.productionNodes
      ? snapshot.productionNodes.map((node, index) => ({
          id: node.id ?? index + 1,
          recipeId: node.recipeId ?? 'gatherLogs',
          progress: typeof node.progress === 'number' ? node.progress : 0,
          active: Boolean(node.active)
        }))
      : [...base.productionNodes],
    nextBuildingInstanceId: snapshot.nextBuildingInstanceId ?? base.nextBuildingInstanceId,
    nextProductionNodeId: snapshot.nextProductionNodeId ?? base.nextProductionNodeId
  };
}

export function tick(state: GameState, dt: number): GameEvent[] {
  state.tick += 1;
  const events: GameEvent[] = [];

  const constructionResult = processConstruction(state, dt, BUILDING_DEFINITIONS);
  for (const building of constructionResult.completed) {
    const def = BUILDING_DEFINITIONS[building.buildingId];
    if (def?.recipeId) {
      const nodeId = state.nextProductionNodeId++;
      state.productionNodes.push({
        id: nodeId,
        recipeId: def.recipeId,
        progress: 0,
        active: false
      });
      building.productionNodeId = nodeId;
    }
    events.push({ type: 'construction.completed', building });
  }

  const economyResult = processEconomy(state, dt, RECIPE_DEFINITIONS);
  events.push(...economyResult.events);

  if (events.length > 0 && typeof console !== 'undefined') {
    for (const event of events) {
      console.debug('[tick %d]', state.tick, event);
    }
  }

  return events;
}

export function fmt(n: number) {
  return Math.floor(n).toLocaleString();
}
