import type { GameState } from './types';

export const SIM_DT = 0.1; // 10 Hz

export function tick(state: GameState, dt: number) {
  // placeholder: gain wood slowly so you see HUD change
  state.resources.wood += 0.1 * dt;
}

export function fmt(n: number) {
  return Math.floor(n).toLocaleString();
}
