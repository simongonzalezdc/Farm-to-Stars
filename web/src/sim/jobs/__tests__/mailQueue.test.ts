import { describe, expect, it } from 'vitest';
import { ensureDailyMail, processMailQueue } from '../mailQueue';
import { defaultState, type ResourcesTable } from '../../../types';

const clone = <T>(value: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);

const RESOURCES: ResourcesTable = {
  food: { display: 'Food', stack: 9999 },
  wheat: { display: 'Wheat', stack: 500 },
  coins: { display: 'Coins', stack: 9999 },
  letters: { display: 'Mail', stack: 99 }
};

describe('mail queue worker', () => {
  it('generates deterministic daily mail jobs', () => {
    const state = defaultState(RESOURCES);
    state.seed = 0x12345678;
    state.homestead.time.day = 5;

    ensureDailyMail(state);
    const firstSnapshot = {
      scheduled: clone(state.mail.scheduled),
      jobs: clone(state.jobQueue.jobs),
      lastGeneratedDay: state.mail.lastGeneratedDay
    };

    ensureDailyMail(state);
    expect(state.mail.scheduled.length).toBe(firstSnapshot.scheduled.length);
    expect(state.jobQueue.jobs.length).toBe(firstSnapshot.jobs.length);
    expect(state.mail.lastGeneratedDay).toBe(firstSnapshot.lastGeneratedDay);

    const replay = defaultState(RESOURCES);
    replay.seed = 0x12345678;
    replay.homestead.time.day = 5;
    ensureDailyMail(replay);

    expect(replay.mail.scheduled).toEqual(firstSnapshot.scheduled);
    expect(replay.jobQueue.jobs).toEqual(firstSnapshot.jobs);
  });

  it('delivers scheduled mail and attachments', () => {
    const state = defaultState(RESOURCES);
    state.resources.coins = 0;
    state.resources.letters = 0;
    state.homestead.time.day = 3;
    state.homestead.time.elapsed = state.homestead.time.secondsPerDay * 0.5;

    state.mail.scheduled.push({
      id: 100,
      templateId: 'test',
      npcId: 'mayor',
      subject: 'Hello',
      body: 'Welcome!',
      attachments: { coins: 5, letters: 1 },
      scheduledAtSeconds: state.homestead.time.secondsPerDay * (state.homestead.time.day - 1)
    });
    state.jobQueue.jobs.push({
      id: 200,
      type: 'mail',
      scheduledAt: state.mail.scheduled[0]!.scheduledAtSeconds,
      payload: state.mail.scheduled[0]
    });

    const result = processMailQueue(state);

    expect(result.events).toContainEqual({
      type: 'mail.delivered',
      messageId: 100,
      attachments: { coins: 5, letters: 1 }
    });
    expect(result.delivered[0]?.subject).toBe('Hello');
    expect(state.resources.coins).toBeGreaterThanOrEqual(5);
    expect(state.resources.letters).toBeGreaterThan(0);
    expect(state.mail.scheduled.length).toBe(0);
    expect(state.jobQueue.jobs.length).toBe(0);
  });
});
