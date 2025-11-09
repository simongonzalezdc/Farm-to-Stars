/**
 * Tutorial Overlay Component
 * Provides interactive tutorial for new players
 */

interface TutorialStep {
  id: string;
  title: string;
  message: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  dismissable?: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Farm to Stars! 🌱',
    message: 'You\'re starting a homestead. Let\'s learn the basics!',
    position: 'center',
    dismissable: true
  },
  {
    id: 'map',
    title: 'The Map',
    message: 'This is your homestead. The brown tiles are ground. Roads appear every 5 tiles. Buildings appear as colored squares when you build them.',
    position: 'center',
    dismissable: true
  },
  {
    id: 'resources',
    title: 'Resources',
    target: '#resourceRow',
    message: 'Your resources are shown here. You need materials like Wood, Stone, and Plant Fiber to build structures.',
    position: 'bottom',
    dismissable: true
  },
  {
    id: 'building',
    title: 'Building Structures',
    target: '#buildOptions',
    message: 'Click a building option to enter build mode. Then click on the map to place it. Right-click to cancel.',
    position: 'top',
    dismissable: true
  },
  {
    id: 'tools',
    title: 'Tools',
    target: '#toolbelt',
    message: 'Use tools to tend your field: Stone Hoe to till soil, Watering Can to water crops, Sickle to harvest.',
    position: 'top',
    dismissable: true
  },
  {
    id: 'seeds',
    title: 'Planting Crops',
    target: '#seedBar',
    message: 'Select a seed, then click on tilled soil to plant. Crops grow over time and can be harvested.',
    position: 'top',
    dismissable: true
  },
  {
    id: 'seasons',
    title: 'Seasons',
    message: 'The game has 4 seasons, each with different effects. Watch the season timer and plan accordingly!',
    position: 'center',
    dismissable: true
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    message: 'Start by building a Farm Plot, then till soil, plant seeds, and harvest crops. Good luck!',
    position: 'center',
    dismissable: true
  }
];

export class TutorialOverlay {
  private container: HTMLElement;
  private currentStepIndex = 0;
  private isActive = false;
  private overlay: HTMLElement | null = null;
  private highlight: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Start the tutorial
   */
  public start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.currentStepIndex = 0;
    this.showStep(0);
  }

  /**
   * Show a specific tutorial step
   */
  private showStep(index: number): void {
    if (index >= TUTORIAL_STEPS.length) {
      this.complete();
      return;
    }

    const step = TUTORIAL_STEPS[index];
    this.renderStep(step);
  }

  /**
   * Render a tutorial step
   */
  private renderStep(step: TutorialStep): void {
    // Remove existing overlay
    if (this.overlay) {
      this.overlay.remove();
    }
    if (this.highlight) {
      this.highlight.remove();
    }

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
    `;

    // Create tutorial card
    const card = document.createElement('div');
    card.className = 'tutorial-card';
    card.style.cssText = `
      background: #1a1a1a;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 1.5rem;
      max-width: 500px;
      color: #e5e7eb;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      pointer-events: auto;
    `;

    // Title
    const title = document.createElement('h3');
    title.textContent = step.title;
    title.style.cssText = 'margin: 0 0 1rem 0; font-size: 1.25rem; color: #3b82f6;';
    card.appendChild(title);

    // Message
    const message = document.createElement('p');
    message.textContent = step.message;
    message.style.cssText = 'margin: 0 0 1.5rem 0; line-height: 1.6;';
    card.appendChild(message);

    // Buttons
    const buttons = document.createElement('div');
    buttons.style.cssText = 'display: flex; gap: 0.5rem; justify-content: flex-end;';

    if (step.dismissable !== false) {
      const skipButton = document.createElement('button');
      skipButton.textContent = 'Skip Tutorial';
      skipButton.style.cssText = 'padding: 0.5rem 1rem; background: #374151; border: 1px solid #4b5563; border-radius: 4px; color: #e5e7eb; cursor: pointer;';
      skipButton.addEventListener('click', () => this.complete());
      buttons.appendChild(skipButton);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = this.currentStepIndex === TUTORIAL_STEPS.length - 1 ? 'Got it!' : 'Next';
    nextButton.style.cssText = 'padding: 0.5rem 1rem; background: #3b82f6; border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: 600;';
    nextButton.addEventListener('click', () => {
      this.currentStepIndex++;
      this.showStep(this.currentStepIndex);
    });
    buttons.appendChild(nextButton);

    card.appendChild(buttons);
    this.overlay.appendChild(card);

    // Highlight target element if specified
    if (step.target) {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        this.highlight = document.createElement('div');
        this.highlight.className = 'tutorial-highlight';
        const rect = targetElement.getBoundingClientRect();
        this.highlight.style.cssText = `
          position: fixed;
          top: ${rect.top - 4}px;
          left: ${rect.left - 4}px;
          width: ${rect.width + 8}px;
          height: ${rect.height + 8}px;
          border: 3px solid #3b82f6;
          border-radius: 4px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.5);
          z-index: 9999;
          pointer-events: none;
        `;
        document.body.appendChild(this.highlight);
      }
    }

    document.body.appendChild(this.overlay);
  }

  /**
   * Complete the tutorial
   */
  private complete(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.highlight) {
      this.highlight.remove();
      this.highlight = null;
    }
    this.isActive = false;
    
    // Save tutorial completion
    localStorage.setItem('farm-to-stars-tutorial-completed', 'true');
  }

  /**
   * Check if tutorial should be shown
   */
  public static shouldShowTutorial(): boolean {
    return localStorage.getItem('farm-to-stars-tutorial-completed') !== 'true';
  }
}

