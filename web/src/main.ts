import Phaser from 'phaser';
import '../styles/build.scss';
import '../styles/hud.scss';
import '../styles/civilization.scss';
import { CalendarHud } from './hud/calendar/Calendar';
import { QuestLog, type QuestEntry, type QuestStatus } from './hud/quests/QuestLog';
import { StaminaTipsOverlay } from './hud/stamina/Tips';
import { DebugOverlay } from './hud/debug/Overlay';
import { gridToScreen, TILE_H, TILE_W } from './iso';
import {
  defaultState,
  type BuildingDefinition,
  type BuildingId,
  type CivilizationId,
  type CropId,
  type GameState,
  type ResourceId,
  type Structure,
  type ToolId
} from './types';
import { load, save } from './storage';
import { enableAudio, toggleMute } from './audio';
import {
  EVENT_RESOURCES_UPDATED,
  fmt,
  gameEvents,
  initWorld,
  SIM_DT,
  tick,
  type ResourcesUpdatedDetail
} from './world';
import { setupPwaInstallPrompt } from './pwa/installPrompt';
import { getUiBuildingDefinition, getUiBuildingDefinitions } from './buildings';
import {
  getSeasonDefinition,
  SEASON_ORDER,
  type SeasonDefinition,
  type SeasonId
} from './config/seasons';
import { isFeatureEnabled } from './config/features';
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
import { HomesteadController } from './ui/homesteadController';
import { CivilizationChoice } from './ui/civilizationChoice';
import { applyCivilizationTheme } from './ui/hudTheme';
import { getNormalizedTime } from './state/time';
import { getStaminaRatio } from './state/stamina';
import { TelemetryTracker, type TelemetrySnapshot } from './telemetry/telemetry';
import { HomesteadMetrics } from './telemetry/homesteadMetrics';
import { exportHomesteadToTownship } from './sim/export/homesteadToTownship';
import {
  flushPlaytestEvents,
  getPlaytestTelemetryOptIn,
  peekPlaytestEvents,
  recordExportGenerated,
  recordHomesteadDaySummary,
  setPlaytestTelemetryOptIn
} from './telemetry/playtest';
import { HOMESTEAD_QUESTS, type QuestMetricId } from './config/quests';

const dataTablesPromise = loadDataTables();

const resourceRow = document.getElementById('resourceRow') as HTMLDivElement;
const queueEl = document.getElementById('buildQueue')!;
const queueDetailsEl = document.getElementById('queueDetails')!;
const feedbackEl = document.getElementById('buildFeedback')!;
const selectedCostEl = document.getElementById('selectedCost')!;
const modeEl = document.getElementById('modeIndicator')!;
const seasonNameEl = document.getElementById('seasonName')!;
const seasonEffectsEl = document.getElementById('seasonEffects')!;
const seasonTimerEl = document.getElementById('seasonTimer')!;
const buildOptionsContainer = document.getElementById('buildOptions') as HTMLDivElement;
const installButton = document.getElementById('installApp') as HTMLButtonElement | null;
const homesteadDayEl = document.getElementById('homesteadDay')!;
const homesteadClockEl = document.getElementById('homesteadClock')!;
const homesteadStaminaEl = document.getElementById('homesteadStamina')!;
const homesteadWeatherEl = document.getElementById('homesteadWeather')!;
const homesteadFeedbackEl = document.getElementById('homesteadFeedback')!;
const toolbeltContainer = document.getElementById('toolbelt') as HTMLDivElement;
const seedBarContainer = document.getElementById('seedBar') as HTMLDivElement;
const playtestStatusEl = document.getElementById('playtestStatus');
const telemetryOptInCheckbox = document.getElementById('telemetryOptIn') as HTMLInputElement | null;
const downloadPerfButton = document.getElementById('downloadPerf') as HTMLButtonElement | null;
const exportTownshipButton = document.getElementById('exportTownship') as HTMLButtonElement | null;
const calendarMount = document.getElementById('calendarMount');
const questMount = document.getElementById('questMount');
const staminaTipsMount = document.getElementById('staminaTipsMount');

const resourceElements = new Map<ResourceId, HTMLSpanElement>();
let buildButtons: HTMLButtonElement[] = [];
let toolButtons: HTMLButtonElement[] = [];
let seedButtons: HTMLButtonElement[] = [];
let restButton: HTMLButtonElement | null = null;

const RESOURCE_ORDER: ResourceId[] = [
  'wood',
  'stone',
  'water',
  'food',
  'coins',
  'fiber',
  'wheat',
  'potato',
  'berries'
];

const HOMESTEAD_BUILDING_ORDER: BuildingId[] = ['plot', 'tent', 'well', 'crate', 'road', 'cottage', 'market'];
const HOMESTEAD_TOOL_ORDER: ToolId[] = ['hoe', 'wateringCan', 'sickle'];
const HOMESTEAD_CROP_ORDER: CropId[] = ['wheat', 'potato', 'berry'];

interface QuestProgressSnapshot {
  status: QuestStatus;
  signature: string;
  unlockedAt: number;
}

(document.getElementById('installAudio') as HTMLButtonElement).addEventListener('click', () => {
  void enableAudio();
});
(document.getElementById('mute') as HTMLButtonElement).addEventListener('click', async () => {
  const muted = await toggleMute();
  (document.getElementById('mute') as HTMLButtonElement).setAttribute(
    'aria-pressed',
    String(muted)
  );
});

if (installButton) {
  setupPwaInstallPrompt(installButton);
}

function createToggleButton(label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-pressed', 'false');
  return button;
}

function createActionButton(label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  return button;
}

function populateResourceHud(tables: DataTables) {
  resourceElements.clear();
  resourceRow.innerHTML = '';

  const ordered = computeResourceOrder(tables.resources);
  for (const resourceId of ordered) {
    const definition = tables.resources[resourceId];
    if (!definition) continue;
    const span = document.createElement('span');
    span.dataset.resource = resourceId;

    const label = document.createElement('span');
    label.textContent = `${definition.display}:`;
    const value = document.createElement('b');
    value.textContent = '0';

    span.append(label, value);
    resourceRow.appendChild(span);
    resourceElements.set(resourceId, value);
  }
}

function computeResourceOrder(resources: DataTables['resources']): ResourceId[] {
  const known = RESOURCE_ORDER.filter((id) => resources[id] !== undefined);
  const extras = Object.keys(resources).filter((key) => !known.includes(key as ResourceId));
  return [...known, ...(extras as ResourceId[])];
}

function populateBuildButtons(tables: DataTables) {
  buildButtons = [];
  buildOptionsContainer.innerHTML = '';
  const definitions = getUiBuildingDefinitions();
  const ordered = (() => {
    const known = HOMESTEAD_BUILDING_ORDER.filter((id) => definitions[id] !== undefined);
    const extras = Object.keys(tables.buildings).filter((key) => !known.includes(key as BuildingId));
    return [...known, ...(extras as BuildingId[])];
  })();

  for (const buildingId of ordered) {
    const definition = definitions[buildingId];
    if (!definition) continue;
    const button = createToggleButton(definition.label);
    button.dataset.building = buildingId;
    buildOptionsContainer.appendChild(button);
    buildButtons.push(button);
  }
}

function populateToolbelt(tables: DataTables) {
  toolButtons = [];
  toolbeltContainer.innerHTML = '';
  const tools = tables.tools;
  const ordered = (() => {
    const known = HOMESTEAD_TOOL_ORDER.filter((id) => tools[id] !== undefined);
    const extras = Object.keys(tools).filter((key) => !known.includes(key as ToolId));
    return [...known, ...(extras as ToolId[])];
  })();

  for (const toolId of ordered) {
    const definition = tools[toolId];
    if (!definition) continue;
    const button = createToggleButton(definition.label);
    button.dataset.tool = toolId;
    toolbeltContainer.appendChild(button);
    toolButtons.push(button);
  }

  restButton = createActionButton('Rest Until Dawn');
  restButton.id = 'restButton';
  toolbeltContainer.appendChild(restButton);
}

function populateSeedButtons(tables: DataTables) {
  seedButtons = [];
  seedBarContainer.innerHTML = '';
  const crops = tables.crops;
  const ordered = (() => {
    const known = HOMESTEAD_CROP_ORDER.filter((id) => crops[id] !== undefined);
    const extras = Object.keys(crops).filter((key) => !known.includes(key as CropId));
    return [...known, ...(extras as CropId[])];
  })();

  for (const cropId of ordered) {
    const definition = crops[cropId];
    if (!definition) continue;
    const button = createToggleButton(`Plant ${definition.label}`);
    button.dataset.crop = cropId;
    seedBarContainer.appendChild(button);
    seedButtons.push(button);
  }
}

function updateResourceDisplay(resources: GameState['resources']) {
  for (const [resourceId, element] of resourceElements) {
    element.textContent = fmt(resources[resourceId] ?? 0);
  }
}

function prepareHud(tables: DataTables) {
  populateResourceHud(tables);
  populateBuildButtons(tables);
  populateToolbelt(tables);
  populateSeedButtons(tables);
}

type WorldBuildingDefinition = Pick<BuildingDefinition, 'id' | 'label' | 'buildTime' | 'footprint'>;

class IsoScene extends Phaser.Scene {
  state: GameState = defaultState();
  tables!: DataTables;
  private readonly telemetry = new TelemetryTracker();
  private readonly homesteadMetrics = new HomesteadMetrics();
  private readonly exportFeatureEnabled = isFeatureEnabled('exportTownship');
  private debugOverlay: DebugOverlay | null = null;
  private calendarHud: CalendarHud | null = null;
  private questLog: QuestLog | null = null;
  private staminaTips: StaminaTipsOverlay | null = null;
  private questSnapshot = new Map<string, QuestProgressSnapshot>();
  private accum = 0;
  private ground!: Phaser.GameObjects.Container;
  private fieldTiles!: Phaser.GameObjects.Container;
  private overlays!: Phaser.GameObjects.Container;
  private props!: Phaser.GameObjects.Container;
  private seasonOverlay?: Phaser.GameObjects.Rectangle;
  private currentSeasonId: SeasonId | null = null;
  private occupancy: OccupancyMap = createOccupancyMap();
  private structureSprites = new Map<number, Phaser.GameObjects.Image>();
  private jobMarkers = new Map<number, Phaser.GameObjects.Image>();
  private buildMode!: BuildModeController;
  private homestead!: HomesteadController;
  private detachHudListener?: () => void;
  private playtestConsentHandler?: () => void;
  private downloadPerfHandler?: () => void;
  private exportHandler?: () => void;

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
    g.fillStyle(0x3b82f6, 1);
    g.fillPoints(
      [
        { x: 24, y: 0 },
        { x: 46, y: 28 },
        { x: 2, y: 28 }
      ],
      true
    );
    g.fillStyle(0x1d4ed8, 1);
    g.fillRect(21, 16, 6, 12);
    g.generateTexture('prop:tent', 48, 32);

    g.clear();
    g.fillStyle(0x64748b, 1);
    g.fillCircle(18, 18, 16);
    g.fillStyle(0x1e293b, 1);
    g.fillCircle(18, 18, 10);
    g.lineStyle(3, 0x94a3b8, 0.9);
    g.strokeCircle(18, 18, 12);
    g.generateTexture('prop:well', 36, 36);

    g.clear();
    g.fillStyle(0x92400e, 1);
    g.fillRoundedRect(0, 0, 40, 30, 6);
    g.lineStyle(3, 0xfbbf24, 0.85);
    g.strokeRoundedRect(0, 0, 40, 30, 6);
    g.generateTexture('prop:crate', 40, 30);

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

    // Show civilization choice for new games or games without civilization
    if (!loaded || !loaded.civilization) {
      const chosenCivilization = await new Promise<CivilizationId>((resolve) => {
        const civilizationChoice = new CivilizationChoice(this.tables.civilizations, (civId) => {
          resolve(civId);
        });
        civilizationChoice.show();
      });

      // Create new game state with chosen civilization
      this.state = defaultState(this.tables.resources);
      this.state.civilization = chosenCivilization;

      // Apply starting resources from civilization
      const civDef = this.tables.civilizations[chosenCivilization];
      if (civDef.startingResources) {
        Object.entries(civDef.startingResources).forEach(([resourceId, amount]) => {
          this.state.resources[resourceId] = (this.state.resources[resourceId] ?? 0) + amount;
        });
      }

      // Save the new game with civilization
      await save(this.state);
    } else {
      this.state = loaded;
    }

    // Apply civilization theme to HUD
    if (this.state.civilization && this.tables.civilizations[this.state.civilization]) {
      const civDef = this.tables.civilizations[this.state.civilization];
      applyCivilizationTheme(civDef.aesthetics);
    }

    this.buildingDefs = Object.fromEntries(
      Object.values(this.tables.buildings).map((def) => [
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
        footprint,
        orientation: job.orientation
      };
      this.state.constructionQueue.push(constructionJob);
      constructionById.set(job.id, constructionJob);
      job.duration = duration;
      job.remaining = remaining;
    }

    initWorld(this.state);
    this.telemetry.reset(this.state);
    this.homesteadMetrics.reset(this.state);
    this.occupancy = createOccupancyMap();

    const cam = this.cameras.main;
    cam.setBackgroundColor('#0e0e10');
    cam.centerOn(0, 0);
    cam.setZoom(1.0);
    cam.roundPixels = true;

    this.ground = this.add.container(0, 0);
    this.fieldTiles = this.add.container(0, 0);
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

    this.homestead = new HomesteadController({
      scene: this,
      state: this.state,
      layer: this.fieldTiles,
      tables: this.tables,
      toolButtons,
      seedButtons,
      restButton,
      feedbackEl: homesteadFeedbackEl,
      onRest: ({ previousDay, nextDay }) => {
        this.homesteadMetrics.recordManualAdvance(this.state, previousDay, nextDay);
      }
    });
    this.homestead.updateField();
    this.updateHomesteadHud();

    if (!this.debugOverlay) {
      this.debugOverlay = new DebugOverlay(this.telemetry);
    }

    if (calendarMount && !this.calendarHud) {
      this.calendarHud = new CalendarHud();
      this.calendarHud.mount(calendarMount);
    }

    if (questMount && !this.questLog) {
      this.questLog = new QuestLog({ maxPinned: 2 });
      this.questLog.mount(questMount);
      this.questLog.clear();
    }

    if (staminaTipsMount && !this.staminaTips) {
      this.staminaTips = new StaminaTipsOverlay();
      this.staminaTips.mount(staminaTipsMount);
    }

    const initialSnapshot = this.telemetry.snapshot(this.state);
    this.calendarHud?.update(initialSnapshot);
    this.staminaTips?.update(initialSnapshot);
    this.updateQuestLog(initialSnapshot);
    this.debugOverlay?.update(0, this.state, initialSnapshot);

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const homesteadActive = this.homestead.handlePointerMove(p);
      if (p.isDown && !this.buildMode.isActive() && !homesteadActive) {
        cam.scrollX -= p.velocity.x / cam.zoom;
        cam.scrollY -= p.velocity.y / cam.zoom;
      }
      this.buildMode.handlePointerMove(p.worldX, p.worldY);
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.homestead.handlePointerDown(p)) {
        return;
      }
      this.buildMode.handlePointerDown(p);
    });

    this.input.on('wheel', (_p: unknown, _go: unknown, _dx: number, dy: number) => {
      const next = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.75, 2.25);
      cam.setZoom(next);
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.buildMode.cancel();
      this.homestead.cancel();
    });

    this.time.addEvent({ delay: 5000, loop: true, callback: () => save(this.state) });

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      if (this.seasonOverlay) {
        this.seasonOverlay.setSize(gameSize.width, gameSize.height);
      }
    });

    this.syncSeasonState(true);
    const updateResourcesHud = (resources: GameState['resources']) => {
      updateResourceDisplay(resources);
    };

    const listener = (event: Event) => {
      const detail = (event as CustomEvent<ResourcesUpdatedDetail>).detail;
      updateResourcesHud(detail.resources);
    };
    gameEvents.addEventListener(EVENT_RESOURCES_UPDATED, listener);
    this.detachHudListener = () => gameEvents.removeEventListener(EVENT_RESOURCES_UPDATED, listener);
    updateResourcesHud(this.state.resources);

    if (telemetryOptInCheckbox) {
      telemetryOptInCheckbox.checked = getPlaytestTelemetryOptIn();
      this.playtestConsentHandler = () => {
        setPlaytestTelemetryOptIn(Boolean(telemetryOptInCheckbox.checked));
        this.updatePlaytestStatus();
      };
      telemetryOptInCheckbox.addEventListener('change', this.playtestConsentHandler);
    }

    if (downloadPerfButton) {
      this.downloadPerfHandler = () => this.handleDownloadPerf();
      downloadPerfButton.addEventListener('click', this.downloadPerfHandler);
    }

    if (exportTownshipButton) {
      exportTownshipButton.hidden = !this.exportFeatureEnabled;
      if (this.exportFeatureEnabled) {
        exportTownshipButton.removeAttribute('aria-hidden');
        exportTownshipButton.removeAttribute('disabled');
        this.exportHandler = () => this.handleExport();
        exportTownshipButton.addEventListener('click', this.exportHandler);
      } else {
        exportTownshipButton.setAttribute('aria-hidden', 'true');
        exportTownshipButton.setAttribute('disabled', 'true');
        exportTownshipButton.title = 'Township export is disabled in this build.';
      }
    }

    this.updatePlaytestStatus();
  }

  update(_time: number, deltaMs: number) {
    const frameStart = performance.now();
    this.accum += deltaMs / 1000;
    let simMs = 0;
    let steps = 0;
    while (this.accum >= SIM_DT) {
      const tickStart = performance.now();
      const events = tick(
        this.state,
        SIM_DT,
        this.buildingDefs,
        this.tables.recipes,
        this.tables.crops,
        this.tables.livestock,
        this.tables.civilizations
      );
      this.telemetry.recordTick(this.state, events, SIM_DT);
      this.homesteadMetrics.recordTick(this.state, events, SIM_DT);
      simMs += performance.now() - tickStart;
      steps += 1;
      if (events.length > 0) {
        const last = events[events.length - 1];
        this.registry.set('lastEvent', last.type);
      }
      this.accum -= SIM_DT;
    }

    this.flushHomesteadSummaries();

    const frameDuration = performance.now() - frameStart;
    this.telemetry.recordFrame(frameDuration, simMs, steps);
    const snapshot = this.telemetry.snapshot(this.state);
    this.debugOverlay?.update(frameDuration, this.state, snapshot);
    this.calendarHud?.update(snapshot);
    this.staminaTips?.update(snapshot);
    this.updateQuestLog(snapshot);

    updateResourceDisplay(this.state.resources);

    this.syncSeasonState();
    this.homestead.updateField();
    this.updateHomesteadHud();
    this.updatePlaytestStatus(snapshot);

    this.props.list.sort((a, b) => {
      const aImg = a as Phaser.GameObjects.Image;
      const bImg = b as Phaser.GameObjects.Image;
      return aImg.y - bImg.y;
    });

    this.syncJobMarkers();
    this.syncStructures();
    this.refreshQueueHud();
  }

  private flushHomesteadSummaries() {
    const drained = this.homesteadMetrics.buffer.drain();
    if (!drained.length) {
      return;
    }
    for (const record of drained) {
      recordHomesteadDaySummary(record.payload);
    }
  }

  private addStructure(structure: Structure) {
    const def = getUiBuildingDefinition(structure.type);
    const { x, y } = gridToScreen(structure.x, structure.y, def.elevation ?? 0);
    const sprite = this.add
      .image(x, y - (def.anchorOffset ?? 0), def.texture)
      .setOrigin(0.5, def.anchorOffset !== undefined ? 1.0 : 0.5);
    sprite.setRotation((Math.PI / 2) * (structure.orientation ?? 0));
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

  private updateHomesteadHud() {
    const homestead = this.state.homestead;
    const day = Math.max(1, Math.floor(homestead.time.day));
    homesteadDayEl.textContent = day.toString();

    const normalized = getNormalizedTime(homestead.time);
    const hoursFloat = (normalized * 24 + 6) % 24;
    const hours = Math.floor(hoursFloat);
    const minutes = Math.floor((hoursFloat - hours) * 60);
    homesteadClockEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;

    const staminaPct = Math.round(getStaminaRatio(homestead.stamina) * 100);
    homesteadStaminaEl.textContent = homestead.stamina.exhausted
      ? `${staminaPct}% (Exhausted)`
      : `${staminaPct}%`;

    const weatherLabel = homestead.weather.current;
    homesteadWeatherEl.textContent = weatherLabel.charAt(0).toUpperCase() + weatherLabel.slice(1);
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

  private updateQuestLog(snapshot: TelemetrySnapshot) {
    if (!this.questLog) {
      return;
    }
    const entries = this.computeQuestEntries(snapshot);
    for (const entry of entries) {
      const signature = JSON.stringify(
        entry.objectives.map((objective) => ({
          id: objective.id,
          current: objective.current,
          target: objective.target
        }))
      );
      const previous = this.questSnapshot.get(entry.id);
      let unlockedAt = previous?.unlockedAt ?? Date.now();
      if (entry.status !== 'locked' && (!previous || previous.status === 'locked')) {
        unlockedAt = Date.now();
      }
      if (!previous || previous.status !== entry.status || previous.signature !== signature) {
        this.questSnapshot.set(entry.id, { status: entry.status, signature, unlockedAt });
        this.questLog.upsertQuest({ ...entry, unlockedAt, updatedAt: Date.now() });
      }
    }
  }

  private computeQuestEntries(snapshot: TelemetrySnapshot): QuestEntry[] {
    const day = Math.max(1, Math.floor(this.state.homestead.time.day));
    const metricValues = resolveQuestMetricValues(this.state);

    return HOMESTEAD_QUESTS.map((definition) => {
      const objectives = definition.objectives.map((objective) => ({
        id: objective.id,
        description: objective.description,
        current: metricValues[objective.metric] ?? 0,
        target: objective.target,
        optional: objective.optional
      }));

      const requiredObjectives = objectives.filter((objective) => !objective.optional);
      const aggregatedTarget = requiredObjectives.reduce((sum, objective) => sum + objective.target, 0);
      const aggregatedCurrent = requiredObjectives.reduce(
        (sum, objective) => sum + Math.min(objective.current, objective.target),
        0
      );
      const status = determineQuestStatus(definition.unlockDay <= day, aggregatedCurrent, aggregatedTarget);

      return {
        id: definition.id,
        title: definition.title,
        description: definition.description,
        rewards: definition.rewards,
        pinned: definition.pinned,
        status,
        objectives
      };
    });
  }

  destroy(fromScene?: boolean) {
    this.detachHudListener?.();
    if (telemetryOptInCheckbox && this.playtestConsentHandler) {
      telemetryOptInCheckbox.removeEventListener('change', this.playtestConsentHandler);
      this.playtestConsentHandler = undefined;
    }
    if (downloadPerfButton && this.downloadPerfHandler) {
      downloadPerfButton.removeEventListener('click', this.downloadPerfHandler);
      this.downloadPerfHandler = undefined;
    }
    if (exportTownshipButton && this.exportHandler) {
      exportTownshipButton.removeEventListener('click', this.exportHandler);
      this.exportHandler = undefined;
    }
    super.destroy(fromScene);
  }

  private updatePlaytestStatus(snapshot?: TelemetrySnapshot) {
    if (!playtestStatusEl) {
      return;
    }
    const optedIn = getPlaytestTelemetryOptIn();
    if (!optedIn) {
      downloadPerfButton?.setAttribute('disabled', 'true');
      if (this.exportFeatureEnabled) {
        exportTownshipButton?.setAttribute('disabled', 'true');
        playtestStatusEl.textContent = 'Telemetry opt-in required before exporting.';
      } else {
        playtestStatusEl.textContent = 'Township export disabled in this build. Opt into telemetry to capture perf logs.';
      }
      return;
    }

    downloadPerfButton?.removeAttribute('disabled');
    if (!this.exportFeatureEnabled) {
      exportTownshipButton?.setAttribute('disabled', 'true');
      const events = peekPlaytestEvents();
      const perf = (snapshot ?? this.telemetry.snapshot(this.state)).performance;
      playtestStatusEl.textContent = `Opted in • ${perf.sampleCount} perf samples • ${events.length} buffered events • Township export unavailable.`;
      return;
    }

    exportTownshipButton?.removeAttribute('disabled');
    const events = peekPlaytestEvents();
    const perf = (snapshot ?? this.telemetry.snapshot(this.state)).performance;
    const daySummaries = events.filter((event) => event.type === 'homestead.daySummary').length;
    const summaryLabel = daySummaries > 0 ? ` • ${daySummaries} day summaries` : '';
    playtestStatusEl.textContent = `Opted in • ${perf.sampleCount} perf samples • ${events.length} buffered events${summaryLabel}.`;
  }

  private handleDownloadPerf() {
    if (!getPlaytestTelemetryOptIn()) {
      this.setPlaytestStatus('Enable telemetry opt-in to download performance logs.');
      return;
    }
    const events = flushPlaytestEvents();
    if (events.length === 0) {
      this.setPlaytestStatus('No buffered telemetry samples yet. Play a bit longer.');
      return;
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      performance: this.telemetry.snapshot(this.state).performance,
      events
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `homestead-perf-${Date.now()}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    this.setPlaytestStatus(`Downloaded ${events.length} telemetry events.`);
    this.updatePlaytestStatus();
  }

  private handleExport() {
    if (!this.exportFeatureEnabled) {
      this.setPlaytestStatus('Township export disabled in this build.');
      return;
    }

    if (!getPlaytestTelemetryOptIn()) {
      this.setPlaytestStatus('Enable telemetry opt-in before exporting to Township.');
      return;
    }

    const payload = exportHomesteadToTownship(this.state);
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `homestead-export-${payload.seed}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);

    const encoder = new TextEncoder();
    const bytes = encoder.encode(json).length;
    recordExportGenerated(bytes, payload.township.shipments.length);
    this.setPlaytestStatus(`Exported snapshot with ${payload.township.shipments.length} shipments.`);
    this.updatePlaytestStatus();
  }

  private setPlaytestStatus(message: string) {
    if (playtestStatusEl) {
      playtestStatusEl.textContent = message;
    }
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
  const tables = await dataTablesPromise;
  prepareHud(tables);
  new Phaser.Game(config);
}

void boot();

function formatDuration(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function determineQuestStatus(unlocked: boolean, current: number, target: number): QuestStatus {
  if (!unlocked) {
    return 'locked';
  }
  return current >= target ? 'completed' : 'active';
}

function resolveQuestMetricValues(state: GameState): Record<QuestMetricId, number> {
  return {
    readyCrops: countReadyCrops(state),
    wellFedLivestock: countHealthyLivestock(state),
    letters: countCollectedLetters(state)
  };
}

function countReadyCrops(state: GameState): number {
  let count = 0;
  for (const tile of Object.values(state.homestead.field.tiles)) {
    if (tile?.crop && tile.crop.ready && !tile.crop.withered) {
      count += 1;
    }
  }
  return count;
}

function countCollectedLetters(state: GameState): number {
  return Math.floor(state.resources.letters ?? 0);
}

function countHealthyLivestock(state: GameState): number {
  let count = 0;
  for (const animal of state.homestead.livestock.animals) {
    if (animal.alive && animal.hunger < 0.5) {
      count += 1;
    }
  }
  return count;
}
