import { describe, expect, it, beforeEach, vi } from 'vitest';
import { load, save, SAVE_STORAGE_KEY } from '../storage';
import { defaultState } from '../types';

const store = new Map<string, unknown>();

vi.mock('idb-keyval', () => {
  return {
    get: vi.fn((key: string) => Promise.resolve(store.get(key))),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
      return Promise.resolve();
    })
  };
});

describe('storage', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it('returns null when no save exists', async () => {
    const result = await load();
    expect(result).toBeNull();
  });

  it('persists and loads the latest save format', async () => {
    const state = defaultState();
    await save(state);

    const raw = store.get(SAVE_STORAGE_KEY);
    expect(raw).toEqual(state);

    const loaded = await load();
    expect(loaded).toEqual(state);
  });

  it('migrates legacy saves into the latest format', async () => {
    store.set(SAVE_STORAGE_KEY, {
      seed: 77,
      wood: 10,
      stone: 5,
      food: 2,
      coins: 1
    });

    const loaded = await load();
    expect(loaded).toEqual({
      v: 1,
      seed: 77,
      resources: { wood: 10, stone: 5, food: 2, coins: 1 }
    });
  });
});
