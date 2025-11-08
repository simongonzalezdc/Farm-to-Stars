import type {
  GameEvent,
  GameState,
  RecipeDefinition,
  RecipeId,
  RecipeIO,
  ResourceId
} from '../types';

export type EconomyResult = {
  events: GameEvent[];
};

export function processEconomy(
  state: GameState,
  dt: number,
  recipes: Record<RecipeId, RecipeDefinition>
): EconomyResult {
  const events: GameEvent[] = [];

  for (const node of state.productionNodes) {
    const recipe = recipes[node.recipeId];
    if (!recipe) {
      node.active = false;
      node.progress = 0;
      continue;
    }

    if (!node.active) {
      if (!hasOutputCapacity(state, recipe)) {
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

    if (!node.active) continue;

    node.progress += dt;

    if (node.progress + 1e-6 < recipe.duration) {
      continue;
    }

    const produced: RecipeIO = {};
    for (const [resource, amount] of Object.entries(recipe.outputs) as [ResourceId, number][]) {
      if (!amount) continue;
      const cap = resolveOutputCap(state, recipe, resource);
      const current = state.resources[resource];
      const next = Math.min(cap, current + amount);
      const delta = Math.max(0, next - current);
      if (delta <= 0) continue;
      state.resources[resource] = next;
      produced[resource] = (produced[resource] ?? 0) + delta;
    }

    if (Object.keys(produced).length > 0) {
      events.push({ type: 'production.cycle', nodeId: node.id, recipeId: recipe.id, outputs: produced });
    }

    node.progress = 0;
    node.active = false;
  }

  return { events };
}

function hasInputs(state: GameState, recipe: RecipeDefinition): boolean {
  for (const [resource, amount] of Object.entries(recipe.inputs) as [ResourceId, number][]) {
    if (!amount) continue;
    if (state.resources[resource] < amount) {
      return false;
    }
  }
  return true;
}

function consumeInputs(state: GameState, recipe: RecipeDefinition) {
  for (const [resource, amount] of Object.entries(recipe.inputs) as [ResourceId, number][]) {
    if (!amount) continue;
    state.resources[resource] -= amount;
  }
}

function hasOutputCapacity(state: GameState, recipe: RecipeDefinition): boolean {
  for (const [resource, amount] of Object.entries(recipe.outputs) as [ResourceId, number][]) {
    if (!amount) continue;
    const cap = resolveOutputCap(state, recipe, resource);
    if (state.resources[resource] + amount > cap + 1e-6) {
      return false;
    }
  }
  return true;
}

function resolveOutputCap(
  state: GameState,
  recipe: RecipeDefinition,
  resource: ResourceId
): number {
  const recipeCap = recipe.outputCaps[resource];
  const globalCap = state.resourceCaps[resource];
  if (typeof recipeCap === 'number' && typeof globalCap === 'number') {
    return Math.min(recipeCap, globalCap);
  }
  if (typeof recipeCap === 'number') return recipeCap;
  if (typeof globalCap === 'number') return globalCap;
  return Number.POSITIVE_INFINITY;
}
