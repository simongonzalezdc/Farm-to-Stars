import perkContent from '../../../content/perks.json';
import { gameEvents, EVENT_TOOL_PERK_UNLOCKED, type ToolPerkUnlockedDetail } from '../../world';
import {
  type GameEvent,
  type GameState,
  type ToolId,
  type ToolMasteryState,
  type ToolPerkId,
  type ToolPerkProgress
} from '../../types';

export interface ToolPerkModifier {
  staminaCostMultiplier: number;
  staminaCostDelta: number;
  moistureDeltaBonus: number;
  yieldMultiplier: number;
}

export interface ToolPerkMilestone {
  type: 'uses';
  count: number;
  label: string;
}

export interface ToolPerkDefinition {
  id: ToolPerkId;
  toolId: ToolId;
  title: string;
  headline: string;
  description: string;
  milestone: ToolPerkMilestone;
  modifiers: Partial<ToolPerkModifier>;
}

interface ToolPerkContentFile {
  perks: ToolPerkDefinition[];
}

const DEFAULT_MODIFIER: ToolPerkModifier = {
  staminaCostMultiplier: 1,
  staminaCostDelta: 0,
  moistureDeltaBonus: 0,
  yieldMultiplier: 1
};

const rawContent = perkContent as ToolPerkContentFile;

export const TOOL_PERK_DEFINITIONS: readonly ToolPerkDefinition[] = rawContent.perks.map(
  (perk) => ({
    ...perk,
    modifiers: { ...perk.modifiers }
  })
);

const PERKS_BY_ID = new Map<ToolPerkId, ToolPerkDefinition>();
const PERKS_BY_TOOL = new Map<ToolId, ToolPerkDefinition[]>();

for (const perk of TOOL_PERK_DEFINITIONS) {
  PERKS_BY_ID.set(perk.id, perk);
  const list = PERKS_BY_TOOL.get(perk.toolId);
  if (list) {
    list.push(perk);
    list.sort((a, b) => a.milestone.count - b.milestone.count);
  } else {
    PERKS_BY_TOOL.set(perk.toolId, [perk]);
  }
}

export interface ToolUseResult {
  uses: number;
  unlocked: ToolPerkDefinition[];
  events: GameEvent[];
}

export function getPerksForTool(toolId: ToolId): readonly ToolPerkDefinition[] {
  return PERKS_BY_TOOL.get(toolId) ?? [];
}

export function getPerkById(perkId: ToolPerkId): ToolPerkDefinition | undefined {
  return PERKS_BY_ID.get(perkId);
}

export function ensureToolMasteryEntry(state: GameState, toolId: ToolId): ToolPerkProgress {
  const mastery = state.homestead.toolMastery;
  if (!mastery[toolId]) {
    mastery[toolId] = { uses: 0, unlocked: [] };
  }
  return mastery[toolId];
}

export function recordToolUse(state: GameState, toolId: ToolId, increment = 1): ToolUseResult {
  const step = Math.max(0, Math.floor(increment));
  const progress = ensureToolMasteryEntry(state, toolId);
  if (step > 0) {
    progress.uses += step;
  }

  const unlockedIds = new Set(progress.unlocked);
  const unlockedDefinitions: ToolPerkDefinition[] = [];
  const events: GameEvent[] = [];

  for (const perk of getPerksForTool(toolId)) {
    if (unlockedIds.has(perk.id)) {
      continue;
    }
    if (progress.uses >= perk.milestone.count) {
      unlockedIds.add(perk.id);
      unlockedDefinitions.push(perk);
      const event: GameEvent = {
        type: 'tool.perk.unlocked',
        perkId: perk.id,
        toolId,
        uses: progress.uses
      };
      events.push(event);
      const detail: ToolPerkUnlockedDetail = {
        perkId: perk.id,
        toolId,
        title: perk.title,
        headline: perk.headline,
        milestoneCount: perk.milestone.count,
        milestoneLabel: perk.milestone.label
      };
      gameEvents.dispatchEvent(new CustomEvent(EVENT_TOOL_PERK_UNLOCKED, { detail }));
    }
  }

  progress.unlocked = getPerksForTool(toolId)
    .filter((perk) => unlockedIds.has(perk.id))
    .map((perk) => perk.id);

  return { uses: progress.uses, unlocked: unlockedDefinitions, events };
}

export function getToolPerkModifiers(mastery: ToolMasteryState, toolId: ToolId): ToolPerkModifier {
  const base: ToolPerkModifier = { ...DEFAULT_MODIFIER };
  const progress = mastery[toolId];
  if (!progress || progress.unlocked.length === 0) {
    return base;
  }

  for (const perkId of progress.unlocked) {
    const perk = PERKS_BY_ID.get(perkId);
    if (!perk || perk.toolId !== toolId) {
      continue;
    }
    const modifiers = perk.modifiers ?? {};
    if (modifiers.staminaCostMultiplier != null) {
      base.staminaCostMultiplier = Math.min(
        base.staminaCostMultiplier,
        modifiers.staminaCostMultiplier
      );
    }
    if (modifiers.staminaCostDelta != null) {
      base.staminaCostDelta += modifiers.staminaCostDelta;
    }
    if (modifiers.moistureDeltaBonus != null) {
      base.moistureDeltaBonus += modifiers.moistureDeltaBonus;
    }
    if (modifiers.yieldMultiplier != null) {
      base.yieldMultiplier = Math.max(base.yieldMultiplier, modifiers.yieldMultiplier);
    }
  }

  return base;
}

export function getToolPerkModifiersFromState(state: GameState, toolId: ToolId): ToolPerkModifier {
  return getToolPerkModifiers(state.homestead.toolMastery, toolId);
}

export function resetToolMastery(state: GameState, toolId?: ToolId) {
  if (toolId) {
    state.homestead.toolMastery[toolId] = { uses: 0, unlocked: [] };
    return;
  }
  for (const key of Object.keys(state.homestead.toolMastery)) {
    state.homestead.toolMastery[key as ToolId] = { uses: 0, unlocked: [] };
  }
}
