import {
  clearPlaytestState,
  flushPlaytestEvents,
  getPlaytestTelemetryOptIn,
  peekPlaytestEvents,
  recordExportGenerated,
  recordPerformanceSample,
  setPlaytestTelemetryOptIn
} from '../playtest';

function createStubStorage() {
  const map = new Map<string, string>();
  return {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    }
  };
}

describe('playtest telemetry store', () => {
  it('respects opt-in before recording events', () => {
    const storage = createStubStorage();
    clearPlaytestState(storage);

    recordPerformanceSample({ frameMs: 18, simMs: 6, steps: 3 }, storage);
    expect(flushPlaytestEvents(storage)).toEqual([]);

    setPlaytestTelemetryOptIn(true, storage);
    expect(getPlaytestTelemetryOptIn(storage)).toBe(true);

    recordPerformanceSample({ frameMs: 16, simMs: 5, steps: 2 }, storage);
    const events = peekPlaytestEvents(storage);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('performance.sample');

    const flushed = flushPlaytestEvents(storage);
    expect(flushed).toHaveLength(1);
    expect(flushPlaytestEvents(storage)).toEqual([]);
  });

  it('coalesces export events once opted in', () => {
    const storage = createStubStorage();
    clearPlaytestState(storage);
    setPlaytestTelemetryOptIn(true, storage);

    recordExportGenerated(2048, 5, storage);
    recordExportGenerated(1024, 2, storage);
    const events = flushPlaytestEvents(storage);

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('export.generated');
    expect(events[0]).toHaveProperty('payloadBytes', 2048);
  });
});
