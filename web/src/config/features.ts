export interface FeatureConfig {
  /** Guard for the Homestead → Township export prototype. */
  exportTownship: boolean;
}

type FeatureOverrides = Partial<FeatureConfig> | null | undefined;

const DEFAULT_FEATURES: FeatureConfig = {
  exportTownship: false
};

let cachedConfig: FeatureConfig | null = null;

const FEATURE_PREFIX = 'feature.';

function isFeatureFlag(flag: string): flag is keyof FeatureConfig {
  return Object.prototype.hasOwnProperty.call(DEFAULT_FEATURES, flag);
}

declare global {
  // eslint-disable-next-line no-var
  var __FARM_FEATURES__: Partial<FeatureConfig> | undefined;
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

function readQueryOverrides(): FeatureOverrides {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  const globalObj = globalThis as {
    window?: { location?: { search?: string } };
    location?: { search?: string };
  };

  const search = globalObj.window?.location?.search ?? globalObj.location?.search;
  if (typeof search !== 'string' || search.length === 0 || !search.includes('feature')) {
    return null;
  }

  if (typeof URLSearchParams === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(search);
  const overrides: Partial<FeatureConfig> = {};

  params.forEach((value, key) => {
    if (!key.toLowerCase().startsWith(FEATURE_PREFIX)) {
      return;
    }
    const flag = key.slice(FEATURE_PREFIX.length);
    if (!isFeatureFlag(flag)) {
      return;
    }
    overrides[flag] = toBoolean(value, DEFAULT_FEATURES[flag]);
  });

  return Object.keys(overrides).length > 0 ? overrides : null;
}

export function getFeatureConfig(): FeatureConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  const globalConfig = readGlobalOverrides();
  const queryOverrides = readQueryOverrides();
  cachedConfig = normalize({ ...(globalConfig ?? {}), ...(queryOverrides ?? {}) });
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

