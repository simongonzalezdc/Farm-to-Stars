import { describe, expect, it } from 'vitest';
import { processMailQueue } from '../mailQueue';
import { defaultState, type ResourcesTable } from '../../../types';

const RESOURCES: ResourcesTable = {
  food: { display: 'Food', stack: 9999 },
  wheat: { display: 'Wheat', stack: 500 },
  coins: { display: 'Coins', stack: 9999 },
  letters: { display: 'Mail', stack: 99 }
};

describe('mail queue worker', () => {
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
