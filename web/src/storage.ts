import { get, set } from 'idb-keyval';
import { migrateSave } from './migrations';
import type { GameState } from './types';

export const SAVE_STORAGE_KEY = 'f2s:web:save:v1';

export async function load(): Promise<GameState | null> {
  const raw = await get(SAVE_STORAGE_KEY);
  return migrateSave(raw);
}
export async function save(s: GameState) {
  await set(SAVE_STORAGE_KEY, s);
import {
  CURRENT_SCHEMA_VERSION,
  createEmptyResources,
  type GameState,
  type ResourcesTable,
  type SaveV1,
  type SaveV2
} from './types';

const STORAGE_KEY = 'f2s:web:save';
const LEGACY_KEYS = ['f2s:web:save:v1'];

export async function load(resourceTable: ResourcesTable): Promise<GameState | null> {
  let raw = await get<unknown>(STORAGE_KEY);
  if (raw == null) {
    for (const key of LEGACY_KEYS) {
      raw = await get<unknown>(key);
      if (raw != null) {
        break;
      }
    }
  }

  if (raw == null) {
    return null;
  }

  const migrated = migrateSave(raw, resourceTable);
  if (!migrated) {
    return null;
  }

  if (migrated.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported save schema version: ${migrated.schemaVersion}`);
  }

  if (!('schemaVersion' in (raw as Record<string, unknown>)) || (raw as { schemaVersion?: number }).schemaVersion !== CURRENT_SCHEMA_VERSION) {
    await save(migrated);
  }

  return migrated;
}

export async function save(state: GameState) {
  await set(STORAGE_KEY, state);
}

export function migrateV1ToV2(save: SaveV1, resourceTable: ResourcesTable): SaveV2 {
  const resources = createEmptyResources(resourceTable);
  for (const [id, amount] of Object.entries(save.resources)) {
    resources[id] = amount;
  }

  return {
    v: save.v,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    seed: save.seed,
    resources,
    world: { buildings: [] },
    buildQueue: [],
    productionQueue: []
  };
}

function migrateSave(raw: unknown, resourceTable: ResourcesTable): GameState | null {
  if (!isRecord(raw)) {
    return null;
  }

  if (raw.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return validateV2(raw as SaveV2, resourceTable);
  }

  if (raw.schemaVersion === undefined) {
    return migrateV1ToV2(raw as SaveV1, resourceTable);
  }

  return null;
}

function validateV2(raw: SaveV2, resourceTable: ResourcesTable): GameState {
  const resources = createEmptyResources(resourceTable);
  for (const [id, amount] of Object.entries(raw.resources)) {
    resources[id] = amount;
  }

  return {
    ...raw,
    resources
  };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}
