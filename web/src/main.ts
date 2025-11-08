import Phaser from 'phaser';
import { gridToScreen, TILE_H, TILE_W } from './iso';
import { defaultState, type GameState, type Structure } from './types';
import { load, save } from './storage';
import { enableAudio, toggleMute } from './audio';
import { fmt, initWorld, SIM_DT, tick } from './world';
import { enableAudio, playSfx, toggleMute } from './audio';
import { setupPwaInstallPrompt } from './pwa/installPrompt';
import {
  EVENT_RESOURCES_UPDATED,
  fmt,
  gameEvents,
  initWorld,
  SIM_DT,
  tick,
  type ResourcesUpdatedDetail
} from './world';
import { getUiBuildingDefinition } from './buildings';
import {
  getSeasonDefinition,
  SEASON_ORDER,
  type SeasonDefinition,
  type SeasonId
} from './config/seasons';
import {
  clearArea,
  createOccupancyMap,
  markJob,
  markStructure,
  type OccupancyMap,
  MAP_HEIGHT,
  MAP_WIDTH
} from './maps/tilemap';
import { loadDataTables, type DataTables } from './data';
import { BuildModeController } from './ui/buildModeController';

const dataTablesPromise = loadDataTables();

const woodEl = document.getElementById('wood')!;
const stoneEl = document.getElementById('stone')!;
const queueEl = document.getElementById('buildQueue')!;
const queueDetailsEl = document.getElementById('queueDetails')!;
const feedbackEl = document.getElementById('buildFeedback')!;
const selectedCostEl = document.getElementById('selectedCost')!;
const modeEl = document.getElementById('modeIndicator')!;
const seasonNameEl = document.getElementById('seasonName')!;
const seasonEffectsEl = document.getElementById('seasonEffects')!;
const seasonTimerEl = document.getElementById('seasonTimer')!;
const buildButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-building]'));
const installButton = document.getElementById('installApp') as HTMLButtonElement | null;

(document.getElementById('installAudio') as HTMLButtonElement).addEventListener(
  'click',
  enableAudio
);
(document.getElementById('mute') as HTMLButtonElement).addEventListener('click', () => {
  const muted = toggleMute();
  (document.getElementById('mute') as HTMLButtonElement).setAttribute(
    'aria-pressed',
    String(muted)
  );
});

if (installButton) {
  setupPwaInstallPrompt(installButton);
}

type PerformanceWithMemory = Performance & {
  memory?: {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

class DebugOverlay {
  private readonly container: HTMLDivElement;
  private frameCount = 0;
  private lastSample = performance.now();
  private fps = 0;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'debug-overlay';
    this.container.style.position = 'fixed';
    this.container.style.right = '0.5rem';
    this.container.style.bottom = '0.5rem';
    this.container.style.padding = '0.25rem 0.5rem';
    this.container.style.background = 'rgba(0, 0, 0, 0.6)';
    this.container.style.color = '#ffffff';
    this.container.style.fontFamily = 'monospace';
    this.container.style.fontSize = '0.75rem';
    this.container.style.zIndex = '1000';
    this.container.setAttribute('aria-live', 'polite');
    document.body.appendChild(this.container);
  }

  update(deltaMs: number) {
    this.frameCount += 1;
    const now = performance.now();
    const elapsed = now - this.lastSample;
    if (elapsed >= 500) {
      this.fps = (this.frameCount * 1000) / elapsed;
      this.frameCount = 0;
      this.lastSample = now;
    }

    const memoryInfo = (performance as PerformanceWithMemory).memory;
    const memoryText = memoryInfo
      ? ` | Mem: ${(memoryInfo.usedJSHeapSize / 1048576).toFixed(1)} / ${(
          memoryInfo.jsHeapSizeLimit / 1048576
        ).toFixed(0)} MB`
      : '';

    this.container.textContent = `FPS: ${this.fps.toFixed(1)} | Frame: ${deltaMs.toFixed(
      2
    )} ms${memoryText}`;
  }
}

const debugOverlay = new DebugOverlay();

class IsoScene extends Phaser.Scene {
  state: GameState = defaultState();
  tables!: DataTables;
  private accum = 0;
  private ground!: Phaser.GameObjects.Container;
  private overlays!: Phaser.GameObjects.Container;
  private props!: Phaser.GameObjects.Container;
  private seasonOverlay?: Phaser.GameObjects.Rectangle;
  private currentSeasonId: SeasonId | null = null;
  private occupancy: OccupancyMap = createOccupancyMap();
  private structureSprites = new Map<number, Phaser.GameObjects.Image>();
  private jobMarkers = new Map<number, Phaser.GameObjects.Image>();
  private buildMode!: BuildModeController;
  private detachHudListener?: () => void;

  preload() {
    const g = this.add.graphics({ x: 0, y: 0 });

    g.fillStyle(0x2b2f33, 1);
    g.fillPoints(
      [
        { x: TILE_W / 2, y: 0 },
        { x: TILE_W, y: TILE_H / 2 },
        { x: TILE_W / 2, y: TILE_H },
        { x: 0, y: TILE_H / 2 }
      ],
      true
    );
    g.generateTexture('tile:ground', TILE_W, TILE_H);
    g.clear();

    g.fillStyle(0x444444, 1);
    g.fillPoints(
      [
        { x: TILE_W / 2, y: 4 },
        { x: TILE_W - 4, y: TILE_H / 2 },
        { x: TILE_W / 2, y: TILE_H - 4 },
        { x: 4, y: TILE_H / 2 }
      ],
      true
    );
    g.generateTexture('tile:road', TILE_W, TILE_H);
    g.clear();

    g.fillStyle(0xb38b6d, 1);
    g.fillRect(0, 0, 52, 36);
    g.generateTexture('prop:cottage', 52, 36);

    g.clear();
    g.lineStyle(3, 0x46ff82, 0.9);
    g.strokePoints(
      [
        { x: TILE_W / 2, y: 2 },
        { x: TILE_W - 2, y: TILE_H / 2 },
        { x: TILE_W / 2, y: TILE_H - 2 },
        { x: 2, y: TILE_H / 2 }
      ],
      true
    );
    g.generateTexture('tile:outline:valid', TILE_W, TILE_H);
    g.clear();
    g.lineStyle(3, 0xff6677, 0.95);
    g.strokePoints(
      [
        { x: TILE_W / 2, y: 2 },
        { x: TILE_W - 2, y: TILE_H / 2 },
        { x: TILE_W / 2, y: TILE_H - 2 },
        { x: 2, y: TILE_H / 2 }
      ],
      true
    );
    g.generateTexture('tile:outline:blocked', TILE_W, TILE_H);
    g.destroy();
  }

  async create() {
    this.tables = await dataTablesPromise;
    const loaded = await load(this.tables.resources);
    this.state = loaded ?? defaultState(this.tables.resources);

    this.buildingDefs = Object.fromEntries(
      Object.values(BUILDINGS).map((def) => [
        def.id as BuildingId,
        {
          id: def.id,
          label: def.label,
          buildTime: def.buildTime,
          footprint: def.footprint
        } satisfies WorldBuildingDefinition
      ])
    ) as Record<BuildingId, WorldBuildingDefinition>;

    const constructionById = new Map(this.state.constructionQueue.map((job) => [job.id, job]));
    for (const job of this.state.buildQueue) {
      const existing = constructionById.get(job.id);
      if (existing) {
        job.duration = existing.duration;
        job.remaining = existing.remaining;
        continue;
      }
      const fallbackDef = this.buildingDefs[job.type as BuildingId];
      const duration = fallbackDef?.buildTime ?? job.duration;
      const remaining = Math.min(job.remaining, duration);
      const footprint = fallbackDef?.footprint ?? job.footprint;
      const constructionJob = {
        id: job.id,
        buildingId: job.type,
        duration,
        remaining,
        footprint
      };
      this.state.constructionQueue.push(constructionJob);
      constructionById.set(job.id, constructionJob);
      job.duration = duration;
      job.remaining = remaining;
    }

    initWorld(this.state);
    this.occupancy = createOccupancyMap();

    const cam = this.cameras.main;
    cam.setBackgroundColor('#0e0e10');
    cam.centerOn(0, 0);
    cam.setZoom(1.0);
    cam.roundPixels = true;

    this.ground = this.add.container(0, 0);
    this.overlays = this.add.container(0, 0);
    this.props = this.add.container(0, 0);

    for (let iy = 0; iy < MAP_HEIGHT; iy++) {
      for (let ix = 0; ix < MAP_WIDTH; ix++) {
        const { x, y } = gridToScreen(ix, iy, 0);
        const key = (ix + iy) % 5 === 0 ? 'tile:road' : 'tile:ground';
        const tile = this.add.image(x, y, key).setOrigin(0.5, 0.5);
        this.ground.add(tile);
      }
    }

    for (const structure of this.state.structures) {
      this.addStructure(structure);
      markStructure(
        this.occupancy,
        structure.x,
        structure.y,
        structure.footprint.w,
        structure.footprint.h,
        structure.type,
        structure.id
      );
    }

    for (const job of this.state.buildQueue) {
      markJob(this.occupancy, job.x, job.y, job.footprint.w, job.footprint.h, job.type, job.id);
      this.addJobMarker(job);
    }

    this.refreshQueueHud();
    this.buildMode = new BuildModeController({
      scene: this,
      state: this.state,
      occupancy: this.occupancy,
      overlayLayer: this.overlays,
      hud: {
        modeIndicator: modeEl,
        selectedCost: selectedCostEl,
        feedback: feedbackEl
      },
      buttons: buildButtons,
      onJobQueued: (job) => {
        this.addJobMarker(job.id, job.x, job.y);
        this.refreshQueueHud();
      }
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown && !this.buildMode.isActive()) {
        cam.scrollX -= p.velocity.x / cam.zoom;
        cam.scrollY -= p.velocity.y / cam.zoom;
      }
      this.buildMode.handlePointerMove(p.worldX, p.worldY);
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.buildMode.handlePointerDown(p);
    });

    this.input.on('wheel', (_p: unknown, _go: unknown, _dx: number, dy: number) => {
      const next = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.75, 2.25);
      cam.setZoom(next);
    });

    this.input.keyboard?.on('keydown-ESC', () => this.buildMode.cancel());

    this.time.addEvent({ delay: 5000, loop: true, callback: () => save(this.state) });

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      if (this.seasonOverlay) {
        this.seasonOverlay.setSize(gameSize.width, gameSize.height);
      }
    });

    this.syncSeasonState(true);
    const updateHud = (resources: GameState['resources']) => {
      woodEl.textContent = fmt(resources.wood ?? 0);
      stoneEl.textContent = fmt(resources.stone ?? 0);
    };

    const listener = (event: Event) => {
      const detail = (event as CustomEvent<ResourcesUpdatedDetail>).detail;
      updateHud(detail.resources);
    };
    gameEvents.addEventListener(EVENT_RESOURCES_UPDATED, listener);
    this.detachHudListener = () => gameEvents.removeEventListener(EVENT_RESOURCES_UPDATED, listener);
    updateHud(this.state.resources);
  }

  update(_time: number, deltaMs: number) {
    this.accum += deltaMs / 1000;
    while (this.accum >= SIM_DT) {
      const events = tick(this.state, SIM_DT, this.buildingDefs, this.tables.recipes);
      if (events.length > 0) {
        const last = events[events.length - 1];
        this.registry.set('lastEvent', last.type);
      }
      this.accum -= SIM_DT;
    }

    debugOverlay.update(deltaMs);

    woodEl.textContent = fmt(this.state.resources.wood ?? 0);
    stoneEl.textContent = fmt(this.state.resources.stone ?? 0);

    this.syncSeasonState();

    this.props.list.sort((a, b) => {
      const aImg = a as Phaser.GameObjects.Image;
      const bImg = b as Phaser.GameObjects.Image;
      return aImg.y - bImg.y;
    });

    this.syncJobMarkers();
    this.syncStructures();
    this.refreshQueueHud();
  }

  private addStructure(structure: Structure) {
    const def = getUiBuildingDefinition(structure.type);
    const { x, y } = gridToScreen(structure.x, structure.y, def.elevation ?? 0);
    const sprite = this.add
      .image(x, y - (def.anchorOffset ?? 0), def.texture)
      .setOrigin(0.5, def.anchorOffset !== undefined ? 1.0 : 0.5);
    this.props.add(sprite);
    this.structureSprites.set(structure.id, sprite);
  }

  private syncStructures() {
    for (const structure of this.state.structures) {
      if (!this.structureSprites.has(structure.id)) {
        this.addStructure(structure);
        markStructure(
          this.occupancy,
          structure.x,
          structure.y,
          structure.footprint.w,
          structure.footprint.h,
          structure.type,
          structure.id
        );
      }
    }
  }

  private addJobMarker(job: BuildJob) {
    const { x: sx, y: sy } = gridToScreen(job.x, job.y, 0);
    const marker = this.add
      .image(sx, sy, 'tile:outline:valid')
      .setOrigin(0.5, 0.5)
      .setAlpha(0.5);
    this.overlays.add(marker);
    marker.setDepth(500);
    this.jobMarkers.set(job.id, {
      marker,
      x: job.x,
      y: job.y,
      w: job.footprint.w,
      h: job.footprint.h
    });
  }

  private syncJobMarkers() {
    const activeIds = new Set(this.state.buildQueue.map((j) => j.id));
    for (const [id, entry] of this.jobMarkers.entries()) {
      if (!activeIds.has(id)) {
        entry.marker.destroy();
        clearArea(this.occupancy, entry.x, entry.y, entry.w, entry.h);
        this.jobMarkers.delete(id);
      }
    }
    for (const job of this.state.buildQueue) {
      const entry = this.jobMarkers.get(job.id);
      if (!entry) {
        this.addJobMarker(job);
        continue;
      }
      const progress =
        job.duration > 0 ? Phaser.Math.Clamp(1 - job.remaining / job.duration, 0, 1) : 1;
      entry.marker.setAlpha(0.3 + 0.5 * progress);
    }
  }

  private refreshQueueHud() {
    const { buildQueue } = this.state;
    queueEl.textContent = `${buildQueue.length}`;
    if (buildQueue.length === 0) {
      queueDetailsEl.textContent = 'No active construction.';
      return;
    }
    const next = buildQueue[0];
    const remaining = Math.ceil(next.remaining);
    const def = getUiBuildingDefinition(next.type);
    queueDetailsEl.textContent = `${def.label} (${remaining}s remaining)`;
  }

  private ensureSeasonOverlay(): Phaser.GameObjects.Rectangle {
    if (!this.seasonOverlay) {
      this.seasonOverlay = this.add
        .rectangle(0, 0, this.scale.width, this.scale.height, 0xffffff, 0)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(900);
    }
    return this.seasonOverlay;
  }

  private syncSeasonState(force = false) {
    const definition = getSeasonDefinition(this.state.season.active);
    const changed = force || this.currentSeasonId !== definition.id;
    if (changed) {
      this.applySeasonVisuals(definition);
      this.currentSeasonId = definition.id;
    }
    this.updateSeasonHud(definition);
  }

  private applySeasonVisuals(definition: SeasonDefinition) {
    const { visuals } = definition;
    this.cameras.main.setBackgroundColor(visuals.background);
    this.tintContainer(this.ground, visuals.groundTint);
    this.tintContainer(this.props, visuals.propTint);
    const overlay = this.ensureSeasonOverlay();
    overlay.setFillStyle(visuals.overlayColor, visuals.overlayAlpha);
  }

  private tintContainer(container: Phaser.GameObjects.Container, tint: number) {
    for (const child of container.list) {
      if (child instanceof Phaser.GameObjects.Image) {
        child.setTint(tint);
      }
    }
  }

  private updateSeasonHud(definition: SeasonDefinition) {
    const remaining = Math.max(0, definition.durationSeconds - this.state.season.elapsed);
    seasonNameEl.textContent = `${definition.visuals.icon} ${definition.label}`;
    seasonEffectsEl.textContent = definition.summary;
    const yearLabel = `Year ${this.state.season.year + 1}`;
    const cycleIndex = (this.state.season.cycle % SEASON_ORDER.length) + 1;
    const cycleLabel = `Cycle ${cycleIndex}/${SEASON_ORDER.length}`;
    seasonTimerEl.textContent = `${yearLabel} • ${cycleLabel} • Next in ${formatDuration(remaining)}`;
  }

  destroy(fromScene?: boolean) {
    this.detachHudListener?.();
    super.destroy(fromScene);
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: window.innerWidth,
  height: window.innerHeight,
  scene: [IsoScene],
  render: { pixelArt: true, antialias: false },
  scale: { mode: Phaser.Scale.RESIZE }
};

async function boot() {
  await dataTablesPromise;
  new Phaser.Game(config);
}

void boot();

function formatDuration(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
