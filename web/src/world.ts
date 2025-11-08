import type { GameState, ResourceId, Resources } from './types';

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
}

export function fmt(n: number) {
  return Math.floor(n).toLocaleString();
}
