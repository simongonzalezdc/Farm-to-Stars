/**
 * Township Phase Type Definitions
 *
 * District simulation, zoning, population management, and civic services.
 * Follows patterns from Homestead (data-driven, event-based, deterministic).
 */

import type { CivilizationId, ResourceId } from './types';

// ============================================================================
// Core Township Types
// ============================================================================

export type ZoneType = 'residential' | 'commercial' | 'industrial' | 'mixed';
export type ServiceType =
  | 'power'
  | 'water'
  | 'safety'
  | 'education'
  | 'health'
  | 'recreation'
  | 'shopping';
export type BuildingDefinitionId = string;

/**
 * Top-level Township state
 * Represents a single district managed by the player
 */
export interface TownshipState {
  version: number; // Schema version for migrations
  districtId: string; // Unique identifier for this district
  seed: number; // RNG seed for deterministic simulation

  gridSize: {
    width: number; // Tile width (default: 64)
    height: number; // Tile height (default: 64)
  };

  zones: Zone[]; // All placed zones
  buildings: Building[]; // All constructed buildings
  population: PopulationState; // Aggregated citizen data
  metrics: TownshipMetrics; // Dashboard metrics

  resources: Record<ResourceId, number>; // Resources carried from Homestead
  civilization: CivilizationId; // Inherited civilization choice

  timestamp: number; // Simulation time elapsed (seconds)
  tick: number; // Simulation tick counter
}

/**
 * Zone Definition
 * Zones are designated areas that attract development
 */
export interface Zone {
  id: string; // Unique zone ID
  type: ZoneType; // Zone category

  position: { x: number; y: number }; // Top-left grid position
  size: { width: number; height: number }; // Zone dimensions in tiles

  maturity: number; // 0-1, development progress
  level: number; // 1-3, density tier (low/medium/high)

  occupancy: number; // Current population or workers
  capacity: number; // Maximum occupancy based on maturity and level

  happiness: number; // 0-100, local zone satisfaction
  demand: number; // -1 to 1, growth pressure

  // Service coverage flags
  services: {
    power: boolean;
    water: boolean;
    safety: boolean;
    education: boolean;
  };
}

/**
 * Building Definition
 * Buildings provide services, housing, or jobs
 */
export interface Building {
  id: string; // Unique building instance ID
  definitionId: BuildingDefinitionId; // References buildings.json

  position: { x: number; y: number }; // Grid position
  zone: string | null; // Parent zone ID (null for standalone)

  level: number; // Building tier (1-3)
  operational: boolean; // Is building functional?

  serviceRadius: number; // Tile range for service coverage (0 = no service)
  provides: ServiceType[]; // Services this building offers

  maintenance: {
    cost: number; // Coins per tick to maintain
    lastMaintained: number; // Timestamp of last maintenance
  };
}

/**
 * Population State (Aggregated)
 * Tracks citizens as aggregate numbers, not individual agents
 */
export interface PopulationState {
  total: number; // Total citizens in district

  employed: number; // Citizens with jobs
  unemployed: number; // Jobless citizens
  homeless: number; // Citizens without housing

  growthRate: number; // Population change per second
  lastGrowth: number; // Timestamp of last growth event
}

/**
 * Township Metrics
 * Dashboard-level statistics for player feedback
 */
export interface TownshipMetrics {
  happiness: {
    overall: number; // 0-100, district-wide satisfaction
    factors: HappinessFactor[]; // Breakdown by category
  };

  demand: {
    residential: number; // -1 to 1, housing demand
    commercial: number; // -1 to 1, shopping/service demand
    industrial: number; // -1 to 1, job demand
  };

  coverage: {
    power: number; // 0-1, % of zones with power
    water: number; // 0-1, % of zones with water
    safety: number; // 0-1, % of zones with police/fire
    education: number; // 0-1, % of zones with schools
  };

  zoneDistribution: {
    residential: number; // Count of residential zones
    commercial: number; // Count of commercial zones
    industrial: number; // Count of industrial zones
    mixed: number; // Count of mixed-use zones
  };
}

/**
 * Happiness Factor
 * Individual contributor to overall happiness
 */
export interface HappinessFactor {
  category: 'housing' | 'employment' | 'services' | 'safety' | 'environment' | 'civilization';
  name: string; // Human-readable label
  value: number; // -50 to 50, contribution to happiness
  weight: number; // Importance multiplier (1.0 = normal)
}

// ============================================================================
// Building Data Schema
// ============================================================================

/**
 * Building Definition (from buildings.json)
 */
export interface BuildingDefinition {
  id: BuildingDefinitionId;
  name: string; // Display name
  description: string; // Tooltip text

  type: ZoneType | 'service'; // Category
  tier: number; // 1-3, technology level

  cost: Partial<Record<ResourceId, number>>; // Construction cost
  buildTime: number; // Seconds to construct

  capacity: number; // Population or jobs provided
  size: { width: number; height: number }; // Footprint in tiles

  effects: {
    happiness?: number; // Base happiness modifier
    environment?: number; // Pollution/beauty modifier
  };

  provides?: ServiceType[]; // Services offered (if applicable)
  serviceRadius?: number; // Tile range for service coverage

  maintenance: {
    cost: number; // Coins per second to maintain
    interval: number; // Seconds between maintenance
  };

  requirements?: {
    population?: number; // Minimum population to unlock
    buildings?: BuildingDefinitionId[]; // Required buildings
    civilization?: CivilizationId[]; // Civilization-specific
  };
}

export type BuildingsTable = Record<BuildingDefinitionId, BuildingDefinition>;

// ============================================================================
// Civilization Integration
// ============================================================================

/**
 * Township-specific Civilization Bonuses
 * Extends Homestead bonuses with city-building perks
 */
export interface TownshipCivilizationBonuses {
  populationGrowth: number; // e.g., 1.10 = +10% growth rate
  constructionSpeed: number; // e.g., 1.15 = +15% faster building
  happinessBonus: number; // e.g., 5 = +5 base happiness
  zoneCapacity: number; // e.g., 1.10 = +10% zone capacity
  serviceCoverage: number; // e.g., 1.20 = +20% service radius
  maintenanceCost: number; // e.g., 0.90 = -10% maintenance

  // Civilization-specific unique bonuses
  unique?: {
    name: string; // e.g., "Maya Observatory Bonus"
    description: string;
    effect: Record<string, number>; // Custom effects
  };
}

/**
 * Full civilization definition for Township phase
 * Merges Homestead data with Township-specific bonuses
 */
export interface TownshipCivilizationDefinition {
  id: CivilizationId;
  name: string;

  homesteadBonuses: Record<string, number>; // Carried forward
  townshipBonuses: TownshipCivilizationBonuses; // New bonuses

  advisorDialogue: {
    welcome: string;
    milestones: Record<string, string>; // e.g., "1000_population": "..."
    warnings: Record<string, string>; // e.g., "low_happiness": "..."
  };
}

// ============================================================================
// Homestead → Township Import
// ============================================================================

/**
 * Homestead Export Payload
 * Defined in types.ts, re-exported here for clarity
 */
export interface HomesteadTownshipExport {
  version: number;
  generatedAt: string;
  seed: number;

  homestead: {
    metadata: {
      day: number;
      season: string;
      year: number;
      cycle: number;
      weather: string;
      civilization?: CivilizationId;
    };

    resources: Record<ResourceId, number>;
    staminaPercent: number;

    structures: Array<{
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;

    livestock?: Array<{
      speciesId: string;
      mature: number;
      juvenile: number;
    }>;
  };

  township: {
    agriculture: Array<{
      id: string;
      seed: number;
      plots: number;
      fertility: number;
      logisticsScore: number;
      exports: Array<{ resourceId: ResourceId; amount: number }>;
    }>;

    shipments: Array<{ resourceId: ResourceId; amount: number }>;
  };
}

/**
 * Import result
 * Contains initial Township state + metadata
 */
export interface TownshipImportResult {
  state: TownshipState;

  metadata: {
    homesteadQuality: number; // 0-1, performance assessment
    startingBonus: string; // Human-readable description
    civilization: CivilizationId;
  };
}

// ============================================================================
// Simulation Events
// ============================================================================

/**
 * Domain events emitted during simulation
 * Used by UI, audio, and telemetry systems
 */
export type TownshipEvent =
  | { type: 'zone_created'; zone: Zone }
  | { type: 'zone_matured'; zone: Zone }
  | { type: 'building_placed'; building: Building }
  | { type: 'building_completed'; building: Building }
  | { type: 'population_milestone'; milestone: number }
  | { type: 'happiness_changed'; previous: number; current: number }
  | { type: 'demand_shift'; demand: TownshipMetrics['demand'] }
  | { type: 'service_coverage_updated'; coverage: TownshipMetrics['coverage'] };

/**
 * Event handler signature
 */
export type TownshipEventHandler = (event: TownshipEvent) => void;

// ============================================================================
// Spatial Queries
// ============================================================================

/**
 * Spatial grid for efficient proximity queries
 */
export interface SpatialCell {
  x: number;
  y: number;
  zones: string[]; // Zone IDs in this cell
  buildings: string[]; // Building IDs in this cell
}

/**
 * Query result from spatial grid
 */
export interface SpatialQueryResult<T> {
  items: T[];
  distance: number; // Distance from query point
}

// ============================================================================
// Configuration Constants
// ============================================================================

export const TOWNSHIP_CONFIG = {
  // Grid settings
  DEFAULT_GRID_SIZE: { width: 64, height: 64 },
  MAX_GRID_SIZE: { width: 128, height: 128 },

  // Simulation
  TICK_RATE: 10, // Hz (matches Homestead)
  BASE_POPULATION_GROWTH: 0.1, // Citizens per second
  BASE_ZONE_GROWTH: 0.01, // Maturity per second

  // Demand thresholds
  DEMAND_HIGH: 0.5,
  DEMAND_LOW: -0.5,

  // Happiness thresholds
  HAPPINESS_HAPPY: 70,
  HAPPINESS_CONTENT: 50,
  HAPPINESS_UNHAPPY: 30,

  // Service coverage requirements
  MIN_POWER_COVERAGE: 0.8,
  MIN_WATER_COVERAGE: 0.8,
  MIN_SAFETY_COVERAGE: 0.6,

  // Zone levels
  ZONE_LEVEL_LOW: 1,
  ZONE_LEVEL_MEDIUM: 2,
  ZONE_LEVEL_HIGH: 3,

  // Capacity multipliers by level
  CAPACITY_MULTIPLIER: {
    1: 1.0, // Low density
    2: 2.5, // Medium density
    3: 5.0 // High density
  },

  // Ideal zone distribution (for demand calculation)
  IDEAL_DISTRIBUTION: {
    residential: 0.5, // 50%
    commercial: 0.3, // 30%
    industrial: 0.2 // 20%
  }
} as const;
