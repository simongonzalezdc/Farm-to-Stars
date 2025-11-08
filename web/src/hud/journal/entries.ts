import { TOOL_PERK_DEFINITIONS, type ToolPerkDefinition } from '../../sim/tools/perks';
import type { ToolId } from '../../types';

export interface JournalEntry {
  id: string;
  toolId: ToolId;
  title: string;
  summary: string;
  description: string;
  milestoneLabel: string;
  milestoneCount: number;
  category: 'perk';
}

function mapPerkToEntry(perk: ToolPerkDefinition): JournalEntry {
  return {
    id: `perk:${perk.id}`,
    toolId: perk.toolId,
    title: perk.title,
    summary: perk.headline,
    description: perk.description,
    milestoneLabel: perk.milestone.label,
    milestoneCount: perk.milestone.count,
    category: 'perk'
  };
}

export const JOURNAL_ENTRIES: readonly JournalEntry[] = TOOL_PERK_DEFINITIONS.map(mapPerkToEntry);

export function getJournalEntriesForTool(toolId: ToolId): JournalEntry[] {
  return JOURNAL_ENTRIES.filter((entry) => entry.toolId === toolId);
}
