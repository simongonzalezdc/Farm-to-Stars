import { getFeatureConfig, isFeatureEnabled, overrideFeatureConfig, resetFeatureConfig } from '../features';

describe('feature config', () => {
  afterEach(() => {
    overrideFeatureConfig(null);
    resetFeatureConfig();
    delete (globalThis as { __FARM_FEATURES__?: unknown }).__FARM_FEATURES__;
  });

  it('defaults to township export being disabled', () => {
    resetFeatureConfig();
    const config = getFeatureConfig();
    expect(config.exportTownship).toBe(false);
    expect(isFeatureEnabled('exportTownship')).toBe(false);
  });

  it('reads township export flag from global overrides', () => {
    resetFeatureConfig();
    (globalThis as { __FARM_FEATURES__?: unknown }).__FARM_FEATURES__ = { exportTownship: true };
    const config = getFeatureConfig();
    expect(config.exportTownship).toBe(true);
    expect(isFeatureEnabled('exportTownship')).toBe(true);
  });

  it('allows explicit overrides for tests', () => {
    overrideFeatureConfig({ exportTownship: true });
    expect(isFeatureEnabled('exportTownship')).toBe(true);

    overrideFeatureConfig({ exportTownship: false });
    expect(isFeatureEnabled('exportTownship')).toBe(false);
  });

  it('coerces string overrides when possible', () => {
    overrideFeatureConfig({ exportTownship: 'true' as unknown as boolean });
    expect(isFeatureEnabled('exportTownship')).toBe(true);

    overrideFeatureConfig({ exportTownship: 'false' as unknown as boolean });
    expect(isFeatureEnabled('exportTownship')).toBe(false);
  });
});

