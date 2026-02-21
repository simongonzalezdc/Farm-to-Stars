/**
 * Zone Growth System
 *
 * Zones mature over time based on:
 * - Demand for that zone type
 * - Service coverage
 * - Civilization bonuses
 *
 * Mature zones can hold more population/workers.
 */

import type {
  TownshipState,
  Zone,
  TownshipEvent,
  TownshipCivilizationDefinition,
  BuildingsTable
} from '../../../types.township';
import { TOWNSHIP_CONFIG } from '../../../types.township';

/**
 * Tick zone growth system
 *
 * @param state - Township state
 * @param civilization - Civilization definition
 * @param buildings - Building definitions table
 * @param dt - Delta time in seconds
 * @returns Array of events generated during this tick
 */
export function tickZoneGrowth(
  state: TownshipState,
  civilization: TownshipCivilizationDefinition,
  buildings: BuildingsTable,
  dt: number
): TownshipEvent[] {
  const events: TownshipEvent[] = [];

  for (const zone of state.zones) {
    // Skip fully mature zones
    if (zone.maturity >= 1.0) continue;

    // Calculate growth modifiers
    const demandModifier = getDemandModifier(state, zone);
    const serviceModifier = getServiceModifier(state, zone);
    const civModifier = civilization.townshipBonuses.zoneCapacity;

    // Base growth rate affected by modifiers
    const growthRate =
      TOWNSHIP_CONFIG.BASE_ZONE_GROWTH * (1 + demandModifier) * serviceModifier * civModifier;

    // Update maturity
    const previousMaturity = zone.maturity;
    zone.maturity = Math.min(1.0, zone.maturity + growthRate * dt);

    // Update capacity based on maturity
    const maxCapacity = getMaxZoneCapacity(zone);
    zone.capacity = Math.floor(zone.maturity * maxCapacity);

    // Emit event if zone just matured
    if (previousMaturity < 1.0 && zone.maturity >= 1.0) {
      events.push({ type: 'zone_matured', zone });
    }
  }

  return events;
}

/**
 * Get demand modifier for zone growth
 *
 * High demand = faster growth
 * Low demand = slower/negative growth
 *
 * @param state - Township state
 * @param zone - Zone to check
 * @returns Modifier value (-1 to 1)
 */
function getDemandModifier(state: TownshipState, zone: Zone): number {
  const demand = state.metrics.demand[zone.type];

  // Positive demand accelerates growth
  // Negative demand slows or reverses growth
  return demand;
}

/**
 * Get service modifier for zone growth
 *
 * Zones with good service coverage grow faster
 *
 * @param state - Township state
 * @param zone - Zone to check
 * @returns Modifier value (0.5 to 1.5)
 */
function getServiceModifier(state: TownshipState, zone: Zone): number {
  let modifier = 1.0;

  // Power and water are essential
  if (zone.services.power) modifier += 0.2;
  if (zone.services.water) modifier += 0.2;

  // Safety and education boost growth
  if (zone.services.safety) modifier += 0.05;
  if (zone.services.education) modifier += 0.05;

  // Minimum modifier is 0.5 (slow growth even without services)
  return Math.max(0.5, Math.min(1.5, modifier));
}

/**
 * Get maximum capacity for a zone based on level
 *
 * @param zone - Zone to check
 * @returns Maximum occupancy
 */
function getMaxZoneCapacity(zone: Zone): number {
  const baseCapacity = 100; // Base capacity for level 1
  const levelMultiplier = TOWNSHIP_CONFIG.CAPACITY_MULTIPLIER[zone.level] ?? 1.0;

  return baseCapacity * levelMultiplier;
}

/**
 * Create a new zone
 *
 * @param type - Zone type
 * @param position - Grid position
 * @param size - Zone dimensions
 * @returns New zone instance
 */
export function createZone(
  type: Zone['type'],
  position: { x: number; y: number },
  size: { width: number; height: number } = { width: 4, height: 4 }
): Zone {
  return {
    id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    position,
    size,

    maturity: 0,
    level: 1, // Start at low density

    occupancy: 0,
    capacity: 0,

    happiness: 50, // Neutral starting happiness
    demand: 0,

    services: {
      power: false,
      water: false,
      safety: false,
      education: false
    }
  };
}

/**
 * Upgrade zone to next level (increase density)
 *
 * @param zone - Zone to upgrade
 * @returns True if upgraded, false if already max level
 */
export function upgradeZone(zone: Zone): boolean {
  if (zone.level >= TOWNSHIP_CONFIG.ZONE_LEVEL_HIGH) {
    return false; // Already max level
  }

  zone.level += 1;
  zone.maturity = 0; // Reset maturity for new level
  zone.capacity = 0;

  return true;
}

/**
 * Check if zone can be upgraded
 *
 * @param zone - Zone to check
 * @returns True if upgrade is available
 */
export function canUpgradeZone(zone: Zone): boolean {
  return (
    zone.level < TOWNSHIP_CONFIG.ZONE_LEVEL_HIGH &&
    zone.maturity >= 1.0 && // Must be fully mature
    zone.services.power && // Requires power
    zone.services.water // Requires water
  );
}
