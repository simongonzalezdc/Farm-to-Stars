import type { TelemetrySnapshot, TelemetryTracker } from '../../telemetry/telemetry';
import type { ResourceId } from '../../types';

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'resources', label: 'Resources' },
  { id: 'events', label: 'Events' }
] as const;

export type DebugOverlayTabId = (typeof TABS)[number]['id'];

export type DocumentLike = Pick<Document, 'body' | 'createElement'> | null | undefined;

export function isOverlaySupported(doc: DocumentLike = typeof document !== 'undefined' ? document : null): boolean {
  if (!doc) {
    return false;
  }
  if (!doc.body) {
    return false;
  }
  return typeof doc.createElement === 'function';
}

interface DebugOverlayOptions {
  defaultTab?: DebugOverlayTabId;
  containerId?: string;
  parentContainer?: HTMLElement | null;
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export class DebugOverlay {
  private readonly container: HTMLDivElement | null;
  private readonly tabButtons = new Map<DebugOverlayTabId, HTMLButtonElement>();
  private readonly tabPanels = new Map<DebugOverlayTabId, HTMLPreElement>();
  private readonly summaryPanel: HTMLPreElement | null;
  private readonly resourcesPanel: HTMLPreElement | null;
  private readonly eventsPanel: HTMLPreElement | null;
  private activeTab: DebugOverlayTabId;
  private frameCount = 0;
  private lastSample = typeof performance !== 'undefined' ? performance.now() : 0;
  private fps = 0;

  constructor(private readonly telemetry: TelemetryTracker, options: DebugOverlayOptions = {}) {
    this.activeTab = options.defaultTab ?? 'summary';
    if (!isOverlaySupported()) {
      this.container = null;
      return;
    }

    const doc = document;
    const container = doc.createElement('div');
    container.id = options.containerId ?? 'debug-overlay';
    
    // If parent container is provided, use it; otherwise use fixed positioning
    if (options.parentContainer) {
      container.style.position = 'relative';
      container.style.width = '100%';
      container.style.maxHeight = '100%';
    } else {
      container.style.position = 'fixed';
      container.style.right = '0.75rem';
      container.style.bottom = '0.75rem';
      container.style.width = 'min(28rem, 90vw)';
      container.style.maxHeight = '45vh';
    }
    
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.padding = '0.5rem 0.75rem 0.75rem';
    container.style.background = 'rgba(10, 12, 20, 0.82)';
    container.style.border = '1px solid rgba(148, 163, 184, 0.35)';
    container.style.borderRadius = '12px';
    container.style.color = '#f8fafc';
    container.style.fontFamily = 'JetBrains Mono, SFMono-Regular, Menlo, monospace';
    container.style.fontSize = '0.72rem';
    container.style.lineHeight = '1.45';
    container.style.zIndex = '1000';
    container.style.pointerEvents = 'auto';
    container.style.backdropFilter = 'blur(6px)';
    container.style.boxShadow = '0 6px 18px rgba(15, 23, 42, 0.45)';
    container.setAttribute('aria-live', 'polite');

    const tabList = doc.createElement('div');
    tabList.setAttribute('role', 'tablist');
    tabList.style.display = 'flex';
    tabList.style.gap = '0.25rem';
    tabList.style.marginBottom = '0.5rem';

    container.appendChild(tabList);

    for (const tab of TABS) {
      const button = doc.createElement('button');
      button.type = 'button';
      button.textContent = tab.label;
      button.dataset.tabId = tab.id;
      button.setAttribute('role', 'tab');
      button.id = `${container.id}-${tab.id}`;
      button.style.background = 'rgba(30, 41, 59, 0.8)';
      button.style.border = '1px solid rgba(148, 163, 184, 0.45)';
      button.style.borderRadius = '8px';
      button.style.color = '#e2e8f0';
      button.style.padding = '0.25rem 0.75rem';
      button.style.fontFamily = 'inherit';
      button.style.fontSize = '0.7rem';
      button.style.cursor = 'pointer';
      button.style.flex = '1 1 0';
      button.addEventListener('click', () => {
        this.setActiveTab(tab.id);
      });
      this.tabButtons.set(tab.id, button);
      tabList.appendChild(button);

      const panel = doc.createElement('pre');
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
      panel.style.margin = '0';
      panel.style.padding = '0.25rem 0.25rem 0';
      panel.style.whiteSpace = 'pre-wrap';
      panel.style.wordBreak = 'break-word';
      panel.style.overflowY = 'auto';
      panel.style.flex = '1 1 auto';
      panel.style.display = 'none';
      this.tabPanels.set(tab.id, panel);
      container.appendChild(panel);
    }

    this.container = container;
    this.summaryPanel = this.tabPanels.get('summary') ?? null;
    this.resourcesPanel = this.tabPanels.get('resources') ?? null;
    this.eventsPanel = this.tabPanels.get('events') ?? null;

    this.updateTabStates();

    // Append to parent container if provided, otherwise to body
    if (options.parentContainer) {
      options.parentContainer.appendChild(container);
    } else {
      doc.body.appendChild(container);
    }
  }

  update(deltaMs: number, state: Parameters<TelemetryTracker['snapshot']>[0], snapshot?: TelemetrySnapshot) {
    if (!this.container) {
      return;
    }

    this.frameCount += 1;
    const now = typeof performance !== 'undefined' ? performance.now() : 0;
    const elapsed = now - this.lastSample;
    if (elapsed >= 500) {
      this.fps = elapsed > 0 ? (this.frameCount * 1000) / elapsed : 0;
      this.frameCount = 0;
      this.lastSample = now;
    }

    const data = snapshot ?? this.telemetry.snapshot(state);
    const memoryText = this.formatMemory();
    this.renderSummaryPanel(data, deltaMs, memoryText);
    this.renderResourcesPanel(data);
    this.renderEventsPanel(data);
  }

  private renderSummaryPanel(snapshot: TelemetrySnapshot, deltaMs: number, memory: string) {
    if (!this.summaryPanel) {
      return;
    }
    const lines: string[] = [];
    lines.push(`FPS ${this.fps.toFixed(1)} | Frame ${deltaMs.toFixed(2)} ms${memory}`);

    const seasonLine = this.formatSeasonLine(snapshot);
    if (seasonLine) {
      lines.push(seasonLine);
    }

    lines.push(this.formatHomesteadLine(snapshot));
    lines.push(this.formatWeatherLine(snapshot));

    const queues = snapshot.queues;
    lines.push(`Queues build:${queues.build} construction:${queues.construction} active:${queues.productionActive}`);

    const daily = this.formatDailyLine(snapshot);
    if (daily) {
      lines.push(daily);
    }

    this.summaryPanel.textContent = lines.join('\n');
  }

  private renderResourcesPanel(snapshot: TelemetrySnapshot) {
    if (!this.resourcesPanel) {
      return;
    }
    const entries = Object.entries(snapshot.resources.totals) as [ResourceId, number][];
    entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
    const lines: string[] = [];
    lines.push('Top resources');
    for (const [resource, total] of entries.slice(0, 8)) {
      const rate = snapshot.resources.ratesPerMinute[resource] ?? 0;
      const rateText = this.formatRate(rate);
      lines.push(`${resource.padEnd(12, ' ')} ${total.toFixed(1).padStart(8, ' ')}  (${rateText}/m)`);
    }

    if (entries.length === 0) {
      lines.push('No resources tracked.');
    }

    const totals = snapshot.resources.totals;
    const detail = Object.keys(totals)
      .sort()
      .map((id) => `${id}: ${totals[id] ?? 0}`)
      .join(', ');
    lines.push('');
    lines.push(detail);

    this.resourcesPanel.textContent = lines.join('\n');
  }

  private renderEventsPanel(snapshot: TelemetrySnapshot) {
    if (!this.eventsPanel) {
      return;
    }
    if (snapshot.recentEvents.length === 0) {
      this.eventsPanel.textContent = 'No recent events.';
      return;
    }
    this.eventsPanel.textContent = snapshot.recentEvents.join('\n');
  }

  private formatSeasonLine(snapshot: TelemetrySnapshot): string | null {
    const { season } = snapshot;
    const progress = (season.progress * 100).toFixed(0);
    const remaining = Number.isFinite(season.remainingSeconds)
      ? this.formatDuration(season.remainingSeconds)
      : '∞';
    return `Season ${season.id} • Y${season.year}C${season.cycle} • ${progress}% • Next ${remaining}`;
  }

  private formatHomesteadLine(snapshot: TelemetrySnapshot): string {
    const staminaPercent = Math.round(snapshot.homestead.staminaRatio * 100);
    const exhausted = snapshot.homestead.exhausted ? ' (!)' : '';
    return `Day ${snapshot.homestead.day} @ ${snapshot.homestead.clock} | Stamina ${staminaPercent}%${exhausted}`;
  }

  private formatWeatherLine(snapshot: TelemetrySnapshot): string {
    const delta = snapshot.homestead.moistureDeltaPerSecond;
    const formattedDelta = Math.abs(delta) < 0.0005 ? '0.000' : delta.toFixed(3);
    return `Weather ${snapshot.homestead.weather} (${formattedDelta} moisture/s)`;
  }

  private formatDailyLine(snapshot: TelemetrySnapshot): string | null {
    const daily = snapshot.daily;
    const outputs = this.formatProductionOutputs(daily.productionOutputs);
    const base = `Daily build:${daily.buildsCompleted} crop:${daily.cropsMatured}/${daily.cropsWithered} prod:${daily.productionCycles}`;
    return outputs ? `${base} • ${outputs}` : base;
  }

  private formatProductionOutputs(outputs: Record<ResourceId, number>): string | null {
    const entries = Object.entries(outputs) as [ResourceId, number][];
    if (entries.length === 0) {
      return null;
    }
    entries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    return entries
      .slice(0, 4)
      .map(([resource, amount]) => `${resource}:${amount.toFixed(1)}`)
      .join(', ');
  }

  private formatRate(rate: number): string {
    if (Math.abs(rate) < 0.05) {
      return '0.0';
    }
    const sign = rate >= 0 ? '+' : '-';
    return `${sign}${Math.abs(rate).toFixed(1)}`;
  }

  private formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds)) {
      return '∞';
    }
    const clamped = Math.max(0, seconds);
    const minutes = Math.floor(clamped / 60);
    const secs = Math.floor(clamped % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private formatMemory(): string {
    if (typeof performance === 'undefined') {
      return '';
    }
    const memoryInfo = (performance as PerformanceWithMemory).memory;
    if (!memoryInfo) {
      return '';
    }
    const used = memoryInfo.usedJSHeapSize / 1048576;
    const limit = memoryInfo.jsHeapSizeLimit / 1048576;
    return ` | Mem ${used.toFixed(1)} / ${limit.toFixed(0)} MB`;
  }

  private setActiveTab(tab: DebugOverlayTabId) {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.updateTabStates();
  }

  private updateTabStates() {
    for (const [id, button] of this.tabButtons) {
      const active = id === this.activeTab;
      button.setAttribute('aria-selected', active ? 'true' : 'false');
      button.style.background = active ? 'rgba(59, 130, 246, 0.55)' : 'rgba(30, 41, 59, 0.8)';
      button.style.borderColor = active ? 'rgba(59, 130, 246, 0.85)' : 'rgba(148, 163, 184, 0.45)';
    }

    for (const [id, panel] of this.tabPanels) {
      panel.style.display = id === this.activeTab ? 'block' : 'none';
    }
  }
}
