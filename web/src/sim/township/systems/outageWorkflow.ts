/**
 * Outage Workflow System
 *
 * Handles service disruptions and repairs for utility buildings
 */

import type { TownshipState, Building } from '../../../types.township';
import type { BuildingsTable } from '../data/buildingsLoader';

export interface OutageConfig {
  meanTimeBetweenOutages: number; // Average seconds between outages
  repairTimeBase: number; // Base repair time in seconds
  repairCostMultiplier: number; // Multiplier of building cost for repairs
  healthDegradationRate: number; // Health loss per second without maintenance
}

const DEFAULT_OUTAGE_CONFIG: OutageConfig = {
  meanTimeBetweenOutages: 600, // 10 minutes average
  repairTimeBase: 60, // 1 minute base repair time
  repairCostMultiplier: 0.2, // 20% of building cost
  healthDegradationRate: 0.5 // 0.5% per second
};

export interface OutageEvent {
  type: 'outage_started' | 'outage_repaired' | 'building_damaged';
  buildingId: string;
  timestamp: number;
}

/**
 * Outage Workflow System
 */
export class OutageWorkflowSystem {
  private config: OutageConfig;
  private outageTimers: Map<string, number> = new Map(); // Building ID -> time until next check

  constructor(config: Partial<OutageConfig> = {}) {
    this.config = { ...DEFAULT_OUTAGE_CONFIG, ...config };
  }

  /**
   * Tick the outage system
   */
  public tick(state: TownshipState, buildings: BuildingsTable, dt: number): OutageEvent[] {
    const events: OutageEvent[] = [];

    for (const building of state.buildings) {
      // Skip buildings under construction
      if (building.constructionProgress < 100) continue;

      const def = buildings[building.definitionId];
      if (!def) continue;

      // Only service buildings can have outages
      if (def.type !== 'service') continue;

      // Check if building is currently out of service
      if (!building.operational) {
        // Building is in outage state
        // Players can repair by clicking/interacting (handled elsewhere)
        continue;
      }

      // Degrade health over time if not maintained
      if (building.health < 100) {
        building.health = Math.max(0, building.health - this.config.healthDegradationRate * dt);

        if (building.health <= 0) {
          // Building completely broken down
          building.operational = false;
          events.push({
            type: 'building_damaged',
            buildingId: building.id,
            timestamp: state.timestamp
          });
        }
      }

      // Check for random outages
      const timer = this.outageTimers.get(building.id) || this.getRandomOutageTime();

      const newTimer = timer - dt;

      if (newTimer <= 0) {
        // Outage occurs!
        const outageChance = this.calculateOutageChance(building, def);

        if (Math.random() < outageChance) {
          building.operational = false;
          building.health = Math.max(20, building.health - 30); // Damage from outage

          events.push({
            type: 'outage_started',
            buildingId: building.id,
            timestamp: state.timestamp
          });
        }

        // Reset timer
        this.outageTimers.set(building.id, this.getRandomOutageTime());
      } else {
        this.outageTimers.set(building.id, newTimer);
      }
    }

    return events;
  }

  /**
   * Attempt to repair a building
   */
  public repairBuilding(
    state: TownshipState,
    buildings: BuildingsTable,
    buildingId: string
  ): { success: boolean; cost?: Record<string, number>; time?: number; reason?: string } {
    const building = state.buildings.find((b) => b.id === buildingId);
    if (!building) {
      return { success: false, reason: 'Building not found' };
    }

    if (building.operational && building.health >= 100) {
      return { success: false, reason: 'Building does not need repair' };
    }

    const def = buildings[building.definitionId];
    if (!def) {
      return { success: false, reason: 'Building definition not found' };
    }

    // Calculate repair cost
    const repairCost = this.calculateRepairCost(building, def);

    // Check if player can afford
    const canAfford = Object.entries(repairCost).every(
      ([resourceId, cost]) =>
        (state.resources[resourceId as keyof typeof state.resources] ?? 0) >= cost
    );

    if (!canAfford) {
      return { success: false, cost: repairCost, reason: 'Insufficient resources' };
    }

    // Deduct costs
    for (const [resourceId, cost] of Object.entries(repairCost)) {
      const key = resourceId as keyof typeof state.resources;
      state.resources[key] = (state.resources[key] ?? 0) - cost;
    }

    // Calculate repair time
    const repairTime = this.calculateRepairTime(building, def);

    // Restore building
    building.operational = true;
    building.health = 100;

    return { success: true, cost: repairCost, time: repairTime };
  }

  /**
   * Calculate outage chance based on building condition
   */
  private calculateOutageChance(building: Building, def: any): number {
    // Base chance: 10%
    let chance = 0.1;

    // Increase chance based on health
    if (building.health < 50) {
      chance += 0.3; // +30% if health < 50%
    } else if (building.health < 75) {
      chance += 0.15; // +15% if health < 75%
    }

    // Increase chance if maintenance is overdue
    const timeSinceMaintenance = Date.now() - building.maintenance.lastMaintained;
    const maintenanceInterval = def.maintenance.interval * 1000;

    if (timeSinceMaintenance > maintenanceInterval * 2) {
      chance += 0.2; // +20% if maintenance very overdue
    } else if (timeSinceMaintenance > maintenanceInterval) {
      chance += 0.1; // +10% if maintenance overdue
    }

    return Math.min(chance, 0.8); // Cap at 80%
  }

  /**
   * Calculate repair cost
   */
  private calculateRepairCost(building: Building, def: any): Record<string, number> {
    const cost: Record<string, number> = {};

    // Repair cost is a percentage of building cost
    const healthPercent = building.health / 100;
    const damagePercent = 1 - healthPercent;

    for (const [resourceId, buildCost] of Object.entries(def.cost)) {
      cost[resourceId] = Math.ceil(
        (buildCost as number) * this.config.repairCostMultiplier * damagePercent
      );
    }

    return cost;
  }

  /**
   * Calculate repair time
   */
  private calculateRepairTime(building: Building, def: any): number {
    const healthPercent = building.health / 100;
    const damagePercent = 1 - healthPercent;

    // Repair time scales with damage
    return this.config.repairTimeBase * damagePercent;
  }

  /**
   * Get random outage check time
   */
  private getRandomOutageTime(): number {
    // Exponential distribution for realistic random intervals
    return -Math.log(Math.random()) * this.config.meanTimeBetweenOutages;
  }

  /**
   * Clear outage timer for a building (when removed)
   */
  public clearOutageTimer(buildingId: string): void {
    this.outageTimers.delete(buildingId);
  }

  /**
   * Get all buildings currently in outage
   */
  public getBuildingsInOutage(state: TownshipState): Building[] {
    return state.buildings.filter((b) => !b.operational && b.constructionProgress >= 100);
  }
}
