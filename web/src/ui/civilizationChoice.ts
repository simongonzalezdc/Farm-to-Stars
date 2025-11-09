import type { CivilizationDefinition, CivilizationId, CivilizationsTable } from '../types';

export class CivilizationChoice {
  private modal: HTMLElement;
  private grid: HTMLElement;
  private civilizations: CivilizationsTable;
  private onChoose: (civilizationId: CivilizationId) => void;

  constructor(
    civilizations: CivilizationsTable,
    onChoose: (civilizationId: CivilizationId) => void
  ) {
    this.civilizations = civilizations;
    this.onChoose = onChoose;

    const modal = document.getElementById('civilizationChoiceModal');
    const grid = document.getElementById('civilizationGrid');

    if (!modal || !grid) {
      throw new Error('Civilization choice modal elements not found in DOM');
    }

    this.modal = modal;
    this.grid = grid;

    this.renderCivilizations();
  }

  /**
   * Show the civilization choice modal
   */
  show(): void {
    this.modal.hidden = false;
  }

  /**
   * Hide the civilization choice modal
   */
  hide(): void {
    this.modal.hidden = true;
  }

  /**
   * Render all civilization cards
   */
  private renderCivilizations(): void {
    this.grid.innerHTML = '';

    const civilizationEntries = Object.entries(this.civilizations);

    civilizationEntries.forEach(([id, civ]) => {
      const card = this.createCivilizationCard(id as CivilizationId, civ);
      this.grid.appendChild(card);
    });
  }

  /**
   * Create a single civilization card element
   */
  private createCivilizationCard(id: CivilizationId, civ: CivilizationDefinition): HTMLElement {
    const card = document.createElement('div');
    card.className = 'civilization-card';
    card.setAttribute('data-civilization-id', id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Choose ${civ.name}`);

    // Header with color swatch
    const header = document.createElement('div');
    header.className = 'civilization-card__header';

    const colorSwatch = document.createElement('div');
    colorSwatch.className = 'civilization-card__color';
    colorSwatch.style.backgroundColor = civ.aesthetics.primaryColor;

    const titleGroup = document.createElement('div');
    titleGroup.className = 'civilization-card__title-group';

    const name = document.createElement('h3');
    name.className = 'civilization-card__name';
    name.textContent = civ.name;

    const tagline = document.createElement('p');
    tagline.className = 'civilization-card__tagline';
    tagline.textContent = civ.tagline;

    titleGroup.appendChild(name);
    titleGroup.appendChild(tagline);
    header.appendChild(colorSwatch);
    header.appendChild(titleGroup);

    // Description
    const description = document.createElement('p');
    description.className = 'civilization-card__description';
    description.textContent = civ.description;

    // Bonuses list
    const bonusesList = document.createElement('ul');
    bonusesList.className = 'civilization-card__bonuses';

    Object.entries(civ.bonuses).forEach(([bonusKey, bonusValue]) => {
      const bonusItem = document.createElement('li');
      bonusItem.className = 'civilization-card__bonus';

      const percentage = ((bonusValue - 1) * 100).toFixed(0);
      const bonusName = this.formatBonusName(bonusKey);
      bonusItem.textContent = `${percentage}% ${bonusName}`;

      bonusesList.appendChild(bonusItem);
    });

    // Lore snippet
    const lore = document.createElement('p');
    lore.className = 'civilization-card__lore';
    lore.textContent = `"${civ.loreSnippet}"`;

    // Assemble card
    card.appendChild(header);
    card.appendChild(description);
    card.appendChild(bonusesList);
    card.appendChild(lore);

    // Event listeners
    card.addEventListener('click', () => this.handleChoice(id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleChoice(id);
      }
    });

    return card;
  }

  /**
   * Handle civilization choice
   */
  private handleChoice(civilizationId: CivilizationId): void {
    this.hide();
    this.onChoose(civilizationId);
  }

  /**
   * Format bonus key for display
   */
  private formatBonusName(key: string): string {
    // Convert camelCase to Title Case with spaces
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
