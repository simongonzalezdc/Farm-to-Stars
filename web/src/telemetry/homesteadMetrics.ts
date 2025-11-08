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
    spent: number;
    restCount: number;
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
  private restCount = 0;
  private lastStamina = 0;
  private staminaSpent = 0;

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
    this.resetDailyCounters(state);
  }

  recordTick(state: GameState, events: GameEvent[], dt: number) {
    if (this.currentDay === null) {
      this.reset(state);
    }

    const staminaValue = this.getStaminaValue(state);
    if (staminaValue + Number.EPSILON < this.lastStamina) {
      this.staminaSpent += this.lastStamina - staminaValue;
    }
    this.lastStamina = staminaValue;

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
          this.finalizeCurrentDay(state);
          this.startNewDay(state, event.day);
          break;
        default:
          break;
      }
    }

    this.lastWeatherType = state.homestead.weather.current;
    this.lastMoistureDelta = this.toFinite(state.homestead.weather.moistureDeltaPerSecond);
  }

  recordManualAdvance(state: GameState, previousDay: number, nextDay: number) {
    this.lastWeatherType = state.homestead.weather.current;
    this.lastMoistureDelta = this.toFinite(state.homestead.weather.moistureDeltaPerSecond);
    this.restCount += 1;
    this.currentDay = this.normalizeDay(previousDay);
    this.finalizeCurrentDay(state);
    this.startNewDay(state, nextDay);
  }

  private finalizeCurrentDay(state: GameState) {
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
        exhaustedSeconds: this.exhaustedSeconds,
        spent: this.staminaSpent,
        restCount: this.restCount
      },
      weather: {
        type: this.lastWeatherType ?? state.homestead.weather.current,
        moistureDeltaPerSecond: this.lastMoistureDelta
      },
      resources: { ...state.resources }
    };
    this.buffer.enqueue(payload);
  }

  private startNewDay(state: GameState, day: number) {
    this.currentDay = this.normalizeDay(day);
    this.resetDailyCounters(state);
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

  private getStaminaValue(state: GameState): number {
    const { current } = state.homestead.stamina;
    if (!Number.isFinite(current)) {
      return 0;
    }
    return Math.max(0, current);
  }

  private resetDailyCounters(state: GameState) {
    this.dayElapsed = 0;
    this.matured = 0;
    this.withered = 0;
    this.productionCycles = 0;
    this.minStaminaRatio = this.computeStaminaRatio(state);
    this.exhaustedSeconds = 0;
    this.restCount = 0;
    this.staminaSpent = 0;
    this.lastStamina = this.getStaminaValue(state);
    this.lastWeatherType = state.homestead.weather.current;
    this.lastMoistureDelta = this.toFinite(state.homestead.weather.moistureDeltaPerSecond);
  }

  private toFinite(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return value;
  }
}
