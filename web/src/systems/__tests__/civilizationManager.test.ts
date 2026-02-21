import { describe, expect, it } from 'vitest';
import { CivilizationManager, createCivilizationManager } from '../civilizationManager';
import type { CivilizationDefinition, CivilizationsTable } from '../../types';

const mockCivilizations: CivilizationsTable = {
  testCiv: {
    name: 'Test Civilization',
    displayName: 'Test',
    tagline: 'For testing',
    description: 'A civilization for testing purposes',
    bonuses: {
      solarEnergy: 1.15,
      research: 1.1,
      waterEfficiency: 1.2
    },
    aesthetics: {
      primaryColor: '#FF0000',
      secondaryColor: '#00FF00',
      accentColor: '#0000FF',
      pattern: 'test_pattern',
      architecture: 'test_style'
    },
    festivals: [],
    loreSnippet: 'Test lore'
  },
  noBonusCiv: {
    name: 'No Bonus Civilization',
    displayName: 'No Bonus',
    tagline: 'No bonuses',
    description: 'A civilization with no bonuses',
    bonuses: {},
    aesthetics: {
      primaryColor: '#FFFFFF',
      secondaryColor: '#000000',
      accentColor: '#888888',
      pattern: 'none',
      architecture: 'plain'
    },
    festivals: [],
    loreSnippet: 'No bonus lore'
  }
};

describe('CivilizationManager', () => {
  describe('constructor', () => {
    it('creates instance with valid civilization definition', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);
      expect(manager).toBeInstanceOf(CivilizationManager);
    });

    it('stores civilization definition', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);
      const aesthetics = manager.getAesthetics();
      expect(aesthetics.primaryColor).toBe('#FF0000');
    });
  });

  describe('getBonusMultiplier', () => {
    it('returns correct multiplier for existing bonus', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);
      expect(manager.getBonusMultiplier('solarEnergy')).toBe(1.15);
      expect(manager.getBonusMultiplier('research')).toBe(1.1);
      expect(manager.getBonusMultiplier('waterEfficiency')).toBe(1.2);
    });

    it('returns 1.0 for non-existent bonus', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);
      expect(manager.getBonusMultiplier('tradeEfficiency')).toBe(1.0);
      expect(manager.getBonusMultiplier('buildingDurability')).toBe(1.0);
    });

    it('returns 1.0 for civilization with no bonuses', () => {
      const manager = new CivilizationManager(mockCivilizations.noBonusCiv);
      expect(manager.getBonusMultiplier('solarEnergy')).toBe(1.0);
      expect(manager.getBonusMultiplier('research')).toBe(1.0);
    });
  });

  describe('applyBonus', () => {
    it('correctly applies bonus to base value', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);

      // 100 * 1.15 = 115
      expect(manager.applyBonus('solarEnergy', 100)).toBe(115);

      // 50 * 1.10 = 55
      expect(manager.applyBonus('research', 50)).toBe(55);

      // 200 * 1.20 = 240
      expect(manager.applyBonus('waterEfficiency', 200)).toBe(240);
    });

    it('returns base value when bonus does not exist', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);

      // No tradeEfficiency bonus, so 100 * 1.0 = 100
      expect(manager.applyBonus('tradeEfficiency', 100)).toBe(100);
    });

    it('handles zero and negative base values correctly', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);

      expect(manager.applyBonus('solarEnergy', 0)).toBe(0);
      expect(manager.applyBonus('solarEnergy', -50)).toBe(-57.5);
    });

    it('handles decimal base values correctly', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);

      // 10.5 * 1.15 = 12.075
      expect(manager.applyBonus('solarEnergy', 10.5)).toBeCloseTo(12.075, 3);
    });

    it('applies no bonus for civilization with empty bonuses object', () => {
      const manager = new CivilizationManager(mockCivilizations.noBonusCiv);

      expect(manager.applyBonus('solarEnergy', 100)).toBe(100);
      expect(manager.applyBonus('research', 50)).toBe(50);
    });
  });

  describe('hasBonus', () => {
    it('returns true for existing bonuses', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);

      expect(manager.hasBonus('solarEnergy')).toBe(true);
      expect(manager.hasBonus('research')).toBe(true);
      expect(manager.hasBonus('waterEfficiency')).toBe(true);
    });

    it('returns false for non-existent bonuses', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);

      expect(manager.hasBonus('tradeEfficiency')).toBe(false);
      expect(manager.hasBonus('buildingDurability')).toBe(false);
    });

    it('returns false for all bonuses when civilization has none', () => {
      const manager = new CivilizationManager(mockCivilizations.noBonusCiv);

      expect(manager.hasBonus('solarEnergy')).toBe(false);
      expect(manager.hasBonus('research')).toBe(false);
    });
  });

  describe('getAllBonuses', () => {
    it('returns copy of all bonuses', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);
      const bonuses = manager.getAllBonuses();

      expect(bonuses).toEqual({
        solarEnergy: 1.15,
        research: 1.1,
        waterEfficiency: 1.2
      });
    });

    it('returned object is a copy, not a reference', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);
      const bonuses = manager.getAllBonuses();

      // Modify the returned object
      bonuses.solarEnergy = 2.0;

      // Original should be unchanged
      expect(manager.getBonusMultiplier('solarEnergy')).toBe(1.15);
    });

    it('returns empty object for civilization with no bonuses', () => {
      const manager = new CivilizationManager(mockCivilizations.noBonusCiv);
      const bonuses = manager.getAllBonuses();

      expect(bonuses).toEqual({});
      expect(Object.keys(bonuses)).toHaveLength(0);
    });
  });

  describe('getAesthetics', () => {
    it('returns all aesthetic properties', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);
      const aesthetics = manager.getAesthetics();

      expect(aesthetics).toEqual({
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
        accentColor: '#0000FF',
        pattern: 'test_pattern',
        architecture: 'test_style'
      });
    });

    it('returned object is a copy, not a reference', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);
      const aesthetics = manager.getAesthetics();

      // Modify the returned object
      aesthetics.primaryColor = '#000000';

      // Original should be unchanged
      expect(manager.getAesthetics().primaryColor).toBe('#FF0000');
    });
  });

  describe('getBonusDescriptions', () => {
    it('returns formatted descriptions for all bonuses', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);
      const descriptions = manager.getBonusDescriptions();

      expect(descriptions).toHaveLength(3);

      // Check solarEnergy description
      const solarDesc = descriptions.find((d) => d.name === 'Solar Energy');
      expect(solarDesc).toBeDefined();
      expect(solarDesc?.value).toBe('+15%');

      // Check research description
      const researchDesc = descriptions.find((d) => d.name === 'Research');
      expect(researchDesc).toBeDefined();
      expect(researchDesc?.value).toBe('+10%');

      // Check waterEfficiency description
      const waterDesc = descriptions.find((d) => d.name === 'Water Efficiency');
      expect(waterDesc).toBeDefined();
      expect(waterDesc?.value).toBe('+20%');
    });

    it('returns empty array for civilization with no bonuses', () => {
      const manager = new CivilizationManager(mockCivilizations.noBonusCiv);
      const descriptions = manager.getBonusDescriptions();

      expect(descriptions).toHaveLength(0);
    });

    it('formats bonus names with proper capitalization', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);
      const descriptions = manager.getBonusDescriptions();

      descriptions.forEach((desc) => {
        // Should be properly capitalized (e.g., "Solar Energy", not "solarenergy")
        expect(desc.name).toMatch(/^[A-Z]/);
        expect(desc.name).not.toMatch(/[a-z][A-Z]/); // No camelCase remnants
      });
    });

    it('formats percentages correctly', () => {
      const manager = new CivilizationManager(mockCivilizations.testCiv);
      const descriptions = manager.getBonusDescriptions();

      descriptions.forEach((desc) => {
        // Should be in format "+X%" or "-X%"
        expect(desc.value).toMatch(/^[+-]\d+%$/);
      });
    });
  });
});

describe('createCivilizationManager', () => {
  it('creates manager for valid civilization ID', () => {
    const manager = createCivilizationManager('testCiv', mockCivilizations);
    expect(manager).toBeInstanceOf(CivilizationManager);
  });

  it('throws error for invalid civilization ID', () => {
    expect(() => {
      createCivilizationManager('invalidCiv', mockCivilizations);
    }).toThrow('Civilization invalidCiv not found');
  });

  it('throws error for empty civilization ID', () => {
    expect(() => {
      createCivilizationManager('', mockCivilizations);
    }).toThrow('Civilization  not found');
  });

  it('created manager has correct bonuses', () => {
    const manager = createCivilizationManager('testCiv', mockCivilizations);
    expect(manager.getBonusMultiplier('solarEnergy')).toBe(1.15);
  });
});

describe('CivilizationManager integration', () => {
  it('water efficiency bonus reduces consumption (used as divisor)', () => {
    const manager = new CivilizationManager(mockCivilizations.testCiv);
    const baseConsumption = 100;
    const waterEfficiency = manager.getBonusMultiplier('waterEfficiency');

    // With 1.20 water efficiency, consumption should be reduced to 100 / 1.20 = 83.33
    const actualConsumption = baseConsumption / waterEfficiency;
    expect(actualConsumption).toBeCloseTo(83.33, 2);
  });

  it('production bonuses increase output (used as multiplier)', () => {
    const manager = new CivilizationManager(mockCivilizations.testCiv);
    const baseProduction = 100;

    // Solar energy bonus increases production
    const solarProduction = manager.applyBonus('solarEnergy', baseProduction);
    expect(solarProduction).toBe(115);

    // Research bonus increases research speed
    const researchSpeed = manager.applyBonus('research', baseProduction);
    expect(researchSpeed).toBe(110);
  });

  it('chaining multiple bonuses works correctly', () => {
    const manager = new CivilizationManager(mockCivilizations.testCiv);
    let value = 100;

    // Apply solar energy bonus
    value = manager.applyBonus('solarEnergy', value);
    expect(value).toBe(115);

    // Apply research bonus
    value = manager.applyBonus('research', value);
    expect(value).toBeCloseTo(126.5, 1);
  });
});
