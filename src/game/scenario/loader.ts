import type { GamePhase, VictoryCondition } from '../../ai/types';

export interface ScenarioDefinition {
  id: string;
  name: string;
  civilization: 'solar' | 'celestial' | 'merchant' | 'mesa' | 'pioneer';
  startingPhase: GamePhase;
  prompt: string;
  description: string;
  difficulty: 'easy' | 'normal' | 'hard';
  constraints: Record<string, unknown>;
  victory: VictoryCondition[];
  startingResources: Record<string, number>;
  startingPopulation: number;
  estimatedWeeks: number;
  author: string;
  tags: string[];
}

export function loadScenario(id: string): ScenarioDefinition | null {
  const scenarios = getOfficialScenarios();
  return scenarios.find(s => s.id === id) || null;
}

export function getOfficialScenarios(): ScenarioDefinition[] {
  return [
    {
      id: 'solar-awakening',
      name: 'The Solar Awakening',
      civilization: 'solar',
      startingPhase: 'homestead',
      prompt: 'Your people have always followed the sun. Now, as you settle this new land, ancient knowledge stirs. Build a homestead that honors the Solar ancestors, and lay the foundation for something greater.',
      description: 'A warm, community-focused scenario emphasizing festivals, innovation, and solar-powered progress.',
      difficulty: 'normal',
      constraints: {
        solar_bonus: true,
        festival_frequency: 'high',
      },
      victory: [
        { type: 'population', target: 100, phase: 'township' },
        { type: 'building', target: 'solar_temple', phase: 'township' },
      ],
      startingResources: { wood: 50, stone: 30, food: 100, water: 50 },
      startingPopulation: 10,
      estimatedWeeks: 24,
      author: 'Farm-to-Stars Team',
      tags: ['beginner', 'cozy', 'community'],
    },
    {
      id: 'mesa-cliff-dwellers',
      name: 'The Cliff Dwellers',
      civilization: 'mesa',
      startingPhase: 'homestead',
      prompt: 'Water is scarce in the canyon, but stone is abundant. Your ancestors built cliff dwellings that stood for centuries. Can you honor their legacy while building something new?',
      description: 'A challenging scenario focused on sustainability, water management, and vertical construction.',
      difficulty: 'hard',
      constraints: {
        water_scarcity: true,
        stone_abundance: true,
        vertical_building: true,
      },
      victory: [
        { type: 'population', target: 80, phase: 'township' },
        { type: 'building', target: 'cliff_palace', phase: 'township' },
      ],
      startingResources: { wood: 20, stone: 100, food: 60, water: 20 },
      startingPopulation: 8,
      estimatedWeeks: 28,
      author: 'Farm-to-Stars Team',
      tags: ['challenging', 'sustainability', 'history'],
    },
    {
      id: 'merchant-gambit',
      name: 'The Merchant\'s Gambit',
      civilization: 'merchant',
      startingPhase: 'homestead',
      prompt: 'You arrived with nothing but a cart of goods and sharp wits. Trade is in your blood. Build connections, make deals, and turn this humble homestead into a trading hub.',
      description: 'A commerce-focused scenario with risk/reward decisions and diplomatic opportunities.',
      difficulty: 'normal',
      constraints: {
        trade_bonus: true,
        market_unlocked: 'early',
        diplomatic_events: 'frequent',
      },
      victory: [
        { type: 'population', target: 120, phase: 'township' },
        { type: 'research', target: 'trade_routes', phase: 'township' },
      ],
      startingResources: { wood: 40, stone: 40, food: 80, water: 40, influence: 20 },
      startingPopulation: 12,
      estimatedWeeks: 22,
      author: 'Farm-to-Stars Team',
      tags: ['diplomacy', 'trade', 'replayable'],
    },
    {
      id: 'celestial-navigation',
      name: 'Celestial Navigation',
      civilization: 'celestial',
      startingPhase: 'homestead',
      prompt: 'Your people have always read the stars. Now you must read the land. Apply the precision of astronomical study to the chaos of nature. Plan carefully, and the heavens will guide you.',
      description: 'A strategic scenario emphasizing planning, timing, and long-term thinking.',
      difficulty: 'normal',
      constraints: {
        planning_bonus: true,
        season_forecast: 'accurate',
        timing_events: true,
      },
      victory: [
        { type: 'population', target: 100, phase: 'township' },
        { type: 'research', target: 'observatory', phase: 'township' },
      ],
      startingResources: { wood: 60, stone: 40, food: 90, water: 60 },
      startingPopulation: 10,
      estimatedWeeks: 24,
      author: 'Farm-to-Stars Team',
      tags: ['strategy', 'planning', 'zen'],
    },
    {
      id: 'pioneer-spirit',
      name: 'The Pioneer Spirit',
      civilization: 'pioneer',
      startingPhase: 'homestead',
      prompt: 'The frontier calls. You are the first to settle this wild land. Resources are plentiful but so are dangers. Adapt, expand, and forge a new path where none existed before.',
      description: 'An expansion-focused scenario with exploration, adaptation, and growth challenges.',
      difficulty: 'easy',
      constraints: {
        expansion_bonus: true,
        resource_abundance: true,
        exploration_events: true,
      },
      victory: [
        { type: 'population', target: 150, phase: 'township' },
        { type: 'building', target: 'frontier_outpost', phase: 'township' },
      ],
      startingResources: { wood: 80, stone: 50, food: 120, water: 80 },
      startingPopulation: 15,
      estimatedWeeks: 20,
      author: 'Farm-to-Stars Team',
      tags: ['beginner', 'expansion', 'discovery'],
    },
  ];
}

export function validateScenario(def: unknown): def is ScenarioDefinition {
  if (typeof def !== 'object' || def === null) return false;
  const s = def as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.prompt === 'string' &&
    ['solar', 'celestial', 'merchant', 'mesa', 'pioneer'].includes(s.civilization as string)
  );
}
