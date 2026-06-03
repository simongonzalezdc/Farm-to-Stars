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
  weather: SeasonWeatherProfile;
}

export interface SeasonWeatherProfile {
  /** Probability (0-1) of a rainy segment when rolling weather. */
  rainChance: number;
  /** Probability (0-1) of a storm; applied after rain chance. */
  stormChance: number;
  /** Minimum simulated seconds before rerolling weather. */
  minDurationSeconds: number;
  /** Maximum simulated seconds before rerolling weather. */
  maxDurationSeconds: number;
  /** Soil evaporation rate applied every simulated second when no precipitation occurs. */
  evaporationPerSecond: number;
  /** Moisture added per second while raining. */
  rainPrecipitationPerSecond: number;
  /** Moisture added per second while storming. */
  stormPrecipitationPerSecond: number;
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
    summary: '+25% gather, +30% build speed, gentle rains improve soil.',
    durationSeconds: 150,
    visuals: {
      background: '#203826',
      groundTint: 0xbdf7d4,
      propTint: 0xf5fff8,
      overlayColor: 0x7fe0b8,
      overlayAlpha: 0.1,
      icon: '🌱'
    },
    multipliers: {
      resourceRate: 1.25,
      constructionSpeed: 1.3,
      economy: 1.1
    },
    weather: {
      rainChance: 0.4,
      stormChance: 0.14,
      minDurationSeconds: 110,
      maxDurationSeconds: 240,
      evaporationPerSecond: 0.0035,
      rainPrecipitationPerSecond: 0.03,
      stormPrecipitationPerSecond: 0.045
    }
  },
  [SeasonId.Summer]: {
    id: SeasonId.Summer,
    label: 'Summer Zenith',
    summary: '+12% gather, +18% sell value with brighter afternoons.',
    durationSeconds: 150,
    visuals: {
      background: '#2f3317',
      groundTint: 0xffed9e,
      propTint: 0xfff5d8,
      overlayColor: 0xffd966,
      overlayAlpha: 0.07,
      icon: '☀️'
    },
    multipliers: {
      resourceRate: 1.12,
      constructionSpeed: 1.0,
      economy: 1.18
    },
    weather: {
      rainChance: 0.24,
      stormChance: 0.09,
      minDurationSeconds: 120,
      maxDurationSeconds: 280,
      evaporationPerSecond: 0.005,
      rainPrecipitationPerSecond: 0.022,
      stormPrecipitationPerSecond: 0.034
    }
  },
  [SeasonId.Autumn]: {
    id: SeasonId.Autumn,
    label: 'Autumn Harvest',
    summary: 'Steady yields, -8% build speed, +10% sell value.',
    durationSeconds: 150,
    visuals: {
      background: '#362315',
      groundTint: 0xffb680,
      propTint: 0xf9d6af,
      overlayColor: 0xff9f5c,
      overlayAlpha: 0.12,
      icon: '🍂'
    },
    multipliers: {
      resourceRate: 1.05,
      constructionSpeed: 0.92,
      economy: 1.1
    },
    weather: {
      rainChance: 0.34,
      stormChance: 0.12,
      minDurationSeconds: 115,
      maxDurationSeconds: 250,
      evaporationPerSecond: 0.0038,
      rainPrecipitationPerSecond: 0.026,
      stormPrecipitationPerSecond: 0.04
    }
  },
  [SeasonId.Winter]: {
    id: SeasonId.Winter,
    label: 'Winter Slumber',
    summary: '-12% gather, -22% build speed, -8% sell value.',
    durationSeconds: 150,
    visuals: {
      background: '#1b2f46',
      groundTint: 0xd3e3ff,
      propTint: 0xe1ecff,
      overlayColor: 0x6aa8ff,
      overlayAlpha: 0.15,
      icon: '❄️'
    },
    multipliers: {
      resourceRate: 0.88,
      constructionSpeed: 0.78,
      economy: 0.92
    },
    weather: {
      rainChance: 0.2,
      stormChance: 0.08,
      minDurationSeconds: 130,
      maxDurationSeconds: 280,
      evaporationPerSecond: 0.0022,
      rainPrecipitationPerSecond: 0.02,
      stormPrecipitationPerSecond: 0.032
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
