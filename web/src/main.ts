import Phaser from 'phaser';
import { gridToScreen, screenToGrid, TILE_W, TILE_H } from './iso';
import { defaultState, type GameState, type BuildingType, type Structure } from './types';
import { load, save } from './storage';
import { enableAudio, toggleMute } from './audio';
import { tick, fmt } from './world';
import { BUILDINGS, applyCost, canAfford, formatCost } from './buildings';
import {
  createOccupancyMap,
  markJob,
  markStructure,
  validatePlacement,
  withinBounds,
  type OccupancyMap,
  type PlacementIssue,
  MAP_WIDTH,
  MAP_HEIGHT
} from './maps/tilemap';

const woodEl = document.getElementById('wood')!;
const stoneEl = document.getElementById('stone')!;
const queueEl = document.getElementById('buildQueue')!;
const queueDetailsEl = document.getElementById('queueDetails')!;
const feedbackEl = document.getElementById('buildFeedback')!;
const selectedCostEl = document.getElementById('selectedCost')!;
const modeEl = document.getElementById('modeIndicator')!;
const buildButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('[data-building]')
);
(document.getElementById('installAudio') as HTMLButtonElement).addEventListener('click', enableAudio);
(document.getElementById('mute') as HTMLButtonElement).addEventListener('click', () => {
  const m = toggleMute();
  (document.getElementById('mute') as HTMLButtonElement).setAttribute('aria-pressed', String(m));
});

class IsoScene extends Phaser.Scene {
  state: GameState = defaultState();
  private accum = 0;
  private ground!: Phaser.GameObjects.Container;
  private overlays!: Phaser.GameObjects.Container;
  private props!: Phaser.GameObjects.Container;
  private ghost!: Phaser.GameObjects.Image;
  private occupancy: OccupancyMap = createOccupancyMap();
  private blockedOverlays: Phaser.GameObjects.Image[] = [];
  private structureSprites = new Map<number, Phaser.GameObjects.Image>();
  private jobMarkers = new Map<number, Phaser.GameObjects.Image>();
  private ui: {
    mode: 'pan' | 'build';
    selected?: BuildingType;
    hover?: { x: number; y: number };
  } = { mode: 'pan' };
  private selectedButton: HTMLButtonElement | null = null;

  preload() {
    // placeholder pixel-iso textures (replace with real atlas later)
    const g = this.add.graphics({ x: 0, y: 0 });

    // ground diamond (pixel crisp)
    g.fillStyle(0x2b2f33, 1);
    g.fillPoints(
      [{ x: TILE_W / 2, y: 0 }, { x: TILE_W, y: TILE_H / 2 }, { x: TILE_W / 2, y: TILE_H }, { x: 0, y: TILE_H / 2 }],
      true
    );
    g.generateTexture('tile:ground', TILE_W, TILE_H);
    g.clear();

    // road diamond
    g.fillStyle(0x444444, 1);
    g.fillPoints(
      [{ x: TILE_W / 2, y: 4 }, { x: TILE_W - 4, y: TILE_H / 2 }, { x: TILE_W / 2, y: TILE_H - 4 }, { x: 4, y: TILE_H / 2 }],
      true
    );
    g.generateTexture('tile:road', TILE_W, TILE_H);
    g.clear();

    // cottage (simple pixel block to start)
    g.fillStyle(0xb38b6d, 1);
    g.fillRect(0, 0, 52, 36);
    g.generateTexture('prop:cottage', 52, 36);

    // placement outlines
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
    const loaded = await load();
    const base = defaultState();
    if (loaded) {
      const mergedStructures = (loaded.structures ?? base.structures).map((structure, idx) => ({
        ...structure,
        id: structure.id ?? idx,
        footprint: structure.footprint ?? { w: 1, h: 1 }
      }));
      const mergedQueue = (loaded.buildQueue ?? base.buildQueue).map((job, idx) => {
        const def = BUILDINGS[job.type];
        const footprint = job.footprint ?? def?.footprint ?? { w: 1, h: 1 };
        const duration = job.duration ?? def?.buildTime ?? 10;
        const remaining = Math.min(job.remaining ?? duration, duration);
        const status = job.status === 'building' ? 'building' : 'queued';
        return {
          ...job,
          id: job.id ?? base.nextBuildId + idx,
          footprint,
          duration,
          remaining,
          status
        };
      });
      const highestStructureId = mergedStructures.reduce(
        (max, structure) => Math.max(max, structure.id ?? 0),
        0
      );
      const highestJobId = mergedQueue.reduce((max, job) => Math.max(max, job.id ?? 0), 0);
      this.state = {
        ...base,
        ...loaded,
        resources: { ...base.resources, ...loaded.resources },
        structures: mergedStructures,
        buildQueue: mergedQueue,
        nextBuildId:
          loaded.nextBuildId ??
          Math.max(base.nextBuildId, highestStructureId + 1, highestJobId + 1)
      };
    } else {
      this.state = base;
    }

    const cam = this.cameras.main;
    cam.setBackgroundColor('#0e0e10');
    cam.centerOn(0, 0);
    cam.setZoom(1.0);
    cam.roundPixels = true; // keep pixels crisp at sub-pixel positions

    this.ground = this.add.container(0, 0);
    this.overlays = this.add.container(0, 0);
    this.props = this.add.container(0, 0);

    // tiny 20×20 patch to start
    for (let iy = 0; iy < MAP_HEIGHT; iy++) {
      for (let ix = 0; ix < MAP_WIDTH; ix++) {
        const { x, y } = gridToScreen(ix, iy, 0);
        const key = (ix + iy) % 5 === 0 ? 'tile:road' : 'tile:ground';
        const t = this.add.image(x, y, key).setOrigin(0.5, 0.5);
        this.ground.add(t);
      }
    }

    this.ghost = this.add.image(0, 0, 'prop:cottage').setVisible(false).setAlpha(0.7);
    this.ghost.setDepth(1000);

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
      markJob(
        this.occupancy,
        job.x,
        job.y,
        job.footprint.w,
        job.footprint.h,
        job.type,
        job.id
      );
      this.addJobMarker(job.id, job.x, job.y);
    }

    this.refreshQueueHud();
    this.setupHud();

    // drag to pan
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown && this.ui.mode === 'pan') {
        cam.scrollX -= p.velocity.x / cam.zoom;
        cam.scrollY -= p.velocity.y / cam.zoom;
      }
      if (this.ui.mode === 'build') {
        this.updatePlacementPreview(p.worldX, p.worldY);
      }
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.ui.mode === 'build' && p.leftButtonDown()) {
        this.attemptPlacement();
      }
      if (this.ui.mode === 'build' && p.rightButtonDown()) {
        this.exitBuildMode();
      }
    });

    // wheel to zoom (clamped for readability on web+mobile)
    this.input.on('wheel', (_p: any, _go: any, _dx: number, dy: number) => {
      const next = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.75, 2.25);
      cam.setZoom(next);
    });

    this.input.keyboard?.on('keydown-ESC', () => this.exitBuildMode());

    // autosave every 5s
    this.time.addEvent({ delay: 5000, loop: true, callback: () => save(this.state) });
  }

  update(_time: number, deltaMs: number) {
    // fixed 10 Hz sim (you can switch to 20 Hz by changing 0.1 → 0.05)
    this.accum += deltaMs / 1000;
    while (this.accum >= 0.1) {
      tick(this.state, 0.1);
      this.accum -= 0.1;
    }

    woodEl.textContent = fmt(this.state.resources.wood);
    stoneEl.textContent = fmt(this.state.resources.stone);

    // y-sort props by screen y
    this.props.list.sort((a, b) => (a as any).y - (b as any).y);

    this.syncStructures();
    this.syncJobMarkers();
    this.refreshQueueHud();
  }

  private setupHud() {
    modeEl.textContent = 'Camera';
    selectedCostEl.textContent = '—';
    feedbackEl.textContent = 'Camera pan + zoom enabled.';
    buildButtons.forEach((btn) => {
      const type = btn.dataset.building as BuildingType | undefined;
      if (!type) {
        return;
      }
      const def = BUILDINGS[type];
      btn.textContent = `${def.label} (${formatCost(def.cost)})`;
      btn.addEventListener('click', () => {
        if (this.ui.selected === type && this.ui.mode === 'build') {
          this.exitBuildMode();
          return;
        }
        this.enterBuildMode(type, btn);
      });
    });
  }

  private enterBuildMode(type: BuildingType, button: HTMLButtonElement) {
    this.ui.mode = 'build';
    this.ui.selected = type;
    this.selectedButton?.setAttribute('aria-pressed', 'false');
    this.selectedButton = button;
    this.selectedButton.setAttribute('aria-pressed', 'true');
    const def = BUILDINGS[type];
    this.ghost.setTexture(def.texture);
    this.ghost.setVisible(false);
    modeEl.textContent = 'Placement';
    selectedCostEl.textContent = formatCost(def.cost);
    feedbackEl.textContent = 'Click a tile to queue construction. Right click or press Esc to cancel.';
    const pointer = this.input.activePointer;
    this.updatePlacementPreview(pointer.worldX, pointer.worldY);
  }

  private exitBuildMode() {
    this.ui.mode = 'pan';
    this.ui.selected = undefined;
    this.ui.hover = undefined;
    this.selectedButton?.setAttribute('aria-pressed', 'false');
    this.selectedButton = null;
    this.ghost.setVisible(false);
    this.hideBlockedTiles();
    modeEl.textContent = 'Camera';
    selectedCostEl.textContent = '—';
    feedbackEl.textContent = 'Camera pan + zoom enabled.';
  }

  private updatePlacementPreview(worldX: number, worldY: number) {
    if (this.ui.mode !== 'build' || !this.ui.selected) {
      return;
    }
    const def = BUILDINGS[this.ui.selected];
    const { ix, iy } = screenToGrid(worldX, worldY);
    if (!withinBounds(this.occupancy, ix, iy, def.footprint.w, def.footprint.h)) {
      this.ghost.setVisible(false);
      this.ui.hover = undefined;
      this.showBlockedTiles([
        { x: ix, y: iy, reason: 'out-of-bounds' as PlacementIssue['reason'] }
      ]);
      return;
    }

    const { x, y } = gridToScreen(ix, iy, def.elevation ?? 0);
    this.ghost.setVisible(true);
    this.ghost.setPosition(x, y - (def.anchorOffset ?? 0));
    this.ui.hover = { x: ix, y: iy };

    const placement = validatePlacement(
      this.occupancy,
      ix,
      iy,
      def.footprint.w,
      def.footprint.h
    );

    const affordable = canAfford(this.state.resources, def.cost);
    const valid = placement.ok && affordable;

    if (!placement.ok) {
      this.showBlockedTiles(placement.issues);
    } else {
      this.hideBlockedTiles();
    }

    if (!affordable) {
      this.ghost.setTint(0xffd166);
    } else if (valid) {
      this.ghost.setTint(0x82ff9a);
    } else {
      this.ghost.setTint(0xff6b6b);
    }
    this.ghost.setAlpha(valid ? 0.85 : 0.65);
  }

  private attemptPlacement() {
    if (this.ui.mode !== 'build' || !this.ui.selected || !this.ui.hover) {
      return;
    }
    const type = this.ui.selected;
    const def = BUILDINGS[type];
    const { x, y } = this.ui.hover;
    const placement = validatePlacement(
      this.occupancy,
      x,
      y,
      def.footprint.w,
      def.footprint.h
    );

    if (!placement.ok) {
      this.showBlockedTiles(placement.issues);
      feedbackEl.textContent = 'Cannot place there: tiles are occupied.';
      return;
    }

    if (!canAfford(this.state.resources, def.cost)) {
      feedbackEl.textContent = 'Not enough resources for that building.';
      return;
    }

    applyCost(this.state.resources, def.cost);

    const jobId = this.state.nextBuildId++;
    const job = {
      id: jobId,
      type,
      x,
      y,
      footprint: def.footprint,
      duration: def.buildTime,
      remaining: def.buildTime,
      status: 'queued' as const
    };
    this.state.buildQueue.push(job);
    markJob(this.occupancy, x, y, def.footprint.w, def.footprint.h, type, jobId);
    this.addJobMarker(jobId, x, y);
    feedbackEl.textContent = `${def.label} queued for construction.`;
    this.hideBlockedTiles();
    const pointer = this.input.activePointer;
    this.updatePlacementPreview(pointer.worldX, pointer.worldY);
    this.refreshQueueHud();
  }

  private addStructure(structure: Structure) {
    const def = BUILDINGS[structure.type];
    const { x, y } = gridToScreen(structure.x, structure.y, def.elevation ?? 0);
    const sprite = this.add
      .image(x, y - (def.anchorOffset ?? 0), def.texture)
      .setOrigin(0.5, 1.0);
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

  private addJobMarker(jobId: number, x: number, y: number) {
    const { x: sx, y: sy } = gridToScreen(x, y, 0);
    const marker = this.add
      .image(sx, sy, 'tile:outline:valid')
      .setOrigin(0.5, 0.5)
      .setAlpha(0.5);
    this.overlays.add(marker);
    marker.setDepth(500);
    this.jobMarkers.set(jobId, marker);
  }

  private syncJobMarkers() {
    const activeIds = new Set(this.state.buildQueue.map((j) => j.id));
    for (const [id, marker] of this.jobMarkers.entries()) {
      if (!activeIds.has(id)) {
        marker.destroy();
        this.jobMarkers.delete(id);
      }
    }
    for (const job of this.state.buildQueue) {
      const marker = this.jobMarkers.get(job.id);
      if (!marker) {
        this.addJobMarker(job.id, job.x, job.y);
        continue;
      }
      const progress = Phaser.Math.Clamp(1 - job.remaining / job.duration, 0, 1);
      marker.setAlpha(0.3 + 0.5 * progress);
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
    queueDetailsEl.textContent = `${BUILDINGS[next.type].label} (${remaining}s remaining)`;
  }

  private showBlockedTiles(issues: PlacementIssue[]) {
    if (!issues.length) {
      this.hideBlockedTiles();
      return;
    }
    this.blockedOverlays.forEach((img) => img.setVisible(false));
    issues.forEach((issue, idx) => {
      if (issue.x < 0 || issue.y < 0 || issue.x >= MAP_WIDTH || issue.y >= MAP_HEIGHT) {
        return;
      }
      let img = this.blockedOverlays[idx];
      if (!img) {
        img = this.add.image(0, 0, 'tile:outline:blocked').setOrigin(0.5, 0.5);
        this.overlays.add(img);
        this.blockedOverlays[idx] = img;
      }
      img.setVisible(true);
      const { x, y } = gridToScreen(issue.x, issue.y, 0);
      img.setPosition(x, y);
      img.setDepth(600);
    });
  }

  private hideBlockedTiles() {
    this.blockedOverlays.forEach((img) => img.setVisible(false));
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

new Phaser.Game(config);
