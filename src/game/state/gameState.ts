import type { GamePhase, CivilizationId, ResourceId, DecisionRecord } from '../../ai/types';

export interface GameState {
  // Identity
  scenarioId: string;
  civilization: CivilizationId;
  
  // Progress
  phase: GamePhase;
  week: number;
  
  // Resources
  resources: Record<ResourceId, number>;
  population: number;
  populationCap: number;
  
  // History
  decisions: DecisionRecord[];
  eventsSeen: string[];
  
  // Unlocks
  unlockedBuildings: string[];
  unlockedTechnologies: string[];
  unlockedDecisions: string[];
  
  // Phase transition
  phaseProgress: PhaseProgress;
  
  // Save metadata
  createdAt: string;
  updatedAt: string;
}

export interface PhaseProgress {
  homestead: HomesteadProgress;
  township: TownshipProgress;
  nation: NationProgress;
  stellar: StellarProgress;
}

export interface HomesteadProgress {
  farmsBuilt: number;
  wellsBuilt: number;
  maxPopulationReached: number;
}

export interface TownshipProgress {
  districtsBuilt: number;
  utilitiesOperational: string[];
  zoningEstablished: boolean;
  maxPopulationReached: number;
}

export interface NationProgress {
  territoriesControlled: number;
  treatiesSigned: string[];
  researchCompleted: string[];
  maxPopulationReached: number;
}

export interface StellarProgress {
  coloniesEstablished: number;
  interstellarContacts: string[];
  wondersBuilt: string[];
  maxPopulationReached: number;
}

export function createInitialState(
  scenarioId: string,
  civilization: CivilizationId,
  startingResources: Record<string, number>,
  startingPopulation: number
): GameState {
  const now = new Date().toISOString();
  return {
    scenarioId,
    civilization,
    phase: 'homestead',
    week: 1,
    resources: {
      wood: startingResources.wood || 0,
      stone: startingResources.stone || 0,
      food: startingResources.food || 0,
      water: startingResources.water || 0,
      population: 0,
      research: 0,
      influence: startingResources.influence || 0,
    },
    population: startingPopulation,
    populationCap: startingPopulation * 2,
    decisions: [],
    eventsSeen: [],
    unlockedBuildings: [],
    unlockedTechnologies: [],
    unlockedDecisions: [],
    phaseProgress: {
      homestead: { farmsBuilt: 0, wellsBuilt: 0, maxPopulationReached: startingPopulation },
      township: { districtsBuilt: 0, utilitiesOperational: [], zoningEstablished: false, maxPopulationReached: 0 },
      nation: { territoriesControlled: 0, treatiesSigned: [], researchCompleted: [], maxPopulationReached: 0 },
      stellar: { coloniesEstablished: 0, interstellarContacts: [], wondersBuilt: [], maxPopulationReached: 0 },
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function canAdvancePhase(state: GameState): { can: boolean; reason?: string } {
  switch (state.phase) {
    case 'homestead':
      if (state.population < 50) return { can: false, reason: 'Need 50 population to advance' };
      if (state.week < 10) return { can: false, reason: 'Need at least 10 weeks of development' };
      return { can: true };
      
    case 'township':
      if (state.population < 200) return { can: false, reason: 'Need 200 population' };
      return { can: true };
      
    case 'nation':
      if (state.population < 1000) return { can: false, reason: 'Need 1000 population' };
      return { can: true };
      
    case 'stellar':
      return { can: false, reason: 'Already at maximum phase' };
      
    default:
      return { can: false, reason: 'Unknown phase' };
  }
}

export function advancePhase(state: GameState): GameState {
  const phases: GamePhase[] = ['homestead', 'township', 'nation', 'stellar'];
  const currentIndex = phases.indexOf(state.phase);
  if (currentIndex >= phases.length - 1) return state;
  
  return {
    ...state,
    phase: phases[currentIndex + 1],
    week: 1,
    updatedAt: new Date().toISOString(),
  };
}

export function applyResourceChanges(
  state: GameState,
  changes: Record<ResourceId, number>,
  populationChange: number
): GameState {
  const newResources = { ...state.resources };
  for (const [key, value] of Object.entries(changes)) {
    if (key in newResources) {
      newResources[key as ResourceId] = Math.max(0, (newResources[key as ResourceId] || 0) + value);
    }
  }
  
  const newPopulation = Math.max(0, state.population + populationChange);
  
  return {
    ...state,
    resources: newResources,
    population: newPopulation,
    populationCap: Math.max(state.populationCap, newPopulation * 1.5),
    phaseProgress: {
      ...state.phaseProgress,
      [state.phase]: {
        ...state.phaseProgress[state.phase],
        maxPopulationReached: Math.max(
          state.phaseProgress[state.phase].maxPopulationReached || 0,
          newPopulation
        ),
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function recordDecision(
  state: GameState,
  decisionId: string,
  choiceId: string,
  outcome: string
): GameState {
  return {
    ...state,
    decisions: [
      ...state.decisions,
      {
        week: state.week,
        decisionId,
        choiceId,
        outcome,
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function incrementWeek(state: GameState): GameState {
  return {
    ...state,
    week: state.week + 1,
    updatedAt: new Date().toISOString(),
  };
}
