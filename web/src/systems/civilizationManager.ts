import type {
  CivilizationAesthetics,
  CivilizationBonuses,
  CivilizationDefinition,
  CivilizationId
} from '../types';

/**
 * Manages civilization bonuses and applies them to gameplay systems.
 * Centralizes all bonus application logic to ensure consistency.
 */
export class CivilizationManager {
  private civilization: CivilizationDefinition;

  constructor(civilization: CivilizationDefinition) {
    this.civilization = civilization;
  }

  /**
   * Get the civilization ID
   */
  get id(): CivilizationId {
    return this.civilization.id;
  }

  /**
   * Get the civilization name
   */
  get name(): string {
    return this.civilization.name;
  }

  /**
   * Apply a bonus multiplier to a base value
   * @param bonusType - The type of bonus to apply (e.g., 'solarEnergy', 'research')
   * @param baseValue - The base value before bonus
   * @returns The value after applying the bonus multiplier
   */
  applyBonus(bonusType: keyof CivilizationBonuses, baseValue: number): number {
    const multiplier = this.civilization.bonuses[bonusType] ?? 1.0;
    return baseValue * multiplier;
  }

  /**
   * Get the raw bonus multiplier for a specific type
   * @param bonusType - The type of bonus
   * @returns The multiplier (1.0 = no bonus, 1.15 = +15%)
   */
  getBonusMultiplier(bonusType: keyof CivilizationBonuses): number {
    return this.civilization.bonuses[bonusType] ?? 1.0;
  }

  /**
   * Check if this civilization has a specific bonus
   */
  hasBonus(bonusType: keyof CivilizationBonuses): boolean {
    return this.civilization.bonuses[bonusType] !== undefined;
  }

  /**
   * Get all active bonuses for this civilization
   * @returns A copy of the bonuses object
   */
  getAllBonuses(): CivilizationBonuses {
    return { ...this.civilization.bonuses };
  }

  /**
   * Get civilization aesthetics for UI theming
   * @returns A copy of the aesthetics object
   */
  getAesthetics(): CivilizationAesthetics {
    return { ...this.civilization.aesthetics };
  }

  /**
   * Get a formatted description of all bonuses for UI display
   * @returns Array of bonus descriptions
   */
  getBonusDescriptions(): Array<{ name: string; value: string }> {
    return Object.entries(this.civilization.bonuses).map(([key, value]) => ({
      name: this.formatBonusName(key),
      value: `+${((value - 1) * 100).toFixed(0)}%`
    }));
  }

  /**
   * Format a bonus key for display
   * Converts camelCase to Title Case with spaces
   */
  private formatBonusName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}

/**
 * Create a CivilizationManager from a civilization ID and table
 */
export function createCivilizationManager(
  civilizationId: CivilizationId,
  civilizations: Record<CivilizationId, CivilizationDefinition>
): CivilizationManager {
  const civilization = civilizations[civilizationId];
  if (!civilization) {
    throw new Error(`Unknown civilization ID: ${civilizationId}`);
  }
  return new CivilizationManager(civilization);
}
