import type { HomesteadDaySummaryEvent } from './homesteadMetrics';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type PlaytestEvent =
  | {
      type: 'performance.sample';
      frameMs: number;
      simMs: number;
      steps: number;
      timestamp: string;
    }
  | {
      type: 'export.generated';
      payloadBytes: number;
      shipments: number;
      timestamp: string;
    }
  | {
      type: 'homestead.daySummary';
      summary: HomesteadDaySummaryEvent;
      timestamp: string;
    };

interface PlaytestState {
  telemetryOptIn: boolean;
  events: PlaytestEvent[];
}

const STORAGE_KEY = 'fts:playtest';
const MAX_EVENTS = 2048;

let cachedState: PlaytestState | null = null;
let cachedStorage: StorageLike | null = null;

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    }
  };
}

function resolveStorage(provided?: StorageLike | null): StorageLike {
  if (provided) {
    cachedStorage = provided;
    return provided;
  }
  if (cachedStorage) {
    return cachedStorage;
  }
  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage) {
        cachedStorage = window.localStorage;
        return cachedStorage;
      }
    } catch (err) {
      // ignored; fall back to memory storage
    }
  }
  cachedStorage = createMemoryStorage();
  return cachedStorage;
}

function loadState(storage: StorageLike): PlaytestState {
  if (cachedState) {
    return cachedState;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedState = { telemetryOptIn: false, events: [] };
      return cachedState;
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      !parsed ||
      typeof parsed.telemetryOptIn !== 'boolean' ||
      !Array.isArray(parsed.events)
    ) {
      cachedState = { telemetryOptIn: false, events: [] };
      return cachedState;
    }
    const events = parsed.events.filter(
      (event: PlaytestEvent) => event && typeof event === 'object'
    );
    cachedState = { telemetryOptIn: parsed.telemetryOptIn, events };
    return cachedState;
  } catch (err) {
    cachedState = { telemetryOptIn: false, events: [] };
    return cachedState;
  }
}

function persistState(storage: StorageLike, state: PlaytestState) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Persistence is best-effort; ignore quota errors.
  }
}

export function getPlaytestTelemetryOptIn(storage?: StorageLike): boolean {
  const resolved = resolveStorage(storage);
  const state = loadState(resolved);
  return state.telemetryOptIn;
}

export function setPlaytestTelemetryOptIn(optIn: boolean, storage?: StorageLike) {
  const resolved = resolveStorage(storage);
  const state = loadState(resolved);
  if (state.telemetryOptIn === optIn) {
    return;
  }
  state.telemetryOptIn = optIn;
  persistState(resolved, state);
}

export function recordPlaytestEvent(
  event: Omit<PlaytestEvent, 'timestamp'>,
  storage?: StorageLike
): boolean {
  const resolved = resolveStorage(storage);
  const state = loadState(resolved);
  if (!state.telemetryOptIn) {
    return false;
  }
  const fullEvent = { ...event, timestamp: new Date().toISOString() } as PlaytestEvent;
  state.events.push(fullEvent);
  if (state.events.length > MAX_EVENTS) {
    state.events.splice(0, state.events.length - MAX_EVENTS);
  }
  persistState(resolved, state);
  return true;
}

export function recordPerformanceSample(
  sample: { frameMs: number; simMs: number; steps: number },
  storage?: StorageLike
) {
  recordPlaytestEvent({ type: 'performance.sample', ...sample }, storage);
}

export function recordExportGenerated(
  payloadBytes: number,
  shipments: number,
  storage?: StorageLike
) {
  recordPlaytestEvent({ type: 'export.generated', payloadBytes, shipments }, storage);
}

export function recordHomesteadDaySummary(
  summary: HomesteadDaySummaryEvent,
  storage?: StorageLike
) {
  recordPlaytestEvent({ type: 'homestead.daySummary', summary }, storage);
}

export function flushPlaytestEvents(storage?: StorageLike): PlaytestEvent[] {
  const resolved = resolveStorage(storage);
  const state = loadState(resolved);
  if (!state.events.length) {
    return [];
  }
  const events = [...state.events];
  state.events.length = 0;
  persistState(resolved, state);
  return events;
}

export function peekPlaytestEvents(storage?: StorageLike): PlaytestEvent[] {
  const resolved = resolveStorage(storage);
  const state = loadState(resolved);
  return [...state.events];
}

export function clearPlaytestState(storage?: StorageLike) {
  const resolved = resolveStorage(storage);
  cachedState = { telemetryOptIn: false, events: [] };
  persistState(resolved, cachedState);
}
