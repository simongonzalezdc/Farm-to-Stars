import { describe, expect, it } from 'vitest';

import { defaultState } from '../../../types';
import { gameEvents, EVENT_TOOL_PERK_UNLOCKED, type ToolPerkUnlockedDetail } from '../../../world';
import {
  TOOL_PERK_DEFINITIONS,
  getToolPerkModifiers,
  recordToolUse,
  resetToolMastery
} from '../perks';

describe('tool proficiency perks', () => {
  it('unlocks perks at milestone thresholds and emits bus events', () => {
    const state = defaultState();
    const apprentice = TOOL_PERK_DEFINITIONS.find((perk) => perk.id === 'tool.hoe.apprentice');
    expect(apprentice).toBeDefined();
    if (!apprentice) return;

    const captured: ToolPerkUnlockedDetail[] = [];
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToolPerkUnlockedDetail>).detail;
      captured.push(detail);
    };
    gameEvents.addEventListener(EVENT_TOOL_PERK_UNLOCKED, handler);

    try {
      const result = recordToolUse(state, 'hoe', apprentice.milestone.count);
      expect(result.unlocked.map((perk) => perk.id)).toEqual([apprentice.id]);
      expect(result.events).toEqual([
        {
          type: 'tool.perk.unlocked',
          perkId: apprentice.id,
          toolId: 'hoe',
          uses: apprentice.milestone.count
        }
      ]);
      expect(state.homestead.toolMastery.hoe).toEqual({
        uses: apprentice.milestone.count,
        unlocked: [apprentice.id]
      });
      expect(captured).toHaveLength(1);
      expect(captured[0]).toMatchObject({
        perkId: apprentice.id,
        toolId: 'hoe',
        milestoneCount: apprentice.milestone.count
      });
    } finally {
      gameEvents.removeEventListener(EVENT_TOOL_PERK_UNLOCKED, handler);
    }
  });

  it('applies the strongest modifier values from unlocked perks', () => {
    const state = defaultState();
    const hoePerks = TOOL_PERK_DEFINITIONS.filter((perk) => perk.toolId === 'hoe');
    expect(hoePerks.length).toBeGreaterThan(0);

    for (const perk of hoePerks) {
      recordToolUse(state, 'hoe', perk.milestone.count);
    }

    const modifiers = getToolPerkModifiers(state.homestead.toolMastery, 'hoe');
    expect(modifiers.staminaCostMultiplier).toBeCloseTo(0.8, 5);
    expect(modifiers.staminaCostDelta).toBe(-1);
    expect(modifiers.moistureDeltaBonus).toBe(0);
    expect(modifiers.yieldMultiplier).toBe(1);
  });

  it('resets mastery data for all tools', () => {
    const state = defaultState();
    recordToolUse(state, 'hoe', 10);
    recordToolUse(state, 'wateringCan', 5);

    expect(Object.keys(state.homestead.toolMastery).length).toBeGreaterThan(0);
    resetToolMastery(state);
    for (const progress of Object.values(state.homestead.toolMastery)) {
      expect(progress).toEqual({ uses: 0, unlocked: [] });
    }
  });
});
