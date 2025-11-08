import { deriveSeed } from '../random';
import type {
  BuildingsTable,
  GameState,
  LivestockId,
  ResourceId,
  SeasonId,
  Structure,
  WeatherType
} from '../../types';
import { getDataTables } from '../../data';

export interface TownshipExportOptions {
  /** Optional salt applied when deriving the export seed. Defaults to the current in-game day. */
  salt?: number;
  /** When true, include delivered mail attachments in the outgoing shipment manifest. */
  includeMailAttachments?: boolean;
  /** Optional override for building definitions used to categorise farm structures. */
  buildings?: BuildingsTable;
}

export interface TownshipExportShipment {
  resourceId: ResourceId;
  amount: number;
}

export interface TownshipLivestockSummary {
  speciesId: LivestockId;
  mature: number;
  juvenile: number;
}

export interface TownshipStructureFootprint {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TownshipAgricultureDistrict {
  id: string;
  seed: number;
  plots: number;
  fertility: number;
  logisticsScore: number;
  exports: TownshipExportShipment[];
}

export interface HomesteadSnapshotMetadata {
  day: number;
  season: SeasonId;
  year: number;
  cycle: number;
  weather: WeatherType;
}

export interface HomesteadTownshipExport {
  version: number;
  generatedAt: string;
  seed: number;
  homestead: {
    metadata: HomesteadSnapshotMetadata;
    resources: Record<ResourceId, number>;
    staminaPercent: number;
    structures: TownshipStructureFootprint[];
    livestock: TownshipLivestockSummary[];
  };
  township: {
    agriculture: TownshipAgricultureDistrict[];
    shipments: TownshipExportShipment[];
  };
}

const EXPORT_VERSION = 1;
const EPSILON = 1e-6;
const MAX_EXPORT_SHIPMENTS = 24;

export function exportHomesteadToTownship(
  state: GameState,
  options: TownshipExportOptions = {}
): HomesteadTownshipExport {
  const salt = Number.isFinite(options.salt) ? options.salt! : state.homestead.time.day;
  const seed = deriveSeed(state.seed, Math.floor(salt));
  const generatedAt = new Date().toISOString();

  const metadata: HomesteadSnapshotMetadata = {
    day: Math.max(1, Math.floor(state.homestead.time.day)),
    season: state.season.active,
    year: state.season.year,
    cycle: state.season.cycle,
    weather: state.homestead.weather.current
  };

  const structures = summariseStructures(state.structures);
  const livestock = summariseLivestock(state);
  const resources = normaliseResources(state.resources);

  const buildings = resolveBuildingsTable(options.buildings);
  const agriculture = buildAgricultureDistricts(structures, resources, seed, buildings);
  const shipments = buildShipments(resources, state, options.includeMailAttachments ?? true);

  const stamina = state.homestead.stamina;
  const staminaPercent = stamina.max > EPSILON ? Math.round((stamina.current / stamina.max) * 100) : 0;

  return {
    version: EXPORT_VERSION,
    generatedAt,
    seed,
    homestead: {
      metadata,
      resources,
      staminaPercent,
      structures,
      livestock
    },
    township: {
      agriculture,
      shipments
    }
  };
}

function summariseStructures(structures: Structure[]): TownshipStructureFootprint[] {
  return structures.map((structure) => ({
    type: structure.type,
    x: structure.x,
    y: structure.y,
    width: structure.footprint.w,
    height: structure.footprint.h
  }));
}

function summariseLivestock(state: GameState): TownshipLivestockSummary[] {
  const herd = state.homestead.livestock.animals.filter((animal) => animal.alive);
  const bySpecies = new Map<LivestockId, { mature: number; juvenile: number }>();
  for (const animal of herd) {
    const entry = bySpecies.get(animal.speciesId) ?? { mature: 0, juvenile: 0 };
    if (animal.growth >= 1 - EPSILON) {
      entry.mature += 1;
    } else {
      entry.juvenile += 1;
    }
    bySpecies.set(animal.speciesId, entry);
  }
  return Array.from(bySpecies.entries()).map(([speciesId, value]) => ({
    speciesId,
    mature: value.mature,
    juvenile: value.juvenile
  }));
}

function normaliseResources(resources: Record<ResourceId, number>): Record<ResourceId, number> {
  return Object.fromEntries(
    Object.entries(resources).map(([resourceId, amount]) => [resourceId, Math.max(0, Math.floor(amount ?? 0))])
  ) as Record<ResourceId, number>;
}

function buildAgricultureDistricts(
  structures: TownshipStructureFootprint[],
  resources: Record<ResourceId, number>,
  seed: number,
  buildings: BuildingsTable | null
): TownshipAgricultureDistrict[] {
  const farmStructures = structures.filter((structure) => isFarmStructure(structure, buildings));
  const plots = farmStructures.reduce((total, structure) => total + structure.width * structure.height, 0);
  if (plots <= 0) {
    return [];
  }

  const exports = Object.entries(resources)
    .filter(([, amount]) => amount > 0)
    .map(([resourceId, amount]) => ({ resourceId: resourceId as ResourceId, amount: Math.floor(amount / 3) }));

  const fertility = Math.min(1, exports.reduce((sum, item) => sum + item.amount, 0) / Math.max(1, plots * 10));
  const logisticsScore = Math.min(1, plots / 400);

  return [
    {
      id: `agri-${seed.toString(16)}`,
      seed,
      plots,
      fertility: Number(fertility.toFixed(3)),
      logisticsScore: Number(logisticsScore.toFixed(3)),
      exports: exports.filter((item) => item.amount > 0)
    }
  ];
}

function buildShipments(
  resources: Record<ResourceId, number>,
  state: GameState,
  includeMailAttachments: boolean
): TownshipExportShipment[] {
  const shipments: TownshipExportShipment[] = [];
  const sorted = Object.entries(resources)
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  for (const [resourceId, amount] of sorted) {
    shipments.push({ resourceId: resourceId as ResourceId, amount });
    if (shipments.length >= MAX_EXPORT_SHIPMENTS) {
      break;
    }
  }

  if (includeMailAttachments) {
    for (const mail of state.mail.inbox) {
      if (!mail.attachments) continue;
      for (const [resourceId, amount] of Object.entries(mail.attachments) as [ResourceId, number][]) {
        if (!amount || amount <= 0) continue;
        shipments.push({ resourceId, amount: Math.floor(amount) });
        if (shipments.length >= MAX_EXPORT_SHIPMENTS) {
          return coalesceShipments(shipments);
        }
      }
    }
  }

  return coalesceShipments(shipments);
}

function coalesceShipments(shipments: TownshipExportShipment[]): TownshipExportShipment[] {
  const totals = new Map<ResourceId, number>();
  for (const shipment of shipments) {
    const current = totals.get(shipment.resourceId) ?? 0;
    totals.set(shipment.resourceId, current + Math.max(0, shipment.amount));
  }
  return Array.from(totals.entries()).map(([resourceId, amount]) => ({
    resourceId,
    amount: Math.floor(amount)
  }));
}

let cachedBuildings: BuildingsTable | null | undefined;

function resolveBuildingsTable(override?: BuildingsTable): BuildingsTable | null {
  if (override) {
    return override;
  }
  if (cachedBuildings !== undefined) {
    return cachedBuildings;
  }
  try {
    cachedBuildings = getDataTables().buildings;
  } catch (err) {
    cachedBuildings = null;
  }
  return cachedBuildings;
}

function isFarmStructure(structure: TownshipStructureFootprint, buildings: BuildingsTable | null): boolean {
  if (buildings) {
    const definition = buildings[structure.type];
    if (definition?.category) {
      return definition.category === 'farm' || definition.category.startsWith('farm.');
    }
  }
  return structure.type === 'plot';
}
