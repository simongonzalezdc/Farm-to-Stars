import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../data', async () => {
  const buildings = {
    road: {
      id: 'road',
      label: 'Road',
      buildTime: 1,
      footprint: { w: 1, h: 1 }
    },
    tent: {
      id: 'tent',
      label: 'Settler Tent',
      buildTime: 4,
      footprint: { w: 2, h: 2 }
    },
    well: {
      id: 'well',
      label: 'Well',
      buildTime: 5,
      footprint: { w: 1, h: 1 }
    },
    crate: {
      id: 'crate',
      label: 'Crate',
      buildTime: 3,
      footprint: { w: 1, h: 1 }
    }
  } as const;

  return {
    getDataTables: () => ({
      resources: {},
      buildings,
      recipes: {},
      crops: {},
      tools: {}
    })
  };
});

import { getUiBuildingDefinitions, resetUiBuildingCache } from '../buildings';

describe('ui building definitions', () => {
  beforeEach(() => {
    resetUiBuildingCache();
  });

  it('applies homestead visual overrides for new structures', () => {
    const defs = getUiBuildingDefinitions();

    expect(defs.tent.texture).toBe('prop:tent');
    expect(defs.tent.anchorOffset).toBeGreaterThan(0);

    expect(defs.well.texture).toBe('prop:well');
    expect(defs.crate.texture).toBe('prop:crate');
  });
});
