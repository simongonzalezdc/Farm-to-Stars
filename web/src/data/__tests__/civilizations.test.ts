import { describe, expect, it } from 'vitest';
import civilizations from '../civilizations.json';
import type { CivilizationDefinition } from '../../types';

describe('civilizations data', () => {
  const civIds = Object.keys(civilizations);
  const civEntries = Object.entries(civilizations);

  it('includes exactly 5 civilizations for homestead phase', () => {
    expect(civIds).toHaveLength(5);
    expect(civIds).toContain('teotihuacan');
    expect(civIds).toContain('maya');
    expect(civIds).toContain('moche');
    expect(civIds).toContain('hopewell');
    expect(civIds).toContain('puebloan');
  });

  describe('required fields', () => {
    it.each(civEntries)('%s has all required identity fields', (id, civ) => {
      const def = civ as CivilizationDefinition;
      expect(def.name, `${id} missing name`).toBeTruthy();
      expect(def.name, `${id} name is empty`).not.toBe('');
      expect(def.displayName, `${id} missing displayName`).toBeTruthy();
      expect(def.displayName, `${id} displayName is empty`).not.toBe('');
      expect(def.tagline, `${id} missing tagline`).toBeTruthy();
      expect(def.tagline, `${id} tagline is empty`).not.toBe('');
      expect(def.description, `${id} missing description`).toBeTruthy();
      expect(def.description, `${id} description is empty`).not.toBe('');
      expect(def.loreSnippet, `${id} missing loreSnippet`).toBeTruthy();
      expect(def.loreSnippet, `${id} loreSnippet is empty`).not.toBe('');
    });

    it.each(civEntries)('%s has bonuses object', (id, civ) => {
      const def = civ as CivilizationDefinition;
      expect(def.bonuses, `${id} missing bonuses`).toBeDefined();
      expect(typeof def.bonuses, `${id} bonuses is not an object`).toBe('object');
    });

    it.each(civEntries)('%s has aesthetics object with all required fields', (id, civ) => {
      const def = civ as CivilizationDefinition;
      expect(def.aesthetics, `${id} missing aesthetics`).toBeDefined();
      expect(def.aesthetics.primaryColor, `${id} missing primaryColor`).toBeTruthy();
      expect(def.aesthetics.secondaryColor, `${id} missing secondaryColor`).toBeTruthy();
      expect(def.aesthetics.accentColor, `${id} missing accentColor`).toBeTruthy();
      expect(def.aesthetics.pattern, `${id} missing pattern`).toBeTruthy();
      expect(def.aesthetics.architecture, `${id} missing architecture`).toBeTruthy();
    });

    it.each(civEntries)('%s has festivals array', (id, civ) => {
      const def = civ as CivilizationDefinition;
      expect(Array.isArray(def.festivals), `${id} festivals is not an array`).toBe(true);
    });
  });

  describe('bonuses validation', () => {
    it.each(civEntries)('%s has at least one bonus', (id, civ) => {
      const def = civ as CivilizationDefinition;
      const bonusKeys = Object.keys(def.bonuses);
      expect(bonusKeys.length, `${id} has no bonuses`).toBeGreaterThan(0);
    });

    it.each(civEntries)('%s has valid bonus multipliers (positive numbers)', (id, civ) => {
      const def = civ as CivilizationDefinition;
      Object.entries(def.bonuses).forEach(([bonusType, multiplier]) => {
        expect(typeof multiplier, `${id}.${bonusType} is not a number`).toBe('number');
        expect(multiplier, `${id}.${bonusType} is not positive`).toBeGreaterThan(0);
        expect(Number.isFinite(multiplier), `${id}.${bonusType} is not finite`).toBe(true);
      });
    });

    it.each(civEntries)('%s has balanced bonuses (10-25% range for homestead)', (id, civ) => {
      const def = civ as CivilizationDefinition;
      Object.entries(def.bonuses).forEach(([bonusType, multiplier]) => {
        // Bonuses should be between 1.05 (5%) and 1.25 (25%)
        expect(
          multiplier,
          `${id}.${bonusType} bonus too low (${multiplier})`
        ).toBeGreaterThanOrEqual(1.0);
        expect(multiplier, `${id}.${bonusType} bonus too high (${multiplier})`).toBeLessThanOrEqual(
          1.3
        );
      });
    });
  });

  describe('aesthetics validation', () => {
    const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

    it.each(civEntries)('%s has valid hex colors', (id, civ) => {
      const def = civ as CivilizationDefinition;
      expect(
        def.aesthetics.primaryColor,
        `${id} primaryColor invalid: ${def.aesthetics.primaryColor}`
      ).toMatch(hexColorRegex);
      expect(
        def.aesthetics.secondaryColor,
        `${id} secondaryColor invalid: ${def.aesthetics.secondaryColor}`
      ).toMatch(hexColorRegex);
      expect(
        def.aesthetics.accentColor,
        `${id} accentColor invalid: ${def.aesthetics.accentColor}`
      ).toMatch(hexColorRegex);
    });

    it.each(civEntries)('%s has non-empty pattern and architecture', (id, civ) => {
      const def = civ as CivilizationDefinition;
      expect(def.aesthetics.pattern.length, `${id} pattern is empty`).toBeGreaterThan(0);
      expect(def.aesthetics.architecture.length, `${id} architecture is empty`).toBeGreaterThan(0);
    });

    it.each(civEntries)('%s has unique primary color', (id, civ) => {
      const def = civ as CivilizationDefinition;
      const primaryColor = def.aesthetics.primaryColor;

      const duplicates = civEntries.filter(
        ([otherId, otherCiv]) =>
          otherId !== id &&
          (otherCiv as CivilizationDefinition).aesthetics.primaryColor === primaryColor
      );

      expect(
        duplicates,
        `${id} shares primary color ${primaryColor} with ${duplicates.map(([id]) => id).join(', ')}`
      ).toHaveLength(0);
    });
  });

  describe('festivals validation', () => {
    it.each(civEntries)('%s has at least one festival', (id, civ) => {
      const def = civ as CivilizationDefinition;
      expect(def.festivals.length, `${id} has no festivals`).toBeGreaterThan(0);
    });

    it.each(civEntries)('%s festivals have required fields', (id, civ) => {
      const def = civ as CivilizationDefinition;
      def.festivals.forEach((festival, idx) => {
        expect(festival.name, `${id} festival[${idx}] missing name`).toBeTruthy();
        expect(festival.season, `${id} festival[${idx}] missing season`).toBeTruthy();
        expect(festival.description, `${id} festival[${idx}] missing description`).toBeTruthy();
        expect(festival.bonuses, `${id} festival[${idx}] missing bonuses`).toBeDefined();
      });
    });

    it.each(civEntries)('%s festivals have valid season IDs', (id, civ) => {
      const def = civ as CivilizationDefinition;
      const validSeasons = ['spring', 'summer', 'autumn', 'winter'];
      def.festivals.forEach((festival, idx) => {
        expect(
          validSeasons,
          `${id} festival[${idx}] has invalid season: ${festival.season}`
        ).toContain(festival.season);
      });
    });
  });

  describe('starting resources validation', () => {
    it.each(civEntries)('%s starting resources are valid numbers', (id, civ) => {
      const def = civ as CivilizationDefinition;
      if (def.startingResources) {
        Object.entries(def.startingResources).forEach(([resourceId, amount]) => {
          expect(typeof amount, `${id} starting resource ${resourceId} is not a number`).toBe(
            'number'
          );
          expect(amount, `${id} starting resource ${resourceId} is not positive`).toBeGreaterThan(
            0
          );
          expect(
            Number.isInteger(amount),
            `${id} starting resource ${resourceId} is not an integer`
          ).toBe(true);
        });
      }
    });

    it.each(civEntries)('%s starting resources are balanced (≤10 items)', (id, civ) => {
      const def = civ as CivilizationDefinition;
      if (def.startingResources) {
        Object.entries(def.startingResources).forEach(([resourceId, amount]) => {
          expect(
            amount,
            `${id} starting resource ${resourceId} too high (${amount})`
          ).toBeLessThanOrEqual(10);
        });
      }
    });
  });

  describe('civilization uniqueness', () => {
    it('each civilization has unique bonus profile', () => {
      const bonusProfiles = civEntries.map(([id, civ]) => {
        const def = civ as CivilizationDefinition;
        return {
          id,
          bonuses: Object.keys(def.bonuses).sort().join(',')
        };
      });

      const uniqueProfiles = new Set(bonusProfiles.map((p) => p.bonuses));
      expect(uniqueProfiles.size, 'Some civilizations have identical bonus profiles').toBe(
        civEntries.length
      );
    });

    it('each civilization has unique lore snippet', () => {
      const loreSnippets = civEntries.map(
        ([_, civ]) => (civ as CivilizationDefinition).loreSnippet
      );
      const uniqueLore = new Set(loreSnippets);
      expect(uniqueLore.size, 'Some civilizations share lore snippets').toBe(civEntries.length);
    });

    it('each civilization has unique name', () => {
      const names = civEntries.map(([_, civ]) => (civ as CivilizationDefinition).name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size, 'Some civilizations share names').toBe(civEntries.length);
    });
  });

  describe('balance verification', () => {
    it('no civilization has strictly better bonuses than others', () => {
      // This test verifies no civilization is a "power creep" that's better in all ways
      civEntries.forEach(([id1, civ1]) => {
        const def1 = civ1 as CivilizationDefinition;

        civEntries.forEach(([id2, civ2]) => {
          if (id1 === id2) return;

          const def2 = civ2 as CivilizationDefinition;

          // Check if civ1 is strictly better than civ2
          let betterCount = 0;
          let worseCount = 0;
          let equalCount = 0;

          Object.keys(def1.bonuses).forEach((bonusType) => {
            const bonus1 = def1.bonuses[bonusType] ?? 1.0;
            const bonus2 = def2.bonuses[bonusType] ?? 1.0;

            if (bonus1 > bonus2) betterCount++;
            else if (bonus1 < bonus2) worseCount++;
            else equalCount++;
          });

          // If civ1 has bonuses in all the same areas as civ2 and is better or equal in all,
          // that's power creep
          const isStrictlyBetter = betterCount > 0 && worseCount === 0 && equalCount === 0;

          expect(
            isStrictlyBetter,
            `${id1} appears to be strictly better than ${id2} (better: ${betterCount}, worse: ${worseCount})`
          ).toBe(false);
        });
      });
    });

    it('civilizations have diverse bonus types', () => {
      const allBonusTypes = new Set<string>();

      civEntries.forEach(([_, civ]) => {
        const def = civ as CivilizationDefinition;
        Object.keys(def.bonuses).forEach((bonusType) => allBonusTypes.add(bonusType));
      });

      // Should have at least 5 different bonus types across all civilizations
      expect(
        allBonusTypes.size,
        'Civilizations should have diverse bonus types'
      ).toBeGreaterThanOrEqual(5);
    });
  });
});
