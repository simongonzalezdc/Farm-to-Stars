import { get, set } from 'idb-keyval';
import type { GameState } from './types';
const KEY = 'f2s:web:save:v1';

export async function load(): Promise<GameState | null> {
  return (await get(KEY)) ?? null;
}
export async function save(s: GameState) {
  await set(KEY, s);
}
