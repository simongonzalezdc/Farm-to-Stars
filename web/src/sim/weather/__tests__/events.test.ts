import { describe, expect, it } from 'vitest';
import { updateWeatherEvents } from '../events';
import { createDefaultWeatherState, type WeatherState } from '../../../types';

function cloneWeather(state: WeatherState): WeatherState {
  return JSON.parse(JSON.stringify(state)) as WeatherState;
}

describe('weather events scheduler', () => {
  it('spawns and resolves dynamic weather events', () => {
    const state = createDefaultWeatherState();
    state.current = 'rain';
    state.events.nextRollIn = 0;
    state.rngState = 0x12345678;

    const first = updateWeatherEvents(state, 10);
    expect(first.started.length).toBeGreaterThan(0);
    const spawned = first.started[0]!;
    expect(first.events).toContainEqual({
      type: 'weather.event.started',
      eventId: spawned.id,
      eventType: spawned.type,
      intensity: spawned.intensity
    });
    expect(Number.isFinite(first.moistureModifier)).toBe(true);

    const active = state.events.active.find((event) => event.id === spawned.id);
    expect(active?.remaining).toBeGreaterThan(0);

    state.events.nextRollIn = Number.POSITIVE_INFINITY;
    const resolved = updateWeatherEvents(state, (active?.remaining ?? 0) + 1);

    expect(resolved.ended).toContainEqual(expect.objectContaining({ id: spawned.id }));
    expect(resolved.events).toContainEqual({
      type: 'weather.event.ended',
      eventId: spawned.id,
      eventType: spawned.type
    });
    expect(state.events.active.length).toBe(0);
  });

  it('produces deterministic schedules regardless of tick size', () => {
    const base = createDefaultWeatherState();
    base.current = 'storm';
    base.events.nextRollIn = 40;
    base.rngState = 0xabcdef;

    const single = cloneWeather(base);
    const multi = cloneWeather(base);

    updateWeatherEvents(single, 240);
    updateWeatherEvents(multi, 80);
    updateWeatherEvents(multi, 80);
    updateWeatherEvents(multi, 80);

    expect(multi.events.active).toEqual(single.events.active);
    expect(multi.events.nextRollIn).toBeCloseTo(single.events.nextRollIn, 5);
    expect(multi.events.serial).toBe(single.events.serial);
  });
});
