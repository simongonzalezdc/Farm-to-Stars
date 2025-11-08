import Phaser from 'phaser';

import { playInvalidPlacement, playPlace, playUiHover } from '../audio';
import { gridToScreen, screenToGrid } from '../iso';
import {
  applyCost,
  canAfford,
  formatCost,
  getUiBuildingDefinition,
  getUiBuildingDefinitions,
  type UiBuildingDefinition
} from '../buildings';
import {
  markJob,
  validatePlacement,
  type OccupancyMap,
  type PlacementIssue,
  type PlacementResult
} from '../maps/tilemap';
import type { BuildJob, BuildingType, GameState } from '../types';

interface HudElements {
  modeIndicator: HTMLElement;
  selectedCost: HTMLElement;
  feedback: HTMLElement;
}

interface BuildModeControllerOptions {
  scene: Phaser.Scene;
  state: GameState;
  occupancy: OccupancyMap;
  overlayLayer: Phaser.GameObjects.Container;
  hud: HudElements;
  buttons: HTMLButtonElement[];
  onJobQueued(job: BuildJob): void;
}

export class BuildModeController {
  private readonly scene: Phaser.Scene;
  private readonly state: GameState;
  private readonly occupancy: OccupancyMap;
  private readonly overlayLayer: Phaser.GameObjects.Container;
  private readonly hud: HudElements;
  private readonly onJobQueued: (job: BuildJob) => void;
  private readonly buttons: HTMLButtonElement[];
  private readonly particleManager: Phaser.GameObjects.Particles.ParticleEmitterManager;
  private readonly placementEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  private mode: 'pan' | 'build' = 'pan';
  private selected?: BuildingType;
  private currentDefinition?: UiBuildingDefinition;
  private hover?: { x: number; y: number };
  private readonly ghost: Phaser.GameObjects.Image;
  private readonly footprintOverlay: Phaser.GameObjects.Container;
  private readonly footprintTiles: Phaser.GameObjects.Image[] = [];
  private selectedButton: HTMLButtonElement | null = null;
  private ghostMoveTween: Phaser.Tweens.Tween | null = null;
  private feedbackHoldUntil = 0;

  constructor(options: BuildModeControllerOptions) {
    this.scene = options.scene;
    this.state = options.state;
    this.occupancy = options.occupancy;
    this.overlayLayer = options.overlayLayer;
    this.hud = options.hud;
    this.buttons = options.buttons;
    this.onJobQueued = options.onJobQueued;

    this.ghost = this.scene.add
      .image(0, 0, 'prop:cottage')
      .setVisible(false)
      .setAlpha(0.7)
      .setOrigin(0.5, 1.0)
      .setDepth(950);

    this.footprintOverlay = this.scene.add.container(0, 0);
    this.footprintOverlay.setDepth(900);
    this.footprintOverlay.setVisible(false);
    this.overlayLayer.add(this.footprintOverlay);

    this.ensureParticleTexture();
    this.particleManager = this.scene.add.particles(0, 0, 'ui:placementSpark');
    this.particleManager.setDepth(940);
    this.particleManager.setVisible(false);
    this.placementEmitter = this.particleManager.createEmitter({
      speed: { min: 70, max: 140 },
      lifespan: { min: 260, max: 420 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 0.85, end: 0 },
      rotate: { min: -45, max: 45 },
      gravityY: -160,
      quantity: 18,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false
    });

    this.setupButtons();
    this.resetHud();
  }

  isActive(): boolean {
    return this.mode === 'build';
  }

  cancel() {
    if (this.mode !== 'build') {
      return;
    }
    this.exitBuildMode();
  }

  handlePointerMove(worldX: number, worldY: number) {
    if (this.mode !== 'build' || !this.selected) {
      return;
    }
    this.updatePlacementPreview(worldX, worldY);
  }

  handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.mode !== 'build') {
      return;
    }

    if (pointer.leftButtonDown()) {
      this.attemptPlacement();
    }

    if (pointer.rightButtonDown()) {
      this.exitBuildMode();
    }
  }

  private setupButtons() {
    const definitions = getUiBuildingDefinitions();
    this.buttons.forEach((button) => {
      const type = button.dataset.building as BuildingType | undefined;
      if (!type) {
        return;
      }
      const def = definitions[type];
      if (!def) {
        button.disabled = true;
        button.title = 'Unavailable building';
        return;
      }
      button.textContent = `${def.label} (${formatCost(def.cost)})`;
      button.title = `Footprint: ${def.footprint.w}\u00d7${def.footprint.h}\nCost: ${formatCost(def.cost)}\nBuild time: ${def.buildTime}s`;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('mouseenter', () => {
        if (button.disabled) return;
        playUiHover();
      });
      button.addEventListener('focus', () => {
        if (button.disabled) return;
        playUiHover();
      });
      button.addEventListener('click', () => {
        if (this.mode === 'build' && this.selected === type) {
          this.exitBuildMode();
          return;
        }
        this.enterBuildMode(type, button, def);
      });
    });
  }

  private resetHud() {
    this.hud.modeIndicator.textContent = 'Camera';
    this.hud.selectedCost.textContent = '—';
    this.updateCostState('idle');
    this.setFeedback('Camera pan + zoom enabled.', 'info');
  }

  private enterBuildMode(type: BuildingType, button: HTMLButtonElement, def?: UiBuildingDefinition) {
    this.mode = 'build';
    this.selected = type;
    this.selectedButton?.setAttribute('aria-pressed', 'false');
    this.selectedButton = button;
    this.selectedButton.setAttribute('aria-pressed', 'true');

    const resolved = def ?? getUiBuildingDefinition(type);
    this.currentDefinition = resolved;
    this.hud.modeIndicator.textContent = 'Placement';
    this.hud.selectedCost.textContent = formatCost(resolved.cost);
    const affordable = canAfford(this.state.resources, resolved.cost);
    this.updateCostState(affordable ? 'ok' : 'warn');
    this.setFeedback(
      affordable
        ? 'Click a tile to queue construction. Right click or press Esc to cancel.'
        : 'Gather more resources before placing this building.',
      affordable ? 'info' : 'warn'
    );
    this.ghost.setTexture(resolved.texture);
    this.ghost.setVisible(false);
    this.footprintOverlay.setVisible(false);

    const pointer = this.scene.input.activePointer;
    this.updatePlacementPreview(pointer.worldX, pointer.worldY);
  }

  private exitBuildMode() {
    this.mode = 'pan';
    this.selected = undefined;
    this.currentDefinition = undefined;
    this.hover = undefined;
    this.feedbackHoldUntil = 0;
    this.selectedButton?.setAttribute('aria-pressed', 'false');
    this.selectedButton = null;
    this.ghostMoveTween?.stop();
    this.ghostMoveTween = null;
    this.ghost.setVisible(false);
    this.footprintOverlay.setVisible(false);
    this.footprintTiles.forEach((tile) => tile.setVisible(false));
    this.placementEmitter.stop();
    this.particleManager.setVisible(false);
    this.resetHud();
  }

  private ensureFootprintTiles(count: number) {
    for (let i = this.footprintTiles.length; i < count; i++) {
      const tile = this.scene.add.image(0, 0, 'tile:outline:valid').setOrigin(0.5, 0.5).setVisible(false);
      tile.setAlpha(0.65);
      this.footprintOverlay.add(tile);
      this.footprintTiles.push(tile);
    }
  }

  private updatePlacementPreview(worldX: number, worldY: number) {
    if (!this.selected) {
      return;
    }
    const def = this.currentDefinition ?? getUiBuildingDefinition(this.selected);
    this.currentDefinition = def;
    const { ix, iy } = screenToGrid(worldX, worldY);
    this.hover = { x: ix, y: iy };

    const placement = validatePlacement(this.occupancy, ix, iy, def.footprint.w, def.footprint.h);
    const affordable = canAfford(this.state.resources, def.cost);
    const valid = placement.ok && affordable;

    this.drawFootprint(ix, iy, def, placement.issues);

    const { x, y } = gridToScreen(ix, iy, def.elevation ?? 0);
    this.ghost.setVisible(true);
    const targetY = y - (def.anchorOffset ?? 0);
    if (this.ghostMoveTween) {
      this.ghostMoveTween.stop();
    }
    this.ghostMoveTween = this.scene.tweens.add({
      targets: this.ghost,
      x,
      y: targetY,
      duration: valid ? 110 : 160,
      ease: valid ? 'Sine.easeOut' : 'Cubic.easeOut'
    });

    if (!affordable) {
      this.ghost.setTint(0xffd166);
    } else if (placement.ok) {
      this.ghost.setTint(0x82ff9a);
    } else {
      this.ghost.setTint(0xff6b6b);
    }

    this.ghost.setAlpha(valid ? 0.85 : 0.65);
    this.updateCostState(affordable ? 'ok' : 'warn');

    if (this.feedbackHoldUntil <= performance.now()) {
      if (!affordable) {
        this.setFeedback('Need more resources before placing.', 'warn');
      } else if (!placement.ok) {
        this.setFeedback(this.describeIssues(placement), 'error');
      } else {
        this.setFeedback(`${def.label} ready to place.`, 'success');
      }
    }
  }

  private drawFootprint(x: number, y: number, def: UiBuildingDefinition, issues: PlacementIssue[]) {
    const totalTiles = def.footprint.w * def.footprint.h;
    this.ensureFootprintTiles(totalTiles);
    const blocked = new Set(issues.map((issue) => `${issue.x},${issue.y}`));

    let tileIndex = 0;
    for (let iy = 0; iy < def.footprint.h; iy++) {
      for (let ix = 0; ix < def.footprint.w; ix++) {
        const tile = this.footprintTiles[tileIndex++];
        const tx = x + ix;
        const ty = y + iy;
        const { x: sx, y: sy } = gridToScreen(tx, ty, 0);
        tile.setPosition(sx, sy);
        tile.setVisible(true);
        if (blocked.has(`${tx},${ty}`)) {
          tile.setTint(0xff6b6b);
          tile.setAlpha(0.8);
        } else {
          tile.setTint(0x82ff9a);
          tile.setAlpha(0.6);
        }
      }
    }

    for (let i = tileIndex; i < this.footprintTiles.length; i++) {
      this.footprintTiles[i].setVisible(false);
    }

    this.footprintOverlay.setVisible(true);
  }

  private attemptPlacement() {
    if (this.mode !== 'build' || !this.selected || !this.hover) {
      return;
    }
    const def = this.currentDefinition ?? getUiBuildingDefinition(this.selected);
    const { x, y } = this.hover;
    const placement = validatePlacement(this.occupancy, x, y, def.footprint.w, def.footprint.h);

    if (!placement.ok) {
      playInvalidPlacement();
      this.setFeedback(this.describeIssues(placement), 'error', 1400);
      this.drawFootprint(x, y, def, placement.issues);
      playInvalidPlacementSfx();
      return;
    }

    if (!canAfford(this.state.resources, def.cost)) {
      playInvalidPlacement();
      this.setFeedback('Not enough resources for that building.', 'warn', 1400);
      this.updateCostState('warn');
      return;
    }

    applyCost(this.state.resources, def.cost);

    const jobId = this.state.nextBuildId++;
    const job: BuildJob = {
      id: jobId,
      type: this.selected,
      x,
      y,
      footprint: def.footprint,
      duration: def.buildTime,
      remaining: def.buildTime,
      status: 'queued'
    };
    this.state.buildQueue.push(job);
    markJob(this.occupancy, x, y, def.footprint.w, def.footprint.h, this.selected, jobId);
    playPlacementSfx();

    this.onJobQueued(job);

    this.emitPlacementCelebration(x, y, def);
    this.setFeedback(`${def.label} queued for construction.`, 'success', 1600);
    const stillAffordable = canAfford(this.state.resources, def.cost);
    this.updateCostState(stillAffordable ? 'ok' : 'warn');

    const pointer = this.scene.input.activePointer;
    this.updatePlacementPreview(pointer.worldX, pointer.worldY);
  }

  private setFeedback(message: string, tone: 'info' | 'warn' | 'error' | 'success', holdMs = 0) {
    this.hud.feedback.textContent = message;
    this.hud.feedback.dataset.tone = tone;
    this.feedbackHoldUntil = holdMs > 0 ? performance.now() + holdMs : 0;
  }

  private updateCostState(state: 'idle' | 'ok' | 'warn') {
    this.hud.selectedCost.dataset.state = state;
  }

  private describeIssues(result: PlacementResult | PlacementIssue[]): string {
    const issues = Array.isArray(result) ? result : result.issues;
    const reasons = new Set(issues.map((issue) => issue.reason));
    if (reasons.has('out-of-bounds')) {
      return 'Cannot place there: outside colony boundary.';
    }
    if (reasons.has('occupied')) {
      return 'Cannot place there: space already reserved.';
    }
    return 'Cannot place there.';
  }

  private emitPlacementCelebration(x: number, y: number, def: UiBuildingDefinition) {
    const cx = x + (def.footprint.w - 1) / 2;
    const cy = y + (def.footprint.h - 1) / 2;
    const { x: sx, y: sy } = gridToScreen(cx, cy, def.elevation ?? 0);
    this.particleManager.setVisible(true);
    this.placementEmitter.explode(
      Math.min(30, 12 + def.footprint.w * def.footprint.h * 2),
      sx,
      sy - (def.anchorOffset ?? 0)
    );
  }

  private ensureParticleTexture() {
    if (this.scene.textures.exists('ui:placementSpark')) {
      return;
    }
    const graphics = this.scene.make.graphics({ add: false });
    graphics.fillStyle(0xf8fafc, 1);
    graphics.fillCircle(6, 6, 5);
    graphics.generateTexture('ui:placementSpark', 12, 12);
    graphics.destroy();
  }
}
