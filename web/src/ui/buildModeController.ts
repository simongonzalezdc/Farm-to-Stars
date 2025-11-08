import Phaser from 'phaser';

import { playPlace } from '../audio';
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
  type PlacementIssue
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

  private mode: 'pan' | 'build' = 'pan';
  private selected?: BuildingType;
  private hover?: { x: number; y: number };
  private readonly ghost: Phaser.GameObjects.Image;
  private readonly footprintOverlay: Phaser.GameObjects.Container;
  private readonly footprintTiles: Phaser.GameObjects.Image[] = [];
  private selectedButton: HTMLButtonElement | null = null;

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
    this.hud.feedback.textContent = 'Camera pan + zoom enabled.';
  }

  private enterBuildMode(type: BuildingType, button: HTMLButtonElement, def?: UiBuildingDefinition) {
    this.mode = 'build';
    this.selected = type;
    this.selectedButton?.setAttribute('aria-pressed', 'false');
    this.selectedButton = button;
    this.selectedButton.setAttribute('aria-pressed', 'true');

    const resolved = def ?? getUiBuildingDefinition(type);
    this.hud.modeIndicator.textContent = 'Placement';
    this.hud.selectedCost.textContent = formatCost(resolved.cost);
    this.hud.feedback.textContent = 'Click a tile to queue construction. Right click or press Esc to cancel.';
    this.ghost.setTexture(resolved.texture);
    this.ghost.setVisible(false);
    this.footprintOverlay.setVisible(false);

    const pointer = this.scene.input.activePointer;
    this.updatePlacementPreview(pointer.worldX, pointer.worldY);
  }

  private exitBuildMode() {
    this.mode = 'pan';
    this.selected = undefined;
    this.hover = undefined;
    this.selectedButton?.setAttribute('aria-pressed', 'false');
    this.selectedButton = null;
    this.ghost.setVisible(false);
    this.footprintOverlay.setVisible(false);
    this.footprintTiles.forEach((tile) => tile.setVisible(false));
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
    const def = getUiBuildingDefinition(this.selected);
    const { ix, iy } = screenToGrid(worldX, worldY);
    this.hover = { x: ix, y: iy };

    const placement = validatePlacement(this.occupancy, ix, iy, def.footprint.w, def.footprint.h);
    const affordable = canAfford(this.state.resources, def.cost);
    const valid = placement.ok && affordable;

    this.drawFootprint(ix, iy, def, placement.issues);

    const { x, y } = gridToScreen(ix, iy, def.elevation ?? 0);
    this.ghost.setVisible(true);
    this.ghost.setPosition(x, y - (def.anchorOffset ?? 0));

    if (!affordable) {
      this.ghost.setTint(0xffd166);
    } else if (placement.ok) {
      this.ghost.setTint(0x82ff9a);
    } else {
      this.ghost.setTint(0xff6b6b);
    }

    this.ghost.setAlpha(valid ? 0.85 : 0.65);
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
    const def = getUiBuildingDefinition(this.selected);
    const { x, y } = this.hover;
    const placement = validatePlacement(this.occupancy, x, y, def.footprint.w, def.footprint.h);

    if (!placement.ok) {
      this.hud.feedback.textContent = 'Cannot place there: tiles are blocked or out of bounds.';
      this.drawFootprint(x, y, def, placement.issues);
      return;
    }

    if (!canAfford(this.state.resources, def.cost)) {
      this.hud.feedback.textContent = 'Not enough resources for that building.';
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
    playPlace();

    this.onJobQueued(job);

    this.hud.feedback.textContent = `${def.label} queued for construction.`;

    const pointer = this.scene.input.activePointer;
    this.updatePlacementPreview(pointer.worldX, pointer.worldY);
  }
}
