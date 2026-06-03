/**
 * Demand Calculation System
 *
 * Calculates RCI (Residential, Commercial, Industrial) demand based on city state
 */

import type { TownshipState } from '../../../types.township';
import type { BuildingsTable } from '../data/buildingsLoader';

export interface DemandFactors {
  residential: {
    unemployment: number; // -1 to +1
    happiness: number; // -1 to +1
    coverage: number; // -1 to +1
  };
  commercial: {
    population: number; // -1 to +1
    residentialRatio: number; // -1 to +1
  };
  industrial: {
    employment: number; // -1 to +1
    commercialRatio: number; // -1 to +1
  };
}

/**
 * Demand Calculation System
 *
 * Dynamically updates RCI demand based on city metrics
 */
export class DemandCalculationSystem {
  /**
   * Calculate RCI demand for the current city state
   */
  public calculateDemand(
    state: TownshipState,
    buildings: BuildingsTable
  ): TownshipState['metrics']['demand'] {
    const factors = this.calculateFactors(state, buildings);

    // Residential demand
    const residentialDemand = this.calculateResidentialDemand(state, factors);

    // Commercial demand
    const commercialDemand = this.calculateCommercialDemand(state, factors);

    // Industrial demand
    const industrialDemand = this.calculateIndustrialDemand(state, factors);

    return {
      residential: this.clampDemand(residentialDemand),
      commercial: this.clampDemand(commercialDemand),
      industrial: this.clampDemand(industrialDemand)
    };
  }

  /**
   * Calculate demand factors from city state
   */
  private calculateFactors(state: TownshipState, buildings: BuildingsTable): DemandFactors {
    const { population, metrics } = state;

    // Unemployment factor
    const unemploymentRate = population.total > 0 ? population.unemployed / population.total : 0;
    const unemploymentFactor = this.normalize(unemploymentRate, 0, 0.4, -1, 1, true); // High unemployment = bad

    // Happiness factor
    const happinessFactor = this.normalize(metrics.happiness.overall, 0, 100, -1, 1, false);

    // Coverage factor (average of all utilities)
    const avgCoverage =
      (metrics.coverage.power +
        metrics.coverage.water +
        metrics.coverage.safety +
        metrics.coverage.education) /
      4;
    const coverageFactor = this.normalize(avgCoverage, 0, 100, -1, 1, false);

    // Population factor for commercial demand
    const populationFactor = this.normalize(population.total, 0, 2000, -1, 1, false);

    // Zone distribution factors
    const zoneDistribution = metrics.zoneDistribution;
    const totalZones =
      zoneDistribution.residential +
      zoneDistribution.commercial +
      zoneDistribution.industrial +
      zoneDistribution.mixed;

    const residentialRatio = totalZones > 0 ? zoneDistribution.residential / totalZones : 0;
    const commercialRatio = totalZones > 0 ? zoneDistribution.commercial / totalZones : 0;
    const industrialRatio = totalZones > 0 ? zoneDistribution.industrial / totalZones : 0;

    // Employment-need factor for industrial demand.
    const employmentNeed = population.total > 0 ? population.unemployed / population.total : 0;
    const employmentFactor = this.normalize(employmentNeed, 0, 0.5, -1, 1, false);

    return {
      residential: {
        unemployment: unemploymentFactor,
        happiness: happinessFactor,
        coverage: coverageFactor
      },
      commercial: {
        population: populationFactor,
        residentialRatio: this.normalize(residentialRatio, 0.2, 0.5, -1, 1, false)
      },
      industrial: {
        employment: employmentFactor,
        commercialRatio: this.normalize(commercialRatio, 0.1, 0.3, -1, 1, false)
      }
    };
  }

  /**
   * Calculate residential demand
   *
   * High when:
   * - Low unemployment (jobs available)
   * - High happiness
   * - Good utility coverage
   */
  private calculateResidentialDemand(state: TownshipState, factors: DemandFactors): number {
    const { unemployment, happiness, coverage } = factors.residential;

    // Weighted average
    const demand =
      unemployment * 0.4 + // Jobs are important
      happiness * 0.3 + // Happiness matters
      coverage * 0.3; // Utilities matter

    // Bonus for low population (early game boost)
    const populationBonus =
      state.population.total < 500 ? 0.4 : state.population.total < 1000 ? 0.15 : 0;

    return demand + populationBonus;
  }

  /**
   * Calculate commercial demand
   *
   * High when:
   * - Population is growing
   * - Good residential/commercial ratio
   */
  private calculateCommercialDemand(state: TownshipState, factors: DemandFactors): number {
    const { population, residentialRatio } = factors.commercial;

    // Weighted average
    const demand =
      population * 0.5 + // Population drives commerce
      residentialRatio * 0.5; // Need residential base

    // Penalty if too much commercial already
    const commercialCount = state.zones.filter((z) => z.type === 'commercial').length;
    const residentialCount = state.zones.filter((z) => z.type === 'residential').length;

    if (commercialCount > residentialCount * 0.4) {
      return demand - 0.3;
    }

    return demand;
  }

  /**
   * Calculate industrial demand
   *
   * High when:
   * - Need more jobs (high unemployment)
   * - Commercial sector needs goods
   */
  private calculateIndustrialDemand(state: TownshipState, factors: DemandFactors): number {
    const { employment, commercialRatio } = factors.industrial;

    // Weighted average
    const demand =
      employment * 0.6 + // Employment need drives industry
      commercialRatio * 0.4; // Commerce needs industrial goods

    // Penalty if too much industrial (pollution concern)
    const zoneDistribution = state.metrics.zoneDistribution;
    const industrialCount = zoneDistribution.industrial;
    const totalZones =
      zoneDistribution.residential +
      zoneDistribution.commercial +
      zoneDistribution.industrial +
      zoneDistribution.mixed;

    if (totalZones > 0 && industrialCount / totalZones > 0.3) {
      return demand - 0.4; // Heavy penalty for pollution
    }

    return demand;
  }

  /**
   * Normalize a value from one range to another
   */
  private normalize(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
    invert: boolean = false
  ): number {
    let normalized = ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;

    if (invert) {
      normalized = outMax + outMin - normalized;
    }

    return Math.max(outMin, Math.min(outMax, normalized));
  }

  /**
   * Clamp demand to valid range [-1, 1]
   */
  private clampDemand(demand: number): number {
    return Math.max(-1, Math.min(1, demand));
  }
}
