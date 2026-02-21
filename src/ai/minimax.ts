import type { AIProvider, GameContext, Decision, EventResult, OutcomeResult } from './types';

interface MinimaxConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export class MinimaxProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private cache: Map<string, unknown> = new Map();

  constructor(config: MinimaxConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'MiniMax-Text-01';
    this.baseUrl = config.baseUrl || 'https://api.minimaxi.chat/v1/text/chatcompletion_v2';
  }

  async generateEvent(context: GameContext): Promise<EventResult> {
    const cacheKey = this.getEventCacheKey(context);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached as EventResult;

    const prompt = this.buildEventPrompt(context);
    const response = await this.callAPI(prompt);
    const result = this.parseEventResponse(response);
    
    this.cache.set(cacheKey, result);
    return result;
  }

  async resolveDecision(decision: Decision, context: GameContext): Promise<OutcomeResult> {
    const prompt = this.buildDecisionPrompt(decision, context);
    const response = await this.callAPI(prompt);
    return this.parseOutcomeResponse(response);
  }

  async generateNarrative(context: GameContext): Promise<string> {
    const prompt = this.buildNarrativePrompt(context);
    const response = await this.callAPI(prompt);
    return response.trim();
  }

  private async callAPI(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Minimax API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private getSystemPrompt(): string {
    return `You are the game master for Farm-to-Stars, a cozy grand strategy game about civilizations growing from homestead to interstellar. Generate narrative events and outcomes that are warm, evocative, and game-mechanically meaningful. Always respond in valid JSON.`;
  }

  private buildEventPrompt(context: GameContext): string {
    const history = context.history.slice(-5).map(h => 
      `Week ${h.week}: ${h.outcome}`
    ).join('\n');

    return JSON.stringify({
      instruction: 'Generate a game event',
      scenario: context.scenario.name,
      civilization: context.civilization,
      phase: context.phase,
      week: context.week,
      resources: context.resources,
      population: context.population,
      recentHistory: history || 'Just beginning',
      constraints: context.scenario.constraints,
    }, null, 2) + '\n\nRespond with JSON: { "title": string, "narrative": string (2-3 sentences), "choices": [{ "id": string, "text": string, "cost": { resource: number }? }] }';
  }

  private buildDecisionPrompt(decision: Decision, context: GameContext): string {
    return JSON.stringify({
      instruction: 'Resolve player decision',
      decision: decision.prompt,
      choice: decision.choices[0]?.text || 'Unknown',
      civilization: context.civilization,
      phase: context.phase,
      week: context.week,
      resources: context.resources,
    }, null, 2) + '\n\nRespond with JSON: { "narrative": string, "resourceChanges": { resource: number }, "populationChange": number, "nextEvent": string? }';
  }

  private buildNarrativePrompt(context: GameContext): string {
    return `Write a brief narrative summary for a ${context.civilization} civilization at ${context.phase} phase, week ${context.week}. Population: ${context.population}. Keep it cozy and evocative. One paragraph.`;
  }

  private parseEventResponse(response: string): EventResult {
    try {
      const parsed = JSON.parse(response);
      return {
        title: parsed.title || 'Event',
        narrative: parsed.narrative || 'Something happened.',
        choices: parsed.choices || [{ id: 'continue', text: 'Continue' }],
        illustration: parsed.illustration,
        followUp: parsed.followUp,
      };
    } catch {
      return {
        title: 'Unexpected Development',
        narrative: response.slice(0, 200),
        choices: [{ id: 'continue', text: 'Continue' }],
      };
    }
  }

  private parseOutcomeResponse(response: string): OutcomeResult {
    try {
      const parsed = JSON.parse(response);
      return {
        narrative: parsed.narrative || 'The decision has consequences.',
        resourceChanges: parsed.resourceChanges || {},
        populationChange: parsed.populationChange || 0,
        unlocks: parsed.unlocks,
        nextEvent: parsed.nextEvent,
        advancePhase: parsed.advancePhase,
      };
    } catch {
      return {
        narrative: response.slice(0, 200),
        resourceChanges: { wood: 0, stone: 0, food: 0, water: 0, population: 0, research: 0, influence: 0 },
        populationChange: 0,
      };
    }
  }

  private getEventCacheKey(context: GameContext): string {
    return `${context.scenario.id}-${context.phase}-${context.week}-${context.civilization}`;
  }
}

export function createAIProvider(config: { type: 'minimax', apiKey: string }): AIProvider {
  switch (config.type) {
    case 'minimax':
      return new MinimaxProvider({ apiKey: config.apiKey });
    default:
      throw new Error(`Unknown AI provider: ${config.type}`);
  }
}
