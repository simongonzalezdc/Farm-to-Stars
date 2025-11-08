import { createDefaultTimeState, type TimeOfDayState } from '../types';

export interface AdvanceTimeResult {
  /** Number of whole days completed during the tick. */
  daysElapsed: number;
  /** Whether the day counter advanced at least once. */
  dayChanged: boolean;
  /** Normalized 0-1 time of day after ticking. */
  normalizedTime: number;
}

const EPSILON = 1e-6;

export function advanceTime(state: TimeOfDayState, dt: number): AdvanceTimeResult {
  if (dt <= 0 || !Number.isFinite(dt)) {
    const normalized = getNormalizedTime(state);
    return { daysElapsed: 0, dayChanged: false, normalizedTime: normalized };
  }

  const secondsPerDay = state.secondsPerDay > EPSILON ? state.secondsPerDay : createDefaultTimeState().secondsPerDay;
  let elapsed = state.elapsed + dt;
  let daysElapsed = 0;

  while (elapsed >= secondsPerDay) {
    elapsed -= secondsPerDay;
    daysElapsed += 1;
  }

  state.elapsed = Math.max(0, elapsed);
  state.day = Math.max(1, state.day + daysElapsed);

  const normalizedTime = getNormalizedTime(state);

  return {
    daysElapsed,
    dayChanged: daysElapsed > 0,
    normalizedTime
  };
}

export function getNormalizedTime(state: TimeOfDayState): number {
  const secondsPerDay = state.secondsPerDay > EPSILON ? state.secondsPerDay : createDefaultTimeState().secondsPerDay;
  if (secondsPerDay <= EPSILON) {
    return 0;
  }
  const normalized = state.elapsed / secondsPerDay;
  if (!Number.isFinite(normalized)) {
    return 0;
  }
  if (normalized < 0) {
    return 0;
  }
  if (normalized > 1) {
    return normalized - Math.floor(normalized);
  }
  return normalized;
}

export function isNight(state: TimeOfDayState): boolean {
  const normalized = getNormalizedTime(state);
  return normalized >= 0.75 || normalized < 0.25;
}

export function resetForNewDay(state: TimeOfDayState) {
  state.day = Math.max(1, state.day + 1);
  state.elapsed = 0;
}
