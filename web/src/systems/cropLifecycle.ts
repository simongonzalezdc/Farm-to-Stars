import {
  clamp01,
  parseTileKey,
  tileKey,
  type CropDefinition,
  type CropTileState,
  type CropsTable,
  type FieldState,
  type HomesteadState
} from '../types';

export interface CropLifecycleResult {
  matured: CropLifecycleEvent[];
  withered: CropLifecycleEvent[];
}

export interface CropLifecycleEvent {
  cropId: string;
  x: number;
  y: number;
}

const EPSILON = 1e-6;

export function tickCropLifecycle(
  homestead: HomesteadState,
  dt: number,
  crops: CropsTable,
  waterEfficiencyMultiplier: number = 1.0
): CropLifecycleResult {
  const result: CropLifecycleResult = { matured: [], withered: [] };

  if (dt <= 0 || !Number.isFinite(dt)) {
    return result;
  }

  const field = homestead.field;
  const weatherDelta = homestead.weather.moistureDeltaPerSecond * dt;

  for (const [key, tile] of Object.entries(field.tiles)) {
    tile.moisture = clamp01(tile.moisture + weatherDelta);
    const coords = parseTileKey(key) ?? { x: 0, y: 0 };

    if (!tile.crop) {
      if (!tile.tilled && tile.moisture <= EPSILON) {
        delete field.tiles[key];
      }
      continue;
    }

    const cropState = tile.crop;
    const definition = crops[cropState.cropId];
    if (!definition) {
      cropState.withered = true;
      cropState.ready = false;
      result.withered.push({ cropId: cropState.cropId, ...coords });
      continue;
    }

    if (cropState.withered) {
      continue;
    }

    const stage = resolveStage(definition, cropState);
    if (!stage) {
      cropState.withered = true;
      cropState.ready = false;
      result.withered.push({ cropId: cropState.cropId, ...coords });
      continue;
    }

    if (tile.moisture + EPSILON < stage.wiltThreshold) {
      cropState.withered = true;
      cropState.ready = false;
      result.withered.push({ cropId: cropState.cropId, ...coords });
      continue;
    }

    // Apply water efficiency bonus (higher multiplier = less consumption)
    const baseConsumption = Math.max(0, stage.moistureConsumptionPerSecond) * dt;
    const moistureConsumption = baseConsumption / waterEfficiencyMultiplier;
    if (moistureConsumption > 0) {
      tile.moisture = clamp01(tile.moisture - moistureConsumption);
    }

    if (tile.moisture + EPSILON < stage.minMoisture) {
      cropState.stageElapsed = Math.max(0, cropState.stageElapsed - dt * 0.25);
      continue;
    }

    cropState.stageElapsed += dt;

    let stageElapsed = cropState.stageElapsed;
    let stageIndex = cropState.stageIndex;
    let currentStage = stage;

    while (currentStage.duration > EPSILON && stageElapsed + EPSILON >= currentStage.duration) {
      stageElapsed -= currentStage.duration;
      if (stageIndex < definition.stages.length - 1) {
        stageIndex += 1;
        currentStage = definition.stages[stageIndex];
        continue;
      }

      if (!cropState.ready) {
        cropState.ready = true;
        result.matured.push({ cropId: cropState.cropId, ...coords });
      }

      if (!definition.regrow) {
        stageElapsed = currentStage.duration;
      } else {
        stageElapsed = Math.max(0, stageElapsed);
      }
      break;
    }

    cropState.stageIndex = stageIndex;
    cropState.stageElapsed = stageElapsed;
  }

  return result;
}

export function tillSoil(
  field: FieldState,
  x: number,
  y: number,
  moisture = 0.2
): CropTileState | null {
  const key = tileKey(x, y);
  const tile = field.tiles[key] ?? { tilled: false, moisture: clamp01(moisture), crop: null };
  tile.tilled = true;
  tile.moisture = clamp01(moisture);
  field.tiles[key] = tile;
  return tile.crop;
}

export function plantCrop(field: FieldState, x: number, y: number, cropId: string): CropTileState {
  const key = tileKey(x, y);
  const tile = field.tiles[key] ?? { tilled: true, moisture: 0.3, crop: null };
  tile.tilled = true;
  tile.crop = {
    cropId,
    stageIndex: 0,
    stageElapsed: 0,
    ready: false,
    withered: false
  };
  field.tiles[key] = tile;
  return tile.crop;
}

export function harvestCrop(
  field: FieldState,
  x: number,
  y: number,
  crops: CropsTable
): CropTileState | null {
  const key = tileKey(x, y);
  const tile = field.tiles[key];
  if (!tile?.crop) {
    return null;
  }

  const cropState = tile.crop;
  const definition = crops[cropState.cropId];
  if (!definition) {
    tile.crop = null;
    return cropState;
  }

  if (!cropState.ready || cropState.withered) {
    return null;
  }

  if (definition.regrow) {
    cropState.ready = false;
    cropState.stageIndex = Math.max(0, definition.stages.length - 2);
    cropState.stageElapsed = 0;
    return cropState;
  }

  tile.crop = null;
  return cropState;
}

function resolveStage(definition: CropDefinition, cropState: CropTileState) {
  if (definition.stages.length === 0) {
    return null;
  }
  const index = Math.min(Math.max(0, cropState.stageIndex), definition.stages.length - 1);
  return definition.stages[index];
}
