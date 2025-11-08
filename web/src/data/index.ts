import type {
  BuildingsTable,
  BuildingDefinition,
  BuildingEffects,
  RecipeDefinition,
  RecipesTable,
  ResourceDefinition,
  ResourcesTable
} from '../types';

export interface DataTables {
  resources: ResourcesTable;
  buildings: BuildingsTable;
  recipes: RecipesTable;
}

let cachedTables: DataTables | null = null;

const RESOURCE_URL = new URL('./resources.json', import.meta.url);
const BUILDING_URL = new URL('./buildings.json', import.meta.url);
const RECIPE_URL = new URL('./recipes.json', import.meta.url);

export async function loadDataTables(): Promise<DataTables> {
  if (cachedTables) {
    return cachedTables;
  }

  const [resourcesRaw, buildingsRaw, recipesRaw] = await Promise.all([
    fetchJson(RESOURCE_URL),
    fetchJson(BUILDING_URL),
    fetchJson(RECIPE_URL)
  ]);

  const resources = validateResourcesTable(resourcesRaw);
  const buildings = validateBuildingsTable(buildingsRaw);
  const recipes = validateRecipesTable(recipesRaw);

  cachedTables = { resources, buildings, recipes };
  return cachedTables;
}

export function getDataTables(): DataTables {
  if (!cachedTables) {
    throw new Error('Data tables have not been loaded yet. Call loadDataTables() first.');
  }
  return cachedTables;
}

async function fetchJson(url: URL): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load data table: ${url}`);
  }
  return res.json();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function validateResourcesTable(raw: unknown): ResourcesTable {
  if (!isRecord(raw)) {
    throw new Error('resources.json must be an object map.');
  }

  const table: Record<string, ResourceDefinition> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isRecord(value)) {
      throw new Error(`Resource \"${key}\" must be an object.`);
    }
    const display = value.display;
    const stack = value.stack;
    if (!isString(display) || !isNumber(stack)) {
      throw new Error(`Resource \"${key}\" is missing required fields.`);
    }
    table[key] = { display, stack };
  }

  return table;
}

function validateBuildingsTable(raw: unknown): BuildingsTable {
  if (!isRecord(raw)) {
    throw new Error('buildings.json must be an object map.');
  }

  const table: Record<string, BuildingDefinition> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isRecord(value)) {
      throw new Error(`Building \"${key}\" must be an object.`);
    }

    const category = value.category;
    const buildTime = value.buildTime;
    const size = value.size;
    const effects = value.effects;
    const production = value.production;

    if (!isString(category) || !isNumber(buildTime) || !Array.isArray(size) || size.length !== 2) {
      throw new Error(`Building \"${key}\" is missing required fields.`);
    }

    const [width, height] = size;
    if (!isNumber(width) || !isNumber(height)) {
      throw new Error(`Building \"${key}\" has invalid size tuple.`);
    }

    let normalizedEffects: BuildingEffects | undefined;
    if (effects !== undefined) {
      if (!isRecord(effects)) {
        throw new Error(`Building \"${key}\" effects must be an object.`);
      }
      const effectRecord: BuildingEffects = {};
      for (const [effectKey, effectValue] of Object.entries(effects)) {
        if (!isNumber(effectValue)) {
          throw new Error(`Building \"${key}\" effect \"${effectKey}\" must be numeric.`);
        }
        effectRecord[effectKey] = effectValue;
      }
      normalizedEffects = effectRecord;
    }

    if (production !== undefined && !isString(production)) {
      throw new Error(`Building \"${key}\" production must be a string.`);
    }

    table[key] = {
      category,
      buildTime,
      size: [width, height],
      ...(normalizedEffects ? { effects: normalizedEffects } : {}),
      ...(production ? { production } : {})
    };
  }

  return table;
}

function validateRecipesTable(raw: unknown): RecipesTable {
  if (!isRecord(raw)) {
    throw new Error('recipes.json must be an object map.');
  }

  const table: Record<string, RecipeDefinition> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isRecord(value)) {
      throw new Error(`Recipe \"${key}\" must be an object.`);
    }

    const inputs = value.inputs;
    const duration = value.duration;
    const outputs = value.outputs;

    if (!Array.isArray(inputs) || !isNumber(duration) || !Array.isArray(outputs)) {
      throw new Error(`Recipe \"${key}\" is missing required fields.`);
    }

    table[key] = {
      inputs: normalizeRecipeIO(key, 'inputs', inputs),
      duration,
      outputs: normalizeRecipeIO(key, 'outputs', outputs)
    };
  }

  return table;
}

function normalizeRecipeIO(
  recipeId: string,
  field: 'inputs' | 'outputs',
  entries: unknown[]
): RecipeDefinition['inputs'] {
  return entries.map((entry, index) => {
    if (!Array.isArray(entry) || entry.length !== 2) {
      throw new Error(`Recipe \"${recipeId}\" ${field} entry #${index} must be a tuple [resource, amount].`);
    }
    const [resource, amount] = entry;
    if (!isString(resource) || !isNumber(amount)) {
      throw new Error(`Recipe \"${recipeId}\" ${field} entry #${index} has invalid resource or amount.`);
    }
    return [resource, amount];
  });
}
