import { describe, expect, it } from 'vitest';
import { updateWeatherEvents } from '../events';
import { createDefaultWeatherState } from '../../../types';

describe('weather events scheduler', () => {
  it('spawns and resolves dynamic weather events', () => {
    const state = createDefaultWeatherState();
    state.current = 'rain';
    state.events.nextRollIn = 0;
    state.rngState = 0x12345678;

    const first = updateWeatherEvents(state, 10);
    expect(first.started.length).toBeGreaterThanOrEqual(0);
    if (first.started.length === 0) {
      // Force spawn by setting next roll to zero again
      state.events.nextRollIn = 0;
      const second = updateWeatherEvents(state, 10);
      expect(second.started.length).toBeGreaterThan(0);
    }

    const activeBefore = state.events.active.length;
    const totalMoisture = updateWeatherEvents(state, 0).moistureModifier;
    expect(state.events.active.length).toBeGreaterThanOrEqual(activeBefore);
    expect(Number.isFinite(totalMoisture)).toBe(true);

    const elapsed = state.events.active.reduce(
      (sum, event) => Math.max(sum, event.duration + 1),
      0
    );
    state.events.nextRollIn = Number.POSITIVE_INFINITY;
    const resolved = updateWeatherEvents(state, elapsed);
    expect(resolved.ended.length).toBeGreaterThan(0);
    expect(state.events.active.length).toBe(0);
  });
});
