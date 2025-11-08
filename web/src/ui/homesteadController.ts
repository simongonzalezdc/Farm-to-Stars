import Phaser from 'phaser';

import { playInvalidPlacement, playPlace, playUiHover } from '../audio';
import { gridToScreen, screenToGrid } from '../iso';
import type { DataTables } from '../data';
import {
  clamp01,
  parseTileKey,
  tileKey,
  type CropId,
  type GameState,
  type SoilTileState,
  type ToolId
} from '../types';
import { MAP_HEIGHT, MAP_WIDTH } from '../maps/tilemap';
import { plantCrop, harvestCrop, tillSoil } from '../systems/cropLifecycle';
import { spendStamina, applyRest } from '../state/stamina';
import { resetForNewDay } from '../state/time';
import { getToolPerkModifiersFromState, recordToolUse } from '../sim/tools/perks';

type FeedbackTone = 'info' | 'warn' | 'error' | 'success';

interface HomesteadControllerOptions {
  scene: Phaser.Scene;
  state: GameState;
  layer: Phaser.GameObjects.Container;
  tables: DataTables;
  toolButtons: HTMLButtonElement[];
  seedButtons: HTMLButtonElement[];
  restButton: HTMLButtonElement | null;
  feedbackEl: HTMLElement;
}

const PLANT_STAMINA_COST = 4;

export class HomesteadController {
  private readonly scene: Phaser.Scene;
  private readonly state: GameState;
  private readonly layer: Phaser.GameObjects.Container;
  private readonly feedbackEl: HTMLElement;
  private readonly toolButtons: HTMLButtonElement[];
  private readonly seedButtons: HTMLButtonElement[];
  private readonly restButton: HTMLButtonElement | null;

  private readonly crops: DataTables['crops'];
  private readonly tools: DataTables['tools'];

  private readonly cursor: Phaser.GameObjects.Image;
  private readonly fieldSprites = new Map<string, Phaser.GameObjects.Image>();

  private selectedTool: ToolId | null = null;
  private selectedCrop: CropId | null = null;
  private hoverKey: string | null = null;

  private readonly renderWidth: number;
  private readonly renderHeight: number;

  constructor(options: HomesteadControllerOptions) {
    this.scene = options.scene;
    this.state = options.state;
    this.layer = options.layer;
    this.feedbackEl = options.feedbackEl;
    this.toolButtons = options.toolButtons;
    this.seedButtons = options.seedButtons;
    this.restButton = options.restButton;
    this.crops = options.tables.crops;
    this.tools = options.tables.tools;

    this.renderWidth = Math.min(this.state.homestead.field.width, MAP_WIDTH);
    this.renderHeight = Math.min(this.state.homestead.field.height, MAP_HEIGHT);

    this.cursor = this.scene.add
      .image(0, 0, 'tile:outline:valid')
      .setVisible(false)
      .setAlpha(0.55)
      .setDepth(995);
    this.layer.add(this.cursor);

    this.setupButtons();
    this.setFeedback('Select a tool to tend the field.', 'info');
  }

  isActive(): boolean {
    return this.selectedTool !== null || this.selectedCrop !== null;
  }

  cancel() {
    this.selectedTool = null;
    this.selectedCrop = null;
    for (const button of [...this.toolButtons, ...this.seedButtons]) {
      button.setAttribute('aria-pressed', 'false');
    }
    this.hoverKey = null;
    this.cursor.setVisible(false);
    this.setFeedback('Select a tool to tend the field.', 'info');
  }

  handlePointerMove(pointer: Phaser.Input.Pointer): boolean {
    const { ix, iy } = screenToGrid(pointer.worldX, pointer.worldY);
    if (!this.withinBounds(ix, iy)) {
      this.hoverKey = null;
      this.cursor.setVisible(false);
      return this.isActive();
    }

    this.hoverKey = tileKey(ix, iy);
    const { x, y } = gridToScreen(ix, iy, 0);
    this.cursor.setPosition(x, y);
    this.cursor.setDepth(990 + iy);
    this.cursor.setVisible(this.isActive());
    return this.isActive();
  }

  handlePointerDown(pointer: Phaser.Input.Pointer): boolean {
    if (!this.isActive()) {
      return false;
    }

    if (pointer.rightButtonDown()) {
      this.cancel();
      return true;
    }

    if (!pointer.leftButtonDown()) {
      return this.isActive();
    }

    const { ix, iy } = screenToGrid(pointer.worldX, pointer.worldY);
    if (!this.withinBounds(ix, iy)) {
      this.setFeedback('That plot is outside the homestead field.', 'warn');
      playInvalidPlacement();
      return true;
    }

    if (this.selectedCrop) {
      this.handlePlant(ix, iy, this.selectedCrop);
      return true;
    }

    if (this.selectedTool) {
      this.handleTool(ix, iy, this.selectedTool);
      return true;
    }

    return false;
  }

  updateField() {
    const activeKeys = new Set<string>();
    for (const [key, tile] of Object.entries(this.state.homestead.field.tiles)) {
      const coords = parseTileKey(key);
      if (!coords) continue;
      if (!this.withinBounds(coords.x, coords.y)) continue;
      activeKeys.add(key);
      const sprite = this.ensureTileSprite(key, coords.x, coords.y);
      this.applyTileVisuals(sprite, tile);
    }

    for (const [key, sprite] of this.fieldSprites) {
      if (!activeKeys.has(key)) {
        sprite.destroy();
        this.fieldSprites.delete(key);
      }
    }
  }

  private withinBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.renderWidth && y < this.renderHeight;
  }

  private ensureTileSprite(key: string, x: number, y: number) {
    let sprite = this.fieldSprites.get(key);
    if (!sprite) {
      const { x: sx, y: sy } = gridToScreen(x, y, 0);
      sprite = this.scene.add.image(sx, sy, 'tile:ground').setOrigin(0.5, 0.5);
      sprite.setDepth(880 + y);
      this.layer.add(sprite);
      this.fieldSprites.set(key, sprite);
    } else {
      const { x: sx, y: sy } = gridToScreen(x, y, 0);
      sprite.setPosition(sx, sy);
      sprite.setDepth(880 + y);
    }
    sprite.setVisible(true);
    return sprite;
  }

  private applyTileVisuals(sprite: Phaser.GameObjects.Image, tile: SoilTileState) {
    const moisture = clamp01(tile.moisture);
    const baseR = 98 + Math.round(70 * moisture);
    const baseG = 76 + Math.round(90 * moisture);
    const baseB = 52 + Math.round(40 * moisture);
    let tint = Phaser.Display.Color.GetColor(baseR, baseG, baseB);
    if (tile.crop?.withered) {
      tint = Phaser.Display.Color.GetColor(92, 66, 48);
    } else if (tile.crop?.ready) {
      tint = Phaser.Display.Color.GetColor(140, 220, 120);
    }
    sprite.setTint(tint);
    sprite.setAlpha(tile.tilled ? 0.95 : 0.6);
    if (tile.crop?.ready) {
      sprite.setAlpha(1);
    } else if (tile.crop?.withered) {
      sprite.setAlpha(0.7);
    }
  }

  private setupButtons() {
    for (const button of this.toolButtons) {
      const toolId = button.dataset.tool as ToolId | undefined;
      if (!toolId || !this.tools[toolId]) {
        button.disabled = true;
        continue;
      }
      button.addEventListener('mouseenter', () => {
        if (!button.disabled) playUiHover();
      });
      button.addEventListener('focus', () => {
        if (!button.disabled) playUiHover();
      });
      button.addEventListener('click', () => {
        if (button.disabled) return;
        if (this.selectedTool === toolId) {
          this.selectedTool = null;
          button.setAttribute('aria-pressed', 'false');
          this.setFeedback('Deselected tool.', 'info');
          return;
        }
        this.selectedTool = toolId;
        this.selectedCrop = null;
        this.syncSelection(button);
        const def = this.tools[toolId];
        this.setFeedback(`${def.action} ready. Click a tile to act.`, 'info');
      });
    }

    for (const button of this.seedButtons) {
      const cropId = button.dataset.crop as CropId | undefined;
      if (!cropId || !this.crops[cropId]) {
        button.disabled = true;
        continue;
      }
      button.addEventListener('mouseenter', () => {
        if (!button.disabled) playUiHover();
      });
      button.addEventListener('focus', () => {
        if (!button.disabled) playUiHover();
      });
      button.addEventListener('click', () => {
        if (button.disabled) return;
        if (this.selectedCrop === cropId) {
          this.selectedCrop = null;
          button.setAttribute('aria-pressed', 'false');
          this.setFeedback('Seed selection cleared.', 'info');
          return;
        }
        this.selectedCrop = cropId;
        this.selectedTool = null;
        this.syncSelection(button);
        this.setFeedback(`Planting ${this.crops[cropId].label}. Click a tilled tile to sow.`, 'info');
      });
    }

    this.restButton?.addEventListener('click', () => {
      playUiHover();
      this.rest();
    });
  }

  private syncSelection(active: HTMLButtonElement) {
    for (const button of [...this.toolButtons, ...this.seedButtons]) {
      button.setAttribute('aria-pressed', button === active ? 'true' : 'false');
    }
    this.cursor.setVisible(this.isActive() && this.hoverKey !== null);
  }

  private setFeedback(message: string, tone: FeedbackTone) {
    this.feedbackEl.textContent = message;
    this.feedbackEl.setAttribute('data-tone', tone);
  }

  private handleTool(x: number, y: number, toolId: ToolId) {
    const tool = this.tools[toolId];
    if (!tool) {
      return;
    }
    const modifiers = getToolPerkModifiersFromState(this.state, toolId);
    const rawCost = tool.staminaCost * modifiers.staminaCostMultiplier + modifiers.staminaCostDelta;
    const staminaCost = Math.max(0, Math.round(rawCost * 100) / 100);
    if (!spendStamina(this.state.homestead.stamina, { cost: staminaCost })) {
      const costLabel = Number.isInteger(staminaCost)
        ? String(Math.round(staminaCost))
        : staminaCost.toFixed(1);
      this.setFeedback(
        `Too exhausted to use that tool. This action currently costs ${costLabel} stamina. Rest to recover.`,
        'warn'
      );
      playInvalidPlacement();
      return;
    }

    let handled = false;
    let message = '';
    let tone: FeedbackTone = 'success';

    switch (toolId) {
      case 'hoe': {
        tillSoil(
          this.state.homestead.field,
          x,
          y,
          Math.max(0.3, this.state.homestead.field.tiles[tileKey(x, y)]?.moisture ?? 0.3)
        );
        message = 'Soil tilled and ready for planting.';
        tone = 'success';
        playPlace();
        handled = true;
        break;
      }
      case 'wateringCan': {
        const tile = this.state.homestead.field.tiles[tileKey(x, y)];
        if (!tile?.tilled) {
          this.setFeedback('Till the soil before watering.', 'warn');
          playInvalidPlacement();
          return;
        }
        const baseDelta = tool.moistureDelta ?? 0.2;
        const delta = baseDelta + modifiers.moistureDeltaBonus;
        tile.moisture = clamp01(tile.moisture + delta);
        message = 'Moisture restored.';
        tone = 'success';
        playPlace();
        handled = true;
        break;
      }
      case 'sickle': {
        const harvested = harvestCrop(this.state.homestead.field, x, y, this.crops);
        if (!harvested) {
          this.setFeedback('Nothing ready to harvest on that tile.', 'warn');
          playInvalidPlacement();
          return;
        }
        const def = this.crops[harvested.cropId];
        for (const [resource, amount] of Object.entries(def?.yields ?? {})) {
          const baseAmount = amount ?? 0;
          const multiplier = Math.max(1, modifiers.yieldMultiplier);
          const scaled = multiplier > 1 ? Math.max(baseAmount, Math.round(baseAmount * multiplier)) : baseAmount;
          const current = this.state.resources[resource] ?? 0;
          this.state.resources[resource] = current + scaled;
        }
        message = 'Harvest collected and stored.';
        tone = 'success';
        playPlace();
        handled = true;
        break;
      }
      default:
        this.setFeedback('Tool not implemented.', 'warn');
        playInvalidPlacement();
        break;
    }
    if (!handled) {
      return;
    }

    this.updateField();
    this.showToolOutcome(toolId, message, tone);
  }

  private showToolOutcome(toolId: ToolId, baseMessage: string, tone: FeedbackTone) {
    const result = recordToolUse(this.state, toolId);
    if (result.unlocked.length === 0) {
      this.setFeedback(baseMessage, tone);
      return;
    }

    const highlights = result.unlocked
      .map((perk) => `${perk.title}: ${perk.headline}`)
      .join(' • ');
    this.setFeedback(`${baseMessage} ✨ ${highlights}`, 'success');
  }

  private handlePlant(x: number, y: number, cropId: CropId) {
    const crop = this.crops[cropId];
    if (!crop) {
      this.setFeedback('Unknown crop.', 'warn');
      return;
    }
    const tile = this.state.homestead.field.tiles[tileKey(x, y)];
    if (!tile?.tilled) {
      this.setFeedback('Till the soil before planting.', 'warn');
      playInvalidPlacement();
      return;
    }
    if (tile.crop && !tile.crop.withered) {
      this.setFeedback('A crop already occupies that tile.', 'warn');
      playInvalidPlacement();
      return;
    }
    if (!spendStamina(this.state.homestead.stamina, { cost: PLANT_STAMINA_COST })) {
      this.setFeedback('Too exhausted to plant. Rest to recover stamina.', 'warn');
      playInvalidPlacement();
      return;
    }
    plantCrop(this.state.homestead.field, x, y, cropId);
    this.setFeedback(`${crop.label} planted.`, 'success');
    playPlace();
    this.updateField();
  }

  private rest() {
    applyRest(this.state.homestead.stamina);
    resetForNewDay(this.state.homestead.time);
    this.state.homestead.weather.elapsed = 0;
    this.setFeedback(`Rested until dawn. Day ${this.state.homestead.time.day}.`, 'success');
    this.cancel();
    this.updateField();
  }
}

