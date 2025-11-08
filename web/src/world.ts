import type { GameState } from './types';

export const SIM_DT = 0.1; // 10 Hz

export function tick(state: GameState, dt: number) {
  // placeholder: gain wood slowly so you see HUD change
  state.resources.wood += 0.1 * dt;

  const job = state.buildQueue[0];
  if (job) {
    if (job.status === 'queued') {
      job.status = 'building';
    }
    job.remaining = Math.max(0, job.remaining - dt);
    if (job.remaining === 0) {
      state.structures.push({
        id: job.id,
        type: job.type,
        x: job.x,
        y: job.y,
        footprint: job.footprint
      });
      state.buildQueue.shift();
    }
  }
}

export function fmt(n: number) {
  return Math.floor(n).toLocaleString();
}
