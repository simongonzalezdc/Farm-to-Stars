/**
 * Zone Placement UI
 *
 * UI component for placing R/C/I zones in the township
 */

import type { TownshipController, ZoneType } from './TownshipController';

export interface ZonePlacementUIConfig {
  container: HTMLElement;
  controller: TownshipController;
}

/**
 * Zone Placement UI Component
 */
export class ZonePlacementUI {
  private container: HTMLElement;
  private controller: TownshipController;
  private selectedButton: HTMLButtonElement | null = null;

  constructor(config: ZonePlacementUIConfig) {
    this.container = config.container;
    this.controller = config.controller;

    this.render();
  }

  /**
   * Render the zone placement UI
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'zone-placement-ui';

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Zone Designation';
    title.className = 'zone-ui-title';
    this.container.appendChild(title);

    // Zone type buttons
    const zoneTypes: Array<{ type: ZoneType; label: string; color: string; icon: string }> = [
      { type: 'residential', label: 'Residential', color: '#4caf50', icon: '🏠' },
      { type: 'commercial', label: 'Commercial', color: '#2196f3', icon: '🏪' },
      { type: 'industrial', label: 'Industrial', color: '#ff9800', icon: '🏭' },
      { type: 'mixed', label: 'Mixed Use', color: '#9c27b0', icon: '🏢' }
    ];

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'zone-buttons';

    for (const zone of zoneTypes) {
      const button = document.createElement('button');
      button.className = 'zone-button';
      button.dataset.zoneType = zone.type;

      const icon = document.createElement('span');
      icon.className = 'zone-icon';
      icon.textContent = zone.icon;

      const label = document.createElement('span');
      label.className = 'zone-label';
      label.textContent = zone.label;

      const colorBar = document.createElement('div');
      colorBar.className = 'zone-color-bar';
      colorBar.style.backgroundColor = zone.color;

      button.appendChild(icon);
      button.appendChild(label);
      button.appendChild(colorBar);

      button.addEventListener('click', () => this.selectZoneType(zone.type, button));

      buttonsContainer.appendChild(button);
    }

    this.container.appendChild(buttonsContainer);

    // Instructions
    const instructions = document.createElement('div');
    instructions.className = 'zone-instructions';
    instructions.innerHTML = `
      <p><strong>How to place zones:</strong></p>
      <ol>
        <li>Select a zone type above</li>
        <li>Click and drag on the map to designate an area</li>
        <li>Zones will mature over time based on demand and services</li>
      </ol>
      <p class="zone-tip">💡 Tip: Provide power and water to zones for faster growth</p>
    `;
    this.container.appendChild(instructions);

    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.className = 'zone-cancel-button';
    cancelButton.textContent = 'Exit Zone Mode';
    cancelButton.addEventListener('click', () => this.exitZoneMode());
    this.container.appendChild(cancelButton);

    // Select residential by default
    const firstButton = buttonsContainer.querySelector('[data-zone-type="residential"]') as HTMLButtonElement;
    if (firstButton) {
      this.selectZoneType('residential', firstButton);
    }
  }

  /**
   * Select a zone type
   */
  private selectZoneType(type: ZoneType, button: HTMLButtonElement): void {
    // Deselect previous
    if (this.selectedButton) {
      this.selectedButton.classList.remove('selected');
    }

    // Select new
    this.selectedButton = button;
    button.classList.add('selected');

    // Update controller
    this.controller.selectZoneType(type);
  }

  /**
   * Exit zone placement mode
   */
  private exitZoneMode(): void {
    if (this.selectedButton) {
      this.selectedButton.classList.remove('selected');
      this.selectedButton = null;
    }

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
   * Update UI state
   */
  public update(): void {
    const mode = this.controller.getMode();
    const selectedType = this.controller.getSelectedZoneType();

    // Update button states
    const buttons = this.container.querySelectorAll('.zone-button');
    buttons.forEach(button => {
      const btn = button as HTMLButtonElement;
      const type = btn.dataset.zoneType;

      if (mode === 'zone' && type === selectedType) {
        btn.classList.add('selected');
        this.selectedButton = btn;
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  /**
   * Destroy the UI
   */
  public destroy(): void {
    this.container.innerHTML = '';
  }
}
