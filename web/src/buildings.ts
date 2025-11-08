import { getDataTables } from './data';
import type { BuildingDefinition, BuildingType, Resources } from './types';

export interface UiBuildingDefinition extends BuildingDefinition {
  cost: Partial<Resources>;
  texture: string;
  anchorOffset?: number;
  elevation?: number;
}

const VISUAL_OVERRIDES: Partial<Record<BuildingType, Pick<UiBuildingDefinition, 'texture' | 'anchorOffset' | 'elevation'>>> = {
  road: { texture: 'tile:road' },
  plot: { texture: 'tile:ground' },
  cottage: { texture: 'prop:cottage', anchorOffset: 8, elevation: 8 },
  market: { texture: 'prop:cottage', anchorOffset: 8, elevation: 8 }
};

let cachedUiDefinitions: Record<BuildingType, UiBuildingDefinition> | null = null;

export function getUiBuildingDefinitions(): Record<BuildingType, UiBuildingDefinition> {
  if (cachedUiDefinitions) {
    return cachedUiDefinitions;
  }

  const tables = getDataTables();
  const resolved: Record<BuildingType, UiBuildingDefinition> = {} as Record<BuildingType, UiBuildingDefinition>;

  for (const def of Object.values(tables.buildings)) {
    const id = def.id as BuildingType;
    const visual = VISUAL_OVERRIDES[id] ?? { texture: 'prop:cottage' };
    resolved[id] = {
      ...def,
      cost: def.cost ? { ...def.cost } : {},
      texture: visual.texture,
      anchorOffset: visual.anchorOffset,
      elevation: visual.elevation
    };
  }

  cachedUiDefinitions = resolved;
  return cachedUiDefinitions;
}

export function getUiBuildingDefinition(id: BuildingType): UiBuildingDefinition {
  const definitions = getUiBuildingDefinitions();
  const entry = definitions[id];
  if (!entry) {
    throw new Error(`Unknown building type: ${id}`);
  }
  return entry;
}

export function listUiBuildingDefinitions(): UiBuildingDefinition[] {
  return Object.values(getUiBuildingDefinitions());
}

export function formatCost(cost: Partial<Resources> | undefined): string {
  if (!cost || Object.keys(cost).length === 0) {
    return 'Free';
  }
  const parts: string[] = [];
  for (const [key, value] of Object.entries(cost)) {
    if (value && value > 0) {
      parts.push(`${value}\u00d7 ${key}`);
    }
  }
  return parts.length ? parts.join(', ') : 'Free';
}

export function canAfford(resources: Resources, cost: Partial<Resources> | undefined): boolean {
  if (!cost) {
    return true;
  }
  for (const [key, value] of Object.entries(cost)) {
    if (value && (resources[key as keyof Resources] ?? 0) < value) {
      return false;
    }
  }
  return true;
}

export function applyCost(resources: Resources, cost: Partial<Resources> | undefined) {
  if (!cost) {
    return;
  }
  for (const [key, value] of Object.entries(cost)) {
    if (value && value !== 0) {
      const resourceKey = key as keyof Resources;
      resources[resourceKey] = Math.max(0, (resources[resourceKey] ?? 0) - value);
    }
  }
}

export function resetUiBuildingCache() {
  cachedUiDefinitions = null;
}
