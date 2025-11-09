/**
 * Heatmap Visualization System
 *
 * Renders visual overlays showing coverage, happiness, and demand
 */

import type { TownshipState } from '../../../types.township';
import type { UtilityNetwork } from './utilitiesPropagation';

export type HeatmapType = 'power' | 'water' | 'safety' | 'education' | 'happiness' | 'demand_r' | 'demand_c' | 'demand_i';

export interface HeatmapData {
  width: number;
  height: number;
  values: number[][]; // 0-1 normalized values
  type: HeatmapType;
}

export interface HeatmapColors {
  low: number; // Phaser color
  mid: number;
  high: number;
}

const HEATMAP_COLOR_SCHEMES: Record<HeatmapType, HeatmapColors> = {
  power: { low: 0x000033, mid: 0x0066ff, high: 0x00ccff },
  water: { low: 0x001a33, mid: 0x0099cc, high: 0x00ffff },
  safety: { low: 0x330000, mid: 0xff6600, high: 0xffcc00 },
  education: { low: 0x1a0033, mid: 0x6600cc, high: 0xcc66ff },
  happiness: { low: 0xff0000, mid: 0xffff00, high: 0x00ff00 },
  demand_r: { low: 0x220022, mid: 0x66ff66, high: 0x00ff00 }, // Residential green
  demand_c: { low: 0x002222, mid: 0x6666ff, high: 0x0000ff }, // Commercial blue
  demand_i: { low: 0x222200, mid: 0xffaa00, high: 0xff6600 }  // Industrial orange
};

/**
 * Heatmap Visualization System
 */
export class HeatmapVisualizationSystem {
  /**
   * Generate power coverage heatmap
   */
  public generatePowerHeatmap(network: UtilityNetwork): HeatmapData {
    return this.generateUtilityHeatmap(network.power, 'power');
  }

  /**
   * Generate water coverage heatmap
   */
  public generateWaterHeatmap(network: UtilityNetwork): HeatmapData {
    return this.generateUtilityHeatmap(network.water, 'water');
  }

  /**
   * Generate safety coverage heatmap
   */
  public generateSafetyHeatmap(network: UtilityNetwork): HeatmapData {
    return this.generateUtilityHeatmap(network.safety, 'safety');
  }

  /**
   * Generate education coverage heatmap
   */
  public generateEducationHeatmap(network: UtilityNetwork): HeatmapData {
    return this.generateUtilityHeatmap(network.education, 'education');
  }

  /**
   * Generate happiness heatmap
   */
  public generateHappinessHeatmap(state: TownshipState, network: UtilityNetwork): HeatmapData {
    const { width, height } = state.gridSize;
    const values: number[][] = [];

    for (let y = 0; y < height; y++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) {
        // Happiness based on coverage
        const hasPower = network.power[y]?.[x] || false;
        const hasWater = network.water[y]?.[x] || false;
        const hasSafety = network.safety[y]?.[x] || false;
        const hasEducation = network.education[y]?.[x] || false;

        // Count services
        const serviceCount = [hasPower, hasWater, hasSafety, hasEducation].filter(Boolean).length;

        // Normalize: 0-4 services -> 0-1
        const happiness = serviceCount / 4;

        row.push(happiness);
      }
      values.push(row);
    }

    return { width, height, values, type: 'happiness' };
  }

  /**
   * Generate residential demand heatmap
   */
  public generateResidentialDemandHeatmap(state: TownshipState): HeatmapData {
    return this.generateDemandHeatmap(state, state.metrics.demand.residential, 'demand_r');
  }

  /**
   * Generate commercial demand heatmap
   */
  public generateCommercialDemandHeatmap(state: TownshipState): HeatmapData {
    return this.generateDemandHeatmap(state, state.metrics.demand.commercial, 'demand_c');
  }

  /**
   * Generate industrial demand heatmap
   */
  public generateIndustrialDemandHeatmap(state: TownshipState): HeatmapData {
    return this.generateDemandHeatmap(state, state.metrics.demand.industrial, 'demand_i');
  }

  /**
   * Generate utility heatmap from boolean grid
   */
  private generateUtilityHeatmap(grid: boolean[][], type: HeatmapType): HeatmapData {
    const height = grid.length;
    const width = grid[0]?.length || 0;

    const values: number[][] = grid.map(row =>
      row.map(cell => cell ? 1 : 0)
    );

    return { width, height, values, type };
  }

  /**
   * Generate demand heatmap (uniform across entire grid)
   */
  private generateDemandHeatmap(state: TownshipState, demand: number, type: HeatmapType): HeatmapData {
    const { width, height } = state.gridSize;

    // Normalize demand from [-1, 1] to [0, 1]
    const normalizedDemand = (demand + 1) / 2;

    // Create uniform grid with demand value
    const values: number[][] = Array.from({ length: height }, () =>
      Array(width).fill(normalizedDemand)
    );

    return { width, height, values, type };
  }

  /**
   * Get color for a heatmap value
   */
  public getColorForValue(value: number, type: HeatmapType): number {
    const colors = HEATMAP_COLOR_SCHEMES[type];

    if (value < 0.5) {
      // Interpolate between low and mid
      return this.interpolateColor(colors.low, colors.mid, value * 2);
    } else {
      // Interpolate between mid and high
      return this.interpolateColor(colors.mid, colors.high, (value - 0.5) * 2);
    }
  }

  /**
   * Interpolate between two colors
   */
  private interpolateColor(color1: number, color2: number, t: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
  }

  /**
   * Get alpha value for heatmap overlay
   */
  public getAlphaForValue(value: number): number {
    // Vary alpha based on value (0.2 to 0.6)
    return 0.2 + value * 0.4;
  }
}
