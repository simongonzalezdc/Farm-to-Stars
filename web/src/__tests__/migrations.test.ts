import { describe, expect, it } from 'vitest';
import { migrateOrDefault, migrateSave } from '../migrations';

describe('save migrations', () => {
  it('returns null for invalid input', () => {
    expect(migrateSave('nope')).toBeNull();
    expect(migrateSave({ v: 2, seed: 1 })).toBeNull();
  });

  it('migrates v1 saves while sanitizing resources', () => {
    const migrated = migrateSave({
      v: 1,
      seed: 42,
      resources: { wood: 10, stone: undefined, food: 3, coins: Number.NaN }
    });

    expect(migrated).toEqual({
      v: 1,
      seed: 42,
      resources: { wood: 10, stone: 0, food: 3, coins: 0 }
    });
  });

  it('upgrades v0 saves into v1 structure', () => {
    const migrated = migrateSave({
      seed: 21,
      wood: 5,
      stone: 6,
      food: 7,
      coins: 8
    });

    expect(migrated).toEqual({
      v: 1,
      seed: 21,
      resources: { wood: 5, stone: 6, food: 7, coins: 8 }
    });
  });

  it('falls back to default state when migration fails', () => {
    const migrated = migrateOrDefault({ wrong: true });
    expect(migrated.v).toBe(1);
    expect(migrated.resources.wood).toBe(0);
  });
});
