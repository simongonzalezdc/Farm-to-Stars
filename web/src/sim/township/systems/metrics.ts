/**
 * Township Metrics Systems
 *
 * Calculates happiness, demand curves, and service coverage.
 * These metrics drive player feedback and simulation dynamics.
 */

import type {
  TownshipState,
  TownshipMetrics,
  HappinessFactor,
  TownshipCivilizationDefinition,
  BuildingsTable,
  Building,
  Zone
} from '../../../types.township';
import { TOWNSHIP_CONFIG } from '../../../types.township';

// ============================================================================
// Happiness Calculator
// ============================================================================

/**
 * Calculate overall district happiness
 *
 * Multi-factor system weighing:
 * - Housing availability
 * - Employment rate
 * - Service coverage
 * - Environment quality
 * - Civilization bonuses
 *
 * @param state - Township state
 * @param civilization - Civilization definition
 * @returns Happiness metrics
 */
export function calculateHappiness(
  state: TownshipState,
  civilization: TownshipCivilizationDefinition
): TownshipMetrics['happiness'] {
  const factors: HappinessFactor[] = [];

  // Housing factor: Homelessness penalty
  if (state.population.total > 0) {
    const homelessRatio = state.population.homeless / state.population.total;
    factors.push({
      category: 'housing',
      name: 'Housing Availability',
      value: -50 * homelessRatio,
      weight: 2.0
    });
  }

  // Employment factor: Unemployment penalty
  const laborForce = state.population.employed + state.population.unemployed;
  if (laborForce > 0) {
    const unemploymentRatio = state.population.unemployed / laborForce;
    factors.push({
      category: 'employment',
      name: 'Employment Rate',
      value: -40 * unemploymentRatio,
      weight: 1.5
    });
  }

  // Services factor: Coverage bonuses
  const avgServiceCoverage =
    (state.metrics.coverage.power +
      state.metrics.coverage.water +
      state.metrics.coverage.safety +
      state.metrics.coverage.education) /
    4;

  factors.push({
    category: 'services',
    name: 'Public Services',
    value: 30 * avgServiceCoverage,
    weight: 1.0
  });

  // Environment factor: Pollution/beauty (future: industrial zones create pollution)
  const industrialZones = state.zones.filter(z => z.type === 'industrial').length;
  const totalZones = state.zones.length || 1;
  const industrialRatio = industrialZones / totalZones;

  if (industrialRatio > 0.3) {
    // Too much industry reduces happiness
    factors.push({
      category: 'environment',
      name: 'Environmental Quality',
      value: -20 * (industrialRatio - 0.3),
      weight: 0.8
    });
  }

  // Civilization-specific bonuses
  const civBonus = civilization.townshipBonuses.happinessBonus;
  if (civBonus !== 0) {
    factors.push({
      category: 'civilization',
      name: `${civilization.name} Cultural Bonus`,
      value: civBonus,
      weight: 1.0
    });
  }

  // Calculate weighted average
  const totalWeight = factors.reduce((sum, f) => sum + Math.abs(f.weight), 0);
  const weightedSum = factors.reduce((sum, f) => sum + f.value * f.weight, 0);

  // Base happiness is 50, modified by factors
  let overall = 50;
  if (totalWeight > 0) {
    overall += weightedSum / totalWeight;
  }

  return {
    overall: Math.max(0, Math.min(100, overall)),
    factors
  };
}

// ============================================================================
// Demand Calculator
// ============================================================================

/**
 * Calculate RCI (Residential/Commercial/Industrial) demand
 *
 * Based on SimCity model:
 * - Balance of existing zones affects demand
 * - Population needs drive residential demand
 * - Jobs drive commercial/industrial demand
 *
 * @param state - Township state
 * @returns Demand metrics (-1 to 1 for each zone type)
 */
export function calculateDemand(state: TownshipState): TownshipMetrics['demand'] {
  const { zones, population } = state;

  // Count zones by type
  const residential = zones.filter(z => z.type === 'residential').length;
  const commercial = zones.filter(z => z.type === 'commercial').length;
  const industrial = zones.filter(z => z.type === 'industrial').length;
  const total = residential + commercial + industrial || 1;

  // Ideal distribution (can be customized per civilization)
  const idealResidential = total * TOWNSHIP_CONFIG.IDEAL_DISTRIBUTION.residential;
  const idealCommercial = total * TOWNSHIP_CONFIG.IDEAL_DISTRIBUTION.commercial;
  const idealIndustrial = total * TOWNSHIP_CONFIG.IDEAL_DISTRIBUTION.industrial;

  // Base demand from ideal distribution
  let resDemand = calculateDeviationDemand(residential, idealResidential);
  let comDemand = calculateDeviationDemand(commercial, idealCommercial);
  let indDemand = calculateDeviationDemand(industrial, idealIndustrial);

  // Adjust residential demand based on housing needs
  const housingCapacity = zones
    .filter(z => z.type === 'residential')
    .reduce((sum, z) => sum + z.capacity, 0);

  if (population.total > housingCapacity * 0.8) {
    // Near capacity - high demand
    resDemand = Math.max(resDemand, 0.5);
  }

  // Adjust commercial/industrial demand based on employment needs
  const jobCapacity = zones
    .filter(z => z.type === 'commercial' || z.type === 'industrial')
    .reduce((sum, z) => sum + z.capacity, 0);

  const laborForce = population.employed + population.unemployed;
  if (laborForce > jobCapacity * 0.8) {
    // Need more jobs
    comDemand = Math.max(comDemand, 0.3);
    indDemand = Math.max(indDemand, 0.3);
  }

  return {
    residential: Math.max(-1, Math.min(1, resDemand)),
    commercial: Math.max(-1, Math.min(1, comDemand)),
    industrial: Math.max(-1, Math.min(1, indDemand))
  };
}

/**
 * Calculate demand based on deviation from ideal
 *
 * @param actual - Current count
 * @param ideal - Ideal count
 * @returns Demand (-1 to 1)
 */
function calculateDeviationDemand(actual: number, ideal: number): number {
  if (ideal === 0) return 0;

  // Positive demand when below ideal
  // Negative demand when above ideal
  const deviation = (ideal - actual) / ideal;
  return Math.max(-1, Math.min(1, deviation));
}

// ============================================================================
// Service Coverage Calculator
// ============================================================================

/**
 * Calculate service coverage metrics
 *
 * For each service type, calculate % of zones within range of a provider
 *
 * @param state - Township state
 * @param buildings - Building definitions
 * @param civilization - Civilization definition
 * @returns Coverage metrics (0-1 for each service)
 */
export function calculateCoverage(
  state: TownshipState,
  buildings: BuildingsTable,
  civilization: TownshipCivilizationDefinition
): TownshipMetrics['coverage'] {
  const { zones } = state;

  if (zones.length === 0) {
    return {
      power: 0,
      water: 0,
      safety: 0,
      education: 0
    };
  }

  // Update zone service flags based on nearby buildings
  updateZoneServiceFlags(state, buildings, civilization);

  // Calculate coverage percentages
  const powerCoverage = zones.filter(z => z.services.power).length / zones.length;
  const waterCoverage = zones.filter(z => z.services.water).length / zones.length;
  const safetyCoverage = zones.filter(z => z.services.safety).length / zones.length;
  const educationCoverage = zones.filter(z => z.services.education).length / zones.length;

  return {
    power: powerCoverage,
    water: waterCoverage,
    safety: safetyCoverage,
    education: educationCoverage
  };
}

/**
 * Update zone service flags based on nearby buildings
 *
 * @param state - Township state
 * @param buildings - Building definitions
 * @param civilization - Civilization definition
 */
function updateZoneServiceFlags(
  state: TownshipState,
  buildings: BuildingsTable,
  civilization: TownshipCivilizationDefinition
): void {
  // Reset all service flags
  for (const zone of state.zones) {
    zone.services.power = false;
    zone.services.water = false;
    zone.services.safety = false;
    zone.services.education = false;
  }

  // Check each building
  for (const building of state.buildings) {
    if (!building.operational) continue; // Skip non-operational buildings

    const def = buildings[building.definitionId];
    if (!def.provides || def.provides.length === 0) continue;

    // Calculate effective service radius (with civilization bonus)
    const baseRadius = building.serviceRadius;
    const effectiveRadius = baseRadius * civilization.townshipBonuses.serviceCoverage;

    // Find zones within range
    const zonesInRange = findZonesInRadius(
      state.zones,
      building.position,
      effectiveRadius
    );

    // Apply services to zones
    for (const zone of zonesInRange) {
      for (const service of def.provides) {
        if (service === 'power') zone.services.power = true;
        if (service === 'water') zone.services.water = true;
        if (service === 'safety') zone.services.safety = true;
        if (service === 'education') zone.services.education = true;
      }
    }
  }
}

/**
 * Find zones within radius of a point
 *
 * @param zones - All zones
 * @param center - Center point
 * @param radius - Search radius in tiles
 * @returns Zones within radius
 */
function findZonesInRadius(
  zones: Zone[],
  center: { x: number; y: number },
  radius: number
): Zone[] {
  return zones.filter(zone => {
    // Calculate distance from center to zone center
    const zoneCenterX = zone.position.x + zone.size.width / 2;
    const zoneCenterY = zone.position.y + zone.size.height / 2;

    const dx = zoneCenterX - center.x;
    const dy = zoneCenterY - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= radius;
  });
}

/**
 * Check if a zone is adequately served
 *
 * @param zone - Zone to check
 * @returns True if zone has essential services
 */
export function isZoneAdequatelyServed(zone: Zone): boolean {
  // Essential services: power and water
  return zone.services.power && zone.services.water;
}

/**
 * Get happiness impact for a zone
 *
 * Zones with good services contribute more to happiness
 *
 * @param zone - Zone to check
 * @returns Happiness contribution
 */
export function getZoneHappinessContribution(zone: Zone): number {
  let contribution = 0;

  if (zone.services.power) contribution += 5;
  if (zone.services.water) contribution += 5;
  if (zone.services.safety) contribution += 3;
  if (zone.services.education) contribution += 2;

  return contribution;
}
