/**
 * Zone Maturation System
 *
 * Handles automatic building spawning in designated zones based on demand
 */

import type { TownshipState, Zone, Building, ZoneType } from '../../../types.township';
import type { BuildingsTable } from '../data/buildingsLoader';
import { getBuildingsByType, isBuildingUnlocked } from '../data/buildingsLoader';

export interface ZoneMaturationConfig {
  maturationRate: number; // % per second when demand is positive
  decayRate: number; // % per second when demand is negative
  spawnThreshold: number; // Maturity % required to spawn a building
  minSpacing: number; // Minimum grid spacing between buildings
}

const DEFAULT_CONFIG: ZoneMaturationConfig = {
  maturationRate: 2.0, // 2% per second = ~50 seconds to mature
  decayRate: 0.5, // Slower decay
  spawnThreshold: 80, // Need 80% maturity to spawn
  minSpacing: 2 // 2 tile minimum spacing
};

/**
 * Zone Maturation System
 *
 * Manages zone growth and automatic building spawning
 */
export class ZoneMaturationSystem {
  private config: ZoneMaturationConfig;

  constructor(config: Partial<ZoneMaturationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update zone maturation based on demand
   */
  public tick(state: TownshipState, buildings: BuildingsTable, dt: number): void {
    const demand = state.metrics.demand;

    for (const zone of state.zones) {
      // Get demand for this zone type
      const zoneDemand = this.getZoneDemand(zone.type, demand);

      // Update maturity
      if (zoneDemand > 0) {
        // Positive demand - zone grows
        zone.maturity = Math.min(100, zone.maturity + this.config.maturationRate * zoneDemand * dt);
      } else if (zoneDemand < 0) {
        // Negative demand - zone decays
        zone.maturity = Math.max(0, zone.maturity + this.config.decayRate * zoneDemand * dt);
      }

      // Try to spawn building if mature enough
      if (zone.maturity >= this.config.spawnThreshold) {
        const spawned = this.trySpawnBuilding(state, zone, buildings);
        if (spawned) {
          // Reset maturity after spawning
          zone.maturity = 0;
        }
      }
    }
  }

  /**
   * Get demand value for a zone type
   */
  private getZoneDemand(zoneType: ZoneType, demand: TownshipState['metrics']['demand']): number {
    switch (zoneType) {
      case 'residential':
        return demand.residential;
      case 'commercial':
        return demand.commercial;
      case 'industrial':
        return demand.industrial;
      case 'mixed':
        // Mixed zones use average of all demands
        return (demand.residential + demand.commercial + demand.industrial) / 3;
    }
  }

  /**
   * Try to spawn a building in a zone
   */
  private trySpawnBuilding(state: TownshipState, zone: Zone, buildings: BuildingsTable): boolean {
    // Get appropriate building type for zone
    const buildingType = this.zoneToBuildingType(zone.type);

    // Get available buildings of this type
    const availableBuildings = getBuildingsByType(buildingType)
      .filter((b) => isBuildingUnlocked(b, state.population.total, state.civilization))
      .sort((a, b) => a.tier - b.tier); // Prefer lower tiers first

    if (availableBuildings.length === 0) return false;

    // Try each tier (starting with lowest)
    for (const buildingDef of availableBuildings) {
      // Check if we can afford it
      const canAfford = Object.entries(buildingDef.cost).every(
        ([resourceId, cost]) =>
          (state.resources[resourceId as keyof typeof state.resources] ?? 0) >= cost
      );

      if (!canAfford) continue;

      // Find a suitable position in the zone
      const position = this.findBuildingPosition(state, zone, buildingDef.size);

      if (!position) continue;

      // Spawn the building
      const building: Building = {
        id: `building-${state.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        definitionId: buildingDef.id,
        position,
        health: 100,
        constructionProgress: 0, // Start construction
        constructionTimeRemaining: buildingDef.buildTime,
        operational: false, // Not operational until construction complete
        serviceRadius: buildingDef.serviceRadius || 0,
        provides: buildingDef.provides || [],
        maintenance: {
          cost: buildingDef.maintenance.cost,
          lastMaintained: state.timestamp
        }
      };

      // Deduct costs
      for (const [resourceId, cost] of Object.entries(buildingDef.cost)) {
        const key = resourceId as keyof typeof state.resources;
        state.resources[key] = (state.resources[key] ?? 0) - cost;
      }

      // Add to state
      state.buildings.push(building);

      return true;
    }

    return false;
  }

  /**
   * Map zone type to building type
   */
  private zoneToBuildingType(zoneType: ZoneType): 'residential' | 'commercial' | 'industrial' {
    switch (zoneType) {
      case 'residential':
        return 'residential';
      case 'commercial':
        return 'commercial';
      case 'industrial':
        return 'industrial';
      case 'mixed':
        // For mixed zones, randomly choose based on current needs
        // For now, default to residential
        return 'residential';
    }
  }

  /**
   * Find a suitable position for a building within a zone
   */
  private findBuildingPosition(
    state: TownshipState,
    zone: Zone,
    buildingSize: { width: number; height: number }
  ): { x: number; y: number } | null {
    const { position, size } = zone;

    // Try random positions within the zone
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = position.x + Math.floor(Math.random() * (size.width - buildingSize.width + 1));
      const y = position.y + Math.floor(Math.random() * (size.height - buildingSize.height + 1));

      // Check if position is valid
      if (this.isPositionValid(state, { x, y }, buildingSize)) {
        return { x, y };
      }
    }

    return null;
  }

  /**
   * Check if a position is valid for placing a building
   */
  private isPositionValid(
    state: TownshipState,
    position: { x: number; y: number },
    size: { width: number; height: number }
  ): boolean {
    const { x, y } = position;
    const { width, height } = size;

    // Check grid bounds
    if (x < 0 || y < 0 || x + width > state.gridSize.width || y + height > state.gridSize.height) {
      return false;
    }

    // Check for overlaps with existing buildings
    for (const building of state.buildings) {
      const buildingDef = this.getBuildingSize(building.definitionId);
      if (!buildingDef) continue;

      const bx = building.position.x;
      const by = building.position.y;
      const bw = buildingDef.width;
      const bh = buildingDef.height;

      // Check for overlap (with spacing)
      const spacing = this.config.minSpacing;
      if (
        x < bx + bw + spacing &&
        x + width + spacing > bx &&
        y < by + bh + spacing &&
        y + height + spacing > by
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get building size from definition ID (helper)
   */
  private getBuildingSize(definitionId: string): { width: number; height: number } | null {
    // This is a simplified lookup - in practice you'd use BuildingsTable
    // For now, assume all buildings are 2x2
    return { width: 2, height: 2 };
  }
}
