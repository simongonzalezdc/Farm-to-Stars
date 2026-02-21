import type { GameEvent, MailMessage, ResourceId, WeatherEventInstance } from '../types';

export interface SimEventBatch {
  events: GameEvent[];
}

export interface LivestockTickResult extends SimEventBatch {
  feedConsumed: Partial<Record<ResourceId, number>>;
}

export interface WeatherEventUpdateResult extends SimEventBatch {
  started: WeatherEventInstance[];
  ended: WeatherEventInstance[];
  moistureModifier: number;
}

export interface MailQueueProcessResult extends SimEventBatch {
  delivered: MailMessage[];
}
