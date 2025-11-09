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

## 4) Civilizations — `/web/src/data/civilizations.json`

Civilization definitions provide cultural theming, gameplay bonuses, and narrative flavor for the homestead phase.

```json
{
  "teotihuacan": {
    "name": "Teotihuacan Empire",
    "displayName": "Where Gods Are Born",
    "tagline": "Masters of Solar Technology",
    "description": "Through centuries of innovation...",
    "bonuses": {
      "solarEnergy": 1.10,
      "research": 1.05
    },
    "aesthetics": {
      "primaryColor": "#E63946",
      "secondaryColor": "#F1FAEE",
      "accentColor": "#FFB703",
      "pattern": "solar_rays",
      "architecture": "pyramid"
    },
    "startingResources": {
      "obsidian": 5
    },
    "festivals": [
      {
        "name": "Sun Ceremony",
        "season": "spring",
        "description": "Honor the dawn of new growth",
        "bonuses": {
          "solarEnergy": 1.25
        }
      }
    ],
    "loreSnippet": "The Sun gave us life..."
  }
}
```

### Schema Breakdown

**Core Identity:**
- `name` (string) — Full civilization name
- `displayName` (string) — Short tagline shown in UI
- `tagline` (string) — One-line description for selection screen
- `description` (string) — Full description of civilization's culture and history

**Gameplay Bonuses:**
- `bonuses` (object) — Key-value pairs of bonus types and multipliers
  - Multipliers are expressed as floats where `1.0` = no bonus, `1.15` = +15%
  - Common bonus types:
    - `solarEnergy` — Solar panel production multiplier
    - `research` — Research speed multiplier
    - `waterEfficiency` — Reduces crop water consumption (applied as divisor)
    - `tradeEfficiency` — Trade value multiplier
    - `resourceGathering` — Resource harvest multiplier
    - `resourceEfficiency` — Resource consumption reduction
    - `buildingDurability` — Building decay rate reduction

**Visual Theming:**
- `aesthetics` (object) — Cultural visual identity
  - `primaryColor` (hex) — Main civilization color for HUD theming
  - `secondaryColor` (hex) — Secondary color for gradients
  - `accentColor` (hex) — Accent color for highlights
  - `pattern` (string) — Visual pattern identifier (e.g., "solar_rays", "glyphs")
  - `architecture` (string) — Architecture style name (e.g., "pyramid", "step_pyramid")

**Starting Conditions:**
- `startingResources` (object, optional) — Extra resources granted on new game
  - Key-value pairs of `resourceId: amount`

**Seasonal Events:**
- `festivals` (array) — Cultural celebrations that occur during specific seasons
  - `name` (string) — Festival name
  - `season` (SeasonId) — When the festival occurs
  - `description` (string) — Festival description
  - `bonuses` (object) — Temporary bonuses active during the festival

**Narrative Flavor:**
- `loreSnippet` (string) — Short quote or flavor text representing civilization philosophy

### Validation Rules

The data loader (`web/src/data/index.ts`) validates:
1. All required fields are present and non-empty strings
2. Bonus multipliers are positive numbers
3. Colors are valid hex codes (3, 4, 6, or 8 digits with # prefix)
4. All aesthetic fields are non-empty strings
5. Starting resources reference valid resource IDs
6. Festival seasons reference valid season IDs

### Save Schema Integration

Civilization choice is stored in the save file (schema v8+):

```typescript
export interface SaveV8 extends SaveV7 {
  civilization: CivilizationId; // e.g., "teotihuacan", "maya"
}
```

Migration from v7 to v8 automatically assigns `"teotihuacan"` as the default civilization for existing saves.

### Usage in Game Systems

**Bonus Application:**
```typescript
// web/src/systems/civilizationManager.ts
const civManager = createCivilizationManager(
  gameState.civilization,
  dataTables.civilizations
);

// Apply water efficiency bonus (reduces consumption)
const waterUsage = baseWaterUsage / civManager.getBonusMultiplier('waterEfficiency');

// Apply research bonus (increases speed)
const researchSpeed = baseResearchSpeed * civManager.applyBonus('research', 1.0);
```

**HUD Theming:**
```typescript
// web/src/ui/hudTheme.ts
const civDef = civilizations[gameState.civilization];
applyCivilizationTheme(civDef.aesthetics);
// Sets CSS custom properties: --civ-primary, --civ-secondary, --civ-accent
```

### Currently Implemented Civilizations

**Homestead Phase (v1.0):**
1. **Teotihuacan Empire** — Solar technology specialists
2. **Maya City-States** — Knowledge and astronomy masters
3. **Moche Kingdoms** — Water efficiency experts
4. **Hopewell Commonwealth** — Trade and economy focus
5. **Puebloan Federation** — Sustainability leaders

**Future Expansion (DLC):**
- See `Docs/future-expansions.md` for 5 additional civilizations planned for post-launch

## 5) Saves

Current schema version: **v8**

```ts
// /web/src/types.ts (excerpt)
export interface SaveV8 {
  v: 1;
  schemaVersion: 8;
  civilization: CivilizationId; // Added in v8
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

### Schema Version History

- **v8** (current) — Added `civilization` field for cultural theming and gameplay bonuses
- **v7** — Added `jobQueue` for background task processing
- **v6** — Added livestock herds, mail system, and weather events
- **v0–v5** — Legacy schemas (see `web/src/migrations.ts` for full history)

### Migration System

The migration system (`web/src/migrations.ts`) automatically upgrades old saves to the current schema:

1. **v7 → v8**: Adds `civilization: "teotihuacan"` as default
2. **v6 → v7**: Adds empty `jobQueue` state
3. **v0–v6**: Progressively adds livestock, mail, weather, and production systems

All migrations are non-destructive and preserve existing player progress.

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
