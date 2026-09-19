import { getMinimaxApiKey, STORAGE_KEY } from './key';
import { createAIProvider } from './minimax';
import type { AIProvider } from './types';

export type {
  AIProvider,
  GameContext,
  Decision,
  Choice,
  EventResult,
  OutcomeResult,
  DecisionRecord,
  CivilizationId,
  GamePhase,
  ResourceId,
  Scenario,
  VictoryCondition,
  GameEvent,
  Requirement,
} from './types';
export { MinimaxProvider, createAIProvider } from './minimax';
export { getMinimaxApiKey, STORAGE_KEY } from './key';

/**
 * Feature-gated provider factory (security fix 2026-09-19).
 *
 * Constructs the MiniMax provider ONLY when a key was supplied at runtime by
 * the user (BYOK via localStorage — see ./key). No hardcoded keys, no
 * build-time-baked keys, and ZERO API calls while unconfigured, so a dormant
 * deployment can never spend or leak.
 */
export function createConfiguredAIProvider(): AIProvider {
  const apiKey = getMinimaxApiKey();
  if (!apiKey) {
    throw new Error(
      `AI features are disabled: no MiniMax API key configured. ` +
      `Supply your own key at runtime via localStorage "${STORAGE_KEY}" ` +
      `(keys are never bundled into this app).`,
    );
  }
  return createAIProvider({ type: 'minimax', apiKey });
}
