import { describe, expect, it } from 'vitest';
import {
  calculateHappiness,
  calculateDemand,
  calculateCoverage,
  isZoneAdequatelyServed,
  getZoneHappinessContribution
} from '../metrics';
import { createZone } from '../zoneGrowth';
import type {
  TownshipState,
  TownshipCivilizationDefinition,
  BuildingsTable,
  Building
} from '../../../../types.township';
import { TOWNSHIP_CONFIG } from '../../../../types.township';

describe('Township Metrics System', () => {
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
        residential: 0,
        commercial: 0,
        industrial: 0
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

  describe('calculateHappiness()', () => {
    it('calculates happiness with multiple factors', () => {
      const state = createMockState();

      const result = calculateHappiness(state, createMockCivilization());

      // Should have some factors (unemployment, services, etc.)
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('reduces happiness when people are homeless', () => {
      const state = createMockState();
      state.population.total = 100;
      state.population.homeless = 0;

      const happyResult = calculateHappiness(state, createMockCivilization());

      state.population.homeless = 50; // 50% homeless
      const unhappyResult = calculateHappiness(state, createMockCivilization());

      expect(unhappyResult.overall).toBeLessThan(happyResult.overall);
      expect(unhappyResult.factors.some(f => f.category === 'housing')).toBe(true);
    });

    it('reduces happiness when people are unemployed', () => {
      const state = createMockState();
      state.population.employed = 50;
      state.population.unemployed = 50; // 50% unemployment

      const result = calculateHappiness(state, createMockCivilization());

      expect(result.factors.some(f => f.category === 'employment')).toBe(true);
      const empFactor = result.factors.find(f => f.category === 'employment');
      expect(empFactor?.value).toBeLessThan(0);
    });

    it('increases happiness with good service coverage', () => {
      const state = createMockState();
      state.metrics.coverage = {
        power: 0,
        water: 0,
        safety: 0,
        education: 0
      };

      const noServicesResult = calculateHappiness(state, createMockCivilization());

      state.metrics.coverage = {
        power: 1.0,
        water: 1.0,
        safety: 1.0,
        education: 1.0
      };

      const fullServicesResult = calculateHappiness(state, createMockCivilization());

      expect(fullServicesResult.overall).toBeGreaterThan(noServicesResult.overall);
      expect(fullServicesResult.factors.some(f => f.category === 'services')).toBe(true);
    });

    it('reduces happiness with too much industry', () => {
      const state = createMockState();

      // 5 industrial zones out of 10 total (50%)
      for (let i = 0; i < 5; i++) {
        state.zones.push(createZone('industrial', { x: i * 5, y: 0 }));
      }
      for (let i = 0; i < 5; i++) {
        state.zones.push(createZone('residential', { x: i * 5, y: 5 }));
      }

      const result = calculateHappiness(state, createMockCivilization());

      // 50% industrial is > 30% threshold, should reduce happiness
      expect(result.factors.some(f => f.category === 'environment')).toBe(true);
      const envFactor = result.factors.find(f => f.category === 'environment');
      if (envFactor) {
        expect(envFactor.value).toBeLessThan(0);
      }
    });

    it('applies civilization happiness bonus', () => {
      const state = createMockState();

      const baseCiv = createMockCivilization();
      const baseResult = calculateHappiness(state, baseCiv);

      const bonusCiv: TownshipCivilizationDefinition = {
        ...createMockCivilization(),
        townshipBonuses: {
          ...createMockCivilization().townshipBonuses,
          happinessBonus: 15 // +15 base happiness
        }
      };

      const bonusResult = calculateHappiness(state, bonusCiv);

      expect(bonusResult.overall).toBeGreaterThan(baseResult.overall);
      expect(bonusResult.factors.some(f => f.category === 'civilization')).toBe(true);
    });

    it('caps happiness at 100', () => {
      const state = createMockState();

      // Perfect conditions
      state.population.homeless = 0;
      state.population.unemployed = 0;
      state.metrics.coverage = {
        power: 1.0,
        water: 1.0,
        safety: 1.0,
        education: 1.0
      };

      const civ: TownshipCivilizationDefinition = {
        ...createMockCivilization(),
        townshipBonuses: {
          ...createMockCivilization().townshipBonuses,
          happinessBonus: 50
        }
      };

      const result = calculateHappiness(state, civ);

      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('caps happiness at 0 (minimum)', () => {
      const state = createMockState();

      // Terrible conditions
      state.population.total = 100;
      state.population.homeless = 100;
      state.population.employed = 0;
      state.population.unemployed = 100;
      state.metrics.coverage = {
        power: 0,
        water: 0,
        safety: 0,
        education: 0
      };

      const result = calculateHappiness(state, createMockCivilization());

      expect(result.overall).toBeGreaterThanOrEqual(0);
    });

    it('includes happiness factors in result', () => {
      const state = createMockState();
      state.population.total = 100;
      state.population.homeless = 20;

      const result = calculateHappiness(state, createMockCivilization());

      expect(Array.isArray(result.factors)).toBe(true);
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.factors[0]).toHaveProperty('category');
      expect(result.factors[0]).toHaveProperty('name');
      expect(result.factors[0]).toHaveProperty('value');
      expect(result.factors[0]).toHaveProperty('weight');
    });
  });

  describe('calculateDemand()', () => {
    it('calculates demand for all zone types', () => {
      const state = createMockState();

      // Add a few zones
      state.zones.push(createZone('residential', { x: 0, y: 0 }));
      state.zones.push(createZone('commercial', { x: 5, y: 5 }));

      const result = calculateDemand(state);

      expect(result.residential).toBeDefined();
      expect(result.commercial).toBeDefined();
      expect(result.industrial).toBeDefined();
    });

    it('shows high residential demand when housing is needed', () => {
      const state = createMockState();
      state.population.total = 200;

      // Only 1 residential zone with low capacity
      const resZone = createZone('residential', { x: 0, y: 0 });
      resZone.capacity = 50;
      state.zones.push(resZone);

      const result = calculateDemand(state);

      expect(result.residential).toBeGreaterThan(0.3);
    });

    it('shows high commercial/industrial demand when jobs are needed', () => {
      const state = createMockState();
      state.population.employed = 50;
      state.population.unemployed = 100;

      // Limited job capacity
      const comZone = createZone('commercial', { x: 0, y: 0 });
      comZone.capacity = 30;
      state.zones.push(comZone);

      const resZone = createZone('residential', { x: 5, y: 5 });
      resZone.capacity = 200;
      state.zones.push(resZone);

      const result = calculateDemand(state);

      expect(result.commercial).toBeGreaterThan(0.2);
      expect(result.industrial).toBeGreaterThan(0.2);
    });

    it('clamps demand values between -1 and 1', () => {
      const state = createMockState();

      // Extreme imbalance
      for (let i = 0; i < 50; i++) {
        state.zones.push(createZone('residential', { x: i, y: 0 }));
      }

      const result = calculateDemand(state);

      expect(result.residential).toBeGreaterThanOrEqual(-1);
      expect(result.residential).toBeLessThanOrEqual(1);
      expect(result.commercial).toBeGreaterThanOrEqual(-1);
      expect(result.commercial).toBeLessThanOrEqual(1);
      expect(result.industrial).toBeGreaterThanOrEqual(-1);
      expect(result.industrial).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateCoverage()', () => {
    it('returns 0% coverage when no zones exist', () => {
      const state = createMockState();

      const result = calculateCoverage(state, {}, createMockCivilization());

      expect(result.power).toBe(0);
      expect(result.water).toBe(0);
      expect(result.safety).toBe(0);
      expect(result.education).toBe(0);
    });

    it('returns 0% coverage when zones have no service flags', () => {
      const state = createMockState();
      state.zones.push(createZone('residential', { x: 0, y: 0 }));
      state.zones.push(createZone('commercial', { x: 5, y: 5 }));

      const result = calculateCoverage(state, {}, createMockCivilization());

      expect(result.power).toBe(0);
      expect(result.water).toBe(0);
    });

    it('updates zone service flags based on nearby buildings', () => {
      const state = createMockState();
      const zone = createZone('residential', { x: 10, y: 10 });
      state.zones.push(zone);

      // Building providing power
      const building: Building = {
        id: 'building-1',
        definitionId: 'power-plant',
        position: { x: 10, y: 10 },
        zone: null,
        level: 1,
        operational: true,
        serviceRadius: 10,
        provides: ['power'],
        maintenance: { cost: 10, lastMaintained: 0 }
      };
      state.buildings.push(building);

      const buildingsTable: BuildingsTable = {
        'power-plant': {
          id: 'power-plant',
          name: 'Power Plant',
          description: 'Provides electricity',
          type: 'service',
          tier: 1,
          cost: { coins: 1000 },
          buildTime: 30,
          capacity: 0,
          size: { width: 2, height: 2 },
          effects: {},
          provides: ['power'],
          serviceRadius: 10,
          maintenance: { cost: 10, interval: 60 }
        }
      };

      calculateCoverage(state, buildingsTable, createMockCivilization());

      expect(zone.services.power).toBe(true);
    });

    it('ignores non-operational buildings', () => {
      const state = createMockState();
      const zone = createZone('residential', { x: 10, y: 10 });
      state.zones.push(zone);

      const building: Building = {
        id: 'building-1',
        definitionId: 'power-plant',
        position: { x: 10, y: 10 },
        zone: null,
        level: 1,
        operational: false, // Not operational
        serviceRadius: 10,
        provides: ['power'],
        maintenance: { cost: 10, lastMaintained: 0 }
      };
      state.buildings.push(building);

      const buildingsTable: BuildingsTable = {
        'power-plant': {
          id: 'power-plant',
          name: 'Power Plant',
          description: 'Provides electricity',
          type: 'service',
          tier: 1,
          cost: { coins: 1000 },
          buildTime: 30,
          capacity: 0,
          size: { width: 2, height: 2 },
          effects: {},
          provides: ['power'],
          serviceRadius: 10,
          maintenance: { cost: 10, interval: 60 }
        }
      };

      calculateCoverage(state, buildingsTable, createMockCivilization());

      expect(zone.services.power).toBe(false);
    });
  });

  describe('isZoneAdequatelyServed()', () => {
    it('returns true when zone has both power and water', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.services.power = true;
      zone.services.water = true;

      expect(isZoneAdequatelyServed(zone)).toBe(true);
    });

    it('returns false when zone lacks power', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.services.power = false;
      zone.services.water = true;

      expect(isZoneAdequatelyServed(zone)).toBe(false);
    });

    it('returns false when zone lacks water', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.services.power = true;
      zone.services.water = false;

      expect(isZoneAdequatelyServed(zone)).toBe(false);
    });
  });

  describe('getZoneHappinessContribution()', () => {
    it('returns 0 for zone with no services', () => {
      const zone = createZone('residential', { x: 0, y: 0 });

      expect(getZoneHappinessContribution(zone)).toBe(0);
    });

    it('returns positive value for zone with services', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.services.power = true;
      zone.services.water = true;

      const contribution = getZoneHappinessContribution(zone);
      expect(contribution).toBeGreaterThan(0);
    });

    it('returns higher value for zone with all services', () => {
      const zone = createZone('residential', { x: 0, y: 0 });
      zone.services.power = true;
      zone.services.water = true;
      zone.services.safety = true;
      zone.services.education = true;

      const contribution = getZoneHappinessContribution(zone);
      expect(contribution).toBe(15); // 5+5+3+2 based on implementation
    });
  });
});
