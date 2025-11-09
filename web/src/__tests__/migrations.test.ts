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
  coins: { display: 'Coins', stack: 999999 },
  wheat: { display: 'Wheat', stack: 500 },
  berries: { display: 'Berries', stack: 250 },
  fiber: { display: 'Fiber', stack: 750 },
  eggs: { display: 'Eggs', stack: 250 },
  milk: { display: 'Milk', stack: 250 },
  letters: { display: 'Mail', stack: 99 }
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
      coins: 0,
      wheat: 0,
      berries: 0,
      fiber: 0,
      eggs: 0,
      milk: 0,
      letters: 0
    });
    expect(migrated?.resourceStorage).toMatchObject({
      wood: { capacity: 9999, current: 10 },
      stone: { capacity: 9999, current: 0 },
      water: { capacity: 9999, current: 0 }
    });
    expect(migrated?.productionNodes).toEqual([]);
    expect(migrated?.productionQueue).toEqual([]);
    expect(migrated?.mail.inbox).toEqual([]);
    expect(migrated?.jobQueue.jobs).toEqual([]);
    expect(migrated?.homestead.livestock.animals.length).toBeGreaterThan(0);
    expect(migrated?.homestead.toolMastery).toEqual({});
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
      coins: 8,
      wheat: 0,
      berries: 0,
      fiber: 0,
      eggs: 0,
      milk: 0,
      letters: 0
    });
    expect(migrated?.mail.scheduled).toEqual([]);
    expect(migrated?.homestead.toolMastery).toEqual({});
  });

  it('falls back to default state when migration fails', () => {
    const migrated = migrateOrDefault({ wrong: true }, RESOURCE_TABLE);
    expect(migrated).toEqual(defaultState(RESOURCE_TABLE));
  });

  describe('civilization field migration (v7 → v8)', () => {
    it('adds default civilization to v7 saves', () => {
      const v7Save = {
        v: 1,
        schemaVersion: 7,
        seed: 123,
        resources: { wood: 50, stone: 20, water: 10, food: 15, coins: 100 },
        resourceStorage: {},
        structures: [],
        buildQueue: [],
        constructionQueue: [],
        buildings: [],
        productionNodes: [],
        productionQueue: [],
        productionModifiers: {},
        nextBuildId: 1,
        nextBuildingInstanceId: 1,
        season: createDefaultSeasonState(),
        homestead: {
          field: { plots: [], tilled: [] },
          time: { dayOfSeason: 1, season: 'spring', year: 1, cycle: 1, timeOfDay: 0.5 },
          stamina: { current: 100, max: 100, regenRate: 1, lastUpdate: 0 },
          weather: { current: 'clear', events: { scheduled: [] } },
          livestock: { animals: [], nextAnimalId: 1 },
          toolMastery: {}
        },
        mail: { inbox: [], scheduled: [], nextMailId: 1 },
        jobQueue: { jobs: [], nextJobId: 1 }
      };

      const migrated = migrateSave(v7Save, RESOURCE_TABLE);

      expect(migrated).not.toBeNull();
      expect(migrated?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(migrated?.civilization).toBe('teotihuacan');
    });

    it('preserves existing civilization in v8 saves', () => {
      const v8Save = {
        v: 1,
        schemaVersion: 8,
        civilization: 'maya',
        seed: 456,
        resources: { wood: 50, stone: 20, water: 10, food: 15, coins: 100 },
        resourceStorage: {},
        structures: [],
        buildQueue: [],
        constructionQueue: [],
        buildings: [],
        productionNodes: [],
        productionQueue: [],
        productionModifiers: {},
        nextBuildId: 1,
        nextBuildingInstanceId: 1,
        season: createDefaultSeasonState(),
        homestead: {
          field: { plots: [], tilled: [] },
          time: { dayOfSeason: 1, season: 'spring', year: 1, cycle: 1, timeOfDay: 0.5 },
          stamina: { current: 100, max: 100, regenRate: 1, lastUpdate: 0 },
          weather: { current: 'clear', events: { scheduled: [] } },
          livestock: { animals: [], nextAnimalId: 1 },
          toolMastery: {}
        },
        mail: { inbox: [], scheduled: [], nextMailId: 1 },
        jobQueue: { jobs: [], nextJobId: 1 }
      };

      const migrated = migrateSave(v8Save, RESOURCE_TABLE);

      expect(migrated).not.toBeNull();
      expect(migrated?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(migrated?.civilization).toBe('maya');
    });

    it('adds civilization field to all legacy saves (v0-v6)', () => {
      const v0Save = {
        seed: 789,
        wood: 100,
        stone: 50,
        food: 25,
        coins: 200
      };

      const migrated = migrateSave(v0Save, RESOURCE_TABLE);

      expect(migrated).not.toBeNull();
      expect(migrated?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(migrated?.civilization).toBe('teotihuacan');
    });

    it('adds civilization to v1 saves during migration', () => {
      const v1Save = {
        v: 1,
        seed: 999,
        resources: { wood: 10, stone: 5, food: 3, coins: 50 }
      };

      const migrated = migrateSave(v1Save, RESOURCE_TABLE);

      expect(migrated).not.toBeNull();
      expect(migrated?.civilization).toBe('teotihuacan');
    });

    it('civilization field is present in migrateOrDefault fallback', () => {
      const migrated = migrateOrDefault({ invalid: 'save' }, RESOURCE_TABLE);
      expect(migrated.civilization).toBe('teotihuacan');
    });

    it('civilization field is present in fresh defaultState', () => {
      const state = defaultState(RESOURCE_TABLE);
      expect(state.civilization).toBe('teotihuacan');
    });

    it('handles missing civilization field gracefully in partial v8 saves', () => {
      const partialV8 = {
        v: 1,
        schemaVersion: 8,
        // civilization field intentionally missing
        seed: 111,
        resources: { wood: 10 },
        resourceStorage: {},
        structures: [],
        buildQueue: [],
        constructionQueue: [],
        buildings: [],
        productionNodes: [],
        productionQueue: [],
        productionModifiers: {},
        nextBuildId: 1,
        nextBuildingInstanceId: 1,
        season: createDefaultSeasonState(),
        homestead: {
          field: { plots: [], tilled: [] },
          time: { dayOfSeason: 1, season: 'spring', year: 1, cycle: 1, timeOfDay: 0.5 },
          stamina: { current: 100, max: 100, regenRate: 1, lastUpdate: 0 },
          weather: { current: 'clear', events: { scheduled: [] } },
          livestock: { animals: [], nextAnimalId: 1 },
          toolMastery: {}
        },
        mail: { inbox: [], scheduled: [], nextMailId: 1 },
        jobQueue: { jobs: [], nextJobId: 1 }
      };

      const migrated = migrateSave(partialV8, RESOURCE_TABLE);

      expect(migrated).not.toBeNull();
      expect(migrated?.civilization).toBe('teotihuacan');
    });
  });
});
