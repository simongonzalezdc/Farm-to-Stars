export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface TelemetryBufferOptions<T> {
  /**
   * Storage key used to persist buffered telemetry events. Defaults to
   * `farm-to-stars.telemetry`.
   */
  storageKey?: string;
  /** Maximum number of entries to retain in the buffer. */
  maxEntries?: number;
  /** Optional storage implementation (defaults to `window.localStorage`). */
  storage?: StorageLike | null;
  /** Time source used when stamping entries. Defaults to `Date.now`. */
  now?: () => number;
  /** Unique identifier factory. Defaults to `crypto.randomUUID` when available. */
  generateId?: () => string;
  /** Optional transformer applied to entries loaded from storage. */
  revive?: (raw: unknown) => BufferedTelemetryRecord<T> | null;
}

export interface BufferedTelemetryRecord<T> {
  id: string;
  timestamp: number;
  payload: T;
}

export type TelemetrySender<T> = (
  batch: readonly BufferedTelemetryRecord<T>[]
) => void | boolean | Promise<void | boolean>;

const DEFAULT_STORAGE_KEY = 'farm-to-stars.telemetry.buffer';
const DEFAULT_MAX_ENTRIES = 128;

function defaultId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${time}-${rand}`;
}

function defaultStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage ?? null;
  } catch (_error) {
    return null;
  }
}

function reviveRecord<T>(raw: unknown): BufferedTelemetryRecord<T> | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const candidate = raw as Partial<BufferedTelemetryRecord<T>>;
  if (typeof candidate.id !== 'string') {
    return null;
  }
  if (typeof candidate.timestamp !== 'number' || !Number.isFinite(candidate.timestamp)) {
    return null;
  }
  if (!('payload' in candidate)) {
    return null;
  }
  return { id: candidate.id, timestamp: candidate.timestamp, payload: candidate.payload as T };
}

export class TelemetryBuffer<T> {
  private readonly storageKey: string;
  private readonly maxEntries: number;
  private readonly storage: StorageLike | null;
  private readonly now: () => number;
  private readonly generateId: () => string;
  private readonly revive: (raw: unknown) => BufferedTelemetryRecord<T> | null;
  private queue: BufferedTelemetryRecord<T>[] = [];

  constructor(options: TelemetryBufferOptions<T> = {}) {
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    this.maxEntries = Math.max(1, options.maxEntries ?? DEFAULT_MAX_ENTRIES);
    this.storage = options.storage ?? defaultStorage();
    this.now = options.now ?? (() => Date.now());
    this.generateId = options.generateId ?? defaultId;
    this.revive = options.revive ?? reviveRecord;
    this.restore();
  }

  /** Number of entries currently buffered. */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Returns a readonly view of the buffered entries ordered from oldest to newest.
   */
  peek(): readonly BufferedTelemetryRecord<T>[] {
    return this.queue;
  }

  /**
   * Adds a telemetry payload to the buffer, trimming the oldest entries when the
   * capacity is exceeded.
   */
  enqueue(payload: T): BufferedTelemetryRecord<T> {
    const record: BufferedTelemetryRecord<T> = {
      id: this.generateId(),
      timestamp: this.now(),
      payload
    };
    this.queue.push(record);
    if (this.queue.length > this.maxEntries) {
      this.queue.splice(0, this.queue.length - this.maxEntries);
    }
    this.persist();
    return record;
  }

  /**
   * Removes and returns all buffered entries.
   */
  drain(): BufferedTelemetryRecord<T>[] {
    const drained = this.queue.slice();
    this.queue = [];
    this.persist();
    return drained;
  }

  /**
   * Attempts to flush buffered telemetry to the provided sender. Entries are only
   * removed from the buffer if the sender resolves without throwing and does not
   * return `false`.
   */
  async flush(sender: TelemetrySender<T>, options: { batchSize?: number } = {}): Promise<number> {
    const requested = options.batchSize ?? this.queue.length;
    const batchSize = Math.max(1, Math.floor(requested || 1));
    let flushed = 0;
    while (this.queue.length > 0) {
      const batch = this.queue.slice(0, batchSize);
      try {
        const result = await sender(batch);
        if (result === false) {
          break;
        }
      } catch (error) {
        this.persist();
        throw error;
      }
      this.queue.splice(0, batch.length);
      flushed += batch.length;
      this.persist();
    }
    return flushed;
  }

  private restore() {
    if (!this.storage) {
      return;
    }
    const raw = this.storage.getItem(this.storageKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        this.storage.removeItem?.(this.storageKey);
        return;
      }
      const restored: BufferedTelemetryRecord<T>[] = [];
      for (const item of parsed) {
        const record = this.revive(item);
        if (record) {
          restored.push(record);
        }
      }
      if (restored.length === 0) {
        this.storage.removeItem?.(this.storageKey);
        return;
      }
      if (restored.length > this.maxEntries) {
        this.queue = restored.slice(restored.length - this.maxEntries);
      } else {
        this.queue = restored;
      }
    } catch (_error) {
      this.queue = [];
      this.storage.removeItem?.(this.storageKey);
    }
  }

  private persist() {
    if (!this.storage) {
      return;
    }
    try {
      if (this.queue.length === 0) {
        this.storage.removeItem?.(this.storageKey);
      } else {
        this.storage.setItem(this.storageKey, JSON.stringify(this.queue));
      }
    } catch (_error) {
      // Ignore storage errors such as quota exceeded or serialization issues.
    }
  }
}
