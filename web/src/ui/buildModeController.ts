import Phaser from 'phaser';

import { playInvalidPlacement, playPlace, playUiHover } from '../audio';
import { PlacementGhost, type PlacementGhostState } from '../hud/build/PlacementGhost';
import { wireBuildControls } from '../input/buildControls';
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
import type { BuildJob, BuildingType, Footprint, GameState, Orientation } from '../types';

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
  private lastPointerWorld?: { x: number; y: number };
  private readonly ghost: PlacementGhost;
  private readonly footprintOverlay: Phaser.GameObjects.Container;
  private readonly footprintTiles: Phaser.GameObjects.Image[] = [];
  private selectedButton: HTMLButtonElement | null = null;
  private ghostMoveTween: Phaser.Tweens.Tween | null = null;
  private feedbackHoldUntil = 0;
  private rotation: Orientation = 0;
  private detachControls: (() => void) | null = null;

  constructor(options: BuildModeControllerOptions) {
    this.scene = options.scene;
    this.state = options.state;
    this.occupancy = options.occupancy;
    this.overlayLayer = options.overlayLayer;
    this.hud = options.hud;
    this.buttons = options.buttons;
    this.onJobQueued = options.onJobQueued;

    this.ghost = new PlacementGhost(this.scene, 'prop:cottage');

    this.footprintOverlay = this.scene.add.container(0, 0);
    this.footprintOverlay.setDepth(900);
    this.footprintOverlay.setVisible(false);
    this.overlayLayer.add(this.footprintOverlay);

    this.ensureParticleTexture();
    this.particleManager = this.scene.add.particles(0, 0, 'ui:placementSpark');
    this.particleManager.setDepth(940);
    this.particleManager.setVisible(false);
    // In Phaser 3.80+, createEmitter was removed. Use addParticleEmitter instead.
    try {
      this.placementEmitter = (this.particleManager as any).addParticleEmitter({
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
    } catch (e) {
      // Fallback: if addParticleEmitter doesn't exist, create emitter using the old API
      this.placementEmitter = (this.particleManager as any).createEmitter({
        speed: { min: 70, max: 140 },
        lifespan: { min: 260, max: 420 },
        scale: { start: 0.55, end: 0 },
        alpha: { start: 0.85, end: 0 },
        rotate: { min: -45, max: 45 },
        gravityY: -160,
        quantity: 18,
        blendMode: Phaser.BlendModes.ADD,
        emitting: false
      }) || this.particleManager;
    }

    this.setupButtons();
    this.resetHud();

    this.detachControls = wireBuildControls(this.scene, {
      onRotate: (delta) => this.rotate(delta),
      onConfirm: () => {
        if (this.mode === 'build') {
          this.attemptPlacement();
        }
      },
      onCancel: () => this.cancel()
    });

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.detachControls?.();
      this.detachControls = null;
    });
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
    this.lastPointerWorld = { x: worldX, y: worldY };
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
    this.rotation = 0;
    this.selectedButton?.setAttribute('aria-pressed', 'false');
    this.selectedButton = button;
    this.selectedButton.setAttribute('aria-pressed', 'true');

    const resolved = def ?? getUiBuildingDefinition(type);
    this.currentDefinition = resolved;
    this.ghost.setTexture(resolved.texture);
    this.ghost.setOrientation(this.rotation);
    this.ghost.setState('valid');
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
    this.ghost.hide();
    this.footprintOverlay.setVisible(false);

    const pointer = this.scene.input.activePointer;
    this.lastPointerWorld = { x: pointer.worldX, y: pointer.worldY };
    this.updatePlacementPreview(pointer.worldX, pointer.worldY);
  }

  private exitBuildMode() {
    this.mode = 'pan';
    this.selected = undefined;
    this.currentDefinition = undefined;
    this.hover = undefined;
    this.lastPointerWorld = undefined;
    this.feedbackHoldUntil = 0;
    this.selectedButton?.setAttribute('aria-pressed', 'false');
    this.selectedButton = null;
    this.ghostMoveTween?.stop();
    this.ghostMoveTween = null;
    this.rotation = 0;
    this.ghost.hide();
    this.ghost.setOrientation(0);
    this.ghost.setState('valid');
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

  private getOrientedFootprint(def: UiBuildingDefinition): Footprint {
    const base = def.footprint;
    if (this.rotation % 2 !== 0) {
      return { w: base.h, h: base.w };
    }
    return { w: base.w, h: base.h };
  }

  private updatePlacementPreview(worldX: number, worldY: number) {
    if (!this.selected) {
      return;
    }
    const def = this.currentDefinition ?? getUiBuildingDefinition(this.selected);
    this.currentDefinition = def;
    this.lastPointerWorld = { x: worldX, y: worldY };
    const { ix, iy } = screenToGrid(worldX, worldY);
    this.hover = { x: ix, y: iy };

    const footprint = this.getOrientedFootprint(def);
    const placement = validatePlacement(this.occupancy, ix, iy, footprint.w, footprint.h);
    const affordable = canAfford(this.state.resources, def.cost);
    const valid = placement.ok && affordable;

    this.drawFootprint(ix, iy, footprint, placement.issues);

    const { x, y } = gridToScreen(ix, iy, def.elevation ?? 0);
    this.ghost.show();
    this.ghost.setOrientation(this.rotation);
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

    const ghostState: PlacementGhostState = !affordable
      ? 'unaffordable'
      : placement.ok
        ? 'valid'
        : placement.issues.some((issue) => issue.reason === 'occupied')
          ? 'blocked'
          : 'invalid';
    this.ghost.setState(ghostState);
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

  private rotate(delta: number) {
    if (this.mode !== 'build' || !this.selected) {
      return;
    }
    const normalized = ((this.rotation + delta) % 4 + 4) % 4 as Orientation;
    if (normalized === this.rotation) {
      return;
    }
    this.rotation = normalized;
    this.ghost.setOrientation(this.rotation);
    const pointer = this.lastPointerWorld ?? {
      x: this.scene.input.activePointer.worldX,
      y: this.scene.input.activePointer.worldY
    };
    this.updatePlacementPreview(pointer.x, pointer.y);
  }

  private drawFootprint(x: number, y: number, footprint: Footprint, issues: PlacementIssue[]) {
    const totalTiles = footprint.w * footprint.h;
    this.ensureFootprintTiles(totalTiles);
    const blocked = new Set(issues.map((issue) => `${issue.x},${issue.y}`));

    let tileIndex = 0;
    for (let iy = 0; iy < footprint.h; iy++) {
      for (let ix = 0; ix < footprint.w; ix++) {
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
    const footprint = this.getOrientedFootprint(def);
    const placement = validatePlacement(this.occupancy, x, y, footprint.w, footprint.h);

    if (!placement.ok) {
      playInvalidPlacement();
      this.setFeedback(this.describeIssues(placement), 'error', 1400);
      this.drawFootprint(x, y, footprint, placement.issues);
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
      footprint,
      orientation: this.rotation,
      duration: def.buildTime,
      remaining: def.buildTime,
      status: 'queued'
    };
    this.state.buildQueue.push(job);
    markJob(this.occupancy, x, y, footprint.w, footprint.h, this.selected, jobId);
    playPlacementSfx();

    this.onJobQueued(job);

    this.emitPlacementCelebration(x, y, def, footprint);
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

  private emitPlacementCelebration(x: number, y: number, def: UiBuildingDefinition, footprint: Footprint) {
    const cx = x + (footprint.w - 1) / 2;
    const cy = y + (footprint.h - 1) / 2;
    const { x: sx, y: sy } = gridToScreen(cx, cy, def.elevation ?? 0);
    this.particleManager.setVisible(true);
    this.placementEmitter.explode(
      Math.min(30, 12 + footprint.w * footprint.h * 2),
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
