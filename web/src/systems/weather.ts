import type { SeasonWeatherProfile } from '../config/seasons';
import {
  clamp01,
  createDefaultWeatherState,
  isWeatherType,
  type WeatherState,
  type WeatherType
} from '../types';

export interface WeatherAdvanceResult {
  changed: boolean;
  current: WeatherType;
  moistureDeltaPerSecond: number;
}

export type RandomSource = () => number;

const EPSILON = 1e-6;

export function advanceWeather(
  state: WeatherState,
  dt: number,
  profile: SeasonWeatherProfile,
  rng: RandomSource = Math.random
): WeatherAdvanceResult {
  if (dt <= 0 || !Number.isFinite(dt)) {
    return {
      changed: false,
      current: state.current,
      moistureDeltaPerSecond: state.moistureDeltaPerSecond
    };
  }

  state.elapsed += dt;
  let changed = false;

  while (state.elapsed >= state.duration - EPSILON) {
    state.elapsed = Math.max(0, state.elapsed - state.duration);
    const next = rollWeatherType(profile, rng);
    if (next !== state.current) {
      state.current = next;
      changed = true;
    }
    state.duration = resolveDurationFor(next, profile, rng);
  }

  state.moistureDeltaPerSecond =
    getPrecipitationFor(state.current, profile) - Math.max(profile.evaporationPerSecond, 0);

  return {
    changed,
    current: state.current,
    moistureDeltaPerSecond: state.moistureDeltaPerSecond
  };
}

export function ensureWeatherState(state: Partial<WeatherState> | undefined): WeatherState {
  if (!state) {
    return createDefaultWeatherState();
  }
  const fallback = createDefaultWeatherState();
  const current = isWeatherType(state.current) ? state.current : fallback.current;
  const duration =
    Number.isFinite(state.duration) && state.duration! > EPSILON
      ? state.duration!
      : fallback.duration;
  const elapsed =
    Number.isFinite(state.elapsed) && state.elapsed! >= 0 ? state.elapsed! : fallback.elapsed;
  const moistureDelta = Number.isFinite(state.moistureDeltaPerSecond)
    ? state.moistureDeltaPerSecond!
    : fallback.moistureDeltaPerSecond;
  return {
    current,
    duration,
    elapsed: clamp01(elapsed / duration) * duration,
    moistureDeltaPerSecond: moistureDelta
  };
}

function rollWeatherType(profile: SeasonWeatherProfile, rng: RandomSource): WeatherType {
  const rainChance = clamp01(profile.rainChance);
  const stormChance = clamp01(profile.stormChance);
  const roll = rng();
  if (roll < stormChance) {
    return 'storm';
  }
  if (roll < stormChance + rainChance) {
    return 'rain';
  }
  return 'clear';
}

function resolveDurationFor(
  type: WeatherType,
  profile: SeasonWeatherProfile,
  rng: RandomSource
): number {
  const min = Math.max(EPSILON, profile.minDurationSeconds);
  const max = Math.max(min, profile.maxDurationSeconds);
  const span = max - min;
  const t = clamp01(rng());
  const bias = type === 'storm' ? 0.35 : type === 'rain' ? 0.5 : 0.65;
  const weighted = (t + bias) / (1 + bias);
  return min + span * weighted;
}

function getPrecipitationFor(type: WeatherType, profile: SeasonWeatherProfile): number {
  switch (type) {
    case 'storm':
      return Math.max(0, profile.stormPrecipitationPerSecond);
    case 'rain':
      return Math.max(0, profile.rainPrecipitationPerSecond);
    default:
      return 0;
  }
}
