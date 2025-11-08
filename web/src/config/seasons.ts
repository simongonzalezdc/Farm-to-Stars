export enum SeasonId {
  Spring = 'spring',
  Summer = 'summer',
  Autumn = 'autumn',
  Winter = 'winter'
}

export interface SeasonVisualTheme {
  /** Hex string accepted by Phaser cameras */
  background: string;
  /** Tint applied to ground tiles */
  groundTint: number;
  /** Tint applied to placed props/structures */
  propTint: number;
  /** Overlay color drawn over the scene */
  overlayColor: number;
  /** Alpha channel for the overlay (0-1) */
  overlayAlpha: number;
  /** Emoji or short icon descriptor for HUD display */
  icon: string;
}

export interface SeasonMultipliers {
  /** Generic resource gain modifier. */
  resourceRate: number;
  /** Construction and crop growth speed modifier. */
  constructionSpeed: number;
  /** Economy modifier applied to automated production. */
  economy: number;
}

export interface SeasonDefinition {
  id: SeasonId;
  /** Localized display label. */
  label: string;
  /** Localized summary of gameplay effects. */
  summary: string;
  /** Duration of the season in in-game seconds. */
  durationSeconds: number;
  visuals: SeasonVisualTheme;
  multipliers: SeasonMultipliers;
}

export const SEASON_ORDER: SeasonId[] = [
  SeasonId.Spring,
  SeasonId.Summer,
  SeasonId.Autumn,
  SeasonId.Winter
];

export const DEFAULT_SEASON_ID = SEASON_ORDER[0];

export const SEASON_DEFINITIONS: Record<SeasonId, SeasonDefinition> = {
  [SeasonId.Spring]: {
    id: SeasonId.Spring,
    label: 'Spring Awakening',
    summary: '+20% growth speed, +10% resource yield.',
    durationSeconds: 180,
    visuals: {
      background: '#0e2017',
      groundTint: 0xa2f0c4,
      propTint: 0xffffff,
      overlayColor: 0x7fe0b8,
      overlayAlpha: 0.12,
      icon: '🌱'
    },
    multipliers: {
      resourceRate: 1.1,
      constructionSpeed: 1.2,
      economy: 1.05
    }
  },
  [SeasonId.Summer]: {
    id: SeasonId.Summer,
    label: 'Summer Zenith',
    summary: '+15% market value, steady growth.',
    durationSeconds: 180,
    visuals: {
      background: '#1b1f0e',
      groundTint: 0xfff2a8,
      propTint: 0xfff0d0,
      overlayColor: 0xffd966,
      overlayAlpha: 0.08,
      icon: '☀️'
    },
    multipliers: {
      resourceRate: 1.0,
      constructionSpeed: 1.0,
      economy: 1.15
    }
  },
  [SeasonId.Autumn]: {
    id: SeasonId.Autumn,
    label: 'Autumn Harvest',
    summary: '+10% market value, -10% growth speed.',
    durationSeconds: 180,
    visuals: {
      background: '#1f140b',
      groundTint: 0xffb680,
      propTint: 0xf7d1a6,
      overlayColor: 0xff9f5c,
      overlayAlpha: 0.14,
      icon: '🍂'
    },
    multipliers: {
      resourceRate: 0.95,
      constructionSpeed: 0.9,
      economy: 1.1
    }
  },
  [SeasonId.Winter]: {
    id: SeasonId.Winter,
    label: 'Winter Slumber',
    summary: '-40% growth speed, -30% yields.',
    durationSeconds: 180,
    visuals: {
      background: '#0e1420',
      groundTint: 0xc9d8ff,
      propTint: 0xdde7ff,
      overlayColor: 0x6aa8ff,
      overlayAlpha: 0.18,
      icon: '❄️'
    },
    multipliers: {
      resourceRate: 0.7,
      constructionSpeed: 0.6,
      economy: 0.85
    }
  }
};

export function getSeasonDefinition(id: SeasonId): SeasonDefinition {
  const def = SEASON_DEFINITIONS[id];
  if (!def) {
    throw new Error(`Unknown season: ${id}`);
  }
  return def;
}

export function getNextSeason(current: SeasonId): SeasonId {
  const index = SEASON_ORDER.indexOf(current);
  if (index === -1) {
    return DEFAULT_SEASON_ID;
  }
  return SEASON_ORDER[(index + 1) % SEASON_ORDER.length];
}

export function isSeasonId(value: unknown): value is SeasonId {
  return typeof value === 'string' && (SEASON_ORDER as string[]).includes(value);
}
