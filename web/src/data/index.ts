import type {
  BuildingsTable,
  BuildingDefinition,
  BuildingEffects,
  CropDefinition,
  CropsTable,
  RecipeDefinition,
  RecipesTable,
  ResourceDefinition,
  ResourcesTable,
  ToolDefinition,
  ToolsTable
} from '../types';

export interface DataTables {
  resources: ResourcesTable;
  buildings: BuildingsTable;
  recipes: RecipesTable;
  crops: CropsTable;
  tools: ToolsTable;
}

let cachedTables: DataTables | null = null;

const RESOURCE_URL = new URL('./resources.json', import.meta.url);
const BUILDING_URL = new URL('./buildings.json', import.meta.url);
const RECIPE_URL = new URL('./recipes.json', import.meta.url);
const CROPS_URL = new URL('./crops.json', import.meta.url);
const TOOLS_URL = new URL('./tools.json', import.meta.url);

export async function loadDataTables(): Promise<DataTables> {
  if (cachedTables) {
    return cachedTables;
  }

  const [resourcesRaw, buildingsRaw, recipesRaw, cropsRaw, toolsRaw] = await Promise.all([
    fetchJson(RESOURCE_URL),
    fetchJson(BUILDING_URL),
    fetchJson(RECIPE_URL),
    fetchJson(CROPS_URL),
    fetchJson(TOOLS_URL)
  ]);

  const resources = validateResourcesTable(resourcesRaw);
  const buildings = validateBuildingsTable(buildingsRaw);
  const recipes = validateRecipesTable(recipesRaw);
  const crops = validateCropsTable(cropsRaw);
  const tools = validateToolsTable(toolsRaw);

  cachedTables = { resources, buildings, recipes, crops, tools };
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
      throw new Error(`Resource "${key}" must be an object.`);
    }
    const display = value.display;
    const stack = value.stack;
    if (!isString(display) || !isNumber(stack)) {
      throw new Error(`Resource "${key}" is missing required fields.`);
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
      throw new Error(`Building "${key}" must be an object.`);
    }

    const label = value.label;
    const category = value.category;
    const buildTime = value.buildTime;
    const size = value.size;
    const effects = value.effects;
    const production = value.production;
    const cost = value.cost;

    if (!isNumber(buildTime) || !Array.isArray(size) || size.length !== 2) {
      throw new Error(`Building "${key}" is missing required fields.`);
    }

    const [width, height] = size;
    if (!isNumber(width) || !isNumber(height)) {
      throw new Error(`Building "${key}" has invalid size tuple.`);
    }

    let normalizedLabel = isString(label) ? label : key;
    if (!isString(label)) {
      normalizedLabel = key.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const normalizedCategory = isString(category) ? category : undefined;
    if (category !== undefined && !normalizedCategory) {
      throw new Error(`Building "${key}" category must be a string if provided.`);
    }

    let normalizedEffects: BuildingEffects | undefined;
    if (effects !== undefined) {
      if (!isRecord(effects)) {
        throw new Error(`Building "${key}" effects must be an object.`);
      }
      const effectRecord: BuildingEffects = {};
      for (const [effectKey, effectValue] of Object.entries(effects)) {
        if (!isNumber(effectValue)) {
          throw new Error(`Building "${key}" effect "${effectKey}" must be numeric.`);
        }
        effectRecord[effectKey] = effectValue;
      }
      normalizedEffects = effectRecord;
    }

    if (production !== undefined && !isString(production)) {
      throw new Error(`Building "${key}" production must be a string.`);
    }

    let normalizedCost: BuildingDefinition['cost'];
    if (cost !== undefined) {
      if (!isRecord(cost)) {
        throw new Error(`Building "${key}" cost must be an object map.`);
      }
      const entries: [string, number][] = [];
      for (const [resource, amount] of Object.entries(cost)) {
        if (!isNumber(amount)) {
          throw new Error(`Building "${key}" cost for "${resource}" must be numeric.`);
        }
        entries.push([resource, amount]);
      }
      normalizedCost = Object.fromEntries(entries);
    }

    table[key] = {
      id: key,
      label: normalizedLabel,
      buildTime,
      footprint: { w: width, h: height },
      ...(normalizedCategory ? { category: normalizedCategory } : {}),
      ...(normalizedEffects ? { effects: normalizedEffects } : {}),
      ...(production ? { recipeId: production } : {}),
      ...(normalizedCost ? { cost: normalizedCost } : {})
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
      throw new Error(`Recipe "${key}" must be an object.`);
    }

    const inputs = value.inputs;
    const duration = value.duration;
    const outputs = value.outputs;
    const outputCaps = value.outputCaps;

    if (!Array.isArray(inputs) || !isNumber(duration) || !Array.isArray(outputs)) {
      throw new Error(`Recipe "${key}" is missing required fields.`);
    }

    table[key] = {
      id: key,
      duration,
      inputs: normalizeRecipeIO(key, 'inputs', inputs),
      outputs: normalizeRecipeIO(key, 'outputs', outputs),
      outputCaps: normalizeOutputCaps(key, outputCaps)
    };
  }

  return table;
}

function validateCropsTable(raw: unknown): CropsTable {
  if (!isRecord(raw)) {
    throw new Error('crops.json must be an object map.');
  }

  const table: Record<string, CropDefinition> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isRecord(value)) {
      throw new Error(`Crop "${key}" must be an object.`);
    }

    const label = value.label;
    const stages = value.stages;
    const yields = value.yields;
    const regrow = value.regrow;

    if (!isString(label) || !Array.isArray(stages) || !Array.isArray(yields)) {
      throw new Error(`Crop "${key}" is missing required fields.`);
    }

    const normalizedStages = stages.map((stage, index) => {
      if (!isRecord(stage)) {
        throw new Error(`Crop "${key}" stage #${index} must be an object.`);
      }
      const id = isString(stage.id) ? stage.id : `${key}:stage:${index}`;
      const duration = isNumber(stage.duration) && stage.duration > 0 ? stage.duration : 1;
      const minMoisture = isNumber(stage.minMoisture)
        ? Math.min(Math.max(stage.minMoisture, 0), 1)
        : 0;
      const consumption =
        isNumber(stage.moistureConsumptionPerSecond) && stage.moistureConsumptionPerSecond >= 0
          ? stage.moistureConsumptionPerSecond
          : 0;
      const wiltThreshold = isNumber(stage.wiltThreshold)
        ? Math.min(Math.max(stage.wiltThreshold, 0), 1)
        : 0;
      return {
        id,
        duration,
        minMoisture,
        moistureConsumptionPerSecond: consumption,
        wiltThreshold
      } satisfies CropDefinition['stages'][number];
    });

    const yieldsRecord = normalizeRecipeIO(key, 'yields', yields);
    const normalizedRegrow = typeof regrow === 'boolean' ? regrow : false;

    table[key] = {
      id: key,
      label,
      stages: normalizedStages,
      yields: yieldsRecord,
      regrow: normalizedRegrow
    };
  }

  return table;
}

function validateToolsTable(raw: unknown): ToolsTable {
  if (!isRecord(raw)) {
    throw new Error('tools.json must be an object map.');
  }

  const table: Record<string, ToolDefinition> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isRecord(value)) {
      throw new Error(`Tool "${key}" must be an object.`);
    }

    const label = value.label;
    const action = value.action;
    const staminaCost = value.staminaCost;
    const moistureDelta = value.moistureDelta;
    const description = value.description;

    if (!isString(label) || !isString(action) || !isNumber(staminaCost)) {
      throw new Error(`Tool "${key}" is missing required fields.`);
    }

    const normalizedMoistureDelta =
      moistureDelta === undefined ? undefined : Math.max(-1, Math.min(1, Number(moistureDelta)));
    const normalizedDescription =
      description === undefined || !isString(description) ? undefined : description;

    table[key] = {
      id: key,
      label,
      action,
      staminaCost,
      ...(normalizedMoistureDelta !== undefined ? { moistureDelta: normalizedMoistureDelta } : {}),
      ...(normalizedDescription ? { description: normalizedDescription } : {})
    };
  }

  return table;
}

function normalizeRecipeIO(
  recipeId: string,
  field: 'inputs' | 'outputs' | 'yields',
  entries: unknown[]
): RecipeDefinition['inputs'] {
  return entries.reduce<RecipeDefinition['inputs']>((acc, entry, index) => {
    if (!Array.isArray(entry) || entry.length !== 2) {
      throw new Error(`Recipe "${recipeId}" ${field} entry #${index} must be a tuple [resource, amount].`);
    }
    const [resource, amount] = entry;
    if (!isString(resource) || !isNumber(amount)) {
      throw new Error(`Recipe "${recipeId}" ${field} entry #${index} has invalid resource or amount.`);
    }
    acc[resource] = amount;
    return acc;
  }, {});
}

function normalizeOutputCaps(recipeId: string, raw: unknown): RecipeDefinition['outputCaps'] {
  if (raw === undefined) {
    return {};
  }
  if (!isRecord(raw)) {
    throw new Error(`Recipe "${recipeId}" outputCaps must be an object map.`);
  }
  const caps: RecipeDefinition['outputCaps'] = {};
  for (const [resource, value] of Object.entries(raw)) {
    if (!isNumber(value)) {
      throw new Error(`Recipe "${recipeId}" output cap for ${resource} must be numeric.`);
    }
    caps[resource as string] = value;
  }
  return caps;
}
