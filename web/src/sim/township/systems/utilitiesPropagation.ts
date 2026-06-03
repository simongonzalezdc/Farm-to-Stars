/**
 * Utilities Propagation System
 *
 * Handles spreading of power, water, and other services across the city grid
 */

import type {
  TownshipState,
  Building,
  BuildingDefinition,
  BuildingsTable,
  ServiceType
} from '../../../types.township';

export interface UtilityNetwork {
  power: boolean[][]; // Grid of powered tiles
  water: boolean[][]; // Grid of watered tiles
  safety: boolean[][]; // Grid of police/fire coverage
  education: boolean[][]; // Grid of school coverage
}

/**
 * Utilities Propagation System
 *
 * Uses flood-fill to propagate services from source buildings
 */
export class UtilitiesPropagationSystem {
  /**
   * Calculate utility coverage for the entire city
   */
  public calculateCoverage(state: TownshipState, buildings: BuildingsTable): UtilityNetwork {
    const { width, height } = state.gridSize;

    // Initialize empty grids
    const network: UtilityNetwork = {
      power: this.createEmptyGrid(width, height),
      water: this.createEmptyGrid(width, height),
      safety: this.createEmptyGrid(width, height),
      education: this.createEmptyGrid(width, height)
    };

    // Process each operational building
    for (const building of state.buildings) {
      if (!building.operational) continue;

      const def = buildings[building.definitionId];
      if (!def) continue;

      // Propagate services from this building
      for (const service of building.provides) {
        this.propagateService(network, building, def, service, width, height);
      }
    }

    return network;
  }

  /**
   * Calculate coverage percentages for metrics
   */
  public calculateMetrics(
    state: TownshipState,
    network: UtilityNetwork
  ): TownshipState['metrics']['coverage'] {
    const { width, height } = state.gridSize;
    const totalTiles = width * height;

    // Count covered tiles for each service
    const powerCovered = this.countCoveredTiles(network.power);
    const waterCovered = this.countCoveredTiles(network.water);
    const safetyCovered = this.countCoveredTiles(network.safety);
    const educationCovered = this.countCoveredTiles(network.education);

    return {
      power: (powerCovered / totalTiles) * 100,
      water: (waterCovered / totalTiles) * 100,
      safety: (safetyCovered / totalTiles) * 100,
      education: (educationCovered / totalTiles) * 100
    };
  }

  /**
   * Propagate a service from a building
   */
  private propagateService(
    network: UtilityNetwork,
    building: Building,
    buildingDef: BuildingDefinition,
    service: ServiceType,
    gridWidth: number,
    gridHeight: number
  ): void {
    const radius = building.serviceRadius;
    const { x, y } = building.position;
    const centerX = x + (buildingDef.size?.width || 2) / 2;
    const centerY = y + (buildingDef.size?.height || 2) / 2;

    // Get the appropriate grid for this service
    let grid: boolean[][] | null = null;

    if (service === 'power' || service === 'electricity') {
      grid = network.power;
    } else if (service === 'water') {
      grid = network.water;
    } else if (service === 'safety' || service === 'police' || service === 'fire') {
      grid = network.safety;
    } else if (service === 'education' || service === 'school') {
      grid = network.education;
    }

    if (!grid) return;

    // Mark tiles within radius as covered
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= radius) {
          const tileX = Math.floor(centerX + dx);
          const tileY = Math.floor(centerY + dy);

          if (tileX >= 0 && tileX < gridWidth && tileY >= 0 && tileY < gridHeight) {
            grid[tileY][tileX] = true;
          }
        }
      }
    }
  }

  /**
   * Create an empty grid
   */
  private createEmptyGrid(width: number, height: number): boolean[][] {
    return Array.from({ length: height }, () => Array(width).fill(false));
  }

  /**
   * Count covered tiles in a grid
   */
  private countCoveredTiles(grid: boolean[][]): number {
    let count = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell) count++;
      }
    }
    return count;
  }

  /**
   * Check if a specific position is covered by a service
   */
  public isCovered(
    network: UtilityNetwork,
    service: 'power' | 'water' | 'safety' | 'education',
    x: number,
    y: number
  ): boolean {
    const grid = network[service];
    if (!grid[y] || !grid[y][x]) return false;
    return grid[y][x];
  }

  /**
   * Get coverage at a specific position (returns object with all services)
   */
  public getCoverageAt(
    network: UtilityNetwork,
    x: number,
    y: number
  ): {
    power: boolean;
    water: boolean;
    safety: boolean;
    education: boolean;
  } {
    return {
      power: this.isCovered(network, 'power', x, y),
      water: this.isCovered(network, 'water', x, y),
      safety: this.isCovered(network, 'safety', x, y),
      education: this.isCovered(network, 'education', x, y)
    };
  }
}
