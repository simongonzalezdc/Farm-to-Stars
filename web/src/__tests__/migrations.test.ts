import { describe, expect, it } from 'vitest';
import { migrateOrDefault, migrateSave } from '../migrations';
import {
  CURRENT_SCHEMA_VERSION,
  createDefaultSeasonState,
  defaultState,
  type ResourcesTable
} from '../types';

const RESOURCE_TABLE: ResourcesTable = {
  wood: { display: 'Wood', stack: 9999 },
  stone: { display: 'Stone', stack: 9999 },
  water: { display: 'Water', stack: 9999 },
  food: { display: 'Food', stack: 9999 },
  coins: { display: 'Coins', stack: 999999 }
};

describe('save migrations', () => {
  it('returns null for invalid input', () => {
    expect(migrateSave('nope', RESOURCE_TABLE)).toBeNull();
    expect(migrateSave({ v: 2, seed: 1 }, RESOURCE_TABLE)).toBeNull();
  });

  it('migrates v1 saves while sanitizing resources', () => {
    const migrated = migrateSave(
      {
        v: 1,
        seed: 42,
        resources: { wood: 10, stone: undefined, food: 3, coins: Number.NaN }
      },
      RESOURCE_TABLE
    );

    expect(migrated).not.toBeNull();
    expect(migrated).toMatchObject({
      seed: 42,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      season: createDefaultSeasonState()
    });
    expect(migrated?.resources).toEqual({
      wood: 10,
      stone: 0,
      water: 0,
      food: 3,
      coins: 0
    });
    expect(migrated?.resourceStorage).toMatchObject({
      wood: { capacity: 9999, current: 10 },
      stone: { capacity: 9999, current: 0 },
      water: { capacity: 9999, current: 0 }
    });
    expect(migrated?.productionNodes).toEqual([]);
    expect(migrated?.productionQueue).toEqual([]);
  });

  it('upgrades v0 saves into the latest structure', () => {
    const migrated = migrateSave(
      {
        seed: 21,
        wood: 5,
        stone: 6,
        food: 7,
        coins: 8
      },
      RESOURCE_TABLE
    );

    expect(migrated).not.toBeNull();
    expect(migrated).toMatchObject({
      seed: 21,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      season: createDefaultSeasonState()
    });
    expect(migrated?.resources).toEqual({
      wood: 5,
      stone: 6,
      water: 0,
      food: 7,
      coins: 8
    });
  });

  it('falls back to default state when migration fails', () => {
    const migrated = migrateOrDefault({ wrong: true }, RESOURCE_TABLE);
    expect(migrated).toEqual(defaultState(RESOURCE_TABLE));
  });
});
