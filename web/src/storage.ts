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
}
