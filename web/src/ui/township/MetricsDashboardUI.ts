/**
 * Metrics Dashboard UI
 *
 * Displays township metrics: happiness, demand, population, coverage
 */

import type { TownshipController } from './TownshipController';
import type { TownshipMetrics } from '../../types.township';

export interface MetricsDashboardUIConfig {
  container: HTMLElement;
  controller: TownshipController;
}

/**
 * Metrics Dashboard UI Component
 */
export class MetricsDashboardUI {
  private container: HTMLElement;
  private controller: TownshipController;

  // Element references for efficient updates
  private populationEl: HTMLElement | null = null;
  private happinessEl: HTMLElement | null = null;
  private happinessBarEl: HTMLElement | null = null;
  private residentialDemandEl: HTMLElement | null = null;
  private commercialDemandEl: HTMLElement | null = null;
  private industrialDemandEl: HTMLElement | null = null;
  private powerCoverageEl: HTMLElement | null = null;
  private waterCoverageEl: HTMLElement | null = null;
  private safetyCoverageEl: HTMLElement | null = null;
  private educationCoverageEl: HTMLElement | null = null;

  constructor(config: MetricsDashboardUIConfig) {
    this.container = config.container;
    this.controller = config.controller;

    this.render();
  }

  /**
   * Render the metrics dashboard
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'metrics-dashboard';

    // Population section
    const populationSection = this.createSection('Population', '👥');
    this.populationEl = document.createElement('div');
    this.populationEl.className = 'metric-value metric-large';
    this.populationEl.textContent = '0';
    populationSection.appendChild(this.populationEl);
    this.container.appendChild(populationSection);

    // Happiness section
    const happinessSection = this.createSection('Happiness', '😊');

    const happinessContainer = document.createElement('div');
    happinessContainer.className = 'happiness-container';

    this.happinessEl = document.createElement('div');
    this.happinessEl.className = 'metric-value';
    this.happinessEl.textContent = '50';

    const happinessBarContainer = document.createElement('div');
    happinessBarContainer.className = 'metric-bar-container';

    this.happinessBarEl = document.createElement('div');
    this.happinessBarEl.className = 'metric-bar happiness-bar';
    this.happinessBarEl.style.width = '50%';

    happinessBarContainer.appendChild(this.happinessBarEl);
    happinessContainer.appendChild(this.happinessEl);
    happinessContainer.appendChild(happinessBarContainer);
    happinessSection.appendChild(happinessContainer);
    this.container.appendChild(happinessSection);

    // Demand section
    const demandSection = this.createSection('Zone Demand', '📊');

    const demandGrid = document.createElement('div');
    demandGrid.className = 'demand-grid';

    this.residentialDemandEl = this.createDemandBar('Residential', '🏠', 'residential');
    this.commercialDemandEl = this.createDemandBar('Commercial', '🏪', 'commercial');
    this.industrialDemandEl = this.createDemandBar('Industrial', '🏭', 'industrial');

    demandGrid.appendChild(this.residentialDemandEl);
    demandGrid.appendChild(this.commercialDemandEl);
    demandGrid.appendChild(this.industrialDemandEl);
    demandSection.appendChild(demandGrid);
    this.container.appendChild(demandSection);

    // Coverage section
    const coverageSection = this.createSection('Service Coverage', '⚙️');

    const coverageGrid = document.createElement('div');
    coverageGrid.className = 'coverage-grid';

    this.powerCoverageEl = this.createCoverageBar('Power', '⚡');
    this.waterCoverageEl = this.createCoverageBar('Water', '💧');
    this.safetyCoverageEl = this.createCoverageBar('Safety', '🚨');
    this.educationCoverageEl = this.createCoverageBar('Education', '📚');

    coverageGrid.appendChild(this.powerCoverageEl);
    coverageGrid.appendChild(this.waterCoverageEl);
    coverageGrid.appendChild(this.safetyCoverageEl);
    coverageGrid.appendChild(this.educationCoverageEl);
    coverageSection.appendChild(coverageGrid);
    this.container.appendChild(coverageSection);

    // Initial update
    this.update();
  }

  /**
   * Create a section container
   */
  private createSection(title: string, icon: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'metric-section';

    const header = document.createElement('div');
    header.className = 'metric-section-header';
    header.innerHTML = `<span class="metric-icon">${icon}</span><span class="metric-title">${title}</span>`;

    section.appendChild(header);
    return section;
  }

  /**
   * Create a demand bar element
   */
  private createDemandBar(label: string, icon: string, type: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'demand-bar-container';

    const labelEl = document.createElement('div');
    labelEl.className = 'demand-label';
    labelEl.innerHTML = `${icon} ${label}`;

    const barTrack = document.createElement('div');
    barTrack.className = 'demand-bar-track';

    const barFill = document.createElement('div');
    barFill.className = `demand-bar-fill demand-${type}`;
    barFill.dataset.type = type;

    const valueEl = document.createElement('span');
    valueEl.className = 'demand-value';
    valueEl.textContent = '0';

    barTrack.appendChild(barFill);
    container.appendChild(labelEl);
    container.appendChild(barTrack);
    container.appendChild(valueEl);

    return container;
  }

  /**
   * Create a coverage bar element
   */
  private createCoverageBar(label: string, icon: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'coverage-bar-container';

    const labelEl = document.createElement('div');
    labelEl.className = 'coverage-label';
    labelEl.innerHTML = `${icon} ${label}`;

    const barTrack = document.createElement('div');
    barTrack.className = 'coverage-bar-track';

    const barFill = document.createElement('div');
    barFill.className = 'coverage-bar-fill';

    const valueEl = document.createElement('span');
    valueEl.className = 'coverage-value';
    valueEl.textContent = '0%';

    barTrack.appendChild(barFill);
    container.appendChild(labelEl);
    container.appendChild(barTrack);
    container.appendChild(valueEl);

    return container;
  }

  /**
   * Update all metrics
   */
  public update(): void {
    const state = this.controller.getState();
    const metrics = this.controller.getMetrics();

    this.updatePopulation(state.population.total);
    this.updateHappiness(metrics.happiness.overall);
    this.updateDemand(metrics.demand);
    this.updateCoverage(metrics.coverage);
  }

  /**
   * Update population display
   */
  private updatePopulation(population: number): void {
    if (this.populationEl) {
      this.populationEl.textContent = Math.floor(population).toLocaleString();
    }
  }

  /**
   * Update happiness display
   */
  private updateHappiness(happiness: number): void {
    if (this.happinessEl) {
      this.happinessEl.textContent = Math.round(happiness).toString();
    }

    if (this.happinessBarEl) {
      this.happinessBarEl.style.width = `${happiness}%`;

      // Color based on happiness level
      if (happiness >= 70) {
        this.happinessBarEl.style.backgroundColor = '#4caf50'; // Green
      } else if (happiness >= 50) {
        this.happinessBarEl.style.backgroundColor = '#ff9800'; // Orange
      } else {
        this.happinessBarEl.style.backgroundColor = '#f44336'; // Red
      }
    }
  }

  /**
   * Update demand bars
   */
  private updateDemand(demand: TownshipMetrics['demand']): void {
    this.updateDemandBar(this.residentialDemandEl, demand.residential);
    this.updateDemandBar(this.commercialDemandEl, demand.commercial);
    this.updateDemandBar(this.industrialDemandEl, demand.industrial);
  }

  /**
   * Update a single demand bar
   */
  private updateDemandBar(container: HTMLElement | null, demandValue: number): void {
    if (!container) return;

    const barFill = container.querySelector('.demand-bar-fill') as HTMLElement;
    const valueEl = container.querySelector('.demand-value') as HTMLElement;

    if (!barFill || !valueEl) return;

    // Demand is -1 to 1, convert to percentage
    // 0 = center, -1 = left, +1 = right
    const percentage = (demandValue + 1) * 50; // 0-100%

    barFill.style.width = `${percentage}%`;

    // Show as -, 0, +
    if (demandValue < -0.3) {
      valueEl.textContent = '--';
      valueEl.className = 'demand-value negative';
    } else if (demandValue > 0.3) {
      valueEl.textContent = '++';
      valueEl.className = 'demand-value positive';
    } else {
      valueEl.textContent = '0';
      valueEl.className = 'demand-value neutral';
    }
  }

  /**
   * Update coverage bars
   */
  private updateCoverage(coverage: TownshipMetrics['coverage']): void {
    this.updateCoverageBar(this.powerCoverageEl, coverage.power);
    this.updateCoverageBar(this.waterCoverageEl, coverage.water);
    this.updateCoverageBar(this.safetyCoverageEl, coverage.safety);
    this.updateCoverageBar(this.educationCoverageEl, coverage.education);
  }

  /**
   * Update a single coverage bar
   */
  private updateCoverageBar(container: HTMLElement | null, coverageValue: number): void {
    if (!container) return;

    const barFill = container.querySelector('.coverage-bar-fill') as HTMLElement;
    const valueEl = container.querySelector('.coverage-value') as HTMLElement;

    if (!barFill || !valueEl) return;

    const percentage = coverageValue * 100;
    barFill.style.width = `${percentage}%`;
    valueEl.textContent = `${Math.round(percentage)}%`;

    // Color based on coverage
    if (percentage >= 80) {
      barFill.style.backgroundColor = '#4caf50'; // Green
    } else if (percentage >= 50) {
      barFill.style.backgroundColor = '#ff9800'; // Orange
    } else {
      barFill.style.backgroundColor = '#f44336'; // Red
    }
  }

  /**
   * Show the UI
   */
  public show(): void {
    this.container.style.display = 'block';
  }

  /**
   * Hide the UI
   */
  public hide(): void {
    this.container.style.display = 'none';
  }

  /**
   * Destroy the UI
   */
  public destroy(): void {
    this.container.innerHTML = '';
    this.populationEl = null;
    this.happinessEl = null;
    this.happinessBarEl = null;
    this.residentialDemandEl = null;
    this.commercialDemandEl = null;
    this.industrialDemandEl = null;
    this.powerCoverageEl = null;
    this.waterCoverageEl = null;
    this.safetyCoverageEl = null;
    this.educationCoverageEl = null;
  }
}
