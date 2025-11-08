import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load, save, STORAGE_KEY } from '../storage';
import { defaultState, type ResourcesTable } from '../types';

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

const RESOURCE_TABLE: ResourcesTable = {
  wood: { display: 'Wood', stack: 9999 },
  stone: { display: 'Stone', stack: 9999 },
  water: { display: 'Water', stack: 9999 },
  food: { display: 'Food', stack: 9999 },
  coins: { display: 'Coins', stack: 999999 }
};

describe('storage', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it('returns null when no save exists', async () => {
    const result = await load(RESOURCE_TABLE);
    expect(result).toBeNull();
  });

  it('persists and loads the latest save format', async () => {
    const state = defaultState(RESOURCE_TABLE);
    await save(state);

    const raw = store.get(STORAGE_KEY);
    expect(raw).toEqual(state);

    const loaded = await load(RESOURCE_TABLE);
    expect(loaded).toEqual(state);
  });

  it('migrates legacy saves into the latest format', async () => {
    store.set(STORAGE_KEY, {
      seed: 77,
      wood: 10,
      stone: 5,
      food: 2,
      coins: 1
    });

    const loaded = await load(RESOURCE_TABLE);
    const expected = defaultState(RESOURCE_TABLE);
    expected.seed = 77;
    expected.resources = {
      ...expected.resources,
      wood: 10,
      stone: 5,
      food: 2,
      coins: 1
    };
    expected.resourceStorage.wood.current = 10;
    expected.resourceStorage.stone.current = 5;
    expected.resourceStorage.food.current = 2;
    expected.resourceStorage.coins.current = 1;
    expect(loaded).toEqual(expected);
  });
});
