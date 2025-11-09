import { describe, expect, it, vi } from 'vitest';
import { TownshipManager, createDefaultTownshipState } from '../townshipManager';
import { createZone } from '../systems/zoneGrowth';
import type {
  TownshipState,
  TownshipCivilizationDefinition,
  BuildingsTable,
  TownshipEvent,
  Building
} from '../../../types.township';
import { TOWNSHIP_CONFIG } from '../../../types.township';

describe('TownshipManager', () => {
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

  // Helper: Create mock buildings table
  const createMockBuildingsTable = (): BuildingsTable => ({
    'power-plant': {
      id: 'power-plant',
      name: 'Power Plant',
      description: 'Provides electricity',
      type: 'service',
      tier: 1,
      cost: { coins: 1000, stone: 500 },
      buildTime: 60,
      capacity: 0,
      size: { width: 3, height: 3 },
      effects: {},
      provides: ['power'],
      serviceRadius: 10,
      maintenance: { cost: 50, interval: 100 }
    },
    'water-tower': {
      id: 'water-tower',
      name: 'Water Tower',
      description: 'Provides clean water',
      type: 'service',
      tier: 1,
      cost: { coins: 800, stone: 400 },
      buildTime: 45,
      capacity: 0,
      size: { width: 2, height: 2 },
      effects: {},
      provides: ['water'],
      serviceRadius: 8,
      maintenance: { cost: 30, interval: 80 }
    }
  });

  describe('constructor', () => {
    it('initializes with provided state', () => {
      const state = createDefaultTownshipState('teotihuacan', 12345);
      const manager = new TownshipManager(state, {}, createMockCivilization());

      const retrievedState = manager.getState();
      expect(retrievedState.seed).toBe(12345);
      expect(retrievedState.civilization).toBe('teotihuacan');
    });

    it('accepts buildings table', () => {
      const state = createDefaultTownshipState('maya', 999);
      const buildings = createMockBuildingsTable();
      const manager = new TownshipManager(state, buildings, createMockCivilization());

      expect(manager).toBeDefined();
    });

    it('accepts civilization definition', () => {
      const state = createDefaultTownshipState('moche', 111);
      const civ: TownshipCivilizationDefinition = {
        ...createMockCivilization(),
        id: 'moche',
        townshipBonuses: {
          ...createMockCivilization().townshipBonuses,
          happinessBonus: 5
        }
      };

      const manager = new TownshipManager(state, {}, civ);

      expect(manager).toBeDefined();
    });
  });

  describe('tick()', () => {
    it('increments timestamp', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const manager = new TownshipManager(state, {}, createMockCivilization());

      const initialTimestamp = manager.getState().timestamp;
      manager.tick(1.0);

      expect(manager.getState().timestamp).toBe(initialTimestamp + 1.0);
    });

    it('increments tick counter', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const manager = new TownshipManager(state, {}, createMockCivilization());

      const initialTick = manager.getState().tick;
      manager.tick(1.0);

      expect(manager.getState().tick).toBe(initialTick + 1);
    });

    it('processes multiple ticks correctly', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const manager = new TownshipManager(state, {}, createMockCivilization());

      manager.tick(1.0);
      manager.tick(0.5);
      manager.tick(2.0);

      expect(manager.getState().timestamp).toBe(3.5);
      expect(manager.getState().tick).toBe(3);
    });

    it('updates zone maturity during tick', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const zone = createZone('residential', { x: 10, y: 10 });
      zone.maturity = 0;
      state.zones.push(zone);

      const manager = new TownshipManager(state, {}, createMockCivilization());

      manager.tick(1.0);

      expect(zone.maturity).toBeGreaterThan(0);
    });

    it('updates population during tick', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.capacity = 500;
      const comZone = createZone('commercial', { x: 5, y: 5 });
      comZone.capacity = 250;
      state.zones.push(resZone, comZone);

      const manager = new TownshipManager(state, {}, createMockCivilization());

      const initialPopulation = state.population.total;
      manager.tick(1.0);

      expect(state.population.total).toBeGreaterThan(initialPopulation);
    });

    it('recalculates metrics during tick', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const manager = new TownshipManager(state, {}, createMockCivilization());

      manager.tick(1.0);

      const metrics = manager.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.happiness).toBeDefined();
      expect(metrics.demand).toBeDefined();
      expect(metrics.coverage).toBeDefined();
    });
  });

  describe('building maintenance', () => {
    it('deducts maintenance cost when due', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      state.resources.coins = 1000;

      const building: Building = {
        id: 'building-1',
        definitionId: 'power-plant',
        position: { x: 10, y: 10 },
        zone: null,
        level: 1,
        operational: true,
        serviceRadius: 10,
        provides: ['power'],
        maintenance: { cost: 50, lastMaintained: 0 }
      };

      state.buildings.push(building);
      state.timestamp = 0;

      const buildings = createMockBuildingsTable();
      const manager = new TownshipManager(state, buildings, createMockCivilization());

      // Advance time past maintenance interval
      manager.tick(buildings['power-plant'].maintenance.interval);

      expect(state.resources.coins).toBeLessThan(1000);
    });

    it('marks building non-operational when maintenance cannot be paid', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      state.resources.coins = 0; // No money for maintenance

      const building: Building = {
        id: 'building-1',
        definitionId: 'power-plant',
        position: { x: 10, y: 10 },
        zone: null,
        level: 1,
        operational: true,
        serviceRadius: 10,
        provides: ['power'],
        maintenance: { cost: 50, lastMaintained: 0 }
      };

      state.buildings.push(building);

      const buildings = createMockBuildingsTable();
      const manager = new TownshipManager(state, buildings, createMockCivilization());

      // Advance time past maintenance interval
      manager.tick(buildings['power-plant'].maintenance.interval);

      expect(building.operational).toBe(false);
    });

    it('applies civilization maintenance cost modifier', () => {
      const state = createDefaultTownshipState('puebloan', 123);
      state.resources.coins = 1000;

      const building: Building = {
        id: 'building-1',
        definitionId: 'power-plant',
        position: { x: 10, y: 10 },
        zone: null,
        level: 1,
        operational: true,
        serviceRadius: 10,
        provides: ['power'],
        maintenance: { cost: 50, lastMaintained: 0 }
      };

      state.buildings.push(building);

      const buildings = createMockBuildingsTable();

      // Puebloan has -20% maintenance cost
      const civ: TownshipCivilizationDefinition = {
        ...createMockCivilization(),
        id: 'puebloan',
        townshipBonuses: {
          ...createMockCivilization().townshipBonuses,
          maintenanceCost: 0.80
        }
      };

      const manager = new TownshipManager(state, buildings, civ);

      manager.tick(buildings['power-plant'].maintenance.interval);

      // Cost should be 50 * 0.80 = 40
      expect(state.resources.coins).toBe(960);
    });
  });

  describe('event system', () => {
    it('emits zone_matured event when zone reaches maturity', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.maturity = 0.99;
      state.zones.push(zone);

      const manager = new TownshipManager(state, {}, createMockCivilization());

      const events: TownshipEvent[] = [];
      manager.on(event => events.push(event));

      manager.tick(10.0);

      expect(events.some(e => e.type === 'zone_matured')).toBe(true);
    });

    it('emits population_milestone event', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      state.population.total = 490;

      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.capacity = 1000;
      const comZone = createZone('commercial', { x: 5, y: 5 });
      comZone.capacity = 500;
      state.zones.push(resZone, comZone);

      state.metrics.happiness.overall = 80;

      const manager = new TownshipManager(state, {}, createMockCivilization());

      const events: TownshipEvent[] = [];
      manager.on(event => events.push(event));

      manager.tick(10.0);

      expect(events.some(e => e.type === 'population_milestone')).toBe(true);
    });

    it('emits happiness_changed event on significant changes', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      state.population.total = 100;
      state.population.homeless = 0;

      const manager = new TownshipManager(state, {}, createMockCivilization());

      const events: TownshipEvent[] = [];
      manager.on(event => events.push(event));

      // Create conditions that will change happiness
      state.population.homeless = 50; // Big change

      manager.tick(0.1);

      // Check if happiness_changed event was emitted
      const happinessEvent = events.find(e => e.type === 'happiness_changed');
      expect(happinessEvent).toBeDefined();
    });

    it('emits demand_shift event', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);

      const manager = new TownshipManager(state, {}, createMockCivilization());

      const events: TownshipEvent[] = [];
      manager.on(event => events.push(event));

      manager.tick(0.1);

      expect(events.some(e => e.type === 'demand_shift')).toBe(true);
    });

    it('allows multiple event handlers', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const manager = new TownshipManager(state, {}, createMockCivilization());

      const events1: TownshipEvent[] = [];
      const events2: TownshipEvent[] = [];

      manager.on(event => events1.push(event));
      manager.on(event => events2.push(event));

      manager.tick(0.1);

      expect(events1.length).toBeGreaterThan(0);
      expect(events2.length).toBeGreaterThan(0);
      expect(events1.length).toBe(events2.length);
    });

    it('allows removing event handlers', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const manager = new TownshipManager(state, {}, createMockCivilization());

      const events: TownshipEvent[] = [];
      const handler = (event: TownshipEvent) => events.push(event);

      manager.on(handler);
      manager.tick(0.1);

      const eventsBeforeRemoval = events.length;

      manager.off(handler);
      manager.tick(0.1);

      expect(events.length).toBe(eventsBeforeRemoval);
    });

    it('handles errors in event handlers gracefully', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const manager = new TownshipManager(state, {}, createMockCivilization());

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      manager.on(() => {
        throw new Error('Test error');
      });

      expect(() => manager.tick(0.1)).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('getState()', () => {
    it('returns readonly state reference', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const manager = new TownshipManager(state, {}, createMockCivilization());

      const retrievedState = manager.getState();

      expect(retrievedState).toBe(state);
    });

    it('state reflects changes after tick', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const manager = new TownshipManager(state, {}, createMockCivilization());

      manager.tick(5.0);

      const retrievedState = manager.getState();
      expect(retrievedState.timestamp).toBe(5.0);
    });
  });

  describe('getMetrics()', () => {
    it('returns current metrics', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const manager = new TownshipManager(state, {}, createMockCivilization());

      const metrics = manager.getMetrics();

      expect(metrics.happiness).toBeDefined();
      expect(metrics.demand).toBeDefined();
      expect(metrics.coverage).toBeDefined();
      expect(metrics.zoneDistribution).toBeDefined();
    });

    it('metrics update after tick', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);

      const zone = createZone('residential', { x: 0, y: 0 });
      state.zones.push(zone);

      const manager = new TownshipManager(state, {}, createMockCivilization());

      const metricsBefore = manager.getMetrics();
      manager.tick(1.0);
      const metricsAfter = manager.getMetrics();

      // Zone distribution should have changed
      expect(metricsAfter).not.toBe(metricsBefore);
    });
  });

  describe('markDirty()', () => {
    it('marks specific subsystems for recalculation', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      const manager = new TownshipManager(state, {}, createMockCivilization());

      // Should not throw
      manager.markDirty('happiness');
      manager.markDirty('demand');
      manager.markDirty('coverage');
    });
  });

  describe('createDefaultTownshipState()', () => {
    it('creates valid initial state', () => {
      const state = createDefaultTownshipState('maya', 42);

      expect(state.version).toBe(1);
      expect(state.seed).toBe(42);
      expect(state.civilization).toBe('maya');
    });

    it('initializes with default grid size', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);

      expect(state.gridSize).toEqual(TOWNSHIP_CONFIG.DEFAULT_GRID_SIZE);
    });

    it('starts with empty zones and buildings', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);

      expect(state.zones).toEqual([]);
      expect(state.buildings).toEqual([]);
    });

    it('starts with base population of 100', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);

      expect(state.population.total).toBe(100);
    });

    it('starts with initial resources', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);

      expect(state.resources.wood).toBeGreaterThan(0);
      expect(state.resources.stone).toBeGreaterThan(0);
      expect(state.resources.coins).toBeGreaterThan(0);
    });

    it('starts with timestamp and tick at 0', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);

      expect(state.timestamp).toBe(0);
      expect(state.tick).toBe(0);
    });

    it('generates unique district ID', () => {
      const state1 = createDefaultTownshipState('teotihuacan', 111);
      const state2 = createDefaultTownshipState('teotihuacan', 222);

      expect(state1.districtId).not.toBe(state2.districtId);
    });
  });

  describe('integration', () => {
    it('runs full simulation loop without errors', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);

      // Add some zones
      const resZone = createZone('residential', { x: 10, y: 10 });
      const comZone = createZone('commercial', { x: 20, y: 20 });
      const indZone = createZone('industrial', { x: 30, y: 30 });
      state.zones.push(resZone, comZone, indZone);

      const buildings = createMockBuildingsTable();
      const manager = new TownshipManager(state, buildings, createMockCivilization());

      // Run 100 ticks
      for (let i = 0; i < 100; i++) {
        expect(() => manager.tick(0.1)).not.toThrow();
      }

      expect(state.tick).toBe(100);
      expect(state.timestamp).toBeCloseTo(10.0, 1);
    });

    it('population grows organically with zones', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);
      state.population.total = 100;

      // Create housing and jobs
      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.maturity = 0.5;
      resZone.capacity = 500;

      const comZone = createZone('commercial', { x: 10, y: 10 });
      comZone.maturity = 0.5;
      comZone.capacity = 250;

      state.zones.push(resZone, comZone);

      const manager = new TownshipManager(state, {}, createMockCivilization());

      const initialPopulation = state.population.total;

      // Run simulation for 10 seconds
      for (let i = 0; i < 100; i++) {
        manager.tick(0.1);
      }

      expect(state.population.total).toBeGreaterThan(initialPopulation);
    });

    it('zones mature over time', () => {
      const state = createDefaultTownshipState('teotihuacan', 123);

      const zone = createZone('residential', { x: 10, y: 10 });
      zone.maturity = 0;
      zone.services.power = true;
      zone.services.water = true;

      state.zones.push(zone);

      const manager = new TownshipManager(state, {}, createMockCivilization());

      // Run simulation until zone matures
      for (let i = 0; i < 1000; i++) {
        manager.tick(0.1);
        if (zone.maturity >= 1.0) break;
      }

      expect(zone.maturity).toBe(1.0);
    });
  });
});
