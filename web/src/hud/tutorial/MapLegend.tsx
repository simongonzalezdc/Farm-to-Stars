/**
 * Map Legend Component
 * Shows what different elements on the map represent
 */

export class MapLegend {
  private container: HTMLElement;
  private isVisible = false;
  private legendElement: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Toggle legend visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Show the legend
   */
  public show(): void {
    if (this.isVisible && this.legendElement) return;

    this.isVisible = true;
    this.legendElement = document.createElement('div');
    this.legendElement.className = 'map-legend';
    this.legendElement.style.cssText = `
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      background: rgba(26, 26, 26, 0.95);
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 1rem;
      color: #e5e7eb;
      font-size: 0.875rem;
      z-index: 1000;
      max-width: 300px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

    this.legendElement.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <h3 style="margin: 0; color: #3b82f6; font-size: 1rem;">Map Legend</h3>
        <button id="closeLegend" style="background: none; border: none; color: #e5e7eb; cursor: pointer; font-size: 1.25rem; padding: 0;">×</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 24px; height: 24px; background: #8b6f47; border: 1px solid #6b5537; border-radius: 2px;"></div>
          <span><strong>Brown tiles:</strong> Ground/soil</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 24px; height: 24px; background: #5a5a5a; border: 1px solid #3a3a3a; border-radius: 2px;"></div>
          <span><strong>Gray tiles:</strong> Roads/paths</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 24px; height: 24px; background: #3b82f6; border: 1px solid #2563eb; border-radius: 2px;"></div>
          <span><strong>Blue squares:</strong> Buildings</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 24px; height: 24px; background: #10b981; border: 1px solid #059669; border-radius: 2px;"></div>
          <span><strong>Green areas:</strong> Crops/fields</span>
        </div>
        <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #374151;">
          <small style="color: #9ca3af;">
            💡 <strong>Tip:</strong> Click and drag to pan the camera. Scroll to zoom. Right-click to cancel actions.
          </small>
        </div>
      </div>
    `;

    const closeButton = this.legendElement.querySelector('#closeLegend') as HTMLButtonElement;
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }

    document.body.appendChild(this.legendElement);
  }

  /**
   * Hide the legend
   */
  public hide(): void {
    if (this.legendElement) {
      this.legendElement.remove();
      this.legendElement = null;
    }
    this.isVisible = false;
  }
}
