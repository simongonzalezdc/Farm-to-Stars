/**
 * Demand Calculation System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DemandCalculationSystem } from '../demandCalculation';
import type { TownshipState } from '../../../../types.township';
import type { BuildingsTable } from '../../data/buildingsLoader';

describe('DemandCalculationSystem', () => {
  let system: DemandCalculationSystem;
  let state: TownshipState;
  let buildings: BuildingsTable;

  beforeEach(() => {
    system = new DemandCalculationSystem();

    state = {
      version: 1,
      districtId: 'test-district',
      seed: 12345,
      gridSize: { width: 64, height: 64 },
      zones: [],
      buildings: [],
      population: {
        total: 500,
        employed: 350,
        unemployed: 150,
        homeless: 0,
        growthRate: 0,
        lastGrowth: 0
      },
      metrics: {
        happiness: { overall: 60, factors: [] },
        demand: { residential: 0, commercial: 0, industrial: 0 },
        coverage: { power: 50, water: 50, safety: 30, education: 20 },
        zoneDistribution: { residential: 5, commercial: 2, industrial: 1, mixed: 0 }
      },
      resources: {
        wood: 1000,
        stone: 800,
        water: 2000,
        food: 500,
        coins: 5000
      },
      civilization: 'teotihuacan',
      timestamp: 0,
      tick: 0
    };

    buildings = {};
  });

  it('should calculate demand within valid range [-1, 1]', () => {
    const demand = system.calculateDemand(state, buildings);

    expect(demand.residential).toBeGreaterThanOrEqual(-1);
    expect(demand.residential).toBeLessThanOrEqual(1);

    expect(demand.commercial).toBeGreaterThanOrEqual(-1);
    expect(demand.commercial).toBeLessThanOrEqual(1);

    expect(demand.industrial).toBeGreaterThanOrEqual(-1);
    expect(demand.industrial).toBeLessThanOrEqual(1);
  });

  it('should increase residential demand with low unemployment', () => {
    // Low unemployment = jobs available
    state.population.unemployed = 20;
    state.population.employed = 480;
    state.metrics.happiness.overall = 80;
    state.metrics.coverage.power = 90;
    state.metrics.coverage.water = 90;

    const demand = system.calculateDemand(state, buildings);

    expect(demand.residential).toBeGreaterThan(0);
  });

  it('should decrease residential demand with high unemployment', () => {
    // High unemployment = no jobs
    state.population.unemployed = 400;
    state.population.employed = 100;
    state.metrics.happiness.overall = 20;
    state.metrics.coverage.power = 10;

    const demand = system.calculateDemand(state, buildings);

    // Demand should be negative or very low
    expect(demand.residential).toBeLessThan(0.5);
  });

  it('should increase commercial demand with growing population', () => {
    state.population.total = 1500; // Large population
    state.metrics.zoneDistribution.residential = 10;
    state.metrics.zoneDistribution.commercial = 2;

    const demand = system.calculateDemand(state, buildings);

    expect(demand.commercial).toBeGreaterThan(0);
  });

  it('should decrease commercial demand with too much commercial zoning', () => {
    state.population.total = 200;
    state.metrics.zoneDistribution.residential = 3;
    state.metrics.zoneDistribution.commercial = 5; // Too much commercial

    const demand = system.calculateDemand(state, buildings);

    expect(demand.commercial).toBeLessThan(0);
  });

  it('should increase industrial demand with high employment need', () => {
    state.population.unemployed = 300;
    state.population.employed = 200;
    state.metrics.zoneDistribution.industrial = 1;

    const demand = system.calculateDemand(state, buildings);

    expect(demand.industrial).toBeGreaterThan(0);
  });

  it('should decrease industrial demand with too much industrial zoning', () => {
    state.metrics.zoneDistribution.residential = 3;
    state.metrics.zoneDistribution.commercial = 2;
    state.metrics.zoneDistribution.industrial = 5; // Too much (pollution)

    const demand = system.calculateDemand(state, buildings);

    expect(demand.industrial).toBeLessThan(0);
  });

  it('should provide early game residential boost', () => {
    state.population.total = 200; // Early game
    state.population.unemployed = 50;
    state.population.employed = 150;
    state.metrics.happiness.overall = 60;

    const demand = system.calculateDemand(state, buildings);

    // Should have positive residential demand in early game
    expect(demand.residential).toBeGreaterThan(0);
  });

  it('should handle zero population gracefully', () => {
    state.population.total = 0;
    state.population.employed = 0;
    state.population.unemployed = 0;

    const demand = system.calculateDemand(state, buildings);

    // Should still return valid demand values
    expect(demand.residential).toBeGreaterThanOrEqual(-1);
    expect(demand.residential).toBeLessThanOrEqual(1);
  });
});
