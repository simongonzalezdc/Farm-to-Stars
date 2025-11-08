export interface StatefulRng {
  rngState: number;
}

const UINT32_MAX = 0xffffffff;

export function nextRandom(state: StatefulRng): number {
  state.rngState = (state.rngState * 1664525 + 1013904223) >>> 0;
  return state.rngState / UINT32_MAX;
}

export function randomBetween(state: StatefulRng, min: number, max: number): number {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return min;
  }
  let lower = min;
  let upper = max;
  if (upper < lower) {
    [lower, upper] = [upper, lower];
  }
  const t = nextRandom(state);
  return lower + (upper - lower) * t;
}

export function deriveSeed(base: number, salt: number): number {
  const seed = Math.imul((base >>> 0) ^ 0x9e3779b9, (salt >>> 0) | 1);
  return (seed ^ (seed >>> 16)) >>> 0;
}
