/**
 * Township Controller
 *
 * Main controller for Township phase gameplay.
 * Manages zone placement, building construction, and district simulation.
 */

import type { TownshipState, Zone, Building, TownshipEvent } from '../../types.township';
import { TownshipManager } from '../../sim/township/townshipManager';
import { getTownshipCivilization } from '../../sim/township/civilizations/townshipCivilizations';
import { getBuildingsTable } from '../../sim/township/data/buildingsLoader';
import type { CivilizationId } from '../../types';

export type ZoneType = 'residential' | 'commercial' | 'industrial' | 'mixed';
export type TownshipMode = 'view' | 'zone' | 'build' | 'demolish';

export interface TownshipControllerConfig {
  civilizationId: CivilizationId;
  seed: number;
  initialState?: TownshipState;
}

/**
 * Township Controller
 *
 * Coordinates all Township UI and simulation
 */
export class TownshipController {
  private manager: TownshipManager;
  private mode: TownshipMode = 'view';
  private selectedZoneType: ZoneType = 'residential';
  private selectedBuildingId: string | null = null;
  private eventHandlers: ((event: TownshipEvent) => void)[] = [];

  // Drag state for zone placement
  private isDragging = false;
  private dragStart: { x: number; y: number } | null = null;
  private dragEnd: { x: number; y: number } | null = null;

  constructor(config: TownshipControllerConfig) {
    const civilization = getTownshipCivilization(config.civilizationId);
    const buildings = getBuildingsTable();

    // Initialize manager with state or create default
    if (config.initialState) {
      this.manager = new TownshipManager(config.initialState, buildings, civilization);
    } else {
      // Create default state
      const state: TownshipState = {
        version: 1,
        districtId: `district-${config.seed}-${Date.now()}`,
        seed: config.seed,
        gridSize: { width: 64, height: 64 },
        zones: [],
        buildings: [],
        population: {
          total: 100,
          employed: 70,
          unemployed: 30,
          homeless: 0,
          growthRate: 0,
          lastGrowth: 0
        },
        metrics: {
          happiness: { overall: 50, factors: [] },
          demand: { residential: 0.5, commercial: 0.5, industrial: 0.5 },
          coverage: { power: 0, water: 0, safety: 0, education: 0 },
          zoneDistribution: { residential: 0, commercial: 0, industrial: 0, mixed: 0 }
        },
        resources: {
          wood: 1000,
          stone: 800,
          water: 2000,
          food: 500,
          coins: 5000
        },
        civilization: config.civilizationId,
        timestamp: 0,
        tick: 0
      };

      this.manager = new TownshipManager(state, buildings, civilization);
    }

    // Subscribe to simulation events
    this.manager.on((event) => this.handleSimulationEvent(event));
  }

  /**
   * Update simulation (call every frame)
   */
  public update(dt: number): void {
    this.manager.tick(dt);
  }

  /**
   * Get current township state
   */
  public getState(): Readonly<TownshipState> {
    return this.manager.getState();
  }

  /**
   * Get current metrics
   */
  public getMetrics() {
    return this.manager.getMetrics();
  }

  /**
   * Set current interaction mode
   */
  public setMode(mode: TownshipMode): void {
    this.mode = mode;
    this.cancelDrag();
  }

  /**
   * Get current mode
   */
  public getMode(): TownshipMode {
    return this.mode;
  }

  /**
   * Select zone type for placement
   */
  public selectZoneType(type: ZoneType): void {
    this.selectedZoneType = type;
    this.mode = 'zone';
  }

  /**
   * Get selected zone type
   */
  public getSelectedZoneType(): ZoneType {
    return this.selectedZoneType;
  }

  /**
   * Select building for construction
   */
  public selectBuilding(buildingId: string): void {
    this.selectedBuildingId = buildingId;
    this.mode = 'build';
  }

  /**
   * Get selected building ID
   */
  public getSelectedBuilding(): string | null {
    return this.selectedBuildingId;
  }

  /**
   * Start zone drag placement
   */
  public startZoneDrag(x: number, y: number): void {
    if (this.mode !== 'zone') return;

    this.isDragging = true;
    this.dragStart = { x, y };
    this.dragEnd = { x, y };
  }

  /**
   * Update zone drag
   */
  public updateZoneDrag(x: number, y: number): void {
    if (!this.isDragging || !this.dragStart) return;

    this.dragEnd = { x, y };
  }

  /**
   * Complete zone drag and create zone
   */
  public completeZoneDrag(): Zone | null {
    if (!this.isDragging || !this.dragStart || !this.dragEnd) {
      this.cancelDrag();
      return null;
    }

    // Calculate zone bounds
    const minX = Math.min(this.dragStart.x, this.dragEnd.x);
    const minY = Math.min(this.dragStart.y, this.dragEnd.y);
    const maxX = Math.max(this.dragStart.x, this.dragEnd.x);
    const maxY = Math.max(this.dragStart.y, this.dragEnd.y);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    // Minimum zone size
    if (width < 2 || height < 2) {
      this.cancelDrag();
      return null;
    }

    // Create zone
    const zone: Zone = {
      id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: this.selectedZoneType,
      position: { x: minX, y: minY },
      size: { width, height },
      maturity: 0,
      level: 1,
      occupancy: 0,
      capacity: 0,
      happiness: 50,
      demand: 0,
      services: {
        power: false,
        water: false,
        safety: false,
        education: false
      }
    };

    // Add to state
    const state = this.manager.getState();
    state.zones.push(zone);

    this.cancelDrag();
    return zone;
  }

  /**
   * Cancel zone drag
   */
  public cancelDrag(): void {
    this.isDragging = false;
    this.dragStart = null;
    this.dragEnd = null;
  }

  /**
   * Get current drag preview bounds (for rendering)
   */
  public getDragPreview(): { x: number; y: number; width: number; height: number } | null {
    if (!this.isDragging || !this.dragStart || !this.dragEnd) return null;

    const minX = Math.min(this.dragStart.x, this.dragEnd.x);
    const minY = Math.min(this.dragStart.y, this.dragEnd.y);
    const maxX = Math.max(this.dragStart.x, this.dragEnd.x);
    const maxY = Math.max(this.dragStart.y, this.dragEnd.y);

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  /**
   * Place a building at position
   */
  public placeBuilding(x: number, y: number): Building | null {
    if (this.mode !== 'build' || !this.selectedBuildingId) return null;

    const buildingDef = getBuildingsTable()[this.selectedBuildingId];
    if (!buildingDef) return null;

    const state = this.manager.getState();

    // Check if player can afford it
    for (const [resourceId, cost] of Object.entries(buildingDef.cost)) {
      if ((state.resources[resourceId as any] || 0) < cost) {
        return null; // Cannot afford
      }
    }

    // Create building instance
    const building: Building = {
      id: `building-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      definitionId: this.selectedBuildingId,
      position: { x, y },
      zone: null,
      level: 1,
      operational: true,
      serviceRadius: buildingDef.serviceRadius || 0,
      provides: buildingDef.provides || [],
      maintenance: {
        cost: buildingDef.maintenance.cost,
        lastMaintained: state.timestamp
      }
    };

    // Deduct costs
    for (const [resourceId, cost] of Object.entries(buildingDef.cost)) {
      state.resources[resourceId as any] -= cost;
    }

    // Add building
    state.buildings.push(building);

    // Mark dirty for recalculation
    this.manager.markDirty('coverage');

    return building;
  }

  /**
   * Delete a zone
   */
  public deleteZone(zoneId: string): boolean {
    const state = this.manager.getState();
    const index = state.zones.findIndex(z => z.id === zoneId);

    if (index === -1) return false;

    state.zones.splice(index, 1);
    return true;
  }

  /**
   * Delete a building
   */
  public deleteBuilding(buildingId: string): boolean {
    const state = this.manager.getState();
    const index = state.buildings.findIndex(b => b.id === buildingId);

    if (index === -1) return false;

    state.buildings.splice(index, 1);
    this.manager.markDirty('coverage');
    return true;
  }

  /**
   * Subscribe to simulation events
   */
  public on(handler: (event: TownshipEvent) => void): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Unsubscribe from simulation events
   */
  public off(handler: (event: TownshipEvent) => void): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index !== -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  /**
   * Handle simulation events
   */
  private handleSimulationEvent(event: TownshipEvent): void {
    // Forward to all handlers
    for (const handler of this.eventHandlers) {
      handler(event);
    }
  }

  /**
   * Serialize state for saving
   */
  public serialize(): TownshipState {
    return this.manager.getState();
  }

  /**
   * Get zones at position
   */
  public getZoneAt(x: number, y: number): Zone | null {
    const state = this.manager.getState();

    for (const zone of state.zones) {
      if (
        x >= zone.position.x &&
        x < zone.position.x + zone.size.width &&
        y >= zone.position.y &&
        y < zone.position.y + zone.size.height
      ) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Get building at position
   */
  public getBuildingAt(x: number, y: number): Building | null {
    const state = this.manager.getState();
    const buildings = getBuildingsTable();

    for (const building of state.buildings) {
      const def = buildings[building.definitionId];
      if (!def) continue;

      if (
        x >= building.position.x &&
        x < building.position.x + def.size.width &&
        y >= building.position.y &&
        y < building.position.y + def.size.height
      ) {
        return building;
      }
    }

    return null;
  }

  /**
   * Generate heatmap for visualization
   */
  public generateHeatmap(type: import('../../../sim/township/systems/heatmapVisualization').HeatmapType) {
    return this.manager.generateHeatmap(type);
  }

  /**
   * Repair a building
   */
  public repairBuilding(buildingId: string) {
    return this.manager.repairBuilding(buildingId);
  }

  /**
   * Get buildings in outage
   */
  public getBuildingsInOutage() {
    return this.manager.getBuildingsInOutage();
  }
}
