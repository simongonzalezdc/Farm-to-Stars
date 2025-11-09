/**
 * Zone Maturation System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ZoneMaturationSystem } from '../zoneMaturation';
import type { TownshipState, Zone } from '../../../../types.township';
import type { BuildingsTable } from '../../data/buildingsLoader';

describe('ZoneMaturationSystem', () => {
  let system: ZoneMaturationSystem;
  let state: TownshipState;
  let buildings: BuildingsTable;

  beforeEach(() => {
    system = new ZoneMaturationSystem();

    // Create minimal test state
    state = {
      version: 1,
      districtId: 'test-district',
      seed: 12345,
      gridSize: { width: 64, height: 64 },
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
        demand: { residential: 0.5, commercial: 0, industrial: 0 },
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

    // Create test buildings table
    buildings = {
      residential_house: {
        id: 'residential_house',
        name: 'Small House',
        type: 'residential',
        tier: 1,
        cost: { wood: 50, stone: 30, coins: 100 },
        capacity: 4,
        buildTime: 30,
        size: { width: 2, height: 2 },
        provides: [],
        maintenance: { cost: 5, interval: 86400 },
        requirements: {}
      }
    };
  });

  it('should increase zone maturity with positive demand', () => {
    const zone: Zone = {
      id: 'zone-1',
      type: 'residential',
      position: { x: 10, y: 10 },
      size: { width: 4, height: 4 },
      maturity: 0
    };

    state.zones.push(zone);
    state.metrics.demand.residential = 0.5;

    system.tick(state, buildings, 1.0);

    expect(zone.maturity).toBeGreaterThan(0);
  });

  it('should spawn building when zone reaches threshold', () => {
    const zone: Zone = {
      id: 'zone-2',
      type: 'residential',
      position: { x: 20, y: 20 },
      size: { width: 6, height: 6 },
      maturity: 95 // Almost at threshold
    };

    state.zones.push(zone);
    state.metrics.demand.residential = 1.0;

    const initialBuildingCount = state.buildings.length;

    // Tick until zone spawns a building
    system.tick(state, buildings, 5.0);

    expect(state.buildings.length).toBeGreaterThan(initialBuildingCount);
  });

  it('should reset maturity after spawning a building', () => {
    const zone: Zone = {
      id: 'zone-3',
      type: 'residential',
      position: { x: 30, y: 30 },
      size: { width: 8, height: 8 },
      maturity: 100
    };

    state.zones.push(zone);
    state.metrics.demand.residential = 1.0;

    system.tick(state, buildings, 0.1);

    // Maturity should be reset if building was spawned
    if (state.buildings.length > 0) {
      expect(zone.maturity).toBeLessThan(100);
    }
  });

  it('should not spawn building without sufficient resources', () => {
    const zone: Zone = {
      id: 'zone-4',
      type: 'residential',
      position: { x: 40, y: 40 },
      size: { width: 4, height: 4 },
      maturity: 100
    };

    state.zones.push(zone);
    state.metrics.demand.residential = 1.0;

    // Drain resources
    state.resources.wood = 0;
    state.resources.stone = 0;
    state.resources.coins = 0;

    const initialBuildingCount = state.buildings.length;

    system.tick(state, buildings, 0.1);

    expect(state.buildings.length).toBe(initialBuildingCount);
  });

  it('should decrease maturity with negative demand', () => {
    const zone: Zone = {
      id: 'zone-5',
      type: 'residential',
      position: { x: 50, y: 50 },
      size: { width: 4, height: 4 },
      maturity: 50
    };

    state.zones.push(zone);
    state.metrics.demand.residential = -0.5;

    const initialMaturity = zone.maturity;

    system.tick(state, buildings, 1.0);

    expect(zone.maturity).toBeLessThan(initialMaturity);
  });
});
