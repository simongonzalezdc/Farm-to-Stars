import { describe, expect, it } from 'vitest';
import { TelemetryTracker } from '../telemetry';
import { defaultState } from '../../types';

describe('TelemetryTracker', () => {
  it('captures resource rates and totals', () => {
    const tracker = new TelemetryTracker();
    const state = defaultState();
    state.resources.wood = 0;
    tracker.reset(state);

    state.resources.wood = 10;
    tracker.recordTick(state, [], 1);

    const snapshot = tracker.snapshot(state);
    expect(snapshot.resources.totals.wood).toBe(10);
    expect(snapshot.resources.ratesPerMinute.wood).toBeCloseTo(600, 3);
  });

  it('tracks daily crop events and resets when the day changes', () => {
    const tracker = new TelemetryTracker();
    const state = defaultState();
    tracker.reset(state);

    tracker.recordTick(
      state,
      [
        { type: 'homestead.crop.matured', cropId: 'wheat', x: 0, y: 0 },
        { type: 'homestead.crop.withered', cropId: 'potato', x: 1, y: 1 }
      ],
      0.5
    );

    let snapshot = tracker.snapshot(state);
    expect(snapshot.daily.cropsMatured).toBe(1);
    expect(snapshot.daily.cropsWithered).toBe(1);

    state.homestead.time.day = 2;
    tracker.recordTick(state, [], 0.5);
    snapshot = tracker.snapshot(state);
    expect(snapshot.daily.cropsMatured).toBe(0);
    expect(snapshot.daily.cropsWithered).toBe(0);
  });

  it('limits recent event history', () => {
    const tracker = new TelemetryTracker();
    const state = defaultState();
    tracker.reset(state);

    for (let i = 0; i < 10; i += 1) {
      tracker.recordTick(
        state,
        [{ type: 'homestead.weather.changed', weather: 'rain', moistureDeltaPerSecond: -0.1 }],
        0.1
      );
    }

    const snapshot = tracker.snapshot(state);
    expect(snapshot.recentEvents.length).toBeLessThanOrEqual(6);
  });

  it('accumulates performance samples', () => {
    const tracker = new TelemetryTracker();
    const state = defaultState();
    tracker.reset(state);

    tracker.recordFrame(16, 6, 3);
    tracker.recordFrame(20, 8, 4);

    const snapshot = tracker.snapshot(state);
    expect(snapshot.performance.sampleCount).toBe(2);
    expect(snapshot.performance.worstFrameMs).toBeCloseTo(20, 5);
    expect(snapshot.performance.averageSimMs).toBeCloseTo(7, 5);
  });
});
