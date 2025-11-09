export interface FeatureConfig {
  /** Guard for the Homestead → Township export prototype. */
  exportTownship: boolean;
}

type FeatureOverrides = Partial<FeatureConfig> | null | undefined;

const DEFAULT_FEATURES: FeatureConfig = {
  exportTownship: false
};

let cachedConfig: FeatureConfig | null = null;

declare global {
  // eslint-disable-next-line no-var
  var __FARM_FEATURES__?: Partial<FeatureConfig>;
  interface Window {
    __FARM_FEATURES__?: Partial<FeatureConfig>;
  }
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      if (value === 1) return true;
      if (value === 0) return false;
    }
  }
  return fallback;
}

function normalize(overrides?: FeatureOverrides): FeatureConfig {
  const source = (overrides ?? {}) as Partial<FeatureConfig>;
  return {
    exportTownship: toBoolean(source.exportTownship, DEFAULT_FEATURES.exportTownship)
  };
}

function readGlobalOverrides(): FeatureOverrides {
  if (typeof globalThis === 'undefined') {
    return null;
  }
  const candidate = (globalThis as { __FARM_FEATURES__?: FeatureOverrides }).__FARM_FEATURES__;
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  return candidate;
}

export function getFeatureConfig(): FeatureConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  const globalConfig = readGlobalOverrides();
  cachedConfig = normalize(globalConfig);
  return cachedConfig;
}

export function isFeatureEnabled<K extends keyof FeatureConfig>(flag: K): boolean {
  const config = getFeatureConfig();
  return Boolean(config[flag]);
}

export function overrideFeatureConfig(overrides?: FeatureOverrides) {
  cachedConfig = normalize(overrides);
}

export function resetFeatureConfig() {
  cachedConfig = null;
}

