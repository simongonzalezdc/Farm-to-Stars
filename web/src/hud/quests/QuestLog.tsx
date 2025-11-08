export type QuestStatus = 'locked' | 'active' | 'completed';

export interface QuestObjective {
  id: string;
  description: string;
  /** Current progress for the objective. */
  current: number;
  /** Goal required to complete the objective. */
  target: number;
  optional?: boolean;
}

export interface QuestEntry {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  objectives: QuestObjective[];
  rewards?: string[];
  pinned?: boolean;
  /** Epoch milliseconds used for recency sorting when not pinned. */
  updatedAt?: number;
  /** Epoch milliseconds describing when the quest unlocked. */
  unlockedAt?: number;
}

export type QuestLogEventMap = {
  select: CustomEvent<{ quest: QuestEntry }>;
  pinchange: CustomEvent<{ quest: QuestEntry; pinned: boolean }>;
};

type QuestLogEventType = keyof QuestLogEventMap;

export interface QuestLogOptions {
  document?: Document;
  maxPinned?: number;
  emptyState?: string;
}

function ensureDocument(doc?: Document | null): Document {
  const resolved = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!resolved) {
    throw new Error('QuestLog requires a document context to create DOM nodes.');
  }
  return resolved;
}

function formatObjectiveProgress(objective: QuestObjective): string {
  const clamped = Math.min(Math.max(objective.current, 0), objective.target);
  return `${clamped}/${objective.target}`;
}

function createBadge(doc: Document, text: string, tone: 'muted' | 'accent' | 'success'): HTMLSpanElement {
  const badge = doc.createElement('span');
  badge.className = `hud-quest-card__badge hud-quest-card__badge--${tone}`;
  badge.textContent = text;
  return badge;
}

export class QuestLog {
  readonly element: HTMLDivElement;
  private readonly list: HTMLUListElement;
  private readonly emptyState: HTMLDivElement;
  private readonly eventTarget = new EventTarget();
  private readonly quests = new Map<string, QuestEntry>();
  private readonly maxPinned: number;

  constructor(options: QuestLogOptions = {}) {
    const doc = ensureDocument(options.document ?? null);
    this.maxPinned = Math.max(1, Math.floor(options.maxPinned ?? 2));

    const root = doc.createElement('section');
    root.className = 'hud-quest-log hud-panel';
    root.setAttribute('aria-label', 'Quest log');

    const header = doc.createElement('header');
    header.className = 'hud-quest-log__header';
    const title = doc.createElement('h2');
    title.textContent = 'Quest Log';
    header.appendChild(title);
    root.appendChild(header);

    this.list = doc.createElement('ul');
    this.list.className = 'hud-quest-log__list';
    this.list.setAttribute('role', 'list');
    root.appendChild(this.list);

    this.emptyState = doc.createElement('div');
    this.emptyState.className = 'hud-quest-log__empty';
    this.emptyState.textContent = options.emptyState ?? 'No active quests yet. Check back after exploring!';
    root.appendChild(this.emptyState);

    this.element = root;
    this.syncEmptyState();
  }

  mount(target: Element) {
    target.appendChild(this.element);
  }

  on<TType extends QuestLogEventType>(
    type: TType,
    handler: (event: QuestLogEventMap[TType]) => void
  ): () => void {
    const listener = ((event: Event) => handler(event as QuestLogEventMap[TType])) as EventListener;
    this.eventTarget.addEventListener(type, listener);
    return () => this.eventTarget.removeEventListener(type, listener);
  }

  upsertQuest(entry: QuestEntry) {
    const normalized: QuestEntry = {
      ...entry,
      updatedAt: entry.updatedAt ?? Date.now(),
      unlockedAt: entry.unlockedAt ?? Date.now()
    };
    this.quests.set(entry.id, normalized);
    this.render();
  }

  removeQuest(id: string) {
    this.quests.delete(id);
    this.render();
  }

  clear() {
    this.quests.clear();
    this.render();
  }

  private render() {
    const doc = this.element.ownerDocument;
    this.list.innerHTML = '';

    const quests = Array.from(this.quests.values());
    quests.sort((a, b) => {
      const pinnedWeight = Number(b.pinned ?? false) - Number(a.pinned ?? false);
      if (pinnedWeight !== 0) return pinnedWeight;
      const statusWeight = statusRank(b.status) - statusRank(a.status);
      if (statusWeight !== 0) return statusWeight;
      const updatedDiff = (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      if (updatedDiff !== 0) return updatedDiff;
      return (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0);
    });

    for (const quest of quests) {
      const item = doc.createElement('li');
      item.className = 'hud-quest-log__item';
      item.appendChild(this.renderQuestCard(doc, quest));
      this.list.appendChild(item);
    }

    this.syncEmptyState();
  }

  private renderQuestCard(doc: Document, quest: QuestEntry): HTMLDivElement {
    const card = doc.createElement('div');
    card.className = 'hud-quest-card';
    card.dataset.questId = quest.id;
    card.classList.toggle('is-completed', quest.status === 'completed');
    card.classList.toggle('is-locked', quest.status === 'locked');
    card.classList.toggle('is-active', quest.status === 'active');

    const header = doc.createElement('div');
    header.className = 'hud-quest-card__header';
    const title = doc.createElement('h3');
    title.textContent = quest.title;
    header.appendChild(title);

    if (quest.status === 'completed') {
      header.appendChild(createBadge(doc, 'Completed', 'success'));
    } else if (quest.status === 'locked') {
      header.appendChild(createBadge(doc, 'Locked', 'muted'));
    } else if (quest.pinned) {
      header.appendChild(createBadge(doc, 'Pinned', 'accent'));
    }

    const pinButton = doc.createElement('button');
    pinButton.type = 'button';
    pinButton.className = 'hud-quest-card__pin';
    pinButton.setAttribute('aria-label', quest.pinned ? 'Unpin quest' : 'Pin quest');
    pinButton.textContent = quest.pinned ? '★' : '☆';
    pinButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.togglePin(quest.id);
    });
    header.appendChild(pinButton);
    card.appendChild(header);

    const description = doc.createElement('p');
    description.className = 'hud-quest-card__description';
    description.textContent = quest.description;
    card.appendChild(description);

    if (quest.objectives.length > 0) {
      const objectivesList = doc.createElement('ul');
      objectivesList.className = 'hud-quest-card__objectives';
      for (const objective of quest.objectives) {
        const li = doc.createElement('li');
        li.className = 'hud-quest-card__objective';
        const progress = Math.min(Math.max(objective.current / Math.max(objective.target, 1), 0), 1);
        li.dataset.progress = progress.toFixed(2);
        li.textContent = objective.description;

        const progressBar = doc.createElement('div');
        progressBar.className = 'hud-quest-card__objective-track';
        const progressFill = doc.createElement('div');
        progressFill.className = 'hud-quest-card__objective-fill';
        progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
        progressBar.appendChild(progressFill);

        const meta = doc.createElement('span');
        meta.className = 'hud-quest-card__objective-progress';
        meta.textContent = formatObjectiveProgress(objective) + (objective.optional ? ' · Optional' : '');

        li.append(progressBar, meta);
        objectivesList.appendChild(li);
      }
      card.appendChild(objectivesList);
    }

    if (quest.rewards && quest.rewards.length > 0) {
      const rewards = doc.createElement('p');
      rewards.className = 'hud-quest-card__rewards';
      rewards.textContent = `Rewards: ${quest.rewards.join(', ')}`;
      card.appendChild(rewards);
    }

    card.addEventListener('click', () => {
      this.emit('select', { quest });
    });

    return card;
  }

  private togglePin(id: string) {
    const quest = this.quests.get(id);
    if (!quest) return;

    const currentlyPinned = quest.pinned ?? false;
    if (!currentlyPinned) {
      const pinnedCount = Array.from(this.quests.values()).filter((q) => q.pinned).length;
      if (pinnedCount >= this.maxPinned) {
        const lastPinned = Array.from(this.quests.values())
          .filter((q) => q.pinned)
          .sort((a, b) => (a.updatedAt ?? 0) - (b.updatedAt ?? 0))[0];
        if (lastPinned) {
          lastPinned.pinned = false;
        }
      }
    }

    quest.pinned = !currentlyPinned;
    quest.updatedAt = Date.now();
    this.emit('pinchange', { quest, pinned: quest.pinned });
    this.render();
  }

  private emit<TType extends QuestLogEventType>(type: TType, detail: QuestLogEventMap[TType]['detail']) {
    const event = new CustomEvent(type, { detail }) as QuestLogEventMap[TType];
    this.eventTarget.dispatchEvent(event);
  }

  private syncEmptyState() {
    const hasQuests = this.quests.size > 0;
    this.emptyState.hidden = hasQuests;
    this.list.hidden = !hasQuests;
  }
}

function statusRank(status: QuestStatus): number {
  switch (status) {
    case 'active':
      return 2;
    case 'locked':
      return 1;
    case 'completed':
    default:
      return 0;
  }
}
