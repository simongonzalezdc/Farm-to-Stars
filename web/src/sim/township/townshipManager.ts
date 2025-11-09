/**
 * Township Manager
 *
 * Central orchestrator for Township simulation.
 * Coordinates zone growth, population, happiness, and services.
 */

import type {
  TownshipState,
  TownshipMetrics,
  TownshipEvent,
  TownshipEventHandler,
  BuildingsTable,
  TownshipCivilizationDefinition
} from '../../types.township';
import { TOWNSHIP_CONFIG } from '../../types.township';

import { tickZoneGrowth } from './systems/zoneGrowth';
import { tickPopulation } from './systems/population';
import { calculateHappiness } from './systems/metrics';
import { ZoneMaturationSystem } from './systems/zoneMaturation';
import { UtilitiesPropagationSystem, type UtilityNetwork } from './systems/utilitiesPropagation';
import { DemandCalculationSystem } from './systems/demandCalculation';

/**
 * Township Manager
 * Manages simulation state and coordinates subsystems
 */
export class TownshipManager {
  private state: TownshipState;
  private buildings: BuildingsTable;
  private civilization: TownshipCivilizationDefinition;

  private eventHandlers: TownshipEventHandler[] = [];

  // S4 Systems
  private zoneMaturation: ZoneMaturationSystem;
  private utilitiesPropagation: UtilitiesPropagationSystem;
  private demandCalculation: DemandCalculationSystem;
  private utilityNetwork: UtilityNetwork | null = null;

  // Performance optimization: cache dirty flags
  private dirty = {
    happiness: true,
    demand: true,
    coverage: true
  };

  private cachedMetrics: TownshipMetrics | null = null;

  constructor(
    state: TownshipState,
    buildings: BuildingsTable,
    civilization: TownshipCivilizationDefinition
  ) {
    this.state = state;
    this.buildings = buildings;
    this.civilization = civilization;

    // Initialize S4 systems
    this.zoneMaturation = new ZoneMaturationSystem();
    this.utilitiesPropagation = new UtilitiesPropagationSystem();
    this.demandCalculation = new DemandCalculationSystem();
  }

  /**
   * Main simulation tick
   * Called at TOWNSHIP_CONFIG.TICK_RATE Hz
   *
   * @param dt - Delta time in seconds since last tick
   */
  tick(dt: number): void {
    // Update timestamp
    this.state.timestamp += dt;
    this.state.tick += 1;

    // Run subsystems
    this.tickZones(dt);
    this.tickPopulation(dt);
    this.tickBuildings(dt);

    // Recalculate metrics (lazy evaluation)
    this.updateMetrics();
  }

  /**
   * Zone growth system (S4 enhanced with auto-spawning)
   */
  private tickZones(dt: number): void {
    const events = tickZoneGrowth(this.state, this.civilization, this.buildings, dt);

    // S4: Zone maturation - automatic building spawning
    const buildingCountBefore = this.state.buildings.length;
    this.zoneMaturation.tick(this.state, this.buildings, dt);
    const buildingCountAfter = this.state.buildings.length;

    // Emit event if buildings were spawned
    if (buildingCountAfter > buildingCountBefore) {
      this.emit({
        type: 'building_spawned',
        count: buildingCountAfter - buildingCountBefore
      });
    }

    // Mark metrics as dirty if zones changed or buildings spawned
    if (events.length > 0 || buildingCountAfter > buildingCountBefore) {
      this.markDirty('demand');
      this.markDirty('coverage');

      // Emit events
      events.forEach(e => this.emit(e));
    }
  }

  /**
   * Population system
   */
  private tickPopulation(dt: number): void {
    const events = tickPopulation(this.state, this.civilization, dt);

    // Mark metrics as dirty if population changed
    if (events.length > 0) {
      this.markDirty('happiness');
      this.markDirty('demand');

      // Emit events
      events.forEach(e => this.emit(e));
    }
  }

  /**
   * Building construction and maintenance (S4 enhanced)
   */
  private tickBuildings(dt: number): void {
    for (const building of this.state.buildings) {
      const def = this.buildings[building.definitionId];
      if (!def) continue;

      // S4: Handle building construction
      if (building.constructionProgress < 100) {
        building.constructionTimeRemaining = Math.max(0, building.constructionTimeRemaining - dt);

        if (building.constructionTimeRemaining <= 0) {
          // Construction complete
          building.constructionProgress = 100;
          building.operational = true;
          this.markDirty('coverage');

          this.emit({
            type: 'building_completed',
            buildingId: building.id,
            definitionId: building.definitionId
          });
        } else {
          // Update construction progress
          const totalTime = def.buildTime;
          building.constructionProgress = Math.min(100,
            ((totalTime - building.constructionTimeRemaining) / totalTime) * 100
          );
        }
        continue; // Skip maintenance for buildings under construction
      }

      // Check if maintenance is due
      const timeSinceMaintenance = this.state.timestamp - building.maintenance.lastMaintained;

      if (timeSinceMaintenance >= def.maintenance.interval) {
        // Deduct maintenance cost
        const cost = def.maintenance.cost * this.civilization.townshipBonuses.maintenanceCost;

        if (this.state.resources.coins >= cost) {
          this.state.resources.coins -= cost;
          building.maintenance.lastMaintained = this.state.timestamp;
          building.operational = true;
        } else {
          // Can't afford maintenance - building becomes non-operational
          building.operational = false;
          this.markDirty('coverage');
        }
      }
    }
  }

  /**
   * Update metrics (lazy evaluation) - S4 enhanced
   */
  private updateMetrics(): void {
    // Recalculate only dirty subsystems
    const metrics = { ...this.state.metrics };

    if (this.dirty.happiness) {
      metrics.happiness = calculateHappiness(this.state, this.civilization);
      this.dirty.happiness = false;

      // Emit happiness change event if significant
      if (Math.abs(metrics.happiness.overall - this.state.metrics.happiness.overall) > 5) {
        this.emit({
          type: 'happiness_changed',
          previous: this.state.metrics.happiness.overall,
          current: metrics.happiness.overall
        });
      }
    }

    // S4: Dynamic demand calculation
    if (this.dirty.demand) {
      metrics.demand = this.demandCalculation.calculateDemand(this.state, this.buildings);
      this.dirty.demand = false;

      this.emit({ type: 'demand_shift', demand: metrics.demand });
    }

    // S4: Utilities propagation for coverage
    if (this.dirty.coverage) {
      this.utilityNetwork = this.utilitiesPropagation.calculateCoverage(this.state, this.buildings);
      metrics.coverage = this.utilitiesPropagation.calculateMetrics(this.state, this.utilityNetwork);
      this.dirty.coverage = false;

      this.emit({ type: 'service_coverage_updated', coverage: metrics.coverage });
    }

    // Update zone distribution
    metrics.zoneDistribution = {
      residential: this.state.zones.filter(z => z.type === 'residential').length,
      commercial: this.state.zones.filter(z => z.type === 'commercial').length,
      industrial: this.state.zones.filter(z => z.type === 'industrial').length,
      mixed: this.state.zones.filter(z => z.type === 'mixed').length
    };

    this.state.metrics = metrics;
  }

  /**
   * Get utility network (for heatmap visualization)
   */
  getUtilityNetwork(): UtilityNetwork | null {
    return this.utilityNetwork;
  }

  /**
   * Mark a subsystem as dirty (needs recalculation)
   */
  markDirty(system: keyof typeof this.dirty): void {
    this.dirty[system] = true;
  }

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<TownshipState> {
    return this.state;
  }

  /**
   * Get current metrics
   */
  getMetrics(): Readonly<TownshipMetrics> {
    return this.state.metrics;
  }

  /**
   * Register event handler
   */
  on(handler: TownshipEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Unregister event handler
   */
  off(handler: TownshipEventHandler): void {
    this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
  }

  /**
   * Emit event to all handlers
   */
  private emit(event: TownshipEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('TownshipManager: Event handler error', error);
      }
    });
  }
}

/**
 * Create initial Township state
 *
 * @param civilization - Civilization ID
 * @param seed - RNG seed for determinism
 * @returns Empty Township state
 */
export function createDefaultTownshipState(civilization: string, seed: number): TownshipState {
  return {
    version: 1,
    districtId: `district-${seed}-${Date.now()}`,
    seed,

    gridSize: TOWNSHIP_CONFIG.DEFAULT_GRID_SIZE,

    zones: [],
    buildings: [],

    population: {
      total: 100, // Starting population
      employed: 70,
      unemployed: 30,
      homeless: 0,
      growthRate: 0,
      lastGrowth: 0
    },

    metrics: {
      happiness: {
        overall: 50,
        factors: []
      },
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
      wood: 500,
      stone: 300,
      water: 1000,
      food: 200,
      coins: 1000
    },

    civilization,

    timestamp: 0,
    tick: 0
  };
}
