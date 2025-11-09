/**
 * Township Scene
 *
 * Main Phaser scene for Township phase gameplay
 */

import Phaser from 'phaser';
import type { TownshipState } from '../types.township';
import type { CivilizationId } from '../types';
import { TownshipController } from '../ui/township/TownshipController';
import { ZonePlacementUI } from '../ui/township/ZonePlacementUI';
import { BuildingMenuUI } from '../ui/township/BuildingMenuUI';
import { MetricsDashboardUI } from '../ui/township/MetricsDashboardUI';
import { AdvisorDialogueUI, AdvisorMessages } from '../ui/township/AdvisorDialogueUI';
import { gridToScreen, TILE_H, TILE_W } from '../iso';
import { saveTownship } from '../storage.township';

export interface TownshipSceneConfig {
  civilization: CivilizationId;
  seed: number;
  initialState?: TownshipState;
}

/**
 * Township Scene
 *
 * Manages the Township phase with city building gameplay
 */
export class TownshipScene extends Phaser.Scene {
  private controller!: TownshipController;
  private zonePlacementUI!: ZonePlacementUI;
  private buildingMenuUI!: BuildingMenuUI;
  private metricsUI!: MetricsDashboardUI;
  private advisorUI!: AdvisorDialogueUI;

  private ground!: Phaser.GameObjects.Container;
  private zones!: Phaser.GameObjects.Container;
  private buildings!: Phaser.GameObjects.Container;
  private overlays!: Phaser.GameObjects.Container;

  // UI Containers
  private uiContainer!: HTMLElement;
  private zonePlacementContainer!: HTMLElement;
  private buildingMenuContainer!: HTMLElement;
  private metricsContainer!: HTMLElement;
  private advisorContainer!: HTMLElement;

  // Mouse state
  private isDragging = false;
  private dragStartCell: { x: number; y: number } | null = null;

  constructor() {
    super({ key: 'TownshipScene' });
  }

  init(data: TownshipSceneConfig) {
    // Store configuration
    this.registry.set('civilization', data.civilization);
    this.registry.set('seed', data.seed);
    if (data.initialState) {
      this.registry.set('townshipState', data.initialState);
    }
  }

  create() {
    const civilization = this.registry.get('civilization') as CivilizationId;
    const seed = this.registry.get('seed') as number;
    const initialState = this.registry.get('townshipState') as TownshipState | undefined;

    // Initialize controller
    this.controller = new TownshipController({
      civilizationId: civilization,
      seed,
      initialState
    });

    // Setup camera
    const cam = this.cameras.main;
    cam.setBackgroundColor('#1a1a1a');
    cam.centerOn(0, 0);
    cam.setZoom(1.0);
    cam.roundPixels = true;

    // Create layer containers
    this.ground = this.add.container(0, 0);
    this.zones = this.add.container(0, 0);
    this.buildings = this.add.container(0, 0);
    this.overlays = this.add.container(0, 0);

    // Render initial grid
    this.renderGrid();

    // Setup UI
    this.createUIContainers();
    this.createUI();

    // Setup input handlers
    this.setupInputHandlers();

    // Show welcome message
    const civilizationName = civilization.charAt(0).toUpperCase() + civilization.slice(1);
    const welcomeMessage = AdvisorMessages.welcome[civilization];
    if (welcomeMessage) {
      this.advisorUI.queueMessage(welcomeMessage);
    }

    // Queue tutorial messages
    setTimeout(() => {
      this.advisorUI.queueMessage(AdvisorMessages.tutorial.zoneFirst);
    }, 9000);

    setTimeout(() => {
      this.advisorUI.queueMessage(AdvisorMessages.tutorial.buildServices);
    }, 15000);

    // Setup auto-save every 5 seconds
    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        const state = this.controller.serialize();
        void saveTownship(state);
      }
    });
  }

  update(_time: number, delta: number) {
    // Update simulation
    this.controller.update(delta / 1000);

    // Update UI
    this.zonePlacementUI.update();
    this.buildingMenuUI.update();
    this.metricsUI.update();

    // Update visuals
    this.renderZones();
    this.renderBuildings();

    // Check for warnings
    this.checkWarnings();
  }

  /**
   * Render the grid
   */
  private renderGrid(): void {
    const state = this.controller.getState();
    const { width, height } = state.gridSize;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const { x: sx, y: sy } = gridToScreen(x, y, 0);

        // Create grid tile
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x333333, 0.3);
        graphics.strokePoints([
          { x: TILE_W / 2, y: 0 },
          { x: TILE_W, y: TILE_H / 2 },
          { x: TILE_W / 2, y: TILE_H },
          { x: 0, y: TILE_H / 2 }
        ], true);

        const tile = this.add.image(sx, sy, graphics.generateTexture('grid_tile', TILE_W, TILE_H))
          .setOrigin(0.5, 0.5);

        this.ground.add(tile);
        graphics.destroy();
      }
    }
  }

  /**
   * Render zones
   */
  private renderZones(): void {
    const state = this.controller.getState();

    // Clear existing zone visuals
    this.zones.removeAll(true);

    // Render each zone
    for (const zone of state.zones) {
      const { x: sx, y: sy } = gridToScreen(zone.position.x, zone.position.y, 0);

      // Zone color based on type
      const colors = {
        residential: 0x4caf50,
        commercial: 0x2196f3,
        industrial: 0xff9800,
        mixed: 0x9c27b0
      };
      const color = colors[zone.type];

      // Draw zone rectangle
      for (let dy = 0; dy < zone.size.height; dy++) {
        for (let dx = 0; dx < zone.size.width; dx++) {
          const { x: tx, y: ty } = gridToScreen(zone.position.x + dx, zone.position.y + dy, 0);

          const zoneTile = this.add.graphics();
          zoneTile.fillStyle(color, 0.2);
          zoneTile.fillPoints([
            { x: TILE_W / 2, y: 2 },
            { x: TILE_W - 2, y: TILE_H / 2 },
            { x: TILE_W / 2, y: TILE_H - 2 },
            { x: 2, y: TILE_H / 2 }
          ], true);

          zoneTile.lineStyle(2, color, 0.6);
          zoneTile.strokePoints([
            { x: TILE_W / 2, y: 2 },
            { x: TILE_W - 2, y: TILE_H / 2 },
            { x: TILE_W / 2, y: TILE_H - 2 },
            { x: 2, y: TILE_H / 2 }
          ], true);

          const img = this.add.image(tx, ty, zoneTile.generateTexture(`zone_${zone.id}_${dx}_${dy}`, TILE_W, TILE_H))
            .setOrigin(0.5, 0.5);

          this.zones.add(img);
          zoneTile.destroy();
        }
      }
    }

    // Render drag preview if active
    const preview = this.controller.getDragPreview();
    if (preview) {
      const selectedType = this.controller.getSelectedZoneType();
      const colors = {
        residential: 0x4caf50,
        commercial: 0x2196f3,
        industrial: 0xff9800,
        mixed: 0x9c27b0
      };
      const color = colors[selectedType];

      for (let dy = 0; dy < preview.height; dy++) {
        for (let dx = 0; dx < preview.width; dx++) {
          const { x: tx, y: ty } = gridToScreen(preview.x + dx, preview.y + dy, 0);

          const previewTile = this.add.graphics();
          previewTile.fillStyle(color, 0.4);
          previewTile.fillPoints([
            { x: TILE_W / 2, y: 2 },
            { x: TILE_W - 2, y: TILE_H / 2 },
            { x: TILE_W / 2, y: TILE_H - 2 },
            { x: 2, y: TILE_H / 2 }
          ], true);

          const img = this.add.image(tx, ty, previewTile.generateTexture(`preview_${dx}_${dy}`, TILE_W, TILE_H))
            .setOrigin(0.5, 0.5)
            .setAlpha(0.6);

          this.overlays.add(img);
          previewTile.destroy();
        }
      }
    }
  }

  /**
   * Render buildings
   */
  private renderBuildings(): void {
    const state = this.controller.getState();

    // Clear existing building visuals
    this.buildings.removeAll(true);

    // Render each building (placeholder for now)
    for (const building of state.buildings) {
      const { x: sx, y: sy } = gridToScreen(building.position.x, building.position.y, 0);

      // Simple building representation
      const buildingSprite = this.add.rectangle(sx, sy - 10, 30, 30, 0xcccccc)
        .setOrigin(0.5, 0.5);

      this.buildings.add(buildingSprite);
    }
  }

  /**
   * Create UI containers
   */
  private createUIContainers(): void {
    // Get or create main UI container
    this.uiContainer = document.getElementById('townshipUI') || this.createMainUIContainer();

    // Create sub-containers
    this.zonePlacementContainer = this.createContainer('zonePlacement');
    this.buildingMenuContainer = this.createContainer('buildingMenu');
    this.metricsContainer = this.createContainer('metrics');
    this.advisorContainer = this.createContainer('advisor');
  }

  private createMainUIContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'townshipUI';
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '100';
    document.body.appendChild(container);
    return container;
  }

  private createContainer(id: string): HTMLElement {
    const container = document.createElement('div');
    container.id = `township-${id}`;
    container.style.position = 'absolute';
    container.style.pointerEvents = 'auto';

    // Position containers
    if (id === 'zonePlacement') {
      container.style.top = '20px';
      container.style.left = '20px';
    } else if (id === 'buildingMenu') {
      container.style.top = '20px';
      container.style.left = '20px';
      container.style.display = 'none';
    } else if (id === 'metrics') {
      container.style.top = '20px';
      container.style.right = '20px';
    } else if (id === 'advisor') {
      container.style.bottom = '20px';
      container.style.left = '50%';
      container.style.transform = 'translateX(-50%)';
    }

    this.uiContainer.appendChild(container);
    return container;
  }

  /**
   * Create UI components
   */
  private createUI(): void {
    // Zone Placement UI
    this.zonePlacementUI = new ZonePlacementUI({
      container: this.zonePlacementContainer,
      controller: this.controller
    });

    // Building Menu UI
    this.buildingMenuUI = new BuildingMenuUI({
      container: this.buildingMenuContainer,
      controller: this.controller
    });

    // Metrics Dashboard
    this.metricsUI = new MetricsDashboardUI({
      container: this.metricsContainer,
      controller: this.controller
    });

    // Advisor Dialogue
    this.advisorUI = new AdvisorDialogueUI({
      container: this.advisorContainer,
      controller: this.controller
    });

    // Initially show zone placement UI
    this.zonePlacementUI.show();
    this.buildingMenuUI.hide();
  }

  /**
   * Setup input handlers
   */
  private setupInputHandlers(): void {
    const cam = this.cameras.main;

    // Pointer move - camera pan and zone drag
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      // Camera pan (middle or right mouse button)
      if ((p.isDown && p.button === 1) || (p.isDown && p.button === 2)) {
        cam.scrollX -= p.velocity.x / cam.zoom;
        cam.scrollY -= p.velocity.y / cam.zoom;
        return;
      }

      // Zone drag update
      if (this.isDragging && this.controller.getMode() === 'zone') {
        const cellPos = this.screenToGrid(p.worldX, p.worldY);
        this.controller.updateZoneDrag(cellPos.x, cellPos.y);
      }
    });

    // Pointer down - start zone drag
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      // Only handle left click for placement
      if (p.button !== 0) return;

      const mode = this.controller.getMode();
      const cellPos = this.screenToGrid(p.worldX, p.worldY);

      if (mode === 'zone') {
        this.isDragging = true;
        this.dragStartCell = cellPos;
        this.controller.startZoneDrag(cellPos.x, cellPos.y);
      } else if (mode === 'build') {
        // Place building
        const building = this.controller.placeBuilding(cellPos.x, cellPos.y);
        if (building) {
          this.advisorUI.queueMessage({
            id: `building_placed_${building.id}`,
            type: 'success',
            title: 'Building Placed',
            message: `Construction started!`,
            icon: '🏗️',
            dismissable: true,
            autoDismiss: 3000
          });
        }
      }
    });

    // Pointer up - complete zone drag
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.button !== 0) return;

      if (this.isDragging && this.controller.getMode() === 'zone') {
        const zone = this.controller.completeZoneDrag();
        this.isDragging = false;
        this.dragStartCell = null;

        if (zone) {
          this.advisorUI.queueMessage({
            id: `zone_placed_${zone.id}`,
            type: 'success',
            title: 'Zone Designated',
            message: `${zone.type.charAt(0).toUpperCase() + zone.type.slice(1)} zone created!`,
            icon: '📍',
            dismissable: true,
            autoDismiss: 2000
          });
        }
      }
    });

    // Mouse wheel - zoom
    this.input.on('wheel', (_p: unknown, _go: unknown, _dx: number, dy: number) => {
      const next = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.5, 2.0);
      cam.setZoom(next);
    });

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-ESC', () => {
      this.controller.setMode('view');
      this.zonePlacementUI.show();
      this.buildingMenuUI.hide();
    });

    this.input.keyboard?.on('keydown-Z', () => {
      this.controller.setMode('zone');
      this.zonePlacementUI.show();
      this.buildingMenuUI.hide();
    });

    this.input.keyboard?.on('keydown-B', () => {
      this.controller.setMode('build');
      this.zonePlacementUI.hide();
      this.buildingMenuUI.show();
    });
  }

  /**
   * Convert screen coordinates to grid coordinates
   */
  private screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    // Simple inverse isometric transformation
    // This is an approximation - adjust based on your iso.ts implementation
    const x = Math.floor((screenX / TILE_W + screenY / TILE_H) / 2);
    const y = Math.floor((screenY / TILE_H - screenX / TILE_W) / 2);

    return { x, y };
  }

  /**
   * Check for warning conditions
   */
  private checkWarnings(): void {
    const metrics = this.controller.getMetrics();

    // Low happiness warning
    if (metrics.happiness.overall < 40 && !this.advisorUI.isShowingMessage()) {
      this.advisorUI.queueMessage(AdvisorMessages.warnings.lowHappiness);
    }

    // Low coverage warnings
    if (metrics.coverage.power < 50 && !this.advisorUI.isShowingMessage()) {
      this.advisorUI.queueMessage(AdvisorMessages.warnings.noPower);
    }

    if (metrics.coverage.water < 50 && !this.advisorUI.isShowingMessage()) {
      this.advisorUI.queueMessage(AdvisorMessages.warnings.noWater);
    }
  }

  /**
   * Cleanup
   */
  destroy(fromScene?: boolean): void {
    this.zonePlacementUI?.destroy();
    this.buildingMenuUI?.destroy();
    this.metricsUI?.destroy();
    this.advisorUI?.destroy();

    this.uiContainer?.remove();

    super.destroy(fromScene);
  }
}
