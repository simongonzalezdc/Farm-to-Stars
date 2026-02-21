/**
 * Utilities Propagation System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UtilitiesPropagationSystem } from '../utilitiesPropagation';
import type { TownshipState, Building } from '../../../../types.township';
import type { BuildingsTable } from '../../data/buildingsLoader';

describe('UtilitiesPropagationSystem', () => {
  let system: UtilitiesPropagationSystem;
  let state: TownshipState;
  let buildings: BuildingsTable;

  beforeEach(() => {
    system = new UtilitiesPropagationSystem();

    state = {
      version: 1,
      districtId: 'test-district',
      seed: 12345,
      gridSize: { width: 32, height: 32 },
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
        demand: { residential: 0, commercial: 0, industrial: 0 },
        coverage: { power: 0, water: 0, safety: 0, education: 0 },
        zoneDistribution: { residential: 0, commercial: 0, industrial: 0, mixed: 0 }
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

    buildings = {
      power_plant: {
        id: 'power_plant',
        name: 'Power Plant',
        type: 'service',
        tier: 1,
        cost: { wood: 200, stone: 150, coins: 500 },
        buildTime: 60,
        size: { width: 3, height: 3 },
        provides: ['power'],
        serviceRadius: 10,
        maintenance: { cost: 20, interval: 86400 },
        requirements: {}
      },
      water_tower: {
        id: 'water_tower',
        name: 'Water Tower',
        type: 'service',
        tier: 1,
        cost: { wood: 100, stone: 100, coins: 300 },
        buildTime: 40,
        size: { width: 2, height: 2 },
        provides: ['water'],
        serviceRadius: 8,
        maintenance: { cost: 10, interval: 86400 },
        requirements: {}
      }
    };
  });

  it('should calculate power coverage from power plant', () => {
    const powerPlant: Building = {
      id: 'building-1',
      definitionId: 'power_plant',
      position: { x: 16, y: 16 },
      health: 100,
      constructionProgress: 100,
      constructionTimeRemaining: 0,
      operational: true,
      serviceRadius: 10,
      provides: ['power'],
      maintenance: { cost: 20, lastMaintained: 0 }
    };

    state.buildings.push(powerPlant);

    const network = system.calculateCoverage(state, buildings);

    // Check that tiles within radius are powered
    expect(network.power[16][16]).toBe(true); // Center
    expect(network.power[16][20]).toBe(true); // Within radius
  });

  it('should calculate water coverage from water tower', () => {
    const waterTower: Building = {
      id: 'building-2',
      definitionId: 'water_tower',
      position: { x: 10, y: 10 },
      health: 100,
      constructionProgress: 100,
      constructionTimeRemaining: 0,
      operational: true,
      serviceRadius: 8,
      provides: ['water'],
      maintenance: { cost: 10, lastMaintained: 0 }
    };

    state.buildings.push(waterTower);

    const network = system.calculateCoverage(state, buildings);

    expect(network.water[10][10]).toBe(true);
  });

  it('should not provide coverage for non-operational buildings', () => {
    const powerPlant: Building = {
      id: 'building-3',
      definitionId: 'power_plant',
      position: { x: 16, y: 16 },
      health: 100,
      constructionProgress: 100,
      constructionTimeRemaining: 0,
      operational: false, // Not operational
      serviceRadius: 10,
      provides: ['power'],
      maintenance: { cost: 20, lastMaintained: 0 }
    };

    state.buildings.push(powerPlant);

    const network = system.calculateCoverage(state, buildings);

    // No power should be provided
    let hasPower = false;
    for (const row of network.power) {
      if (row.some((cell) => cell)) {
        hasPower = true;
        break;
      }
    }

    expect(hasPower).toBe(false);
  });

  it('should calculate correct coverage percentage', () => {
    const powerPlant: Building = {
      id: 'building-4',
      definitionId: 'power_plant',
      position: { x: 16, y: 16 },
      health: 100,
      constructionProgress: 100,
      constructionTimeRemaining: 0,
      operational: true,
      serviceRadius: 10,
      provides: ['power'],
      maintenance: { cost: 20, lastMaintained: 0 }
    };

    state.buildings.push(powerPlant);

    const network = system.calculateCoverage(state, buildings);
    const metrics = system.calculateMetrics(state, network);

    // Power coverage should be > 0% since we have a power plant
    expect(metrics.power).toBeGreaterThan(0);

    // Water coverage should be 0% since no water buildings
    expect(metrics.water).toBe(0);
  });

  it('should check coverage at specific position', () => {
    const powerPlant: Building = {
      id: 'building-5',
      definitionId: 'power_plant',
      position: { x: 16, y: 16 },
      health: 100,
      constructionProgress: 100,
      constructionTimeRemaining: 0,
      operational: true,
      serviceRadius: 10,
      provides: ['power'],
      maintenance: { cost: 20, lastMaintained: 0 }
    };

    state.buildings.push(powerPlant);

    const network = system.calculateCoverage(state, buildings);

    const coverageAt = system.getCoverageAt(network, 16, 16);

    expect(coverageAt.power).toBe(true);
    expect(coverageAt.water).toBe(false);
    expect(coverageAt.safety).toBe(false);
    expect(coverageAt.education).toBe(false);
  });
});
