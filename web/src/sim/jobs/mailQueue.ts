import type { GameEvent, GameState, MailMessage, ScheduledMail } from '../../types';
import { deriveSeed, nextRandom, randomBetween } from '../random';

interface MailTemplate {
  id: string;
  npcId: string;
  subject: string;
  body: string;
  minDay: number;
  weight: number;
  attachments: ScheduledMail['attachments'];
}

const MAIL_TEMPLATES: MailTemplate[] = [
  {
    id: 'welcome-mail',
    npcId: 'mayor',
    subject: 'Welcome to the Homestead',
    body: 'We dropped a small care package to help with the livestock pens. Stop by the square when you can!',
    minDay: 1,
    weight: 2,
    attachments: { food: 4, letters: 1 }
  },
  {
    id: 'festival-reminder',
    npcId: 'luna',
    subject: 'Festival Planning Committee',
    body: 'Keep an eye on the weather! Bring some eggs to the evening potluck.',
    minDay: 3,
    weight: 1,
    attachments: { coins: 5, eggs: 2 }
  },
  {
    id: 'trader-offer',
    npcId: 'rovek',
    subject: 'Traveling Trader Special',
    body: 'I can swap surplus milk for building fiber tomorrow morning. Leave a crate by the road.',
    minDay: 5,
    weight: 1.4,
    attachments: { fiber: 4 }
  }
];

export function ensureDailyMail(state: GameState) {
  const currentDay = state.homestead.time.day;
  const secondsPerDay = state.homestead.time.secondsPerDay;

  for (let day = state.mail.lastGeneratedDay + 1; day <= currentDay; day += 1) {
    generateForDay(state, day, secondsPerDay);
  }

  state.mail.lastGeneratedDay = Math.max(state.mail.lastGeneratedDay, currentDay);
}

export function processMailQueue(state: GameState): { events: GameEvent[]; delivered: MailMessage[] } {
  const now = getTimelineSeconds(state);
  const due = state.jobQueue.jobs.filter((job) => job.type === 'mail' && job.scheduledAt <= now);
  if (due.length === 0) {
    return { events: [], delivered: [] };
  }

  const events: GameEvent[] = [];
  const delivered: MailMessage[] = [];
  for (const job of due) {
    const message = deliverMailJob(state, job.payload as ScheduledMail, now, events);
    delivered.push(message);
    removeJob(state, job.id);
  }
  return { events, delivered };
}

function generateForDay(state: GameState, day: number, secondsPerDay: number) {
  const eligible = MAIL_TEMPLATES.filter((template) => day >= template.minDay);
  if (eligible.length === 0) {
    return;
  }

  const seed = deriveSeed(state.seed, day);
  const rng = { rngState: seed };
  const sendChance = nextRandom(rng);
  if (sendChance < 0.35) {
    return;
  }

  const template = weightedPick(eligible, rng);
  if (!template) {
    return;
  }

  const normalizedTime = Math.min(0.95, Math.max(0.2, randomBetween(rng, 0.3, 0.8)));
  const scheduledAtSeconds = (day - 1) * secondsPerDay + normalizedTime * secondsPerDay;

  const mailId = state.mail.nextId++;
  const scheduled: ScheduledMail = {
    id: mailId,
    templateId: template.id,
    npcId: template.npcId,
    subject: template.subject,
    body: template.body,
    attachments: { ...template.attachments },
    scheduledAtSeconds
  };

  state.mail.scheduled.push(scheduled);
  state.jobQueue.jobs.push({
    id: state.jobQueue.nextJobId++,
    type: 'mail',
    scheduledAt: scheduledAtSeconds,
    payload: scheduled
  });
}

function weightedPick(templates: MailTemplate[], rng: { rngState: number }): MailTemplate | null {
  const total = templates.reduce((sum, template) => sum + Math.max(template.weight, 0), 0);
  if (total <= 0) {
    return null;
  }
  const roll = nextRandom(rng) * total;
  let accumulator = 0;
  for (const template of templates) {
    accumulator += Math.max(template.weight, 0);
    if (roll <= accumulator) {
      return template;
    }
  }
  return templates.at(-1) ?? null;
}

function deliverMailJob(
  state: GameState,
  scheduled: ScheduledMail,
  now: number,
  events: GameEvent[]
): MailMessage {
  const message: MailMessage = {
    id: scheduled.id,
    sender: scheduled.npcId,
    subject: scheduled.subject,
    body: scheduled.body,
    attachments: { ...scheduled.attachments },
    deliveredAtSeconds: now,
    read: false
  };
  state.mail.inbox.unshift(message);

  for (const [resource, amount] of Object.entries(scheduled.attachments)) {
    if (!amount) continue;
    const current = state.resources[resource] ?? 0;
    state.resources[resource] = current + amount;
  }

  state.resources.letters = (state.resources.letters ?? 0) + 1;

  const index = state.mail.scheduled.findIndex((entry) => entry.id === scheduled.id);
  if (index !== -1) {
    state.mail.scheduled.splice(index, 1);
  }

  events.push({
    type: 'mail.delivered',
    messageId: scheduled.id,
    attachments: { ...scheduled.attachments }
  });
  return message;
}

function removeJob(state: GameState, id: number) {
  const index = state.jobQueue.jobs.findIndex((job) => job.id === id);
  if (index !== -1) {
    state.jobQueue.jobs.splice(index, 1);
  }
}

function getTimelineSeconds(state: GameState): number {
  const day = Math.max(1, state.homestead.time.day);
  const secondsPerDay = state.homestead.time.secondsPerDay;
  return (day - 1) * secondsPerDay + state.homestead.time.elapsed;
}
