/**
 * Population System
 *
 * Manages citizen growth, distribution, employment, and housing.
 * Population grows when:
 * - Housing is available
 * - Jobs are available
 * - Happiness is positive
 *
 * Population shrinks when conditions are poor.
 */

import type {
  TownshipState,
  TownshipEvent,
  TownshipCivilizationDefinition
} from '../../../types.township';
import { TOWNSHIP_CONFIG } from '../../../types.township';

/**
 * Tick population system
 *
 * @param state - Township state
 * @param civilization - Civilization definition
 * @param dt - Delta time in seconds
 * @returns Array of events generated during this tick
 */
export function tickPopulation(
  state: TownshipState,
  civilization: TownshipCivilizationDefinition,
  dt: number
): TownshipEvent[] {
  const events: TownshipEvent[] = [];

  // Calculate population capacity
  const housingCapacity = calculateHousingCapacity(state);
  const jobCapacity = calculateJobCapacity(state);

  // Calculate growth modifiers
  const housingModifier = calculateHousingModifier(state.population.total, housingCapacity);
  const jobModifier = calculateJobModifier(state.population.employed, jobCapacity);
  const happinessModifier = calculateHappinessModifier(state.metrics.happiness.overall);
  const civModifier = civilization.townshipBonuses.populationGrowth;

  // Base growth rate
  const baseGrowth = TOWNSHIP_CONFIG.BASE_POPULATION_GROWTH;

  // Final growth rate
  const growthRate =
    baseGrowth * housingModifier * jobModifier * (1 + happinessModifier) * civModifier;

  // Update population
  const previousTotal = state.population.total;
  state.population.growthRate = growthRate;
  state.population.total = Math.max(0, state.population.total + growthRate * dt);

  // Update employment and housing
  distributePopulation(state, housingCapacity, jobCapacity);

  // Check for population milestones
  const milestones = [100, 500, 1000, 2500, 5000, 10000];
  for (const milestone of milestones) {
    if (previousTotal < milestone && state.population.total >= milestone) {
      events.push({ type: 'population_milestone', milestone });
    }
  }

  return events;
}

/**
 * Calculate total housing capacity
 *
 * @param state - Township state
 * @returns Number of citizens that can be housed
 */
function calculateHousingCapacity(state: TownshipState): number {
  const residentialZones = state.zones.filter(
    (z) => z.type === 'residential' || z.type === 'mixed'
  );
  return residentialZones.reduce((sum, zone) => sum + zone.capacity, 0);
}

/**
 * Calculate total job capacity
 *
 * @param state - Township state
 * @returns Number of jobs available
 */
function calculateJobCapacity(state: TownshipState): number {
  const jobZones = state.zones.filter(
    (z) => z.type === 'commercial' || z.type === 'industrial' || z.type === 'mixed'
  );
  return jobZones.reduce((sum, zone) => sum + zone.capacity, 0);
}

/**
 * Calculate housing availability modifier
 *
 * More housing = faster growth
 * Full housing = no growth
 * Overcrowding = negative growth
 *
 * @param population - Current population
 * @param capacity - Housing capacity
 * @returns Modifier (0 to 1.5)
 */
function calculateHousingModifier(population: number, capacity: number): number {
  if (capacity === 0) return 0; // No housing = no growth

  const occupancyRatio = population / capacity;

  if (occupancyRatio < 0.5) {
    // Plenty of room - max growth
    return 1.5;
  } else if (occupancyRatio < 0.8) {
    // Moderate occupancy - normal growth
    return 1.0;
  } else if (occupancyRatio < 1.0) {
    // Near capacity - slow growth
    return 0.5;
  } else {
    // Overcrowded - negative growth
    return -0.5;
  }
}

/**
 * Calculate job availability modifier
 *
 * @param employed - Currently employed citizens
 * @param jobCapacity - Available jobs
 * @returns Modifier (0 to 1.2)
 */
function calculateJobModifier(employed: number, jobCapacity: number): number {
  if (jobCapacity === 0) return 0.5; // Limited growth without jobs

  const employmentRatio = employed / jobCapacity;

  if (employmentRatio < 0.7) {
    // Plenty of jobs - strong growth incentive
    return 1.2;
  } else if (employmentRatio < 1.0) {
    // Some jobs available - normal growth
    return 1.0;
  } else {
    // Job market saturated - slightly reduced growth
    return 0.8;
  }
}

/**
 * Calculate happiness modifier for population growth
 *
 * @param happiness - Current happiness (0-100)
 * @returns Modifier (-0.5 to 0.5)
 */
function calculateHappinessModifier(happiness: number): number {
  // Normalize to -0.5 to 0.5 range
  // 50 happiness = 0 modifier (neutral)
  // 100 happiness = +0.5 modifier
  // 0 happiness = -0.5 modifier
  return (happiness - 50) / 100;
}

/**
 * Distribute population to housing and jobs
 *
 * Updates employment and homelessness stats
 *
 * @param state - Township state
 * @param housingCapacity - Total housing available
 * @param jobCapacity - Total jobs available
 */
function distributePopulation(
  state: TownshipState,
  housingCapacity: number,
  jobCapacity: number
): void {
  const { population } = state;

  // Housing assignment
  if (population.total <= housingCapacity) {
    population.homeless = 0;
  } else {
    population.homeless = population.total - housingCapacity;
  }

  // Employment assignment (assume 70% of housed population seeks work)
  const laborForce = Math.floor((population.total - population.homeless) * 0.7);

  if (laborForce <= jobCapacity) {
    population.employed = laborForce;
    population.unemployed = 0;
  } else {
    population.employed = jobCapacity;
    population.unemployed = laborForce - jobCapacity;
  }

  // Distribute population to zones
  distributeToZones(state, housingCapacity, jobCapacity);
}

/**
 * Distribute population across zones
 *
 * Updates zone occupancy
 *
 * @param state - Township state
 * @param housingCapacity - Total housing
 * @param jobCapacity - Total jobs
 */
function distributeToZones(
  state: TownshipState,
  housingCapacity: number,
  jobCapacity: number
): void {
  // Distribute to residential zones
  const residentialZones = state.zones.filter(
    (z) => z.type === 'residential' || z.type === 'mixed'
  );
  let remainingPopulation = state.population.total - state.population.homeless;

  for (const zone of residentialZones) {
    if (remainingPopulation <= 0) {
      zone.occupancy = 0;
      continue;
    }

    const share = zone.capacity / housingCapacity;
    zone.occupancy = Math.min(zone.capacity, Math.floor(remainingPopulation * share));
    remainingPopulation -= zone.occupancy;
  }

  // Distribute to job zones
  const jobZones = state.zones.filter(
    (z) => z.type === 'commercial' || z.type === 'industrial' || z.type === 'mixed'
  );
  let remainingJobs = state.population.employed;

  for (const zone of jobZones) {
    if (remainingJobs <= 0) {
      zone.occupancy = 0;
      continue;
    }

    const share = zone.capacity / jobCapacity;
    zone.occupancy = Math.min(zone.capacity, Math.floor(remainingJobs * share));
    remainingJobs -= zone.occupancy;
  }
}

/**
 * Get population density for a specific zone
 *
 * @param zone - Zone to check
 * @returns Density ratio (0-1)
 */
export function getZoneDensity(zone: import('../../../types.township').Zone): number {
  if (zone.capacity === 0) return 0;
  return zone.occupancy / zone.capacity;
}

/**
 * Check if population has enough housing
 *
 * @param state - Township state
 * @returns True if housing is adequate
 */
export function hasAdequateHousing(state: TownshipState): boolean {
  return state.population.homeless === 0;
}

/**
 * Check if population has enough jobs
 *
 * @param state - Township state
 * @returns True if employment is healthy
 */
export function hasHealthyEmployment(state: TownshipState): boolean {
  const laborForce = state.population.employed + state.population.unemployed;
  if (laborForce === 0) return true;

  const employmentRate = state.population.employed / laborForce;
  return employmentRate >= 0.8; // 80% employment is healthy
}
