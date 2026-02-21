export interface AIProvider {
  generateEvent(context: GameContext): Promise<EventResult>;
  resolveDecision(decision: Decision, context: GameContext): Promise<OutcomeResult>;
  generateNarrative(context: GameContext): Promise<string>;
}

export interface GameContext {
  scenario: Scenario;
  civilization: CivilizationId;
  phase: GamePhase;
  week: number;
  resources: Record<ResourceId, number>;
  population: number;
  history: DecisionRecord[];
  currentEvent?: GameEvent;
}

export interface Decision {
  id: string;
  type: 'allocation' | 'diplomatic' | 'crisis' | 'research' | 'transition';
  prompt: string;
  choices: Choice[];
}

export interface Choice {
  id: string;
  text: string;
  cost?: Record<ResourceId, number>;
  requirements?: Requirement[];
}

export interface EventResult {
  title: string;
  narrative: string;
  choices: Choice[];
  illustration?: string;
  followUp?: string;
}

export interface OutcomeResult {
  narrative: string;
  resourceChanges: Record<ResourceId, number>;
  populationChange: number;
  unlocks?: string[];
  nextEvent?: string;
  advancePhase?: boolean;
}

export interface DecisionRecord {
  week: number;
  decisionId: string;
  choiceId: string;
  outcome: string;
}

export type CivilizationId = 'solar' | 'celestial' | 'merchant' | 'mesa' | 'pioneer';
export type GamePhase = 'homestead' | 'township' | 'nation' | 'stellar';
export type ResourceId = 'wood' | 'stone' | 'food' | 'water' | 'population' | 'research' | 'influence';

export interface Scenario {
  id: string;
  name: string;
  civilization: CivilizationId;
  startingPhase: GamePhase;
  prompt: string;
  constraints: Record<string, unknown>;
  victory: VictoryCondition[];
}

export interface VictoryCondition {
  type: 'population' | 'building' | 'research' | 'diplomatic';
  target: number | string;
  phase: GamePhase;
}

export interface GameEvent {
  id: string;
  title: string;
  narrative: string;
  choices: Choice[];
}

export interface Requirement {
  type: 'resource' | 'phase' | 'building' | 'week';
  key: string;
  value: number | string;
  operator: 'gte' | 'lte' | 'eq' | 'has';
}
