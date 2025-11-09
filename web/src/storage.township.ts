/**
 * Township Storage
 *
 * Save/load functionality for Township phase
 */

import { get, set } from 'idb-keyval';
import type { TownshipState } from './types.township';

export const TOWNSHIP_STORAGE_KEY = 'f2s:web:township:save';

/**
 * Load Township state from storage
 */
export async function loadTownship(): Promise<TownshipState | null> {
  const raw = await get<unknown>(TOWNSHIP_STORAGE_KEY);

  if (raw == null) {
    return null;
  }

  // Basic validation
  if (typeof raw !== 'object' || raw === null) {
    console.warn('Invalid Township save data');
    return null;
  }

  const state = raw as TownshipState;

  // Validate required fields
  if (!state.version || !state.districtId || !state.civilization) {
    console.warn('Incomplete Township save data');
    return null;
  }

  return state;
}

/**
 * Save Township state to storage
 */
export async function saveTownship(state: TownshipState): Promise<void> {
  await set(TOWNSHIP_STORAGE_KEY, state);
}

/**
 * Clear Township save data
 */
export async function clearTownship(): Promise<void> {
  await set(TOWNSHIP_STORAGE_KEY, null);
}
