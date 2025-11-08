import type { TelemetrySnapshot } from '../../telemetry/telemetry';

export interface StaminaTipsOptions {
  document?: Document;
  lowThreshold?: number;
  criticalThreshold?: number;
  maxVisibleTips?: number;
}

interface TipState {
  text: string;
  tone: 'info' | 'warn' | 'critical';
}

function ensureDocument(doc?: Document | null): Document {
  const resolved = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!resolved) {
    throw new Error('Stamina tips overlay requires a document context.');
  }
  return resolved;
}

export class StaminaTipsOverlay {
  readonly element: HTMLDivElement;
  private readonly title: HTMLHeadingElement;
  private readonly list: HTMLUListElement;
  private readonly lowThreshold: number;
  private readonly criticalThreshold: number;
  private readonly maxVisibleTips: number;

  constructor(options: StaminaTipsOptions = {}) {
    const doc = ensureDocument(options.document ?? null);
    this.lowThreshold = clamp01(options.lowThreshold ?? 0.45);
    this.criticalThreshold = clamp01(options.criticalThreshold ?? 0.2);
    this.maxVisibleTips = Math.max(1, Math.floor(options.maxVisibleTips ?? 3));

    const root = doc.createElement('section');
    root.className = 'hud-stamina-tips hud-panel';
    root.setAttribute('aria-label', 'Stamina advisor');

    this.title = doc.createElement('h2');
    this.title.textContent = 'Stamina Tips';
    root.appendChild(this.title);

    this.list = doc.createElement('ul');
    this.list.className = 'hud-stamina-tips__list';
    root.appendChild(this.list);

    this.element = root;
  }

  mount(target: Element) {
    target.appendChild(this.element);
  }

  update(snapshot: TelemetrySnapshot) {
    const tips = this.buildTips(snapshot).slice(0, this.maxVisibleTips);
    this.renderTips(tips);
  }

  private buildTips(snapshot: TelemetrySnapshot): TipState[] {
    const tips: TipState[] = [];
    const ratio = clamp01(snapshot.homestead.staminaRatio);

    if (snapshot.homestead.exhausted) {
      tips.push({
        text: 'You are exhausted. Rest at the camp or cook a meal before taking new actions.',
        tone: 'critical'
      });
    }

    if (ratio <= this.criticalThreshold) {
      tips.push({
        text: 'Stamina is critically low. Rest until dawn or drink a tonic to avoid collapsing.',
        tone: 'critical'
      });
    } else if (ratio <= this.lowThreshold) {
      tips.push({
        text: 'Energy is fading. Focus on light chores or plan tomorrow using the calendar.',
        tone: 'warn'
      });
    } else {
      tips.push({
        text: 'Stamina reserves look healthy. Chain harvests with light construction to capitalise.',
        tone: 'info'
      });
    }

    if (snapshot.daily.buildsCompleted >= 3 && ratio <= this.lowThreshold) {
      tips.push({
        text: 'Building takes a toll. Queue repairs for tomorrow after you recover some stamina.',
        tone: 'warn'
      });
    }

    if (snapshot.daily.cropsWithered > snapshot.daily.cropsMatured) {
      tips.push({
        text: 'More crops withered than matured today. Consider watering before nightfall.',
        tone: ratio <= this.lowThreshold ? 'critical' : 'warn'
      });
    }

    if (snapshot.queues.build > 0 && ratio <= this.lowThreshold) {
      tips.push({
        text: `There are ${snapshot.queues.build} builds waiting. Rest now and resume when fresh.`,
        tone: 'warn'
      });
    }

    if (snapshot.homestead.moistureDeltaPerSecond < -0.002) {
      tips.push({
        text: 'Soil moisture is falling fast. Light watering can save tomorrow’s stamina demands.',
        tone: ratio <= this.lowThreshold ? 'warn' : 'info'
      });
    }

    if (snapshot.daily.productionCycles >= 4 && ratio <= this.lowThreshold) {
      tips.push({
        text: 'Production has run hot today. Delegate hauling or pause a station to rest.',
        tone: 'warn'
      });
    }

    if (tips.length === 0) {
      tips.push({ text: 'All clear. Keep an eye on the calendar for seasonal opportunities.', tone: 'info' });
    }

    return dedupeTips(tips);
  }

  private renderTips(tips: TipState[]) {
    const doc = this.element.ownerDocument;
    this.list.innerHTML = '';
    for (const tip of tips) {
      const item = doc.createElement('li');
      item.className = `hud-stamina-tips__item hud-stamina-tips__item--${tip.tone}`;
      item.textContent = tip.text;
      this.list.appendChild(item);
    }
  }
}

function dedupeTips(tips: TipState[]): TipState[] {
  const seen = new Set<string>();
  const results: TipState[] = [];
  for (const tip of tips) {
    if (seen.has(tip.text)) continue;
    seen.add(tip.text);
    results.push(tip);
  }
  return results;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
