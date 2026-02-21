/**
 * Buildings Data Loader
 *
 * Loads and validates building definitions from buildings.json
 */

import type { BuildingsTable, BuildingDefinition } from '../../../types.township';
import buildingsData from '../../../../content/township/buildings.json';

/**
 * Validate a single building definition
 */
function validateBuilding(building: any): building is BuildingDefinition {
  if (typeof building !== 'object' || building === null) return false;

  // Required fields
  if (typeof building.id !== 'string') return false;
  if (typeof building.name !== 'string') return false;
  if (typeof building.description !== 'string') return false;
  if (!['residential', 'commercial', 'industrial', 'service'].includes(building.type)) return false;
  if (typeof building.tier !== 'number' || building.tier < 1 || building.tier > 3) return false;
  if (typeof building.buildTime !== 'number') return false;
  if (typeof building.capacity !== 'number') return false;

  // Size validation
  if (
    !building.size ||
    typeof building.size.width !== 'number' ||
    typeof building.size.height !== 'number'
  ) {
    return false;
  }

  // Cost validation
  if (!building.cost || typeof building.cost !== 'object') return false;

  // Maintenance validation
  if (
    !building.maintenance ||
    typeof building.maintenance.cost !== 'number' ||
    typeof building.maintenance.interval !== 'number'
  ) {
    return false;
  }

  return true;
}

/**
 * Load all building definitions
 *
 * @returns Validated buildings table
 * @throws Error if validation fails
 */
export function loadBuildings(): BuildingsTable {
  const data = buildingsData as any;

  if (!data.buildings || typeof data.buildings !== 'object') {
    throw new Error('Invalid buildings.json format: missing "buildings" object');
  }

  const buildings: BuildingsTable = {};

  for (const [id, building] of Object.entries(data.buildings)) {
    if (!validateBuilding(building)) {
      throw new Error(`Invalid building definition: ${id}`);
    }

    buildings[id] = building as BuildingDefinition;
  }

  return buildings;
}

/**
 * Get a single building definition by ID
 *
 * @param buildingId - Building ID
 * @returns Building definition or undefined
 */
export function getBuilding(buildingId: string): BuildingDefinition | undefined {
  const buildings = loadBuildings();
  return buildings[buildingId];
}

/**
 * Get all buildings of a specific type
 *
 * @param type - Building type
 * @returns Array of building definitions
 */
export function getBuildingsByType(
  type: 'residential' | 'commercial' | 'industrial' | 'service'
): BuildingDefinition[] {
  const buildings = loadBuildings();
  return Object.values(buildings).filter((b) => b.type === type);
}

/**
 * Get all buildings a civilization can build
 *
 * @param civilizationId - Civilization ID
 * @returns Array of building definitions
 */
export function getBuildingsForCivilization(civilizationId: string): BuildingDefinition[] {
  const buildings = loadBuildings();
  return Object.values(buildings).filter((building) => {
    // No civilization requirement = available to all
    if (!building.requirements?.civilization) return true;

    // Check if this civilization can build it
    return building.requirements.civilization.includes(civilizationId as any);
  });
}

/**
 * Check if a building can be unlocked with current game state
 *
 * @param building - Building to check
 * @param population - Current population
 * @param civilizationId - Player's civilization
 * @returns True if building is unlocked
 */
export function isBuildingUnlocked(
  building: BuildingDefinition,
  population: number,
  civilizationId: string
): boolean {
  // Check population requirement
  if (building.requirements?.population && population < building.requirements.population) {
    return false;
  }

  // Check civilization requirement
  if (
    building.requirements?.civilization &&
    !building.requirements.civilization.includes(civilizationId as any)
  ) {
    return false;
  }

  return true;
}

// Export singleton instance
let cachedBuildings: BuildingsTable | null = null;

export function getBuildingsTable(): BuildingsTable {
  if (!cachedBuildings) {
    cachedBuildings = loadBuildings();
  }
  return cachedBuildings;
}
