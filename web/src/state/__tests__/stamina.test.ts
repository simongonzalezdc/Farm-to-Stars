import { describe, expect, it } from 'vitest';
import { applyRest, regenerateStamina, spendStamina } from '../stamina';
import { createDefaultStaminaState } from '../../types';

describe('stamina system', () => {
  it('prevents overspending when exhausted', () => {
    const state = createDefaultStaminaState();
    state.current = 5;

    const ok = spendStamina(state, { cost: 8 });

    expect(ok).toBe(false);
    expect(state.exhausted).toBe(true);
    expect(state.current).toBe(0);
  });

  it('regenerates over time and clears exhaustion', () => {
    const state = createDefaultStaminaState();
    state.current = 0;
    state.exhausted = true;

    regenerateStamina(state, { dt: 2 });

    expect(state.current).toBeGreaterThan(0);
    expect(state.exhausted).toBe(false);
  });

  it('rest restores to max instantly', () => {
    const state = createDefaultStaminaState();
    state.current = 10;

    applyRest(state);

    expect(state.current).toBe(state.max);
  });
});
