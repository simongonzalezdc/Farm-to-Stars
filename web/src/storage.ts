import { del, get, set } from 'idb-keyval';
import { migrateSave } from './migrations';
import { CURRENT_SCHEMA_VERSION, type GameState, type ResourcesTable } from './types';

export const STORAGE_KEY = 'f2s:web:save';
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

  const schemaInRaw =
    typeof raw === 'object' && raw !== null && 'schemaVersion' in raw
      ? (raw as { schemaVersion?: number }).schemaVersion
      : undefined;
  if (schemaInRaw !== CURRENT_SCHEMA_VERSION) {
    await save(migrated);
  }

  return migrated;
}

export async function save(state: GameState) {
  await set(STORAGE_KEY, state);
}

/**
 * Clear all save data (reset the game)
 */
export async function clear(): Promise<void> {
  // Delete the main storage key
  await del(STORAGE_KEY);
  // Also delete legacy keys
  for (const key of LEGACY_KEYS) {
    await del(key);
  }
}
