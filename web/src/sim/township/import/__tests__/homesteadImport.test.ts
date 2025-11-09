import { describe, expect, it } from 'vitest';
import {
  importFromHomestead,
  validateHomesteadExport
} from '../homesteadImport';
import type { HomesteadTownshipExport } from '../../../../types.township';

describe('Homestead → Township Import', () => {
  // Helper: Create minimal homestead export
  const createMockHomesteadExport = (): HomesteadTownshipExport => ({
    version: 1,
    generatedAt: '2025-01-01T00:00:00Z',
    seed: 12345,

    homestead: {
      metadata: {
        day: 30,
        season: 'spring',
        year: 2,
        cycle: 1,
        weather: 'clear',
        civilization: 'teotihuacan'
      },

      resources: {
        wood: 500,
        stone: 300,
        water: 1000,
        food: 200,
        coins: 500
      },

      staminaPercent: 80,

      structures: [
        { type: 'house', x: 10, y: 10, width: 2, height: 2 },
        { type: 'barn', x: 15, y: 15, width: 3, height: 3 },
        { type: 'well', x: 5, y: 5, width: 1, height: 1 }
      ],

      livestock: [
        { speciesId: 'chicken', mature: 5, juvenile: 3 },
        { speciesId: 'cow', mature: 2, juvenile: 1 }
      ]
    },

    township: {
      agriculture: [],
      shipments: []
    }
  });

  describe('importFromHomestead()', () => {
    it('creates valid Township state from Homestead export', () => {
      const homesteadExport = createMockHomesteadExport();
      const result = importFromHomestead(homesteadExport, {});

      expect(result.state).toBeDefined();
      expect(result.state.version).toBe(1);
      expect(result.state.seed).toBe(12345);
      expect(result.metadata).toBeDefined();
    });

    it('inherits civilization from Homestead', () => {
      const homesteadExport = createMockHomesteadExport();
      homesteadExport.homestead.metadata.civilization = 'maya';

      const result = importFromHomestead(homesteadExport, {});

      expect(result.state.civilization).toBe('maya');
      expect(result.metadata.civilization).toBe('maya');
    });

    it('defaults to teotihuacan when civilization is missing', () => {
      const homesteadExport = createMockHomesteadExport();
      delete homesteadExport.homestead.metadata.civilization;

      const result = importFromHomestead(homesteadExport, {});

      expect(result.state.civilization).toBe('teotihuacan');
    });

    it('carries forward resources from Homestead', () => {
      const homesteadExport = createMockHomesteadExport();
      homesteadExport.homestead.resources = {
        wood: 1000,
        stone: 500,
        water: 2000,
        food: 300,
        coins: 800
      };

      const result = importFromHomestead(homesteadExport, {});

      expect(result.state.resources.wood).toBe(1000);
      expect(result.state.resources.stone).toBe(500);
      expect(result.state.resources.water).toBe(2000);
      expect(result.state.resources.food).toBe(300);
    });

    it('grants bonus coins (1.5x multiplier)', () => {
      const homesteadExport = createMockHomesteadExport();
      homesteadExport.homestead.resources.coins = 1000;

      const result = importFromHomestead(homesteadExport, {});

      expect(result.state.resources.coins).toBe(1500); // 1000 * 1.5
    });

    it('generates starter zones', () => {
      const homesteadExport = createMockHomesteadExport();

      const result = importFromHomestead(homesteadExport, {});

      expect(result.state.zones.length).toBeGreaterThan(0);
      expect(result.state.zones.some(z => z.type === 'residential')).toBe(true);
      expect(result.state.zones.some(z => z.type === 'commercial')).toBe(true);
      expect(result.state.zones.some(z => z.type === 'industrial')).toBe(true);
    });

    it('calculates starting population based on Homestead quality', () => {
      const poorHomestead = createMockHomesteadExport();
      poorHomestead.homestead.resources = {
        wood: 50,
        stone: 30,
        water: 100,
        food: 20,
        coins: 50
      };
      poorHomestead.homestead.structures = [{ type: 'house', x: 0, y: 0, width: 2, height: 2 }];
      poorHomestead.homestead.livestock = [];

      const richHomestead = createMockHomesteadExport();
      richHomestead.homestead.resources = {
        wood: 5000,
        stone: 3000,
        water: 10000,
        food: 2000,
        coins: 5000
      };
      richHomestead.homestead.structures = Array(20)
        .fill(null)
        .map((_, i) => ({ type: 'house', x: i * 3, y: 0, width: 2, height: 2 }));
      richHomestead.homestead.livestock = [
        { speciesId: 'chicken', mature: 50, juvenile: 30 }
      ];

      const poorResult = importFromHomestead(poorHomestead, {});
      const richResult = importFromHomestead(richHomestead, {});

      expect(richResult.state.population.total).toBeGreaterThan(poorResult.state.population.total);
    });

    it('calculates starting happiness based on Homestead quality', () => {
      const poorHomestead = createMockHomesteadExport();
      poorHomestead.homestead.resources = {
        wood: 10,
        stone: 10,
        water: 10,
        food: 10,
        coins: 10
      };
      poorHomestead.homestead.structures = [];
      poorHomestead.homestead.livestock = [];
      poorHomestead.homestead.staminaPercent = 20;

      const richHomestead = createMockHomesteadExport();
      richHomestead.homestead.resources = {
        wood: 10000,
        stone: 10000,
        water: 10000,
        food: 10000,
        coins: 10000
      };
      richHomestead.homestead.structures = Array(20)
        .fill(null)
        .map((_, i) => ({ type: 'house', x: i * 3, y: 0, width: 2, height: 2 }));
      richHomestead.homestead.livestock = [
        { speciesId: 'chicken', mature: 50, juvenile: 50 }
      ];
      richHomestead.homestead.staminaPercent = 100;

      const poorResult = importFromHomestead(poorHomestead, {});
      const richResult = importFromHomestead(richHomestead, {});

      expect(richResult.state.metrics.happiness.overall).toBeGreaterThan(
        poorResult.state.metrics.happiness.overall
      );
    });

    it('assigns proper employment distribution', () => {
      const homesteadExport = createMockHomesteadExport();

      const result = importFromHomestead(homesteadExport, {});

      const { employed, unemployed, total } = result.state.population;

      expect(employed).toBeGreaterThan(0);
      expect(unemployed).toBeGreaterThan(0);
      expect(employed + unemployed).toBeLessThanOrEqual(total);
    });

    it('starts with no homeless citizens', () => {
      const homesteadExport = createMockHomesteadExport();

      const result = importFromHomestead(homesteadExport, {});

      expect(result.state.population.homeless).toBe(0);
    });

    it('generates unique district ID based on seed and day', () => {
      const export1 = createMockHomesteadExport();
      export1.seed = 111;
      export1.homestead.metadata.day = 10;

      const export2 = createMockHomesteadExport();
      export2.seed = 222;
      export2.homestead.metadata.day = 10;

      const result1 = importFromHomestead(export1, {});
      const result2 = importFromHomestead(export2, {});

      expect(result1.state.districtId).not.toBe(result2.state.districtId);
    });

    it('includes quality assessment in metadata', () => {
      const homesteadExport = createMockHomesteadExport();

      const result = importFromHomestead(homesteadExport, {});

      expect(result.metadata.homesteadQuality).toBeDefined();
      expect(result.metadata.homesteadQuality).toBeGreaterThanOrEqual(0);
      expect(result.metadata.homesteadQuality).toBeLessThanOrEqual(1);
    });

    it('includes human-readable starting bonus description', () => {
      const homesteadExport = createMockHomesteadExport();

      const result = importFromHomestead(homesteadExport, {});

      expect(result.metadata.startingBonus).toBeDefined();
      expect(typeof result.metadata.startingBonus).toBe('string');
      expect(result.metadata.startingBonus.length).toBeGreaterThan(0);
    });

    it('quality score considers resource stockpile', () => {
      const lowResources = createMockHomesteadExport();
      lowResources.homestead.resources = {
        wood: 10,
        stone: 10,
        water: 10,
        food: 10,
        coins: 10
      };

      const highResources = createMockHomesteadExport();
      highResources.homestead.resources = {
        wood: 10000,
        stone: 10000,
        water: 10000,
        food: 10000,
        coins: 10000
      };

      const lowResult = importFromHomestead(lowResources, {});
      const highResult = importFromHomestead(highResources, {});

      expect(highResult.metadata.homesteadQuality).toBeGreaterThan(lowResult.metadata.homesteadQuality);
    });

    it('quality score considers structures built', () => {
      const fewStructures = createMockHomesteadExport();
      fewStructures.homestead.structures = [{ type: 'house', x: 0, y: 0, width: 2, height: 2 }];

      const manyStructures = createMockHomesteadExport();
      manyStructures.homestead.structures = Array(20)
        .fill(null)
        .map((_, i) => ({ type: 'house', x: i * 3, y: 0, width: 2, height: 2 }));

      const fewResult = importFromHomestead(fewStructures, {});
      const manyResult = importFromHomestead(manyStructures, {});

      expect(manyResult.metadata.homesteadQuality).toBeGreaterThan(fewResult.metadata.homesteadQuality);
    });

    it('quality score considers livestock raised', () => {
      const noLivestock = createMockHomesteadExport();
      noLivestock.homestead.livestock = [];

      const manyLivestock = createMockHomesteadExport();
      manyLivestock.homestead.livestock = [
        { speciesId: 'chicken', mature: 50, juvenile: 30 },
        { speciesId: 'cow', mature: 20, juvenile: 10 }
      ];

      const noResult = importFromHomestead(noLivestock, {});
      const manyResult = importFromHomestead(manyLivestock, {});

      expect(manyResult.metadata.homesteadQuality).toBeGreaterThan(noResult.metadata.homesteadQuality);
    });

    it('quality score considers stamina management', () => {
      const lowStamina = createMockHomesteadExport();
      lowStamina.homestead.staminaPercent = 10;

      const highStamina = createMockHomesteadExport();
      highStamina.homestead.staminaPercent = 100;

      const lowResult = importFromHomestead(lowStamina, {});
      const highResult = importFromHomestead(highStamina, {});

      expect(highResult.metadata.homesteadQuality).toBeGreaterThan(lowResult.metadata.homesteadQuality);
    });

    it('caps quality score at 1.0', () => {
      const perfectHomestead = createMockHomesteadExport();
      perfectHomestead.homestead.resources = {
        wood: 99999,
        stone: 99999,
        water: 99999,
        food: 99999,
        coins: 99999
      };
      perfectHomestead.homestead.structures = Array(100)
        .fill(null)
        .map((_, i) => ({ type: 'house', x: i, y: 0, width: 2, height: 2 }));
      perfectHomestead.homestead.livestock = [
        { speciesId: 'chicken', mature: 1000, juvenile: 1000 }
      ];
      perfectHomestead.homestead.staminaPercent = 100;

      const result = importFromHomestead(perfectHomestead, {});

      expect(result.metadata.homesteadQuality).toBeLessThanOrEqual(1.0);
    });

    it('initializes township with timestamp 0 and tick 0', () => {
      const homesteadExport = createMockHomesteadExport();

      const result = importFromHomestead(homesteadExport, {});

      expect(result.state.timestamp).toBe(0);
      expect(result.state.tick).toBe(0);
    });

    it('creates zones with deterministic positions based on seed', () => {
      const export1 = createMockHomesteadExport();
      export1.seed = 42;

      const export2 = createMockHomesteadExport();
      export2.seed = 42;

      const result1 = importFromHomestead(export1, {});
      const result2 = importFromHomestead(export2, {});

      // Same seed should produce same zone layout
      expect(result1.state.zones.length).toBe(result2.state.zones.length);
      expect(result1.state.zones[0].position).toEqual(result2.state.zones[0].position);
    });
  });

  describe('validateHomesteadExport()', () => {
    it('returns true for valid export', () => {
      const validExport = createMockHomesteadExport();

      expect(validateHomesteadExport(validExport)).toBe(true);
    });

    it('returns false for null', () => {
      expect(validateHomesteadExport(null)).toBe(false);
    });

    it('returns false for non-object', () => {
      expect(validateHomesteadExport('invalid')).toBe(false);
      expect(validateHomesteadExport(123)).toBe(false);
      expect(validateHomesteadExport(true)).toBe(false);
    });

    it('returns false when version is missing', () => {
      const invalid = createMockHomesteadExport();
      delete (invalid as any).version;

      expect(validateHomesteadExport(invalid)).toBe(false);
    });

    it('returns false when seed is missing', () => {
      const invalid = createMockHomesteadExport();
      delete (invalid as any).seed;

      expect(validateHomesteadExport(invalid)).toBe(false);
    });

    it('returns false when homestead is missing', () => {
      const invalid: any = {
        version: 1,
        seed: 123
      };

      expect(validateHomesteadExport(invalid)).toBe(false);
    });

    it('returns false when homestead.metadata is missing', () => {
      const invalid = createMockHomesteadExport();
      delete (invalid.homestead as any).metadata;

      expect(validateHomesteadExport(invalid)).toBe(false);
    });

    it('returns false when homestead.resources is missing', () => {
      const invalid = createMockHomesteadExport();
      delete (invalid.homestead as any).resources;

      expect(validateHomesteadExport(invalid)).toBe(false);
    });

    it('returns false when homestead.structures is not an array', () => {
      const invalid = createMockHomesteadExport();
      (invalid.homestead as any).structures = 'not an array';

      expect(validateHomesteadExport(invalid)).toBe(false);
    });

    it('returns true even when optional fields are missing', () => {
      const minimal = createMockHomesteadExport();
      delete minimal.homestead.livestock;

      expect(validateHomesteadExport(minimal)).toBe(true);
    });
  });
});
