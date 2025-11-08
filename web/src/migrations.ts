import { defaultState, type GameState, type Resources, type ResourceId, type SaveV0, type SaveV1 } from './types';

const RESOURCE_IDS: ResourceId[] = ['wood', 'stone', 'food', 'coins'];

function sanitizeResources(candidate: Partial<Record<ResourceId, unknown>>): Resources {
  return RESOURCE_IDS.reduce<Resources>((acc, key) => {
    const value = candidate[key];
    acc[key] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return acc;
  }, {} as Resources);
}

function isSaveV1(candidate: unknown): candidate is SaveV1 {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const record = candidate as Record<string, unknown>;
  if (record.v !== 1 || typeof record.seed !== 'number' || !Number.isFinite(record.seed)) {
    return false;
  }

  if (!record.resources || typeof record.resources !== 'object') {
    return false;
  }

  return true;
}

function isSaveV0(candidate: unknown): candidate is SaveV0 {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const record = candidate as Record<string, unknown>;
  if (typeof record.seed !== 'number' || !Number.isFinite(record.seed)) {
    return false;
  }

  return RESOURCE_IDS.every((key) => typeof record[key] === 'number');
}

export function migrateSave(candidate: unknown): GameState | null {
  if (isSaveV1(candidate)) {
    const resources = sanitizeResources(candidate.resources as Partial<Record<ResourceId, unknown>>);
    return { v: 1, seed: candidate.seed, resources };
  }

  if (isSaveV0(candidate)) {
    const resources = sanitizeResources(candidate as Partial<Record<ResourceId, unknown>>);
    return { v: 1, seed: candidate.seed, resources };
  }

  return null;
}

export function migrateOrDefault(candidate: unknown): GameState {
  return migrateSave(candidate) ?? defaultState();
}
