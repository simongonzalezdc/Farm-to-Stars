import type {
  GameEvent,
  WeatherEventInstance,
  WeatherEventType,
  WeatherState,
  WeatherType
} from '../../types';
import type { WeatherEventUpdateResult } from '../events';
import { nextRandom, randomBetween } from '../random';

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
      weight: 1,
      minDuration: 45,
      maxDuration: 90,
      moistureModifier: -0.002
    }
  ],
  rain: [
    {
      type: 'downpour',
      weight: 2,
      minDuration: 60,
      maxDuration: 140,
      moistureModifier: 0.015
    },
    {
      type: 'gusts',
      weight: 1,
      minDuration: 40,
      maxDuration: 80,
      moistureModifier: -0.001
    }
  ],
  storm: [
    {
      type: 'lightning',
      weight: 2.5,
      minDuration: 30,
      maxDuration: 90,
      moistureModifier: 0.02
    },
    {
      type: 'downpour',
      weight: 1.2,
      minDuration: 60,
      maxDuration: 150,
      moistureModifier: 0.02
    }
  ]
};

export function updateWeatherEvents(state: WeatherState, dt: number): WeatherEventUpdateResult {
  const started: WeatherEventInstance[] = [];
  const ended: WeatherEventInstance[] = [];
  const events: GameEvent[] = [];

  if (dt <= 0) {
    return { started, ended, events, moistureModifier: computeMoistureModifier(state) };
  }

  settleEndedEvents(state, ended, events);

  let remaining = dt;
  state.events.nextRollIn = Math.max(0, state.events.nextRollIn);

  while (remaining > EPSILON) {
    if (state.events.nextRollIn <= EPSILON) {
      const spawned = attemptSpawnEvent(state);
      if (spawned) {
        started.push(spawned);
        events.push({
          type: 'weather.event.started',
          eventId: spawned.id,
          eventType: spawned.type,
          intensity: spawned.intensity
        });
      }
      resetRollTimer(state);
      continue;
    }

    const timeToNextEnd = getTimeToNextEventEnd(state);
    let step = remaining;
    if (state.events.nextRollIn < Number.POSITIVE_INFINITY) {
      step = Math.min(step, state.events.nextRollIn);
    }
    if (timeToNextEnd < Number.POSITIVE_INFINITY) {
      step = Math.min(step, timeToNextEnd);
    }

    if (step <= EPSILON) {
      break;
    }

    advanceActiveEvents(state, step, ended, events);
    remaining -= step;

    if (state.events.nextRollIn < Number.POSITIVE_INFINITY) {
      state.events.nextRollIn = Math.max(0, state.events.nextRollIn - step);
    }
  }

  return { started, ended, events, moistureModifier: computeMoistureModifier(state) };
}

function attemptSpawnEvent(state: WeatherState): WeatherEventInstance | null {
  const candidates = EVENT_DEFINITIONS[state.current];
  if (!candidates || candidates.length === 0) {
    return null;
  }

  const totalWeight = candidates.reduce((sum, def) => sum + Math.max(def.weight, 0), 0);
  if (totalWeight <= EPSILON) {
    return null;
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
    return null;
  }

  if (state.events.active.some((event) => event.type === chosen.type)) {
    return null;
  }

  const duration = Math.max(chosen.minDuration, randomBetween(state, chosen.minDuration, chosen.maxDuration));
  const intensity = 0.6 + nextRandom(state) * 0.8;

  state.events.serial += 1;
  const instance: WeatherEventInstance = {
    id: `wx-${state.events.serial}`,
    type: chosen.type,
    remaining: duration,
    duration,
    intensity
  };
  state.events.active.push(instance);
  return instance;
}

function advanceActiveEvents(
  state: WeatherState,
  elapsed: number,
  ended: WeatherEventInstance[],
  events: GameEvent[]
) {
  if (elapsed <= EPSILON) {
    settleEndedEvents(state, ended, events);
    return;
  }

  for (const event of state.events.active) {
    event.remaining -= elapsed;
  }
  settleEndedEvents(state, ended, events);
}

function settleEndedEvents(
  state: WeatherState,
  ended: WeatherEventInstance[],
  events: GameEvent[]
) {
  for (let i = state.events.active.length - 1; i >= 0; i -= 1) {
    const event = state.events.active[i];
    if (event.remaining <= EPSILON) {
      state.events.active.splice(i, 1);
      ended.push(event);
      events.push({
        type: 'weather.event.ended',
        eventId: event.id,
        eventType: event.type
      });
    }
  }
}

function getTimeToNextEventEnd(state: WeatherState): number {
  let soonest = Number.POSITIVE_INFINITY;
  for (const event of state.events.active) {
    if (event.remaining <= EPSILON) {
      return 0;
    }
    soonest = Math.min(soonest, event.remaining);
  }
  return soonest;
}

function resetRollTimer(state: WeatherState) {
  const base = state.current === 'storm' ? 45 : state.current === 'rain' ? 70 : 120;
  const span = state.current === 'storm' ? 40 : state.current === 'rain' ? 90 : 120;
  state.events.nextRollIn = Math.max(30, base + (nextRandom(state) - 0.5) * span);
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
