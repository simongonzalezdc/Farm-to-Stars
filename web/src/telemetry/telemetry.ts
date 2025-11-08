import { getSeasonDefinition } from '../config/seasons';
import { getNormalizedTime } from '../state/time';
import { recordPerformanceSample } from './playtest';
import type {
  GameEvent,
  GameState,
  RecipeIO,
  ResourceId,
  WeatherType
} from '../types';

export interface TelemetrySnapshot {
  season: {
    id: string;
    year: number;
    cycle: number;
    progress: number;
    remainingSeconds: number;
  };
  homestead: {
    day: number;
    clock: string;
    staminaRatio: number;
    exhausted: boolean;
    weather: WeatherType;
    moistureDeltaPerSecond: number;
  };
  resources: {
    totals: Record<ResourceId, number>;
    ratesPerMinute: Record<ResourceId, number>;
  };
  daily: {
    buildsCompleted: number;
    cropsMatured: number;
    cropsWithered: number;
    productionCycles: number;
    productionOutputs: Record<ResourceId, number>;
  };
  queues: {
    build: number;
    construction: number;
    productionActive: number;
  };
  recentEvents: string[];
  performance: TelemetryPerformanceSnapshot;
}

export interface TelemetryPerformanceSnapshot {
  sampleCount: number;
  averageFrameMs: number;
  worstFrameMs: number;
  percentile95FrameMs: number;
  averageSimMs: number;
}

const RATE_LERP_PER_SECOND = 2;
const EPSILON = 1e-6;
const MAX_RECENT_EVENTS = 6;
const MAX_PERFORMANCE_SAMPLES = 240;

export class TelemetryTracker {
  private readonly resourceSamples = new Map<ResourceId, number>();
  private readonly resourceRates = new Map<ResourceId, number>();
  private day = 0;
  private buildsCompletedToday = 0;
  private maturedToday = 0;
  private witheredToday = 0;
  private productionCyclesToday = 0;
  private readonly productionOutputsToday = new Map<ResourceId, number>();
  private readonly recentEvents: string[] = [];
  private readonly performanceSamples: { frameMs: number; simMs: number; steps: number }[] = [];

  reset(state: GameState) {
    this.resourceSamples.clear();
    this.resourceRates.clear();
    this.productionOutputsToday.clear();
    this.recentEvents.length = 0;
    this.performanceSamples.length = 0;
    this.day = 0;
    this.ensureDay(state.homestead.time.day);
    for (const [resource, amount] of Object.entries(state.resources) as [ResourceId, number][]) {
      this.resourceSamples.set(resource, amount ?? 0);
      this.resourceRates.set(resource, 0);
    }
  }

  recordTick(state: GameState, events: GameEvent[], dt: number) {
    if (dt <= 0 || !Number.isFinite(dt)) {
      return;
    }

    this.ensureDay(state.homestead.time.day);
    this.updateResourceRates(state, dt);

    for (const event of events) {
      switch (event.type) {
        case 'construction.completed':
          this.buildsCompletedToday += 1;
          this.addRecentEvent(`${this.formatClock(state)} build: ${event.building.type}`);
          break;
        case 'homestead.crop.matured':
          this.maturedToday += 1;
          this.addRecentEvent(`${this.formatClock(state)} crop+: ${event.cropId}`);
          break;
        case 'homestead.crop.withered':
          this.witheredToday += 1;
          this.addRecentEvent(`${this.formatClock(state)} crop-: ${event.cropId}`);
          break;
        case 'homestead.weather.changed':
          this.addRecentEvent(`${this.formatClock(state)} weather → ${event.weather}`);
          break;
        case 'season.changed':
          this.addRecentEvent(`${this.formatClock(state)} season → ${event.season}`);
          break;
        case 'homestead.time.advanced':
          this.addRecentEvent(`${this.formatClock(state)} day → ${event.day}`);
          break;
        case 'production.cycle':
          this.productionCyclesToday += 1;
          this.addRecentEvent(`${this.formatClock(state)} prod: ${event.recipeId}`);
          this.accumulateOutputs(event.outputs ?? {});
          break;
        case 'livestock.produce':
          this.addRecentEvent(`${this.formatClock(state)} herd+: ${event.speciesId}`);
          this.accumulateOutputs({ [event.resource]: event.amount });
          break;
        case 'livestock.starved':
          this.addRecentEvent(`${this.formatClock(state)} herd-: ${event.speciesId}`);
          break;
        case 'weather.event.started':
          this.addRecentEvent(`${this.formatClock(state)} wx+: ${event.eventType}`);
          break;
        case 'weather.event.ended':
          this.addRecentEvent(`${this.formatClock(state)} wx-: ${event.eventType}`);
          break;
        case 'mail.delivered':
          this.addRecentEvent(`${this.formatClock(state)} mail`);
          break;
        default:
          break;
      }
    }
  }

  recordFrame(frameMs: number, simMs: number, steps: number) {
    if (!Number.isFinite(frameMs) || frameMs <= 0) {
      return;
    }
    const sample = {
      frameMs,
      simMs: Number.isFinite(simMs) && simMs >= 0 ? simMs : 0,
      steps: Number.isFinite(steps) && steps >= 0 ? steps : 0
    };
    this.performanceSamples.push(sample);
    if (this.performanceSamples.length > MAX_PERFORMANCE_SAMPLES) {
      this.performanceSamples.shift();
    }
    recordPerformanceSample(sample);
  }

  snapshot(state: GameState): TelemetrySnapshot {
    const definition = getSeasonDefinition(state.season.active);
    const duration = definition.durationSeconds;
    const remainingSeconds = Number.isFinite(duration)
      ? Math.max(0, duration - state.season.elapsed)
      : Number.POSITIVE_INFINITY;
    const progress = duration > EPSILON ? clamp01(state.season.elapsed / duration) : 0;

    const stamina = state.homestead.stamina;
    const staminaRatio = stamina.max > EPSILON ? clamp01(stamina.current / stamina.max) : 0;

    const totals = { ...state.resources };
    const ratesPerMinute = Object.fromEntries(
      Array.from(this.resourceRates.entries(), ([resource, perSecond]) => [
        resource,
        perSecond * 60
      ])
    ) as Record<ResourceId, number>;

    return {
      season: {
        id: state.season.active,
        year: state.season.year,
        cycle: state.season.cycle,
        progress,
        remainingSeconds
      },
      homestead: {
        day: state.homestead.time.day,
        clock: this.formatClock(state),
        staminaRatio,
        exhausted: Boolean(stamina.exhausted),
        weather: state.homestead.weather.current,
        moistureDeltaPerSecond: state.homestead.weather.moistureDeltaPerSecond
      },
      resources: {
        totals,
        ratesPerMinute
      },
      daily: {
        buildsCompleted: this.buildsCompletedToday,
        cropsMatured: this.maturedToday,
        cropsWithered: this.witheredToday,
        productionCycles: this.productionCyclesToday,
        productionOutputs: Object.fromEntries(this.productionOutputsToday.entries()) as Record<
          ResourceId,
          number
        >
      },
      queues: {
        build: state.buildQueue.length,
        construction: state.constructionQueue.length,
        productionActive: state.productionNodes.filter((node) => node.active).length
      },
      recentEvents: [...this.recentEvents],
      performance: this.computePerformance()
    };
  }

  private computePerformance(): TelemetryPerformanceSnapshot {
    if (this.performanceSamples.length === 0) {
      return {
        sampleCount: 0,
        averageFrameMs: 0,
        worstFrameMs: 0,
        percentile95FrameMs: 0,
        averageSimMs: 0
      };
    }

    const samples = [...this.performanceSamples];
    let totalFrame = 0;
    let totalSim = 0;
    let worst = 0;
    for (const sample of samples) {
      totalFrame += sample.frameMs;
      totalSim += sample.simMs;
      if (sample.frameMs > worst) {
        worst = sample.frameMs;
      }
    }

    const sorted = samples.map((s) => s.frameMs).sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
    const p95 = sorted[idx] ?? sorted[sorted.length - 1] ?? 0;

    return {
      sampleCount: samples.length,
      averageFrameMs: totalFrame / samples.length,
      worstFrameMs: worst,
      percentile95FrameMs: p95,
      averageSimMs: totalSim / samples.length
    };
  }

  private ensureDay(rawDay: number) {
    const normalizedDay = Number.isFinite(rawDay) ? Math.max(1, Math.floor(rawDay)) : 1;
    if (this.day === normalizedDay) {
      return;
    }
    this.day = normalizedDay;
    this.buildsCompletedToday = 0;
    this.maturedToday = 0;
    this.witheredToday = 0;
    this.productionCyclesToday = 0;
    this.productionOutputsToday.clear();
  }

  private updateResourceRates(state: GameState, dt: number) {
    const lerp = Math.min(1, RATE_LERP_PER_SECOND * dt);
    for (const [resource, amount] of Object.entries(state.resources) as [ResourceId, number][]) {
      const current = Number.isFinite(amount) ? amount : 0;
      const previous = this.resourceSamples.get(resource);
      if (previous === undefined) {
        this.resourceSamples.set(resource, current);
        this.resourceRates.set(resource, 0);
        continue;
      }
      const delta = current - previous;
      const instantaneous = dt > EPSILON ? delta / dt : 0;
      const priorRate = this.resourceRates.get(resource) ?? 0;
      const nextRate = priorRate + (instantaneous - priorRate) * lerp;
      this.resourceRates.set(resource, Math.abs(nextRate) < EPSILON ? 0 : nextRate);
      this.resourceSamples.set(resource, current);
    }
  }

  private accumulateOutputs(outputs: RecipeIO) {
    for (const [resource, amount] of Object.entries(outputs) as [ResourceId, number][]) {
      if (!amount) continue;
      const next = (this.productionOutputsToday.get(resource) ?? 0) + amount;
      this.productionOutputsToday.set(resource, next);
    }
  }

  private addRecentEvent(message: string) {
    if (!message) {
      return;
    }
    this.recentEvents.unshift(message);
    while (this.recentEvents.length > MAX_RECENT_EVENTS) {
      this.recentEvents.pop();
    }
  }

  private formatClock(state: GameState): string {
    const normalized = getNormalizedTime(state.homestead.time);
    const hoursFloat = clamp01(normalized) * 24;
    const hours = Math.floor(hoursFloat);
    const minutes = Math.floor((hoursFloat - hours) * 60 + EPSILON);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}
