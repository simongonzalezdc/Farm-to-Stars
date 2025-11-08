import { describe, expect, it } from 'vitest';
import { migrateOrDefault, migrateSave } from '../migrations';
import { CURRENT_SCHEMA_VERSION, type ResourcesTable } from '../types';

const RESOURCE_TABLE: ResourcesTable = {
  wood: { display: 'Wood', stack: 9999 },
  stone: { display: 'Stone', stack: 9999 },
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

    expect(migrated).toMatchObject({
      seed: 42,
      resources: { wood: 10, stone: 0, food: 3, coins: 0 },
      schemaVersion: CURRENT_SCHEMA_VERSION
    });
  });

  it('upgrades v0 saves into v2 structure', () => {
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

    expect(migrated).toMatchObject({
      seed: 21,
      resources: { wood: 5, stone: 6, food: 7, coins: 8 },
      schemaVersion: CURRENT_SCHEMA_VERSION
    });
  });

  it('falls back to default state when migration fails', () => {
    const migrated = migrateOrDefault({ wrong: true }, RESOURCE_TABLE);
    expect(migrated.v).toBe(1);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});
