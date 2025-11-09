/**
 * Building Menu UI
 *
 * UI component for browsing and selecting buildings to construct
 */

import type { TownshipController } from './TownshipController';
import {
  getBuildingsForCivilization,
  isBuildingUnlocked,
  getBuildingsTable
} from '../../sim/township/data/buildingsLoader';
import type { BuildingDefinition } from '../../types.township';

export interface BuildingMenuUIConfig {
  container: HTMLElement;
  controller: TownshipController;
}

type BuildingCategory = 'all' | 'residential' | 'commercial' | 'industrial' | 'service';

/**
 * Building Menu UI Component
 */
export class BuildingMenuUI {
  private container: HTMLElement;
  private controller: TownshipController;
  private selectedBuildingId: string | null = null;
  private currentCategory: BuildingCategory = 'all';

  constructor(config: BuildingMenuUIConfig) {
    this.container = config.container;
    this.controller = config.controller;

    this.render();
  }

  /**
   * Render the building menu
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'building-menu-ui';

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Building Construction';
    title.className = 'building-menu-title';
    this.container.appendChild(title);

    // Category tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'building-category-tabs';

    const categories: Array<{ id: BuildingCategory; label: string; icon: string }> = [
      { id: 'all', label: 'All', icon: '📋' },
      { id: 'residential', label: 'Residential', icon: '🏠' },
      { id: 'commercial', label: 'Commercial', icon: '🏪' },
      { id: 'industrial', label: 'Industrial', icon: '🏭' },
      { id: 'service', label: 'Service', icon: '⚙️' }
    ];

    for (const category of categories) {
      const tab = document.createElement('button');
      tab.className = 'category-tab';
      tab.dataset.category = category.id;
      if (category.id === this.currentCategory) {
        tab.classList.add('active');
      }

      tab.innerHTML = `<span class="tab-icon">${category.icon}</span><span class="tab-label">${category.label}</span>`;
      tab.addEventListener('click', () => this.setCategory(category.id));

      tabsContainer.appendChild(tab);
    }

    this.container.appendChild(tabsContainer);

    // Building list
    const buildingsList = document.createElement('div');
    buildingsList.className = 'buildings-list';
    buildingsList.id = 'buildingsList';
    this.container.appendChild(buildingsList);

    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.className = 'building-cancel-button';
    cancelButton.textContent = 'Exit Build Mode';
    cancelButton.addEventListener('click', () => this.exitBuildMode());
    this.container.appendChild(cancelButton);

    // Render initial buildings
    this.renderBuildings();
  }

  /**
   * Set active category
   */
  private setCategory(category: BuildingCategory): void {
    this.currentCategory = category;

    // Update tab states
    const tabs = this.container.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      const btn = tab as HTMLButtonElement;
      if (btn.dataset.category === category) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.renderBuildings();
  }

  /**
   * Render buildings for current category
   */
  private renderBuildings(): void {
    const buildingsList = this.container.querySelector('#buildingsList');
    if (!buildingsList) return;

    buildingsList.innerHTML = '';

    const state = this.controller.getState();
    const buildingsTable = getBuildingsTable();
    const civilization = state.civilization;

    // Get buildings for this civilization
    let buildings = getBuildingsForCivilization(civilization);

    // Filter by category
    if (this.currentCategory !== 'all') {
      buildings = buildings.filter(b => b.type === this.currentCategory);
    }

    // Sort by tier, then by cost
    buildings.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return (a.cost.coins || 0) - (b.cost.coins || 0);
    });

    // Render each building
    for (const building of buildings) {
      const card = this.createBuildingCard(building, state.population.total, civilization);
      buildingsList.appendChild(card);
    }

    if (buildings.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No buildings available in this category';
      buildingsList.appendChild(emptyMessage);
    }
  }

  /**
   * Create a building card element
   */
  private createBuildingCard(
    building: BuildingDefinition,
    population: number,
    civilization: string
  ): HTMLElement {
    const card = document.createElement('div');
    card.className = 'building-card';

    const isUnlocked = isBuildingUnlocked(building, population, civilization);
    const isSelected = this.selectedBuildingId === building.id;

    if (!isUnlocked) {
      card.classList.add('locked');
    }

    if (isSelected) {
      card.classList.add('selected');
    }

    // Tier badge
    const tierBadge = document.createElement('div');
    tierBadge.className = `tier-badge tier-${building.tier}`;
    tierBadge.textContent = `T${building.tier}`;
    card.appendChild(tierBadge);

    // Building name
    const name = document.createElement('div');
    name.className = 'building-name';
    name.textContent = building.name;
    card.appendChild(name);

    // Building description
    const desc = document.createElement('div');
    desc.className = 'building-description';
    desc.textContent = building.description;
    card.appendChild(desc);

    // Stats
    const stats = document.createElement('div');
    stats.className = 'building-stats';

    if (building.capacity > 0) {
      const capacityStat = document.createElement('div');
      capacityStat.className = 'stat';
      capacityStat.innerHTML = `<span class="stat-label">Capacity:</span> <span class="stat-value">${building.capacity}</span>`;
      stats.appendChild(capacityStat);
    }

    if (building.serviceRadius) {
      const radiusStat = document.createElement('div');
      radiusStat.className = 'stat';
      radiusStat.innerHTML = `<span class="stat-label">Range:</span> <span class="stat-value">${building.serviceRadius} tiles</span>`;
      stats.appendChild(radiusStat);
    }

    if (building.buildTime) {
      const timeStat = document.createElement('div');
      timeStat.className = 'stat';
      timeStat.innerHTML = `<span class="stat-label">Build Time:</span> <span class="stat-value">${building.buildTime}s</span>`;
      stats.appendChild(timeStat);
    }

    card.appendChild(stats);

    // Cost
    const costDiv = document.createElement('div');
    costDiv.className = 'building-cost';

    for (const [resourceId, amount] of Object.entries(building.cost)) {
      const costItem = document.createElement('span');
      costItem.className = 'cost-item';
      costItem.innerHTML = `${resourceId}: <strong>${amount}</strong>`;
      costDiv.appendChild(costItem);
    }

    card.appendChild(costDiv);

    // Unlock requirements
    if (!isUnlocked) {
      const lockMessage = document.createElement('div');
      lockMessage.className = 'lock-message';

      if (building.requirements?.population) {
        lockMessage.textContent = `Requires ${building.requirements.population} population`;
      } else if (building.requirements?.civilization) {
        lockMessage.textContent = `Requires ${building.requirements.civilization.join(' or ')} civilization`;
      } else {
        lockMessage.textContent = 'Locked';
      }

      card.appendChild(lockMessage);
    }

    // Click handler
    if (isUnlocked) {
      card.addEventListener('click', () => this.selectBuilding(building.id));
    }

    return card;
  }

  /**
   * Select a building for placement
   */
  private selectBuilding(buildingId: string): void {
    this.selectedBuildingId = buildingId;
    this.controller.selectBuilding(buildingId);

    // Update card states
    const cards = this.container.querySelectorAll('.building-card');
    cards.forEach(card => {
      card.classList.remove('selected');
    });

    const selectedCard = this.container.querySelector(`[data-building-id="${buildingId}"]`);
    selectedCard?.classList.add('selected');

    this.renderBuildings(); // Re-render to update selection state
  }

  /**
   * Exit build mode
   */
  private exitBuildMode(): void {
    this.selectedBuildingId = null;
    this.controller.setMode('view');
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
   * Update UI (call when state changes)
   */
  public update(): void {
    const mode = this.controller.getMode();
    const selectedBuilding = this.controller.getSelectedBuilding();

    if (mode === 'build' && selectedBuilding !== this.selectedBuildingId) {
      this.selectedBuildingId = selectedBuilding;
      this.renderBuildings();
    }
  }

  /**
   * Destroy the UI
   */
  public destroy(): void {
    this.container.innerHTML = '';
  }
}
