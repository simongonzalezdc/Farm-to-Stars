# Data Schemas

## 1) Resources — `/web/src/data/resources.json`
```json
{
  "wood":   {"display": "Wood",          "stack": 9999},
  "stone":  {"display": "Stone",         "stack": 9999},
  "water":  {"display": "Water",         "stack": 9999},
  "food":   {"display": "Prepared Meals","stack": 9999},
  "coins":  {"display": "Coins",         "stack": 999999},
  "wheat":  {"display": "Wheat Bundles", "stack": 500},
  "potato": {"display": "Potatoes",      "stack": 500},
  "berries": {"display": "Berries",      "stack": 250},
  "fiber":  {"display": "Plant Fiber",   "stack": 750},
  "eggs":   {"display": "Farm Eggs",     "stack": 250},
  "milk":   {"display": "Fresh Milk",    "stack": 250},
  "letters": {"display": "Unread Mail",  "stack": 99}
}
```

## 2) Buildings — `/web/src/data/buildings.json`
```json
{
  "road":    {"category":"infrastructure","buildTime":2.0,"size":[1,1],"effects":{"moveMul":1.3}},
  "plot":    {"category":"farm","buildTime":3.0,"size":[1,1],"production":"wheat"},
  "cottage": {"category":"housing","buildTime":8.0,"size":[2,2],"effects":{"popCap":4}},
  "market":  {"category":"commerce","buildTime":6.0,"size":[2,2],"production":"sell"}
}
```

## 3) Recipes — `/web/src/data/recipes.json`
```json
{
  "wheat": {"inputs":[["water",1.0]], "duration":30.0, "outputs":[["food",3]]},
  "sell":  {"inputs":[["food",1]],    "duration":2.0,  "outputs":[["coins",2]]}
}
```

## 4) Saves
```ts
// /web/src/types.ts (excerpt)
export interface SaveV6 {
  v: 1;
  schemaVersion: 6;
  seed: number;
  resources: Resources;
  resourceStorage: ResourceStorageState;
  structures: Structure[];
  buildQueue: BuildJob[];
  constructionQueue: ConstructionJob[];
  buildings: BuildingInstance[];
  productionNodes: ProductionNode[];
  productionQueue: ProductionQueueItem[];
  productionModifiers: ProductionModifiers;
  nextBuildId: number;
  nextBuildingInstanceId: number;
  season: SeasonState;
  homestead: {
    field: FieldState;
    time: TimeOfDayState;
    stamina: StaminaState;
    weather: WeatherState & { events: WeatherEventsState };
    livestock: LivestockHerdState;
  };
  mail: MailState;
  jobQueue: BackgroundJobQueueState;
}
```
- Migrations promote legacy saves (v0–v5) into the v6 layout, populating default livestock herds, mailboxes, and weather event
  schedulers.

## Homestead → Township Export Payload (Wave Delta)

Wave Delta introduces a guarded export that snapshots the homestead and packages a starter district blueprint for Township.

- Generator: `web/src/sim/export/homesteadToTownship.ts`
- JSON schema reference: `web/content/township/import.json`

### Payload Outline

```
interface HomesteadTownshipExport {
  version: number;          // Export format version (currently 1)
  generatedAt: string;      // ISO timestamp when the snapshot was produced
  seed: number;             // Derived from save.seed and current in-game day to ensure deterministic imports
  homestead: {
    metadata: {
      day: number;
      season: SeasonId;
      year: number;
      cycle: number;
      weather: WeatherType;
    };
    resources: Record<ResourceId, number>; // Floored to whole units
    staminaPercent: number;                // Rounded snapshot of the farmer state
    structures: Array<{
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
    livestock: Array<{
      speciesId: LivestockId;
      mature: number;
      juvenile: number;
    }>;
  };
  township: {
    agriculture: Array<{
      id: string;             // Stable district id derived from the export seed
      seed: number;           // RNG seed the Township importer can use for layout generation
      plots: number;          // Total cultivated footprint (tile count)
      fertility: number;      // Normalised export potential 0..1
      logisticsScore: number; // Normalised throughput indicator 0..1
      exports: Array<{ resourceId: ResourceId; amount: number }>;
    }>;
    shipments: Array<{ resourceId: ResourceId; amount: number }>;
  };
}
```

- Mail attachments can optionally be folded into the outgoing shipment manifest. The default export path includes them so
  Township gets credit for gifts players have banked during Homestead.
- `exportTownship` HUD control (Wave Delta) requires telemetry opt-in; generated payload sizes and shipment counts feed the
  playtest telemetry buffer via `recordExportGenerated`.
