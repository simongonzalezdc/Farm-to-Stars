import type { QuestObjective } from '../hud/quests/QuestLog';

export type QuestMetricId = 'readyCrops' | 'wellFedLivestock' | 'letters';

export interface QuestObjectiveDefinition {
  id: string;
  /** Short description shown in the quest log. */
  description: string;
  /** Identifier describing which in-game metric powers progress for the objective. */
  metric: QuestMetricId;
  /** Progress target required to complete the objective. */
  target: number;
  /** Optional objectives do not count toward the completion threshold. */
  optional?: boolean;
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  /** Inclusive day index when the quest becomes visible. */
  unlockDay: number;
  objectives: QuestObjectiveDefinition[];
  rewards?: string[];
  pinned?: boolean;
}

export const HOMESTEAD_QUESTS: QuestDefinition[] = [
  {
    id: 'quest:harvest',
    title: 'Homestead Harvest',
    description: 'Harvest ripe crops to restock the pantry before the weekly market.',
    unlockDay: 1,
    objectives: [
      {
        id: 'harvest',
        description: 'Harvest ripe crops',
        metric: 'readyCrops',
        target: 5
      }
    ],
    rewards: ['Pantry stockpile unlocked', '+5 festival reputation'],
    pinned: true
  },
  {
    id: 'quest:herd',
    title: 'Settle the Herd',
    description: 'Keep the livestock well fed to prepare for the caravan drop-off.',
    unlockDay: 2,
    objectives: [
      {
        id: 'livestock',
        description: 'Well-fed animals',
        metric: 'wellFedLivestock',
        target: 3
      }
    ],
    rewards: ['Daily milk stipend', 'Livestock mastery XP']
  },
  {
    id: 'quest:post',
    title: 'Postal Routine',
    description: 'Bank letters from town to earn the mayor’s trust.',
    unlockDay: 3,
    objectives: [
      {
        id: 'letters',
        description: 'Letters collected',
        metric: 'letters',
        target: 2
      }
    ],
    rewards: ['Festival invite', 'Trader discount']
  }
];

export type QuestObjectiveProgress = Pick<QuestObjective, 'current' | 'target' | 'optional'>;
