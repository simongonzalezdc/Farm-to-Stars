import type {
  GameEvent,
  GameState,
  RecipeDefinition,
  RecipeId,
  RecipeIO,
  ResourceId
} from '../types';

const EPSILON = 1e-6;

export type EconomyResult = {
  events: GameEvent[];
};

export function processEconomyTick(
  state: GameState,
  dt: number,
  recipes: Record<RecipeId, RecipeDefinition>
): EconomyResult {
  const events: GameEvent[] = [];
  if (state.productionQueue.length === 0 || dt <= 0) {
    return { events };
  }

  const speedMultiplier = Math.max(0, state.productionModifiers.speedMultiplier || 0);
  const outputMultiplier = Math.max(0, state.productionModifiers.outputMultiplier || 0);
  const queueSnapshot = [...state.productionQueue];

  for (const entry of queueSnapshot) {
    const node = state.productionNodes.find((candidate) => candidate.id === entry.nodeId);
    if (!node) {
      continue;
    }

    const recipe = recipes[entry.recipeId] ?? recipes[node.recipeId];
    if (!recipe) {
      node.active = false;
      node.progress = 0;
      continue;
    }

    const duration = recipe.duration;
    const effectiveSpeed = speedMultiplier > 0 ? speedMultiplier : 1;

    if (!node.active) {
      if (!hasOutputCapacity(state, recipe, outputMultiplier)) {
        node.progress = 0;
        continue;
      }
      if (!hasInputs(state, recipe)) {
        node.progress = 0;
        continue;
      }
      consumeInputs(state, recipe);
      node.active = true;
      node.progress = 0;
    }

    if (!node.active) {
      continue;
    }

    node.progress += dt * effectiveSpeed;

    if (node.progress + EPSILON < duration) {
      continue;
    }

    const produced: RecipeIO = {};
    for (const [resource, amount] of Object.entries(recipe.outputs) as [ResourceId, number][]) {
      if (!amount || outputMultiplier <= 0) continue;
      const rawAmount = amount * outputMultiplier;
      const cap = resolveOutputCap(state, recipe, resource);
      const current = state.resources[resource] ?? 0;
      const next = Math.min(cap, current + rawAmount);
      const delta = Math.max(0, next - current);
      if (delta <= 0) {
        continue;
      }
      state.resources[resource] = next;
      syncStorage(state, resource, next);
      produced[resource] = (produced[resource] ?? 0) + delta;
    }

    if (Object.keys(produced).length > 0) {
      events.push({
        type: 'production.cycle',
        nodeId: node.id,
        recipeId: recipe.id,
        outputs: produced
      });
    }

    node.progress = Math.max(0, node.progress - duration);
    node.active = false;
  }

  return { events };
}

function hasInputs(state: GameState, recipe: RecipeDefinition): boolean {
  for (const [resource, amount] of Object.entries(recipe.inputs) as [ResourceId, number][]) {
    if (!amount) continue;
    if ((state.resources[resource] ?? 0) + EPSILON < amount) {
      return false;
    }
  }
  return true;
}

function consumeInputs(state: GameState, recipe: RecipeDefinition) {
  for (const [resource, amount] of Object.entries(recipe.inputs) as [ResourceId, number][]) {
    if (!amount) continue;
    const next = Math.max(0, (state.resources[resource] ?? 0) - amount);
    state.resources[resource] = next;
    syncStorage(state, resource, next);
  }
}

function hasOutputCapacity(
  state: GameState,
  recipe: RecipeDefinition,
  outputMultiplier: number
): boolean {
  if (outputMultiplier <= 0) {
    return false;
  }
  for (const [resource, amount] of Object.entries(recipe.outputs) as [ResourceId, number][]) {
    if (!amount) continue;
    const cap = resolveOutputCap(state, recipe, resource);
    if ((state.resources[resource] ?? 0) >= cap - EPSILON) {
      return false;
    }
  }
  return true;
}

function resolveOutputCap(state: GameState, recipe: RecipeDefinition, resource: ResourceId): number {
  const recipeCap = recipe.outputCaps[resource];
  const storageSlot = ensureStorageSlot(state, resource);
  const storageCap = storageSlot.capacity;
  if (typeof recipeCap === 'number' && Number.isFinite(recipeCap)) {
    return Math.min(recipeCap, storageCap);
  }
  return storageCap;
}

function ensureStorageSlot(state: GameState, resource: ResourceId) {
  const slot = state.resourceStorage[resource];
  if (slot) {
    return slot;
  }
  const fallback = { current: state.resources[resource] ?? 0, capacity: Number.POSITIVE_INFINITY };
  state.resourceStorage[resource] = fallback;
  return fallback;
}

function syncStorage(state: GameState, resource: ResourceId, next: number) {
  const slot = ensureStorageSlot(state, resource);
  slot.current = Math.min(Math.max(0, next), slot.capacity);
}
