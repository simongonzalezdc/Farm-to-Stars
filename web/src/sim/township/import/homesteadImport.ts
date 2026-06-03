/**
 * Homestead → Township Import Adapter
 *
 * Converts Homestead export payload into initial Township state.
 * Rewards successful Homestead gameplay with better starting conditions.
 */

import type {
  TownshipState,
  TownshipImportResult,
  HomesteadTownshipExport,
  BuildingsTable
} from '../../../types.township';
import { TOWNSHIP_CONFIG } from '../../../types.township';
import { createZone } from '../systems/zoneGrowth';
import type { CivilizationId } from '../../../types';

interface HomesteadExportCandidate {
  version?: unknown;
  seed?: unknown;
  homestead?: {
    metadata?: unknown;
    resources?: unknown;
    structures?: unknown;
  };
}

/**
 * Import Homestead save into Township
 *
 * @param homesteadExport - Exported Homestead data
 * @param buildings - Building definitions table
 * @returns Township state + import metadata
 */
export function importFromHomestead(
  homesteadExport: HomesteadTownshipExport,
  buildings: BuildingsTable
): TownshipImportResult {
  // Assess Homestead performance
  const quality = calculateHomesteadQuality(homesteadExport);

  // Generate deterministic district ID
  const districtId = `district-${homesteadExport.seed}-${homesteadExport.homestead.metadata.day}`;

  // Calculate starting population based on Homestead success
  const basePopulation = 100;
  const bonusPopulation = Math.floor(quality * 200); // Up to +200 citizens
  const startingPopulation = basePopulation + bonusPopulation;

  // Create initial zones based on Homestead structures
  const initialZones = generateStarterZones(
    homesteadExport.homestead.structures,
    homesteadExport.seed
  );

  // Determine civilization
  const civilization =
    (homesteadExport.homestead.metadata.civilization as CivilizationId) || 'teotihuacan';

  // Build Township state
  const state: TownshipState = {
    version: 1,
    districtId,
    seed: homesteadExport.seed,

    gridSize: TOWNSHIP_CONFIG.DEFAULT_GRID_SIZE,

    zones: initialZones,
    buildings: [],

    population: {
      total: startingPopulation,
      employed: Math.floor(startingPopulation * 0.7),
      unemployed: Math.floor(startingPopulation * 0.3),
      homeless: 0,
      growthRate: 0,
      lastGrowth: 0
    },

    metrics: {
      happiness: {
        overall: 50 + quality * 20, // 50-70 starting happiness
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
      ...homesteadExport.homestead.resources,
      // Add Township-specific resources if needed
      coins: Math.floor((homesteadExport.homestead.resources.coins || 0) * 1.5)
    },

    civilization,

    timestamp: 0,
    tick: 0
  };

  // Update zone distribution
  state.metrics.zoneDistribution = {
    residential: state.zones.filter((z) => z.type === 'residential').length,
    commercial: state.zones.filter((z) => z.type === 'commercial').length,
    industrial: state.zones.filter((z) => z.type === 'industrial').length,
    mixed: state.zones.filter((z) => z.type === 'mixed').length
  };

  return {
    state,
    metadata: {
      homesteadQuality: quality,
      startingBonus: getStartingBonusDescription(quality, bonusPopulation),
      civilization
    }
  };
}

/**
 * Assess Homestead performance to determine Township bonuses
 *
 * Factors:
 * - Resource stockpile
 * - Structures built
 * - Livestock raised
 * - Stamina management
 *
 * @param homesteadExport - Homestead export data
 * @returns Quality score (0-1)
 */
function calculateHomesteadQuality(homesteadExport: HomesteadTownshipExport): number {
  let quality = 0;

  // Resource stockpile (0-0.3)
  const totalResources = Object.values(homesteadExport.homestead.resources).reduce(
    (sum, amt) => sum + amt,
    0
  );
  quality += Math.min(0.3, totalResources / 10000);

  // Structures built (0-0.3)
  quality += Math.min(0.3, homesteadExport.homestead.structures.length / 20);

  // Livestock raised (0-0.2)
  if (homesteadExport.homestead.livestock) {
    const totalLivestock = homesteadExport.homestead.livestock.reduce(
      (sum, l) => sum + l.mature + l.juvenile,
      0
    );
    quality += Math.min(0.2, totalLivestock / 50);
  }

  // Stamina management (0-0.2)
  quality += homesteadExport.homestead.staminaPercent * 0.002; // 100% stamina = +0.2

  return Math.min(1.0, quality);
}

/**
 * Generate starter zones based on Homestead structures
 *
 * Creates a balanced mix of residential, commercial, and industrial zones
 * positioned to reflect the player's Homestead layout.
 *
 * @param structures - Homestead structures
 * @param seed - RNG seed for deterministic placement
 * @returns Initial zones
 */
function generateStarterZones(
  structures: HomesteadTownshipExport['homestead']['structures'],
  seed: number
): TownshipState['zones'] {
  const zones: TownshipState['zones'] = [];

  // Create a simple RNG from seed
  let rngState = seed;
  const rng = () => {
    rngState = (rngState * 1664525 + 1013904223) | 0;
    return (rngState >>> 0) / 0xffffffff;
  };

  // Starter zones: 2 residential, 1 commercial, 1 industrial
  // Position them based on Homestead structure density

  // Calculate center of Homestead structures
  const centerX =
    structures.length > 0
      ? Math.floor(structures.reduce((sum, s) => sum + s.x, 0) / structures.length)
      : 32;
  const centerY =
    structures.length > 0
      ? Math.floor(structures.reduce((sum, s) => sum + s.y, 0) / structures.length)
      : 32;

  // Place residential zones near center
  zones.push(
    createZone('residential', { x: centerX - 6, y: centerY - 6 }, { width: 4, height: 4 })
  );
  zones.push(
    createZone('residential', { x: centerX + 2, y: centerY - 6 }, { width: 4, height: 4 })
  );

  // Place commercial zone
  zones.push(createZone('commercial', { x: centerX - 6, y: centerY + 2 }, { width: 4, height: 4 }));

  // Place industrial zone (further from center)
  zones.push(createZone('industrial', { x: centerX + 2, y: centerY + 2 }, { width: 4, height: 4 }));

  // Give starter zones some initial maturity based on Homestead success
  const initialMaturity = Math.min(0.3, structures.length / 50);
  zones.forEach((zone) => {
    zone.maturity = initialMaturity;
  });

  return zones;
}

/**
 * Get human-readable description of starting bonus
 *
 * @param quality - Quality score (0-1)
 * @param bonusPopulation - Bonus population granted
 * @returns Description string
 */
function getStartingBonusDescription(quality: number, bonusPopulation: number): string {
  if (quality >= 0.8) {
    return `Excellent Homestead! +${bonusPopulation} citizens eager to join your township.`;
  } else if (quality >= 0.6) {
    return `Strong Homestead! +${bonusPopulation} citizens attracted to your district.`;
  } else if (quality >= 0.4) {
    return `Solid Homestead! +${bonusPopulation} citizens ready to build a town.`;
  } else if (quality >= 0.2) {
    return `Modest Homestead. +${bonusPopulation} citizens willing to help.`;
  } else {
    return `Basic Homestead. +${bonusPopulation} citizens starting fresh.`;
  }
}

/**
 * Validate Homestead export payload
 *
 * @param homesteadExport - Export to validate
 * @returns True if valid
 */
export function validateHomesteadExport(homesteadExport: unknown): boolean {
  if (typeof homesteadExport !== 'object' || homesteadExport === null) {
    return false;
  }

  const payload = homesteadExport as HomesteadExportCandidate;

  // Check required fields
  if (typeof payload.version !== 'number') return false;
  if (typeof payload.seed !== 'number') return false;
  if (!payload.homestead || typeof payload.homestead !== 'object') return false;

  const homestead = payload.homestead;
  if (!homestead.metadata || typeof homestead.metadata !== 'object') return false;
  if (!homestead.resources || typeof homestead.resources !== 'object') return false;
  if (!Array.isArray(homestead.structures)) return false;

  return true;
}
