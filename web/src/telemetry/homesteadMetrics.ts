import type { GameEvent, GameState, ResourceId, WeatherType } from '../types';
import { TelemetryBuffer } from './buffer';

export interface HomesteadDaySummaryEvent {
  type: 'S1:homestead:daySummary';
  schemaVersion: 1;
  day: number;
  dayLengthSeconds: number;
  crops: {
    matured: number;
    withered: number;
    productionCycles: number;
  };
  stamina: {
    minRatio: number;
    exhaustedSeconds: number;
  };
  weather: {
    type: WeatherType;
    moistureDeltaPerSecond: number;
  };
  resources: Partial<Record<ResourceId, number>>;
}

export interface HomesteadMetricsOptions {
  buffer?: TelemetryBuffer<HomesteadDaySummaryEvent>;
}

const DEFAULT_STORAGE_KEY = 'farm-to-stars.telemetry.homestead';
const DEFAULT_MAX_ENTRIES = 96;

export class HomesteadMetrics {
  public readonly buffer: TelemetryBuffer<HomesteadDaySummaryEvent>;

  private currentDay: number | null = null;
  private dayElapsed = 0;
  private matured = 0;
  private withered = 0;
  private productionCycles = 0;
  private minStaminaRatio = 1;
  private exhaustedSeconds = 0;
  private lastWeatherType: WeatherType | null = null;
  private lastMoistureDelta = 0;

  constructor(options: HomesteadMetricsOptions = {}) {
    this.buffer =
      options.buffer ??
      new TelemetryBuffer<HomesteadDaySummaryEvent>({
        storageKey: DEFAULT_STORAGE_KEY,
        maxEntries: DEFAULT_MAX_ENTRIES
      });
  }

  reset(state: GameState) {
    this.currentDay = this.normalizeDay(state.homestead.time.day);
    this.dayElapsed = 0;
    this.matured = 0;
    this.withered = 0;
    this.productionCycles = 0;
    this.minStaminaRatio = this.computeStaminaRatio(state);
    this.exhaustedSeconds = 0;
    this.lastWeatherType = state.homestead.weather.current;
    this.lastMoistureDelta = this.toFinite(state.homestead.weather.moistureDeltaPerSecond);
  }

  recordTick(state: GameState, events: GameEvent[], dt: number) {
    if (this.currentDay === null) {
      this.reset(state);
    }

    if (dt > 0 && Number.isFinite(dt)) {
      this.dayElapsed += dt;
      this.minStaminaRatio = Math.min(this.minStaminaRatio, this.computeStaminaRatio(state));
      if (state.homestead.stamina.exhausted) {
        this.exhaustedSeconds += dt;
      }
    }

    for (const event of events) {
      switch (event.type) {
        case 'homestead.crop.matured':
          this.matured += 1;
          break;
        case 'homestead.crop.withered':
          this.withered += 1;
          break;
        case 'production.cycle':
          this.productionCycles += 1;
          break;
        case 'homestead.time.advanced':
          this.finalizeDay(state);
          this.currentDay = this.normalizeDay(event.day);
          this.dayElapsed = 0;
          this.matured = 0;
          this.withered = 0;
          this.productionCycles = 0;
          this.minStaminaRatio = this.computeStaminaRatio(state);
          this.exhaustedSeconds = 0;
          break;
        default:
          break;
      }
    }

    this.lastWeatherType = state.homestead.weather.current;
    this.lastMoistureDelta = this.toFinite(state.homestead.weather.moistureDeltaPerSecond);
  }

  private finalizeDay(state: GameState) {
    if (this.currentDay === null) {
      return;
    }
    const payload: HomesteadDaySummaryEvent = {
      type: 'S1:homestead:daySummary',
      schemaVersion: 1,
      day: this.currentDay,
      dayLengthSeconds: this.dayElapsed,
      crops: {
        matured: this.matured,
        withered: this.withered,
        productionCycles: this.productionCycles
      },
      stamina: {
        minRatio: Number.isFinite(this.minStaminaRatio) ? this.minStaminaRatio : 0,
        exhaustedSeconds: this.exhaustedSeconds
      },
      weather: {
        type: this.lastWeatherType ?? state.homestead.weather.current,
        moistureDeltaPerSecond: this.lastMoistureDelta
      },
      resources: { ...state.resources }
    };
    this.buffer.enqueue(payload);
  }

  private normalizeDay(raw: number): number {
    if (!Number.isFinite(raw)) {
      return 1;
    }
    return Math.max(1, Math.floor(raw));
  }

  private computeStaminaRatio(state: GameState): number {
    const { current, max } = state.homestead.stamina;
    if (max <= 0 || !Number.isFinite(current) || !Number.isFinite(max)) {
      return 0;
    }
    return Math.min(1, Math.max(0, current / max));
  }

  private toFinite(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return value;
  }
}
