import { describe, expect, it } from 'vitest';
import {
  tickZoneGrowth,
  createZone,
  upgradeZone,
  canUpgradeZone
} from '../zoneGrowth';
import type { TownshipState, TownshipCivilizationDefinition } from '../../../../types.township';
import { TOWNSHIP_CONFIG } from '../../../../types.township';

describe('Zone Growth System', () => {
  // Helper: Create minimal township state
  const createMockState = (): TownshipState => ({
    version: 1,
    districtId: 'test-district',
    seed: 12345,
    gridSize: TOWNSHIP_CONFIG.DEFAULT_GRID_SIZE,
    zones: [],
    buildings: [],
    population: {
      total: 100,
      employed: 70,
      unemployed: 30,
      homeless: 0,
      growthRate: 0,
      lastGrowth: 0
    },
    metrics: {
      happiness: { overall: 50, factors: [] },
      demand: {
        residential: 0.5,
        commercial: 0.5,
        industrial: 0.5
      },
      coverage: {
        power: 0,
        water: 0,
        safety: 0,
        education: 0
      },
      zoneDistribution: {
        residential: 0,
        commercial: 0,
        industrial: 0,
        mixed: 0
      }
    },
    resources: {
      wood: 100,
      stone: 100,
      water: 100,
      food: 100,
      coins: 1000
    },
    civilization: 'teotihuacan',
    timestamp: 0,
    tick: 0
  });

  // Helper: Create mock civilization
  const createMockCivilization = (): TownshipCivilizationDefinition => ({
    id: 'teotihuacan',
    name: 'Teotihuacan Empire',
    homesteadBonuses: {},
    townshipBonuses: {
      populationGrowth: 1.0,
      constructionSpeed: 1.0,
      happinessBonus: 0,
      zoneCapacity: 1.0,
      serviceCoverage: 1.0,
      maintenanceCost: 1.0
    },
    advisorDialogue: {
      welcome: '',
      milestones: {},
      warnings: {}
    }
  });

  describe('createZone()', () => {
    it('creates zone with correct type and position', () => {
      const zone = createZone('residential', { x: 10, y: 15 });

      expect(zone.type).toBe('residential');
      expect(zone.position).toEqual({ x: 10, y: 15 });
    });

    it('creates zone with default size 4x4', () => {
      const zone = createZone('commercial', { x: 0, y: 0 });

      expect(zone.size).toEqual({ width: 4, height: 4 });
    });

    it('creates zone with custom size', () => {
      const zone = createZone('industrial', { x: 5, y: 5 }, { width: 8, height: 6 });

      expect(zone.size).toEqual({ width: 8, height: 6 });
    });

    it('creates zone with zero maturity', () => {
      const zone = createZone('residential', { x: 0, y: 0 });

      expect(zone.maturity).toBe(0);
      expect(zone.capacity).toBe(0);
    });

    it('creates zone at level 1 (low density)', () => {
      const zone = createZone('residential', { x: 0, y: 0 });

      expect(zone.level).toBe(1);
    });

    it('creates zone with all services disabled', () => {
      const zone = createZone('residential', { x: 0, y: 0 });

      expect(zone.services).toEqual({
        power: false,
        water: false,
        safety: false,
        education: false
      });
    });

    it('creates zone with unique ID', () => {
      const zone1 = createZone('residential', { x: 0, y: 0 });
      const zone2 = createZone('residential', { x: 0, y: 0 });

      expect(zone1.id).toBeTruthy();
      expect(zone2.id).toBeTruthy();
      expect(zone1.id).not.toBe(zone2.id);
    });
  });

  describe('tickZoneGrowth()', () => {
    it('does not grow zones that are already mature', () => {
      const state = createMockState();
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.maturity = 1.0;
      state.zones.push(zone);

      const events = tickZoneGrowth(state, createMockCivilization(), {}, 1.0);

      expect(zone.maturity).toBe(1.0);
      expect(events.length).toBe(0);
    });

    it('grows zone maturity over time', () => {
      const state = createMockState();
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.maturity = 0;
      state.zones.push(zone);

      tickZoneGrowth(state, createMockCivilization(), {}, 1.0);

      expect(zone.maturity).toBeGreaterThan(0);
    });

    it('caps zone maturity at 1.0', () => {
      const state = createMockState();
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.maturity = 0.99;
      state.zones.push(zone);

      // Tick multiple times to try to exceed 1.0
      for (let i = 0; i < 100; i++) {
        tickZoneGrowth(state, createMockCivilization(), {}, 1.0);
      }

      expect(zone.maturity).toBe(1.0);
    });

    it('emits zone_matured event when zone reaches full maturity', () => {
      const state = createMockState();
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.maturity = 0.98;
      state.zones.push(zone);

      const events = tickZoneGrowth(state, createMockCivilization(), {}, 10.0);

      expect(zone.maturity).toBe(1.0);
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('zone_matured');
      expect(events[0]).toHaveProperty('zone');
    });

    it('only emits zone_matured once per zone', () => {
      const state = createMockState();
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.maturity = 0.98;
      state.zones.push(zone);

      // First tick - should emit event
      const events1 = tickZoneGrowth(state, createMockCivilization(), {}, 10.0);
      expect(events1.length).toBe(1);

      // Second tick - should not emit event (already mature)
      const events2 = tickZoneGrowth(state, createMockCivilization(), {}, 10.0);
      expect(events2.length).toBe(0);
    });

    it('updates zone capacity based on maturity', () => {
      const state = createMockState();
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.maturity = 0;
      state.zones.push(zone);

      expect(zone.capacity).toBe(0);

      // Grow to 50% maturity
      zone.maturity = 0.5;
      tickZoneGrowth(state, createMockCivilization(), {}, 0.01);

      expect(zone.capacity).toBeGreaterThan(0);
      expect(zone.capacity).toBeLessThan(100); // Base capacity for level 1
    });

    it('calculates capacity based on zone level', () => {
      const state = createMockState();
      const zone1 = createZone('residential', { x: 0, y: 0 });
      zone1.level = 1;
      zone1.maturity = 0.99; // Just under 1.0 so tick will process it

      const zone2 = createZone('residential', { x: 5, y: 5 });
      zone2.level = 2;
      zone2.maturity = 0.99;

      const zone3 = createZone('residential', { x: 10, y: 10 });
      zone3.level = 3;
      zone3.maturity = 0.99;

      state.zones.push(zone1, zone2, zone3);

      // Tick to calculate capacity
      tickZoneGrowth(state, createMockCivilization(), {}, 0.1);

      // All should now be at 1.0 maturity with calculated capacity
      // Level 2 should have higher capacity than level 1
      expect(zone2.capacity).toBeGreaterThan(zone1.capacity);
      // Level 3 should have highest capacity
      expect(zone3.capacity).toBeGreaterThan(zone2.capacity);
    });

    it('grows faster with positive demand', () => {
      const state = createMockState();
      const zone = createZone('residential', { x: 0, y: 0 });
      state.zones.push(zone);

      // High demand scenario
      state.metrics.demand.residential = 0.8;

      const initialMaturity = zone.maturity;
      tickZoneGrowth(state, createMockCivilization(), {}, 1.0);

      expect(zone.maturity).toBeGreaterThan(initialMaturity);
    });

    it('grows slower with negative demand', () => {
      const state = createMockState();

      const zone1 = createZone('residential', { x: 0, y: 0 });
      const zone2 = createZone('residential', { x: 5, y: 5 });

      state.zones.push(zone1, zone2);

      // Positive demand for zone1
      state.metrics.demand.residential = 0.5;
      tickZoneGrowth(state, createMockCivilization(), {}, 1.0);
      const growth1 = zone1.maturity;

      // Negative demand for zone2
      state.metrics.demand.residential = -0.5;
      zone2.maturity = 0;
      tickZoneGrowth(state, createMockCivilization(), {}, 1.0);
      const growth2 = zone2.maturity;

      expect(growth1).toBeGreaterThan(growth2);
    });

    it('grows faster with good service coverage', () => {
      const state = createMockState();
      const zone = createZone('residential', { x: 0, y: 0 });
      state.zones.push(zone);

      // Enable all services
      zone.services.power = true;
      zone.services.water = true;
      zone.services.safety = true;
      zone.services.education = true;

      const initialMaturity = zone.maturity;
      tickZoneGrowth(state, createMockCivilization(), {}, 1.0);

      expect(zone.maturity).toBeGreaterThan(initialMaturity);
    });

    it('applies civilization zone capacity bonus', () => {
      const state = createMockState();
      const zone = createZone('residential', { x: 0, y: 0 });
      state.zones.push(zone);

      // Civilization with +10% zone capacity
      const civ: TownshipCivilizationDefinition = {
        ...createMockCivilization(),
        townshipBonuses: {
          ...createMockCivilization().townshipBonuses,
          zoneCapacity: 1.10
        }
      };

      const initialMaturity = zone.maturity;
      tickZoneGrowth(state, civ, {}, 1.0);

      expect(zone.maturity).toBeGreaterThan(initialMaturity);
    });
  });

  describe('upgradeZone()', () => {
    it('upgrades zone from level 1 to level 2', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.level = 1;

      const upgraded = upgradeZone(zone);

      expect(upgraded).toBe(true);
      expect(zone.level).toBe(2);
    });

    it('resets maturity to 0 when upgrading', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.level = 1;
      zone.maturity = 1.0;
      zone.capacity = 100;

      upgradeZone(zone);

      expect(zone.maturity).toBe(0);
      expect(zone.capacity).toBe(0);
    });

    it('cannot upgrade beyond max level', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.level = TOWNSHIP_CONFIG.ZONE_LEVEL_HIGH;

      const upgraded = upgradeZone(zone);

      expect(upgraded).toBe(false);
      expect(zone.level).toBe(TOWNSHIP_CONFIG.ZONE_LEVEL_HIGH);
    });
  });

  describe('canUpgradeZone()', () => {
    it('allows upgrade when zone is fully mature with services', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.level = 1;
      zone.maturity = 1.0;
      zone.services.power = true;
      zone.services.water = true;

      expect(canUpgradeZone(zone)).toBe(true);
    });

    it('prevents upgrade if zone is not fully mature', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.level = 1;
      zone.maturity = 0.8;
      zone.services.power = true;
      zone.services.water = true;

      expect(canUpgradeZone(zone)).toBe(false);
    });

    it('prevents upgrade if zone lacks power', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.level = 1;
      zone.maturity = 1.0;
      zone.services.power = false;
      zone.services.water = true;

      expect(canUpgradeZone(zone)).toBe(false);
    });

    it('prevents upgrade if zone lacks water', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.level = 1;
      zone.maturity = 1.0;
      zone.services.power = true;
      zone.services.water = false;

      expect(canUpgradeZone(zone)).toBe(false);
    });

    it('prevents upgrade if zone is already at max level', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.level = TOWNSHIP_CONFIG.ZONE_LEVEL_HIGH;
      zone.maturity = 1.0;
      zone.services.power = true;
      zone.services.water = true;

      expect(canUpgradeZone(zone)).toBe(false);
    });
  });
});
