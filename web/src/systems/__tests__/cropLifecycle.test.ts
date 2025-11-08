import { describe, expect, it } from 'vitest';
import { plantCrop, tickCropLifecycle } from '../cropLifecycle';
import { createDefaultHomesteadState, type CropsTable } from '../../types';

const MOCK_CROPS: CropsTable = {
  wheat: {
    id: 'wheat',
    label: 'Test Wheat',
    regrow: false,
    yields: { wheat: 3 },
    stages: [
      { id: 'sprout', duration: 4, minMoisture: 0.2, moistureConsumptionPerSecond: 0.01, wiltThreshold: 0.05 },
      { id: 'mature', duration: 4, minMoisture: 0.15, moistureConsumptionPerSecond: 0.008, wiltThreshold: 0.05 }
    ]
  },
  berry: {
    id: 'berry',
    label: 'Berry',
    regrow: true,
    yields: { berries: 2 },
    stages: [
      { id: 'sprout', duration: 2, minMoisture: 0.1, moistureConsumptionPerSecond: 0.005, wiltThreshold: 0.02 },
      { id: 'ripe', duration: 2, minMoisture: 0.1, moistureConsumptionPerSecond: 0.005, wiltThreshold: 0.02 }
    ]
  }
};

describe('crop lifecycle', () => {
  it('advances stages and marks crops ready when growth completes', () => {
    const homestead = createDefaultHomesteadState();
    const crop = plantCrop(homestead.field, 1, 1, 'wheat');
    homestead.field.tiles['1,1']!.moisture = 1;

    const result = tickCropLifecycle(homestead, 10, MOCK_CROPS);

    expect(result.matured).toHaveLength(1);
    expect(crop.ready).toBe(true);
  });

  it('withers crops if moisture drops below threshold', () => {
    const homestead = createDefaultHomesteadState();
    const tile = plantCrop(homestead.field, 2, 3, 'berry');
    homestead.field.tiles['2,3']!.moisture = 0.01;

    const result = tickCropLifecycle(homestead, 1, MOCK_CROPS);

    expect(result.withered).toHaveLength(1);
    expect(tile.withered).toBe(true);
  });
});
