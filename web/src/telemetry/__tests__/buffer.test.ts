import { describe, expect, it, vi } from 'vitest';
import { TelemetryBuffer, type BufferedTelemetryRecord, type StorageLike } from '../buffer';

class MemoryStorage implements StorageLike {
  private readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe('TelemetryBuffer', () => {
  it('enforces max entries and persists across instances', () => {
    const storage = new MemoryStorage();
    let counter = 0;
    const buffer = new TelemetryBuffer<number>({
      storage,
      maxEntries: 2,
      now: () => ++counter,
      generateId: () => `id-${counter}`
    });

    buffer.enqueue(1);
    buffer.enqueue(2);
    buffer.enqueue(3); // should evict the first entry

    expect(buffer.size).toBe(2);
    const firstPass = buffer.peek();
    expect(firstPass[0]?.payload).toBe(2);
    expect(firstPass[1]?.payload).toBe(3);

    const restored = new TelemetryBuffer<number>({
      storage,
      maxEntries: 2
    });
    const restoredEntries = restored.peek();
    expect(restoredEntries).toHaveLength(2);
    expect(restoredEntries[0]?.payload).toBe(2);
    expect(restoredEntries[1]?.payload).toBe(3);
  });

  it('flushes batches and retains entries when sender fails', async () => {
    const storage = new MemoryStorage();
    let seq = 0;
    const buffer = new TelemetryBuffer<string>({
      storage,
      maxEntries: 5,
      generateId: () => `id-${seq++}`,
      now: () => 100
    });

    buffer.enqueue('a');
    buffer.enqueue('b');
    buffer.enqueue('c');

    const sender = vi.fn(async (records: readonly BufferedTelemetryRecord<string>[]) => {
      if (records.some((record) => record.payload === 'b')) {
        throw new Error('network down');
      }
    });

    await expect(buffer.flush(sender, { batchSize: 2 })).rejects.toThrow('network down');
    expect(buffer.size).toBe(3);

    sender.mockImplementation(async () => true);
    const flushed = await buffer.flush(sender, { batchSize: 2 });
    expect(flushed).toBe(3);
    expect(buffer.size).toBe(0);
  });

  it('stops flushing when sender returns false', async () => {
    const storage = new MemoryStorage();
    const buffer = new TelemetryBuffer<string>({ storage });
    buffer.enqueue('keep');
    buffer.enqueue('drop');

    const result = await buffer.flush(() => false);
    expect(result).toBe(0);
    expect(buffer.size).toBe(2);
  });
});
