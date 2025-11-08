import { describe, expect, it } from 'vitest';
import { advanceTime, getNormalizedTime, isNight } from '../time';
import { createDefaultTimeState } from '../../types';

describe('time system', () => {
  it('wraps elapsed time across multiple days', () => {
    const state = createDefaultTimeState();
    state.secondsPerDay = 100;
    state.elapsed = 90;

    const result = advanceTime(state, 30);

    expect(result.daysElapsed).toBe(1);
    expect(state.day).toBe(2);
    expect(state.elapsed).toBe(20);
    expect(getNormalizedTime(state)).toBeCloseTo(0.2, 3);
  });

  it('marks night during final quarter of the day', () => {
    const state = createDefaultTimeState();
    state.secondsPerDay = 200;
    state.elapsed = 180;

    expect(isNight(state)).toBe(true);
  });

  it('ignores negative deltas', () => {
    const state = createDefaultTimeState();
    state.elapsed = 50;

    const result = advanceTime(state, -10);

    expect(result.daysElapsed).toBe(0);
    expect(state.elapsed).toBe(50);
  });
});
