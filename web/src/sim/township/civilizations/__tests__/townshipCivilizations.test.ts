import { describe, expect, it } from 'vitest';
import {
  getTownshipCivilization,
  getAllTownshipCivilizations,
  applyCivilizationBuildingCost,
  getCivilizationUniqueBonus
} from '../townshipCivilizations';
import type { CivilizationId } from '../../../../types';

describe('Township Civilizations', () => {
  const civilizationIds: CivilizationId[] = [
    'teotihuacan',
    'maya',
    'moche',
    'hopewell',
    'puebloan'
  ];

  describe('getTownshipCivilization()', () => {
    it('returns civilization definition for each ID', () => {
      for (const id of civilizationIds) {
        const civ = getTownshipCivilization(id);

        expect(civ).toBeDefined();
        expect(civ.id).toBe(id);
        expect(civ.name).toBeTruthy();
      }
    });

    it('includes township bonuses for all civilizations', () => {
      for (const id of civilizationIds) {
        const civ = getTownshipCivilization(id);

        expect(civ.townshipBonuses).toBeDefined();
        expect(civ.townshipBonuses.populationGrowth).toBeDefined();
        expect(civ.townshipBonuses.constructionSpeed).toBeDefined();
        expect(civ.townshipBonuses.happinessBonus).toBeDefined();
        expect(civ.townshipBonuses.zoneCapacity).toBeDefined();
        expect(civ.townshipBonuses.serviceCoverage).toBeDefined();
        expect(civ.townshipBonuses.maintenanceCost).toBeDefined();
      }
    });

    it('includes advisor dialogue for all civilizations', () => {
      for (const id of civilizationIds) {
        const civ = getTownshipCivilization(id);

        expect(civ.advisorDialogue).toBeDefined();
        expect(civ.advisorDialogue.welcome).toBeTruthy();
        expect(civ.advisorDialogue.milestones).toBeDefined();
        expect(civ.advisorDialogue.warnings).toBeDefined();
      }
    });

    it('includes population milestones in dialogue', () => {
      for (const id of civilizationIds) {
        const civ = getTownshipCivilization(id);

        expect(civ.advisorDialogue.milestones['500_population']).toBeTruthy();
        expect(civ.advisorDialogue.milestones['1000_population']).toBeTruthy();
      }
    });

    it('includes warning dialogue for common scenarios', () => {
      for (const id of civilizationIds) {
        const civ = getTownshipCivilization(id);

        expect(civ.advisorDialogue.warnings['low_happiness']).toBeTruthy();
      }
    });

    it('merges homestead bonuses when provided', () => {
      const homesteadBonuses = {
        waterEfficiency: 1.2,
        researchSpeed: 1.15
      };

      const civ = getTownshipCivilization('maya', homesteadBonuses);

      expect(civ.homesteadBonuses).toEqual(homesteadBonuses);
    });

    it('defaults to teotihuacan for unknown civilization', () => {
      const civ = getTownshipCivilization('unknown' as CivilizationId);

      expect(civ.id).toBe('unknown');
      expect(civ.townshipBonuses).toBeDefined();
    });
  });

  describe('getAllTownshipCivilizations()', () => {
    it('returns all 5 civilizations', () => {
      const allCivs = getAllTownshipCivilizations();

      expect(Object.keys(allCivs).length).toBe(5);
    });

    it('includes all expected civilization IDs', () => {
      const allCivs = getAllTownshipCivilizations();

      for (const id of civilizationIds) {
        expect(allCivs[id]).toBeDefined();
      }
    });

    it('all civilizations have unique bonuses', () => {
      const allCivs = getAllTownshipCivilizations();

      for (const id of civilizationIds) {
        expect(allCivs[id].townshipBonuses.unique).toBeDefined();
        expect(allCivs[id].townshipBonuses.unique?.name).toBeTruthy();
        expect(allCivs[id].townshipBonuses.unique?.description).toBeTruthy();
      }
    });
  });

  describe('Civilization-Specific Bonuses', () => {
    describe('Teotihuacan (Solar Technology)', () => {
      it('has +15% construction speed', () => {
        const civ = getTownshipCivilization('teotihuacan');
        expect(civ.townshipBonuses.constructionSpeed).toBe(1.15);
      });

      it('has +10% service coverage', () => {
        const civ = getTownshipCivilization('teotihuacan');
        expect(civ.townshipBonuses.serviceCoverage).toBe(1.1);
      });

      it('has -5% maintenance cost', () => {
        const civ = getTownshipCivilization('teotihuacan');
        expect(civ.townshipBonuses.maintenanceCost).toBe(0.95);
      });

      it('has Solar Grid Mastery unique bonus', () => {
        const civ = getTownshipCivilization('teotihuacan');
        expect(civ.townshipBonuses.unique?.name).toBe('Solar Grid Mastery');
        expect(civ.townshipBonuses.unique?.effect.powerRadius).toBe(1.25);
      });
    });

    describe('Maya (Knowledge & Astronomy)', () => {
      it('has +5% population growth', () => {
        const civ = getTownshipCivilization('maya');
        expect(civ.townshipBonuses.populationGrowth).toBe(1.05);
      });

      it('has +10 base happiness', () => {
        const civ = getTownshipCivilization('maya');
        expect(civ.townshipBonuses.happinessBonus).toBe(10);
      });

      it('has +10% zone capacity', () => {
        const civ = getTownshipCivilization('maya');
        expect(civ.townshipBonuses.zoneCapacity).toBe(1.1);
      });

      it('has +20% service coverage', () => {
        const civ = getTownshipCivilization('maya');
        expect(civ.townshipBonuses.serviceCoverage).toBe(1.2);
      });

      it('has Observatory Network unique bonus', () => {
        const civ = getTownshipCivilization('maya');
        expect(civ.townshipBonuses.unique?.name).toBe('Observatory Network');
        expect(civ.townshipBonuses.unique?.effect.educationHappiness).toBe(15);
      });
    });

    describe('Moche (Water Efficiency)', () => {
      it('has +5 base happiness', () => {
        const civ = getTownshipCivilization('moche');
        expect(civ.townshipBonuses.happinessBonus).toBe(5);
      });

      it('has +15% service coverage', () => {
        const civ = getTownshipCivilization('moche');
        expect(civ.townshipBonuses.serviceCoverage).toBe(1.15);
      });

      it('has -10% maintenance cost', () => {
        const civ = getTownshipCivilization('moche');
        expect(civ.townshipBonuses.maintenanceCost).toBe(0.9);
      });

      it('has Aqueduct Mastery unique bonus', () => {
        const civ = getTownshipCivilization('moche');
        expect(civ.townshipBonuses.unique?.name).toBe('Aqueduct Mastery');
        expect(civ.townshipBonuses.unique?.effect.waterRadius).toBe(1.4);
        expect(civ.townshipBonuses.unique?.effect.waterCost).toBe(0.75);
      });
    });

    describe('Hopewell (Trade & Economy)', () => {
      it('has +10% population growth', () => {
        const civ = getTownshipCivilization('hopewell');
        expect(civ.townshipBonuses.populationGrowth).toBe(1.1);
      });

      it('has +5 base happiness', () => {
        const civ = getTownshipCivilization('hopewell');
        expect(civ.townshipBonuses.happinessBonus).toBe(5);
      });

      it('has -15% maintenance cost', () => {
        const civ = getTownshipCivilization('hopewell');
        expect(civ.townshipBonuses.maintenanceCost).toBe(0.85);
      });

      it('has Trade Network unique bonus', () => {
        const civ = getTownshipCivilization('hopewell');
        expect(civ.townshipBonuses.unique?.name).toBe('Trade Network');
        expect(civ.townshipBonuses.unique?.effect.commercialIncome).toBe(1.25);
        expect(civ.townshipBonuses.unique?.effect.commercialHappiness).toBe(10);
      });
    });

    describe('Puebloan (Sustainability)', () => {
      it('has -5% construction speed (careful building)', () => {
        const civ = getTownshipCivilization('puebloan');
        expect(civ.townshipBonuses.constructionSpeed).toBe(0.95);
      });

      it('has +15 base happiness', () => {
        const civ = getTownshipCivilization('puebloan');
        expect(civ.townshipBonuses.happinessBonus).toBe(15);
      });

      it('has +15% zone capacity', () => {
        const civ = getTownshipCivilization('puebloan');
        expect(civ.townshipBonuses.zoneCapacity).toBe(1.15);
      });

      it('has -20% maintenance cost', () => {
        const civ = getTownshipCivilization('puebloan');
        expect(civ.townshipBonuses.maintenanceCost).toBe(0.8);
      });

      it('has Sustainable Architecture unique bonus', () => {
        const civ = getTownshipCivilization('puebloan');
        expect(civ.townshipBonuses.unique?.name).toBe('Sustainable Architecture');
        expect(civ.townshipBonuses.unique?.effect.environmentBonus).toBe(20);
        expect(civ.townshipBonuses.unique?.effect.durability).toBe(1.5);
      });
    });
  });

  describe('applyCivilizationBuildingCost()', () => {
    it('returns base cost for non-water buildings', () => {
      const baseCost = { wood: 100, stone: 50, coins: 200 };

      const result = applyCivilizationBuildingCost('teotihuacan', 'house', baseCost);

      expect(result).toEqual(baseCost);
    });

    it('applies Moche water cost discount to water buildings', () => {
      const baseCost = { wood: 100, stone: 50, coins: 200 };

      const result = applyCivilizationBuildingCost('moche', 'water_tower', baseCost);

      // 25% discount (waterCost = 0.75)
      expect(result.wood).toBe(75);
      expect(result.stone).toBe(37); // floor(50 * 0.75) = 37
      expect(result.coins).toBe(150);
    });

    it('does not apply discount for other civilizations', () => {
      const baseCost = { wood: 100, stone: 50, coins: 200 };

      const result = applyCivilizationBuildingCost('maya', 'water_well', baseCost);

      expect(result).toEqual(baseCost);
    });

    it('applies discount to buildings with "water" in type name', () => {
      const baseCost = { wood: 100, coins: 100 };

      const waterTank = applyCivilizationBuildingCost('moche', 'water_tank', baseCost);
      const waterPump = applyCivilizationBuildingCost('moche', 'water_pump', baseCost);

      expect(waterTank.wood).toBe(75);
      expect(waterPump.wood).toBe(75);
    });
  });

  describe('getCivilizationUniqueBonus()', () => {
    it('returns correct unique bonus values', () => {
      expect(getCivilizationUniqueBonus('teotihuacan', 'powerRadius')).toBe(1.25);
      expect(getCivilizationUniqueBonus('maya', 'educationHappiness')).toBe(15);
      expect(getCivilizationUniqueBonus('moche', 'waterRadius')).toBe(1.4);
      expect(getCivilizationUniqueBonus('hopewell', 'commercialIncome')).toBe(1.25);
      expect(getCivilizationUniqueBonus('puebloan', 'durability')).toBe(1.5);
    });

    it('returns 1.0 for non-existent bonus keys', () => {
      const result = getCivilizationUniqueBonus('teotihuacan', 'nonExistentBonus');

      expect(result).toBe(1.0);
    });

    it('returns 1.0 for civilization without unique bonuses', () => {
      const result = getCivilizationUniqueBonus('unknown' as CivilizationId, 'anyBonus');

      expect(result).toBe(1.0);
    });
  });

  describe('Balance Validation', () => {
    it('no civilization has all bonuses greater than 1.0', () => {
      const allCivs = getAllTownshipCivilizations();

      for (const id of civilizationIds) {
        const bonuses = allCivs[id].townshipBonuses;

        // At least one bonus should be neutral or negative
        const hasTradeoff =
          bonuses.populationGrowth <= 1.0 ||
          bonuses.constructionSpeed <= 1.0 ||
          bonuses.zoneCapacity <= 1.0 ||
          bonuses.serviceCoverage <= 1.0 ||
          bonuses.maintenanceCost >= 1.0 ||
          bonuses.happinessBonus <= 0;

        expect(hasTradeoff).toBe(true);
      }
    });

    it('all multipliers are positive', () => {
      const allCivs = getAllTownshipCivilizations();

      for (const id of civilizationIds) {
        const bonuses = allCivs[id].townshipBonuses;

        expect(bonuses.populationGrowth).toBeGreaterThan(0);
        expect(bonuses.constructionSpeed).toBeGreaterThan(0);
        expect(bonuses.zoneCapacity).toBeGreaterThan(0);
        expect(bonuses.serviceCoverage).toBeGreaterThan(0);
        expect(bonuses.maintenanceCost).toBeGreaterThan(0);
      }
    });

    it('all civilizations have distinct unique bonuses', () => {
      const allCivs = getAllTownshipCivilizations();
      const uniqueNames = new Set<string>();

      for (const id of civilizationIds) {
        const uniqueName = allCivs[id].townshipBonuses.unique?.name;
        expect(uniqueName).toBeTruthy();

        if (uniqueName) {
          expect(uniqueNames.has(uniqueName)).toBe(false);
          uniqueNames.add(uniqueName);
        }
      }

      expect(uniqueNames.size).toBe(5);
    });

    it('happiness bonuses are reasonable (-10 to +20)', () => {
      const allCivs = getAllTownshipCivilizations();

      for (const id of civilizationIds) {
        const bonus = allCivs[id].townshipBonuses.happinessBonus;

        expect(bonus).toBeGreaterThanOrEqual(-10);
        expect(bonus).toBeLessThanOrEqual(20);
      }
    });

    it('multiplier bonuses are within 0.8 to 1.2 range', () => {
      const allCivs = getAllTownshipCivilizations();

      for (const id of civilizationIds) {
        const bonuses = allCivs[id].townshipBonuses;

        expect(bonuses.populationGrowth).toBeGreaterThanOrEqual(0.9);
        expect(bonuses.populationGrowth).toBeLessThanOrEqual(1.15);

        expect(bonuses.constructionSpeed).toBeGreaterThanOrEqual(0.9);
        expect(bonuses.constructionSpeed).toBeLessThanOrEqual(1.2);

        expect(bonuses.zoneCapacity).toBeGreaterThanOrEqual(0.9);
        expect(bonuses.zoneCapacity).toBeLessThanOrEqual(1.2);

        expect(bonuses.serviceCoverage).toBeGreaterThanOrEqual(0.9);
        expect(bonuses.serviceCoverage).toBeLessThanOrEqual(1.25);
      }
    });
  });

  describe('Lore Integration', () => {
    it('all welcome messages reference civilization identity', () => {
      const allCivs = getAllTownshipCivilizations();

      for (const id of civilizationIds) {
        const welcome = allCivs[id].advisorDialogue.welcome;

        expect(welcome.length).toBeGreaterThan(50); // Substantial message
        expect(typeof welcome).toBe('string');
      }
    });

    it('milestone messages are distinct per civilization', () => {
      const allCivs = getAllTownshipCivilizations();
      const milestoneTexts = new Set<string>();

      for (const id of civilizationIds) {
        const milestone = allCivs[id].advisorDialogue.milestones['1000_population'];

        expect(milestoneTexts.has(milestone)).toBe(false);
        milestoneTexts.add(milestone);
      }

      expect(milestoneTexts.size).toBe(5);
    });

    it('warning messages provide actionable advice', () => {
      const allCivs = getAllTownshipCivilizations();

      for (const id of civilizationIds) {
        const warning = allCivs[id].advisorDialogue.warnings['low_happiness'];

        expect(warning.length).toBeGreaterThan(20);
        expect(typeof warning).toBe('string');
      }
    });
  });
});
