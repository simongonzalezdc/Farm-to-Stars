import type { AIProvider, GameContext, Decision } from '../../ai/types';
import type { GameState } from '../state/gameState';
import type { ScenarioDefinition } from '../scenario/loader';
import { canAdvancePhase, advancePhase } from '../state/gameState';

export interface DecisionEngine {
  presentEvent(scenario: ScenarioDefinition, state: GameState): Promise<PresentedEvent>;
  makeChoice(
    scenario: ScenarioDefinition,
    state: GameState,
    decisionId: string,
    choiceId: string
  ): Promise<DecisionOutcome>;
  checkAdvancement(state: GameState): AdvancementStatus;
}

export interface PresentedEvent {
  id: string;
  title: string;
  narrative: string;
  choices: Array<{
    id: string;
    text: string;
    disabled?: boolean;
    disabledReason?: string;
  }>;
  illustration?: string;
}

export interface DecisionOutcome {
  narrative: string;
  resourceChanges: Record<string, number>;
  populationChange: number;
  newState: GameState;
  nextEventId?: string;
  phaseAdvanced: boolean;
  advancementAvailable: boolean;
}

export interface AdvancementStatus {
  available: boolean;
  currentPhase: string;
  nextPhase?: string;
  requirements: string[];
  met: string[];
  unmet: string[];
}

export function createDecisionEngine(ai: AIProvider): DecisionEngine {
  return {
    async presentEvent(scenario, state) {
      const context = buildGameContext(scenario, state);
      const event = await ai.generateEvent(context);
      
      return {
        id: `event-${Date.now()}`,
        title: event.title,
        narrative: event.narrative,
        choices: event.choices.map(c => ({
          id: c.id,
          text: c.text,
          disabled: false,
        })),
        illustration: event.illustration,
      };
    },

    async makeChoice(scenario, state, decisionId, choiceId) {
      const decision: Decision = {
        id: decisionId,
        type: 'allocation',
        prompt: 'Player made a choice',
        choices: [{ id: choiceId, text: choiceId }],
      };
      
      const context = buildGameContext(scenario, state);
      const outcome = await ai.resolveDecision(decision, context);
      
      // Apply changes to state
      let newState = state;
      
      // Record the decision
      newState = {
        ...newState,
        decisions: [
          ...newState.decisions,
          {
            week: state.week,
            decisionId,
            choiceId,
            outcome: outcome.narrative.slice(0, 100),
          },
        ],
      };
      
      // Apply resource changes
      for (const [resource, change] of Object.entries(outcome.resourceChanges)) {
        newState = {
          ...newState,
          resources: {
            ...newState.resources,
            [resource]: Math.max(0, (newState.resources[resource as keyof typeof newState.resources] || 0) + change),
          },
        };
      }
      
      // Apply population change
      newState = {
        ...newState,
        population: Math.max(0, newState.population + outcome.populationChange),
      };
      
      // Increment week
      newState = {
        ...newState,
        week: newState.week + 1,
      };
      
      // Check for phase advancement
      const advancement = canAdvancePhase(newState);
      const phaseAdvanced = outcome.advancePhase && advancement.can;
      
      if (phaseAdvanced) {
        newState = advancePhase(newState);
      }
      
      return {
        narrative: outcome.narrative,
        resourceChanges: outcome.resourceChanges,
        populationChange: outcome.populationChange,
        newState,
        nextEventId: outcome.nextEvent,
        phaseAdvanced: phaseAdvanced || false,
        advancementAvailable: advancement.can,
      };
    },

    checkAdvancement(state) {
      const check = canAdvancePhase(state);
      
      const phases = ['homestead', 'township', 'nation', 'stellar'];
      const currentIndex = phases.indexOf(state.phase);
      const nextPhase = currentIndex < phases.length - 1 ? phases[currentIndex + 1] : undefined;
      
      return {
        available: check.can,
        currentPhase: state.phase,
        nextPhase,
        requirements: getPhaseRequirements(state.phase),
        met: check.can ? getPhaseRequirements(state.phase) : [],
        unmet: check.can ? [] : [check.reason || 'Requirements not met'],
      };
    },
  };
}

function buildGameContext(scenario: ScenarioDefinition, state: GameState): GameContext {
  return {
    scenario: {
      id: scenario.id,
      name: scenario.name,
      civilization: scenario.civilization,
      startingPhase: scenario.startingPhase,
      prompt: scenario.prompt,
      constraints: scenario.constraints,
      victory: scenario.victory,
    },
    civilization: scenario.civilization,
    phase: state.phase,
    week: state.week,
    resources: state.resources,
    population: state.population,
    history: state.decisions.slice(-5),
  };
}

function getPhaseRequirements(phase: string): string[] {
  switch (phase) {
    case 'homestead':
      return ['Population 50+', 'Week 10+'];
    case 'township':
      return ['Population 200+'];
    case 'nation':
      return ['Population 1000+'];
    default:
      return [];
  }
}
