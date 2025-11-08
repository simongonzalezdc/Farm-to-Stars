import { describe, expect, it } from 'vitest';
import { HomesteadMetrics, type HomesteadDaySummaryEvent } from '../homesteadMetrics';
import { TelemetryBuffer } from '../buffer';
import { defaultState, type GameEvent } from '../../types';

describe('HomesteadMetrics', () => {
  it('captures daily pacing metrics when the day advances', () => {
    const buffer = new TelemetryBuffer<HomesteadDaySummaryEvent>({ storage: null });
    const metrics = new HomesteadMetrics({ buffer });
    const state = defaultState();
    state.homestead.stamina.max = 100;
    state.homestead.stamina.current = 90;
    state.homestead.weather.current = 'sunny';
    state.homestead.weather.moistureDeltaPerSecond = -0.25;
    state.resources.wood = 25;
    state.resources.food = 12;

    metrics.reset(state);

    state.homestead.stamina.current = 60;
    metrics.recordTick(state, [], 5);

    state.homestead.stamina.current = 40;
    state.homestead.stamina.exhausted = true;
    metrics.recordTick(state, [], 2);

    state.homestead.stamina.exhausted = false;
    state.homestead.stamina.current = 80;

    const events: GameEvent[] = [
      { type: 'homestead.crop.matured', cropId: 'wheat', x: 0, y: 0 } as GameEvent,
      { type: 'homestead.crop.withered', cropId: 'potato', x: 1, y: 1 } as GameEvent,
      { type: 'production.cycle', nodeId: 1, recipeId: 'wheat', outputs: { food: 3 } } as GameEvent,
      { type: 'homestead.time.advanced', day: state.homestead.time.day + 1, normalizedTime: 0 } as GameEvent
    ];

    metrics.recordTick(state, events, 3);

    const records = buffer.drain();
    expect(records).toHaveLength(1);
    const [record] = records;
    const payload = record.payload;

    expect(payload.type).toBe('S1:homestead:daySummary');
    expect(payload.day).toBe(1);
    expect(payload.dayLengthSeconds).toBeCloseTo(10, 5);
    expect(payload.crops.matured).toBe(1);
    expect(payload.crops.withered).toBe(1);
    expect(payload.crops.productionCycles).toBe(1);
    expect(payload.stamina.minRatio).toBeCloseTo(0.4, 5);
    expect(payload.stamina.exhaustedSeconds).toBeCloseTo(2, 5);
    expect(payload.weather.type).toBe('sunny');
    expect(payload.weather.moistureDeltaPerSecond).toBeCloseTo(-0.25, 5);
    expect(payload.resources.food).toBe(12);
    expect(payload.resources.wood).toBe(25);

    // ensure metrics reset for the next day
    metrics.recordTick(state, [], 1);
    expect(metrics.buffer.size).toBe(0);
  });
});
