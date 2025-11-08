import type { BuildingType, Resources } from './types';

export interface BuildingDefinition {
  id: BuildingType;
  label: string;
  cost: Partial<Resources>;
  buildTime: number;
  texture: string;
  footprint: { w: number; h: number };
  elevation?: number;
  anchorOffset?: number;
}

export const BUILDINGS: Record<BuildingType, BuildingDefinition> = {
  cottage: {
    id: 'cottage',
    label: 'Cottage',
    cost: { wood: 15, stone: 5 },
    buildTime: 12,
    texture: 'prop:cottage',
    footprint: { w: 1, h: 1 },
    elevation: 8,
    anchorOffset: 8
  }
};

export function formatCost(cost: Partial<Resources>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(cost)) {
    if (value && value > 0) {
      parts.push(`${value}\u00d7 ${key}`);
    }
  }
  return parts.length ? parts.join(', ') : 'Free';
}

export function canAfford(resources: Resources, cost: Partial<Resources>): boolean {
  for (const [key, value] of Object.entries(cost)) {
    if (value && resources[key as keyof Resources] < value) {
      return false;
    }
  }
  return true;
}

export function applyCost(resources: Resources, cost: Partial<Resources>) {
  for (const [key, value] of Object.entries(cost)) {
    if (value && value !== 0) {
      const resourceKey = key as keyof Resources;
      resources[resourceKey] = Math.max(0, resources[resourceKey] - value);
    }
  }
}
