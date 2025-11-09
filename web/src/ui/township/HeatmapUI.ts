/**
 * Heatmap UI
 *
 * Controls for toggling heatmap overlays
 */

import type { TownshipController } from './TownshipController';
import type { HeatmapType } from '../../sim/township/systems/heatmapVisualization';

export interface HeatmapUIConfig {
  container: HTMLElement;
  controller: TownshipController;
  onHeatmapToggle: (type: HeatmapType | null) => void;
}

/**
 * Heatmap UI Component
 */
export class HeatmapUI {
  private container: HTMLElement;
  private controller: TownshipController;
  private onHeatmapToggle: (type: HeatmapType | null) => void;
  private activeHeatmap: HeatmapType | null = null;
  private rootElement: HTMLElement | null = null;

  constructor(config: HeatmapUIConfig) {
    this.container = config.container;
    this.controller = config.controller;
    this.onHeatmapToggle = config.onHeatmapToggle;

    this.createUI();
  }

  /**
   * Create the heatmap UI
   */
  private createUI(): void {
    const root = document.createElement('div');
    root.className = 'heatmap-ui';

    // Title
    const title = document.createElement('h3');
    title.className = 'heatmap-title';
    title.textContent = 'Heatmaps';
    root.appendChild(title);

    // Button grid
    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';

    // Utility heatmaps
    this.createHeatmapButton(grid, 'power', '⚡ Power', 'Toggle power coverage heatmap');
    this.createHeatmapButton(grid, 'water', '💧 Water', 'Toggle water coverage heatmap');
    this.createHeatmapButton(grid, 'safety', '🚨 Safety', 'Toggle safety coverage heatmap');
    this.createHeatmapButton(grid, 'education', '📚 Education', 'Toggle education coverage heatmap');

    // Separator
    const separator = document.createElement('div');
    separator.className = 'heatmap-separator';
    grid.appendChild(separator);

    // Demand heatmaps
    this.createHeatmapButton(grid, 'demand_r', '🏠 R Demand', 'Toggle residential demand');
    this.createHeatmapButton(grid, 'demand_c', '🏪 C Demand', 'Toggle commercial demand');
    this.createHeatmapButton(grid, 'demand_i', '🏭 I Demand', 'Toggle industrial demand');

    // Separator
    const separator2 = document.createElement('div');
    separator2.className = 'heatmap-separator';
    grid.appendChild(separator2);

    // Other heatmaps
    this.createHeatmapButton(grid, 'happiness', '😊 Happiness', 'Toggle happiness heatmap');

    root.appendChild(grid);

    // Instructions
    const instructions = document.createElement('div');
    instructions.className = 'heatmap-instructions';
    instructions.textContent = 'Click a button to toggle heatmap overlay';
    root.appendChild(instructions);

    this.rootElement = root;
    this.container.appendChild(root);
  }

  /**
   * Create a heatmap toggle button
   */
  private createHeatmapButton(parent: HTMLElement, type: HeatmapType, label: string, title: string): void {
    const button = document.createElement('button');
    button.className = 'heatmap-button';
    button.dataset.heatmap = type;
    button.textContent = label;
    button.title = title;

    button.addEventListener('click', () => {
      // Toggle this heatmap
      if (this.activeHeatmap === type) {
        // Turn off
        this.activeHeatmap = null;
        this.updateButtonStates();
        this.onHeatmapToggle(null);
      } else {
        // Turn on this heatmap
        this.activeHeatmap = type;
        this.updateButtonStates();
        this.onHeatmapToggle(type);
      }
    });

    parent.appendChild(button);
  }

  /**
   * Update button states based on active heatmap
   */
  private updateButtonStates(): void {
    if (!this.rootElement) return;

    const buttons = this.rootElement.querySelectorAll('.heatmap-button');
    buttons.forEach(button => {
      const type = (button as HTMLElement).dataset.heatmap;
      if (type === this.activeHeatmap) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  /**
   * Get active heatmap
   */
  public getActiveHeatmap(): HeatmapType | null {
    return this.activeHeatmap;
  }

  /**
   * Set active heatmap programmatically
   */
  public setActiveHeatmap(type: HeatmapType | null): void {
    this.activeHeatmap = type;
    this.updateButtonStates();
  }

  /**
   * Show the UI
   */
  public show(): void {
    if (this.rootElement) {
      this.rootElement.style.display = 'block';
    }
  }

  /**
   * Hide the UI
   */
  public hide(): void {
    if (this.rootElement) {
      this.rootElement.style.display = 'none';
    }
  }

  /**
   * Destroy the UI
   */
  public destroy(): void {
    if (this.rootElement) {
      this.rootElement.remove();
      this.rootElement = null;
    }
  }
}
