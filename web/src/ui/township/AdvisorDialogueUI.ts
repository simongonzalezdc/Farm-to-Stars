/**
 * Advisor Dialogue UI
 *
 * Displays messages from civilization advisors for events, warnings, and milestones
 */

import type { TownshipController } from './TownshipController';

export interface AdvisorDialogueUIConfig {
  container: HTMLElement;
  controller: TownshipController;
}

export type MessageType = 'info' | 'warning' | 'success' | 'milestone';

export interface AdvisorMessage {
  id: string;
  type: MessageType;
  title: string;
  message: string;
  icon?: string;
  dismissable?: boolean;
  autoDismiss?: number; // Auto-dismiss after N milliseconds
}

/**
 * Advisor Dialogue UI Component
 */
export class AdvisorDialogueUI {
  private container: HTMLElement;
  private controller: TownshipController;
  private messageQueue: AdvisorMessage[] = [];
  private currentMessage: AdvisorMessage | null = null;
  private dialogueElement: HTMLElement | null = null;
  private autoDismissTimer: number | null = null;
  private isVisible: boolean = false;

  constructor(config: AdvisorDialogueUIConfig) {
    this.container = config.container;
    this.controller = config.controller;

    this.createDialogueElement();
  }

  /**
   * Create the dialogue UI element
   */
  private createDialogueElement(): void {
    const dialogue = document.createElement('div');
    dialogue.className = 'advisor-dialogue';
    dialogue.style.display = 'none';

    this.dialogueElement = dialogue;
    this.container.appendChild(dialogue);
  }

  /**
   * Queue a message to be displayed
   */
  public queueMessage(message: AdvisorMessage): void {
    // Check if message with same ID is already queued or currently shown
    if (this.currentMessage?.id === message.id) return;
    if (this.messageQueue.some(m => m.id === message.id)) return;

    this.messageQueue.push(message);

    // Show immediately if nothing is currently displayed
    if (!this.isVisible) {
      this.showNextMessage();
    }
  }

  /**
   * Show the next message in the queue
   */
  private showNextMessage(): void {
    if (this.messageQueue.length === 0) {
      this.hide();
      return;
    }

    const message = this.messageQueue.shift()!;
    this.currentMessage = message;
    this.renderMessage(message);
    this.show();

    // Set up auto-dismiss if configured
    if (message.autoDismiss && message.autoDismiss > 0) {
      this.autoDismissTimer = window.setTimeout(() => {
        this.dismissMessage();
      }, message.autoDismiss);
    }
  }

  /**
   * Render a message
   */
  private renderMessage(message: AdvisorMessage): void {
    if (!this.dialogueElement) return;

    this.dialogueElement.innerHTML = '';
    this.dialogueElement.className = `advisor-dialogue advisor-dialogue-${message.type}`;

    // Message header
    const header = document.createElement('div');
    header.className = 'dialogue-header';

    // Icon
    if (message.icon) {
      const icon = document.createElement('span');
      icon.className = 'dialogue-icon';
      icon.textContent = message.icon;
      header.appendChild(icon);
    }

    // Title
    const title = document.createElement('h3');
    title.className = 'dialogue-title';
    title.textContent = message.title;
    header.appendChild(title);

    this.dialogueElement.appendChild(header);

    // Message body
    const body = document.createElement('div');
    body.className = 'dialogue-body';
    body.textContent = message.message;
    this.dialogueElement.appendChild(body);

    // Footer with buttons
    const footer = document.createElement('div');
    footer.className = 'dialogue-footer';

    // Queue indicator
    if (this.messageQueue.length > 0) {
      const queueIndicator = document.createElement('span');
      queueIndicator.className = 'queue-indicator';
      queueIndicator.textContent = `+${this.messageQueue.length} more`;
      footer.appendChild(queueIndicator);
    }

    // Dismiss button
    if (message.dismissable !== false) {
      const dismissButton = document.createElement('button');
      dismissButton.className = 'dialogue-dismiss-button';
      dismissButton.textContent = this.messageQueue.length > 0 ? 'Next' : 'Dismiss';
      dismissButton.addEventListener('click', () => this.dismissMessage());
      footer.appendChild(dismissButton);
    }

    this.dialogueElement.appendChild(footer);
  }

  /**
   * Dismiss current message and show next
   */
  private dismissMessage(): void {
    // Clear auto-dismiss timer if active
    if (this.autoDismissTimer !== null) {
      window.clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }

    this.currentMessage = null;
    this.showNextMessage();
  }

  /**
   * Show the dialogue
   */
  private show(): void {
    if (this.dialogueElement) {
      this.dialogueElement.style.display = 'block';
      this.isVisible = true;

      // Add entrance animation
      setTimeout(() => {
        this.dialogueElement?.classList.add('visible');
      }, 10);
    }
  }

  /**
   * Hide the dialogue
   */
  private hide(): void {
    if (this.dialogueElement) {
      this.dialogueElement.classList.remove('visible');

      // Wait for animation to complete before hiding
      setTimeout(() => {
        if (this.dialogueElement) {
          this.dialogueElement.style.display = 'none';
          this.isVisible = false;
        }
      }, 300);
    }
  }

  /**
   * Clear all queued messages
   */
  public clearQueue(): void {
    this.messageQueue = [];
    if (this.autoDismissTimer !== null) {
      window.clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }

  /**
   * Get number of queued messages
   */
  public getQueueLength(): number {
    return this.messageQueue.length;
  }

  /**
   * Check if a message is currently visible
   */
  public isShowingMessage(): boolean {
    return this.isVisible;
  }

  /**
   * Destroy the UI
   */
  public destroy(): void {
    this.clearQueue();
    if (this.dialogueElement) {
      this.dialogueElement.remove();
      this.dialogueElement = null;
    }
  }
}

/**
 * Predefined advisor messages for common events
 */

export const AdvisorMessages = {
  // Welcome messages by civilization
  welcome: {
    teotihuacan: {
      id: 'welcome_teotihuacan',
      type: 'milestone' as MessageType,
      title: 'Welcome to Teotihuacan',
      message: 'Great leader, your people look to you to build a thriving city. Harness the power of the sun and create a monument to prosperity!',
      icon: '☀️',
      dismissable: true,
      autoDismiss: 8000
    },
    maya: {
      id: 'welcome_maya',
      type: 'milestone' as MessageType,
      title: 'Welcome to the Maya Empire',
      message: 'Wise ruler, your civilization shall reach the stars! Build observatories and unlock the secrets of the cosmos.',
      icon: '🌟',
      dismissable: true,
      autoDismiss: 8000
    },
    moche: {
      id: 'welcome_moche',
      type: 'milestone' as MessageType,
      title: 'Welcome to Moche',
      message: 'Noble leader, the waters of life flow through your lands. Build grand aqueducts to sustain your growing population!',
      icon: '💧',
      dismissable: true,
      autoDismiss: 8000
    },
    hopewell: {
      id: 'welcome_hopewell',
      type: 'milestone' as MessageType,
      title: 'Welcome to Hopewell',
      message: 'Trading chief, your people are masters of commerce. Establish trading posts and create networks of prosperity!',
      icon: '🏺',
      dismissable: true,
      autoDismiss: 8000
    },
    puebloan: {
      id: 'welcome_puebloan',
      type: 'milestone' as MessageType,
      title: 'Welcome to Puebloan',
      message: 'Community builder, your people live in harmony with nature. Create sustainable plazas and green spaces for all!',
      icon: '🌿',
      dismissable: true,
      autoDismiss: 8000
    }
  },

  // Population milestones
  milestones: {
    pop500: {
      id: 'milestone_500',
      type: 'milestone' as MessageType,
      title: 'Growing Settlement',
      message: 'Your settlement has reached 500 people! More buildings are now available to construct.',
      icon: '🎉',
      dismissable: true,
      autoDismiss: 6000
    },
    pop1000: {
      id: 'milestone_1000',
      type: 'milestone' as MessageType,
      title: 'Thriving City',
      message: 'Your city has grown to 1,000 people! Advanced buildings are now unlocked.',
      icon: '🏙️',
      dismissable: true,
      autoDismiss: 6000
    },
    pop2000: {
      id: 'milestone_2000',
      type: 'milestone' as MessageType,
      title: 'Metropolis',
      message: 'Incredible! Your metropolis now houses 2,000 people. The most advanced buildings are now available!',
      icon: '🌆',
      dismissable: true,
      autoDismiss: 6000
    }
  },

  // Warnings
  warnings: {
    lowHappiness: {
      id: 'warning_happiness',
      type: 'warning' as MessageType,
      title: 'Citizens Are Unhappy',
      message: 'Happiness has fallen below 40%. Build parks, schools, and service buildings to improve citizen well-being!',
      icon: '😟',
      dismissable: true
    },
    noPower: {
      id: 'warning_power',
      type: 'warning' as MessageType,
      title: 'Power Coverage Low',
      message: 'Many zones lack electricity. Build more power plants or solar arrays to expand coverage.',
      icon: '⚡',
      dismissable: true
    },
    noWater: {
      id: 'warning_water',
      type: 'warning' as MessageType,
      title: 'Water Coverage Low',
      message: 'Citizens need water! Build water towers or treatment facilities to expand water service.',
      icon: '💧',
      dismissable: true
    },
    highDemand: {
      id: 'info_demand',
      type: 'info' as MessageType,
      title: 'High Demand',
      message: 'Citizens are demanding more zones! Zone areas that match the demand bars to grow your city.',
      icon: '📊',
      dismissable: true,
      autoDismiss: 5000
    }
  },

  // Tutorial tips
  tutorial: {
    zoneFirst: {
      id: 'tutorial_zone',
      type: 'info' as MessageType,
      title: 'Zone Your City',
      message: 'Start by designating zones (Residential, Commercial, Industrial). Then buildings will automatically develop in those zones!',
      icon: '📍',
      dismissable: true
    },
    buildServices: {
      id: 'tutorial_services',
      type: 'info' as MessageType,
      title: 'Provide Services',
      message: 'Build service buildings like power plants, water towers, and parks to keep your citizens happy and healthy!',
      icon: '⚙️',
      dismissable: true
    },
    watchDemand: {
      id: 'tutorial_demand',
      type: 'info' as MessageType,
      title: 'Watch the Demand Bars',
      message: 'The RCI demand bars show what your city needs. Positive demand (green) means zone more of that type!',
      icon: '📈',
      dismissable: true
    }
  }
};
