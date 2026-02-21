import type {
  WeatherEventInstance,
  WeatherEventType,
  WeatherState,
  WeatherType
} from '../../types';
import { nextRandom, randomBetween } from '../random';

export interface WeatherEventUpdateResult {
  started: WeatherEventInstance[];
  ended: WeatherEventInstance[];
  moistureModifier: number;
}

interface WeatherEventDefinition {
  type: WeatherEventType;
  weight: number;
  minDuration: number;
  maxDuration: number;
  moistureModifier: number;
}

const EPSILON = 1e-6;

const EVENT_DEFINITIONS: Record<WeatherType, WeatherEventDefinition[]> = {
  clear: [
    {
      type: 'gusts',
      weight: 1.25,
      minDuration: 60,
      maxDuration: 120,
      moistureModifier: -0.0015
    }
  ],
  rain: [
    {
      type: 'downpour',
      weight: 2.2,
      minDuration: 70,
      maxDuration: 160,
      moistureModifier: 0.018
    },
    {
      type: 'gusts',
      weight: 1.1,
      minDuration: 55,
      maxDuration: 110,
      moistureModifier: -0.0006
    }
  ],
  storm: [
    {
      type: 'lightning',
      weight: 3.2,
      minDuration: 35,
      maxDuration: 95,
      moistureModifier: 0.024
    },
    {
      type: 'downpour',
      weight: 1.5,
      minDuration: 70,
      maxDuration: 170,
      moistureModifier: 0.022
    }
  ]
};

export function updateWeatherEvents(state: WeatherState, dt: number): WeatherEventUpdateResult {
  if (dt <= 0) {
    return { started: [], ended: [], moistureModifier: computeMoistureModifier(state) };
  }

  const started: WeatherEventInstance[] = [];
  const ended: WeatherEventInstance[] = [];

  for (let i = state.events.active.length - 1; i >= 0; i -= 1) {
    const event = state.events.active[i];
    event.remaining -= dt;
    if (event.remaining <= EPSILON) {
      state.events.active.splice(i, 1);
      ended.push(event);
    }
  }

  state.events.nextRollIn -= dt;
  if (state.events.nextRollIn <= 0) {
    attemptSpawnEvent(state, started);
    resetRollTimer(state);
  }

  return { started, ended, moistureModifier: computeMoistureModifier(state) };
}

function attemptSpawnEvent(state: WeatherState, started: WeatherEventInstance[]) {
  const candidates = EVENT_DEFINITIONS[state.current];
  if (!candidates || candidates.length === 0) {
    return;
  }

  const totalWeight = candidates.reduce((sum, def) => sum + Math.max(def.weight, 0), 0);
  if (totalWeight <= EPSILON) {
    return;
  }

  const roll = nextRandom(state) * totalWeight;
  let accumulator = 0;
  let chosen: WeatherEventDefinition | null = null;
  for (const def of candidates) {
    accumulator += Math.max(def.weight, 0);
    if (roll <= accumulator + EPSILON) {
      chosen = def;
      break;
    }
  }

  if (!chosen) {
    return;
  }

  if (state.events.active.some((event) => event.type === chosen.type)) {
    return;
  }

  const duration = Math.max(
    chosen.minDuration,
    randomBetween(state, chosen.minDuration, chosen.maxDuration)
  );
  const intensity = 0.5 + nextRandom(state) * 0.9;

  state.events.serial += 1;
  const instance: WeatherEventInstance = {
    id: `wx-${state.events.serial}`,
    type: chosen.type,
    remaining: duration,
    duration,
    intensity
  };
  state.events.active.push(instance);
  started.push(instance);
}

function resetRollTimer(state: WeatherState) {
  const base = state.current === 'storm' ? 40 : state.current === 'rain' ? 65 : 110;
  const span = state.current === 'storm' ? 36 : state.current === 'rain' ? 80 : 130;
  state.events.nextRollIn = Math.max(24, base + (nextRandom(state) - 0.5) * span);
}

function computeMoistureModifier(state: WeatherState): number {
  let modifier = 0;
  for (const event of state.events.active) {
    const definitions = EVENT_DEFINITIONS[state.current] ?? [];
    const def = definitions.find((candidate) => candidate.type === event.type);
    if (!def) {
      continue;
    }
    modifier += def.moistureModifier * event.intensity;
  }
  return modifier;
}
