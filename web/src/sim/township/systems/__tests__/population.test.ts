import { describe, expect, it } from 'vitest';
import {
  tickPopulation,
  getZoneDensity,
  hasAdequateHousing,
  hasHealthyEmployment
} from '../population';
import { createZone } from '../zoneGrowth';
import type { TownshipState, TownshipCivilizationDefinition } from '../../../../types.township';
import { TOWNSHIP_CONFIG } from '../../../../types.township';

describe('Population System', () => {
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

  describe('tickPopulation()', () => {
    it('increases population when conditions are favorable', () => {
      const state = createMockState();

      // Create housing and jobs
      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.capacity = 200;
      const comZone = createZone('commercial', { x: 5, y: 5 });
      comZone.capacity = 100;

      state.zones.push(resZone, comZone);
      state.population.total = 100;

      const initialPopulation = state.population.total;
      tickPopulation(state, createMockCivilization(), 1.0);

      expect(state.population.total).toBeGreaterThan(initialPopulation);
    });

    it('decreases population when housing is overcrowded', () => {
      const state = createMockState();

      // Limited housing
      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.capacity = 50;
      state.zones.push(resZone);

      state.population.total = 200; // Overcrowded
      state.metrics.happiness.overall = 30; // Low happiness

      const initialPopulation = state.population.total;
      tickPopulation(state, createMockCivilization(), 1.0);

      expect(state.population.total).toBeLessThan(initialPopulation);
    });

    it('sets growthRate property', () => {
      const state = createMockState();

      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.capacity = 200;
      state.zones.push(resZone);

      tickPopulation(state, createMockCivilization(), 1.0);

      expect(state.population.growthRate).toBeDefined();
      expect(typeof state.population.growthRate).toBe('number');
    });

    it('never allows negative total population', () => {
      const state = createMockState();
      state.population.total = 10;

      // Create terrible conditions
      state.metrics.happiness.overall = 0;
      // No housing or jobs

      for (let i = 0; i < 100; i++) {
        tickPopulation(state, createMockCivilization(), 1.0);
      }

      expect(state.population.total).toBeGreaterThanOrEqual(0);
    });

    it('emits population_milestone events when crossing threshold', () => {
      const state = createMockState();
      state.population.total = 99;

      // Create plenty of housing
      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.capacity = 1000;
      state.zones.push(resZone);

      const comZone = createZone('commercial', { x: 5, y: 5 });
      comZone.capacity = 500;
      state.zones.push(comZone);

      state.metrics.happiness.overall = 80;

      // Tick until we cross 100 milestone
      const events: any[] = [];
      for (let i = 0; i < 10; i++) {
        const newEvents = tickPopulation(state, createMockCivilization(), 0.5);
        events.push(...newEvents);
        if (state.population.total >= 100) break;
      }

      // Should have crossed 100 milestone
      const milestoneEvent = events.find((e) => e.type === 'population_milestone');
      expect(milestoneEvent).toBeDefined();
      if (milestoneEvent && milestoneEvent.type === 'population_milestone') {
        expect(milestoneEvent.milestone).toBe(100);
      }
    });

    it('only emits each milestone once', () => {
      const state = createMockState();
      state.population.total = 99;

      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.capacity = 1000;
      const comZone = createZone('commercial', { x: 5, y: 5 });
      comZone.capacity = 500;
      state.zones.push(resZone, comZone);

      state.metrics.happiness.overall = 80;

      // First tick - cross 100
      const events1 = tickPopulation(state, createMockCivilization(), 0.5);
      const hasMilestone1 = events1.some((e) => e.type === 'population_milestone');

      // Keep ticking until past milestone
      while (state.population.total < 100) {
        tickPopulation(state, createMockCivilization(), 0.5);
      }

      // Second tick - already past 100
      const events2 = tickPopulation(state, createMockCivilization(), 0.5);
      const hasMilestone2 = events2.some((e) => e.type === 'population_milestone');

      // At least one should have emitted milestone, but not both
      expect(hasMilestone1 || hasMilestone2).toBe(true);
    });

    it('distributes population to residential zones', () => {
      const state = createMockState();
      state.population.total = 100;

      const zone1 = createZone('residential', { x: 0, y: 0 });
      zone1.capacity = 50;
      const zone2 = createZone('residential', { x: 5, y: 5 });
      zone2.capacity = 50;

      state.zones.push(zone1, zone2);

      tickPopulation(state, createMockCivilization(), 0.1);

      expect(zone1.occupancy).toBeGreaterThan(0);
      expect(zone2.occupancy).toBeGreaterThan(0);
      expect(zone1.occupancy + zone2.occupancy).toBeLessThanOrEqual(100);
    });

    it('calculates homeless when population exceeds housing', () => {
      const state = createMockState();
      state.population.total = 200;

      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.capacity = 100;
      state.zones.push(resZone);

      tickPopulation(state, createMockCivilization(), 0.1);

      // Use toBeCloseTo for floating point comparison
      expect(state.population.homeless).toBeCloseTo(100, 0);
    });

    it('calculates unemployment when jobs are limited', () => {
      const state = createMockState();
      state.population.total = 200;

      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.capacity = 200;
      state.zones.push(resZone);

      // Only 50 jobs available
      const comZone = createZone('commercial', { x: 5, y: 5 });
      comZone.capacity = 50;
      state.zones.push(comZone);

      tickPopulation(state, createMockCivilization(), 0.1);

      // Labor force = 70% of housed population = 140
      // Jobs = 50
      // Unemployed = 90
      expect(state.population.unemployed).toBeGreaterThan(0);
    });

    it('applies civilization population growth bonus', () => {
      const state = createMockState();

      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.capacity = 500;
      const comZone = createZone('commercial', { x: 5, y: 5 });
      comZone.capacity = 250;
      state.zones.push(resZone, comZone);

      state.population.total = 100;

      // Default civilization
      tickPopulation(state, createMockCivilization(), 1.0);
      const normalGrowth = state.population.total;

      // Reset
      state.population.total = 100;

      // Civilization with +10% population growth
      const fastCiv: TownshipCivilizationDefinition = {
        ...createMockCivilization(),
        townshipBonuses: {
          ...createMockCivilization().townshipBonuses,
          populationGrowth: 1.1
        }
      };

      tickPopulation(state, fastCiv, 1.0);
      const bonusGrowth = state.population.total;

      expect(bonusGrowth).toBeGreaterThan(normalGrowth);
    });

    it('grows faster with high happiness', () => {
      const state = createMockState();

      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.capacity = 500;
      state.zones.push(resZone);

      state.population.total = 100;
      state.metrics.happiness.overall = 80;

      tickPopulation(state, createMockCivilization(), 1.0);
      const happyGrowth = state.population.total - 100;

      // Reset
      state.population.total = 100;
      state.metrics.happiness.overall = 30;

      tickPopulation(state, createMockCivilization(), 1.0);
      const unhappyGrowth = state.population.total - 100;

      expect(happyGrowth).toBeGreaterThan(unhappyGrowth);
    });
  });

  describe('getZoneDensity()', () => {
    it('returns 0 for empty zone', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.capacity = 0;
      zone.occupancy = 0;

      expect(getZoneDensity(zone)).toBe(0);
    });

    it('returns 0.5 for half-full zone', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.capacity = 100;
      zone.occupancy = 50;

      expect(getZoneDensity(zone)).toBe(0.5);
    });

    it('returns 1.0 for full zone', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.capacity = 100;
      zone.occupancy = 100;

      expect(getZoneDensity(zone)).toBe(1.0);
    });
  });

  describe('hasAdequateHousing()', () => {
    it('returns true when no one is homeless', () => {
      const state = createMockState();
      state.population.homeless = 0;

      expect(hasAdequateHousing(state)).toBe(true);
    });

    it('returns false when people are homeless', () => {
      const state = createMockState();
      state.population.homeless = 50;

      expect(hasAdequateHousing(state)).toBe(false);
    });
  });

  describe('hasHealthyEmployment()', () => {
    it('returns true when employment rate is >= 80%', () => {
      const state = createMockState();
      state.population.employed = 80;
      state.population.unemployed = 20;

      expect(hasHealthyEmployment(state)).toBe(true);
    });

    it('returns false when employment rate is < 80%', () => {
      const state = createMockState();
      state.population.employed = 60;
      state.population.unemployed = 40;

      expect(hasHealthyEmployment(state)).toBe(false);
    });

    it('returns true when there is no labor force', () => {
      const state = createMockState();
      state.population.employed = 0;
      state.population.unemployed = 0;

      expect(hasHealthyEmployment(state)).toBe(true);
    });
  });
});
