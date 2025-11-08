import { getSeasonDefinition, SEASON_ORDER, type SeasonId } from '../../config/seasons';
import type { TelemetrySnapshot } from '../../telemetry/telemetry';

export interface CalendarOptions {
  /**
   * Optional custom document implementation for tests. Defaults to the global document when available.
   */
  document?: Document;
  /**
   * Flag that hides the seasonal summary copy in ultra compact configurations.
   */
  hideSeasonSummaries?: boolean;
}

interface SeasonCell {
  root: HTMLDivElement;
  progress: HTMLDivElement;
  summary: HTMLParagraphElement;
}

function ensureDocument(doc?: Document | null): Document {
  const resolved = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!resolved) {
    throw new Error('Calendar HUD requires a document context to construct DOM nodes.');
  }
  return resolved;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'Season finale';
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const segments: string[] = [];
  if (days > 0) segments.push(`${days}d`);
  if (hours > 0) segments.push(`${hours}h`);
  if (minutes > 0 && segments.length < 2) segments.push(`${minutes}m`);
  if (segments.length === 0) {
    segments.push('<1m');
  }
  return segments.join(' ');
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export class CalendarHud {
  readonly element: HTMLDivElement;
  private readonly headerSeason: HTMLSpanElement;
  private readonly headerYear: HTMLSpanElement;
  private readonly dayLabel: HTMLSpanElement;
  private readonly clockLabel: HTMLSpanElement;
  private readonly progressFill: HTMLDivElement;
  private readonly progressText: HTMLSpanElement;
  private readonly moistureText: HTMLSpanElement;
  private readonly seasonCells = new Map<SeasonId, SeasonCell>();
  private readonly recentEventsList: HTMLOListElement;

  constructor(options: CalendarOptions = {}) {
    const doc = ensureDocument(options.document ?? null);
    const root = doc.createElement('section');
    root.className = 'hud-calendar hud-panel';
    root.setAttribute('aria-label', 'Season calendar');

    const header = doc.createElement('header');
    header.className = 'hud-calendar__header';

    const titleGroup = doc.createElement('div');
    titleGroup.className = 'hud-calendar__title';
    this.headerSeason = doc.createElement('span');
    this.headerSeason.className = 'hud-calendar__season';
    titleGroup.appendChild(this.headerSeason);

    this.headerYear = doc.createElement('span');
    this.headerYear.className = 'hud-calendar__year';
    titleGroup.appendChild(this.headerYear);

    const clockGroup = doc.createElement('div');
    clockGroup.className = 'hud-calendar__clock';
    this.dayLabel = doc.createElement('span');
    this.dayLabel.className = 'hud-calendar__day';
    clockGroup.appendChild(this.dayLabel);

    this.clockLabel = doc.createElement('span');
    this.clockLabel.className = 'hud-calendar__time';
    clockGroup.appendChild(this.clockLabel);

    header.append(titleGroup, clockGroup);
    root.appendChild(header);

    const progress = doc.createElement('div');
    progress.className = 'hud-calendar__progress';
    const progressTrack = doc.createElement('div');
    progressTrack.className = 'hud-calendar__progress-track';
    this.progressFill = doc.createElement('div');
    this.progressFill.className = 'hud-calendar__progress-fill';
    this.progressFill.style.width = '0%';
    progressTrack.appendChild(this.progressFill);
    progress.appendChild(progressTrack);

    const progressMeta = doc.createElement('div');
    progressMeta.className = 'hud-calendar__progress-meta';
    this.progressText = doc.createElement('span');
    this.progressText.className = 'hud-calendar__progress-text';
    progressMeta.appendChild(this.progressText);
    this.moistureText = doc.createElement('span');
    this.moistureText.className = 'hud-calendar__moisture';
    progressMeta.appendChild(this.moistureText);
    progress.appendChild(progressMeta);
    root.appendChild(progress);

    const seasonsGrid = doc.createElement('div');
    seasonsGrid.className = 'hud-calendar__seasons';
    for (const seasonId of SEASON_ORDER) {
      const cell = this.createSeasonCell(doc, seasonId, options.hideSeasonSummaries ?? false);
      seasonsGrid.appendChild(cell.root);
      this.seasonCells.set(seasonId, cell);
    }
    root.appendChild(seasonsGrid);

    const insights = doc.createElement('section');
    insights.className = 'hud-calendar__insights';
    const insightsTitle = doc.createElement('h3');
    insightsTitle.textContent = 'Daily Summary';
    insights.appendChild(insightsTitle);

    const list = doc.createElement('ol');
    list.className = 'hud-calendar__recent';
    list.setAttribute('aria-live', 'polite');
    this.recentEventsList = list;
    insights.appendChild(list);
    root.appendChild(insights);

    this.element = root;
  }

  mount(target: Element) {
    target.appendChild(this.element);
  }

  update(snapshot: TelemetrySnapshot) {
    const definition = getSeasonDefinition(snapshot.season.id as SeasonId);
    this.headerSeason.textContent = `${definition.visuals.icon} ${definition.label}`;
    this.headerYear.textContent = `Year ${snapshot.season.year}, Cycle ${snapshot.season.cycle + 1}`;
    this.dayLabel.textContent = `Day ${snapshot.homestead.day}`;
    this.clockLabel.textContent = snapshot.homestead.clock;

    const progress = clamp01(snapshot.season.progress);
    this.progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
    this.progressText.textContent = `${Math.round(progress * 100)}% complete · ${formatDuration(
      snapshot.season.remainingSeconds
    )} left`;

    const moisture = snapshot.homestead.moistureDeltaPerSecond;
    const moistureTrend = moisture > 0 ? 'rising' : moisture < 0 ? 'falling' : 'stable';
    const moistureRate = Math.abs(moisture) < 0.001 ? 'steady soil moisture' : `${
      Math.abs(moisture).toFixed(3)
    }/s ${moisture > 0 ? 'gain' : 'loss'}`;
    this.moistureText.textContent = `Soil ${moistureTrend}: ${moistureRate}`;

    this.updateSeasonGrid(snapshot.season.id as SeasonId, progress);
    this.updateRecentEvents(snapshot);
  }

  private updateRecentEvents(snapshot: TelemetrySnapshot) {
    const doc = this.element.ownerDocument;
    this.recentEventsList.innerHTML = '';
    const events = snapshot.recentEvents.slice(-5).reverse();
    if (events.length === 0) {
      const item = doc.createElement('li');
      item.className = 'hud-calendar__recent-item';
      item.textContent = 'No notable activity logged yet.';
      this.recentEventsList.appendChild(item);
      return;
    }
    for (const event of events) {
      const item = doc.createElement('li');
      item.className = 'hud-calendar__recent-item';
      item.textContent = event;
      this.recentEventsList.appendChild(item);
    }
  }

  private createSeasonCell(doc: Document, seasonId: SeasonId, hideSummary: boolean): SeasonCell {
    const definition = getSeasonDefinition(seasonId);
    const root = doc.createElement('div');
    root.className = 'hud-calendar__season';
    root.dataset.season = seasonId;

    const header = doc.createElement('div');
    header.className = 'hud-calendar__season-header';
    const icon = doc.createElement('span');
    icon.className = 'hud-calendar__season-icon';
    icon.textContent = definition.visuals.icon;
    const label = doc.createElement('span');
    label.className = 'hud-calendar__season-label';
    label.textContent = definition.label;
    header.append(icon, label);
    root.appendChild(header);

    const track = doc.createElement('div');
    track.className = 'hud-calendar__season-track';
    const fill = doc.createElement('div');
    fill.className = 'hud-calendar__season-fill';
    track.appendChild(fill);
    root.appendChild(track);

    const summary = doc.createElement('p');
    summary.className = 'hud-calendar__season-summary';
    summary.textContent = definition.summary;
    if (hideSummary) {
      summary.hidden = true;
    }
    root.appendChild(summary);

    return { root, progress: fill, summary };
  }

  private updateSeasonGrid(active: SeasonId, globalProgress: number) {
    for (const [seasonId, cell] of this.seasonCells) {
      cell.root.classList.remove('is-active', 'is-past', 'is-upcoming');
      if (seasonId === active) {
        cell.root.classList.add('is-active');
        cell.progress.style.width = `${(globalProgress * 100).toFixed(1)}%`;
        cell.summary.hidden = false;
        continue;
      }
      const activeIndex = SEASON_ORDER.indexOf(active);
      const seasonIndex = SEASON_ORDER.indexOf(seasonId);
      if (seasonIndex === -1 || activeIndex === -1) {
        cell.root.classList.add('is-upcoming');
        cell.summary.hidden = true;
        cell.progress.style.width = '0%';
        continue;
      }
      if (seasonIndex < activeIndex) {
        cell.root.classList.add('is-past');
        cell.progress.style.width = '100%';
        cell.summary.hidden = true;
      } else {
        cell.root.classList.add('is-upcoming');
        cell.progress.style.width = '0%';
        cell.summary.hidden = true;
      }
    }
  }
}
