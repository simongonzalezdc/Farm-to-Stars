import { clamp01, createDefaultStaminaState, type StaminaState } from '../types';

export interface StaminaSpendOptions {
  cost: number;
  allowNegative?: boolean;
}

export interface StaminaTickOptions {
  dt: number;
  regenOverride?: number;
}

const EPSILON = 1e-6;

export function spendStamina(state: StaminaState, options: StaminaSpendOptions): boolean {
  const cost = Number.isFinite(options.cost) ? Math.max(0, options.cost) : 0;
  if (cost <= 0) {
    return true;
  }

  if (!options.allowNegative && state.current + 1e-6 < cost) {
    state.current = 0;
    state.exhausted = true;
    return false;
  }

  state.current -= cost;
  if (state.current <= 0) {
    state.current = options.allowNegative ? state.current : 0;
    state.exhausted = !options.allowNegative;
  }
  return true;
}

export function regenerateStamina(state: StaminaState, options: StaminaTickOptions): number {
  const dt = options.dt;
  if (dt <= 0 || !Number.isFinite(dt)) {
    return state.current;
  }

  const regenRate = options.regenOverride ?? state.regenPerSecond;
  const regen = Math.max(0, Number.isFinite(regenRate) ? regenRate : createDefaultStaminaState().regenPerSecond);

  state.current = Math.min(state.max, state.current + regen * dt);
  if (state.current >= state.max - EPSILON) {
    state.current = state.max;
    state.exhausted = false;
  } else if (state.current > EPSILON) {
    state.exhausted = false;
  }
  return state.current;
}

export function setStaminaCapacity(state: StaminaState, max: number) {
  const normalizedMax = Math.max(1, Math.floor(Number.isFinite(max) ? max : createDefaultStaminaState().max));
  state.max = normalizedMax;
  state.current = Math.min(state.current, normalizedMax);
}

export function applyRest(state: StaminaState) {
  state.current = state.max;
  state.exhausted = false;
}

export function getStaminaRatio(state: StaminaState): number {
  if (state.max <= 0) {
    return 0;
  }
  return clamp01(state.current / state.max);
}
