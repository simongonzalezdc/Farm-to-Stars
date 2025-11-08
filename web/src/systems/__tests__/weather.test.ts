import { describe, expect, it } from 'vitest';
import { advanceWeather } from '../weather';
import { SEASON_DEFINITIONS, SeasonId } from '../../config/seasons';
import { createDefaultWeatherState } from '../../types';

describe('weather system', () => {
  it('applies moisture deltas based on weather type', () => {
    const profile = SEASON_DEFINITIONS[SeasonId.Spring].weather;
    const state = createDefaultWeatherState();
    state.current = 'rain';
    state.duration = 30;

    const { moistureDeltaPerSecond } = advanceWeather(state, 10, profile, () => 0.1);

    expect(moistureDeltaPerSecond).toBeCloseTo(
      profile.rainPrecipitationPerSecond - profile.evaporationPerSecond,
      5
    );
  });

  it('rolls new weather when duration elapses', () => {
    const profile = SEASON_DEFINITIONS[SeasonId.Summer].weather;
    const state = createDefaultWeatherState();
    state.duration = 5;
    state.current = 'clear';

    const result = advanceWeather(state, 6, profile, () => 0.9);

    expect(state.elapsed).toBeLessThan(state.duration);
    expect(['clear', 'rain', 'storm']).toContain(result.current);
  });
});
