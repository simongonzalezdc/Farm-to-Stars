# Township S3 Architecture Design
## District Simulation Core - Full Technical Specification

**Last Updated:** 2025-11-09
**Phase:** Township Wave Alpha (Weeks 13-15)
**Bundle:** S3 — District Simulation Core

---

## 1. CONSULTANT SYNTHESIS

### 1.1 Game Design Perspective (Dr. Sarah Chen)

**Recommendations:**
- **Progressive Complexity:** Start with simple zone placement, gradually introduce happiness/services
- **Clear Feedback Loops:** Visual indicators for zone health, demand, and satisfaction
- **Civilization Integration:** Carry forward Homestead bonuses, introduce Township-specific perks
- **Meaningful Choices:** Zoning should create interesting trade-offs (residential density vs. happiness)

**Key Metrics:**
- Population happiness (0-100 scale)
- Housing demand (low/medium/high)
- Job availability ratio
- Service coverage percentage

### 1.2 Game Development Perspective (Marcus Rodriguez)

**Recommendations:**
- **Data-Driven Design:** All buildings, zones, and services in JSON
- **Modular Systems:** Separate concerns (zones, agents, services, happiness)
- **Performance First:** Use spatial partitioning for agent queries, lazy evaluation
- **Deterministic Simulation:** Fixed-step tick(), same seed = same outcome

**Technical Choices:**
- **Grid:** 64×64 tiles (expandable to 128×128 in Nation phase)
- **Tick Rate:** 10 Hz simulation (consistent with Homestead)
- **Agent Model:** Aggregated populations per zone (not individual citizens for performance)
- **Pathfinding:** A* for service coverage, not per-agent movement

### 1.3 Software Engineering Perspective (Dr. Elena Volkov)

**Recommendations:**
- **Clean Architecture:** Domain logic isolated from rendering/UI
- **Repository Pattern:** Data access through clear interfaces
- **Event-Driven:** Publish domain events for UI/telemetry consumption
- **Test Coverage:** ≥90% for simulation core, contract tests for data schemas

**Architecture Layers:**
```
┌─────────────────────────────────────────┐
│ UI Layer (U3 - City HUD & Advisors)   │
├─────────────────────────────────────────┤
│ Application Services                    │
│  - TownshipManager                      │
│  - ZoningService                        │
│  - HappinessCalculator                  │
├─────────────────────────────────────────┤
│ Domain Models                           │
│  - District, Zone, Building             │
│  - Population, Metrics                  │
├─────────────────────────────────────────┤
│ Data Access Layer                       │
│  - BuildingRepository                   │
│  - DistrictRepository                   │
└─────────────────────────────────────────┘
```

### 1.4 Product Management Perspective (James Park)

**Recommendations:**
- **MVP First:** Launch with 3 zone types (residential, commercial, industrial)
- **Incremental Value:** Each building type adds tangible benefit
- **Player Goals:** Clear milestones (reach 1k pop, 5k pop, unlock new buildings)
- **Retention Hooks:** Daily challenges, advisor missions, seasonal events

**Launch Scope:**
- ✅ Basic zoning (R/C/I)
- ✅ Population growth
- ✅ Happiness system
- ✅ Homestead import
- ⏳ Utilities (deferred to S4)
- ⏳ Disasters (deferred to C3)

### 1.5 UI/UX Perspective (Aisha Kumar)

**Recommendations:**
- **Intuitive Zoning:** Click-drag to paint zones, visual feedback on hover
- **Information Hierarchy:** At-a-glance metrics (pop, happiness) + detailed breakdowns on click
- **Accessibility:** Colorblind-safe zone colors, keyboard shortcuts, screen reader support
- **Onboarding:** Contextual tooltips, advisor guidance for first township

**Visual Language:**
- Residential: Green (#22c55e)
- Commercial: Blue (#3b82f6)
- Industrial: Orange (#f97316)
- Mixed-use: Purple (#a855f7)

---

## 2. OPEN SOURCE ASSETS & PATTERNS

### 2.1 Relevant Libraries

**Considered:**
- ✅ **bitECS** - Ultra-fast ECS, but adds complexity for our use case
- ✅ **navmesh** - Phaser navmesh plugin, but we don't need per-agent pathfinding
- ❌ **rot.js** - Roguelike toolkit, overkill for city grid

**Decision:** Stick with **vanilla TypeScript** patterns, no additional dependencies.
**Rationale:** Our existing codebase patterns (data-driven, event bus) are sufficient and keep bundle size small.

### 2.2 Proven Patterns from Open Source City Builders

**Studied:**
- **SimCity (1989):** Zone-based growth, demand curves, RCI balance
- **Cities: Skylines:** Service coverage areas, happiness modifiers
- **Banished:** Resource-constrained growth, job assignment
- **Frostpunk:** Morale system, policy decisions

**Adopted Patterns:**
1. **Zone Maturation:** Empty zone → under construction → active building
2. **Demand Curves:** RCI demand based on balance of existing zones
3. **Service Radius:** Buildings provide benefits to zones within range
4. **Happiness Formula:** Weighted factors (housing, jobs, services, safety)

---

## 3. CORE ARCHITECTURE

### 3.1 Domain Model

```typescript
// Township State (top-level)
interface TownshipState {
  version: number;                    // Schema version
  districtId: string;                 // Unique district ID
  seed: number;                       // RNG seed for determinism
  gridSize: { width: number; height: number };

  zones: Zone[];                      // All zones placed
  buildings: Building[];              // All constructed buildings
  population: PopulationState;        // Aggregated citizen data
  metrics: TownshipMetrics;           // Happiness, demand, etc.

  resources: Record<ResourceId, number>; // Carried from Homestead
  civilization: CivilizationId;       // Inherited from Homestead

  timestamp: number;                  // Simulation time elapsed
}

// Zone Definition
interface Zone {
  id: string;
  type: ZoneType;                     // 'residential' | 'commercial' | 'industrial' | 'mixed'
  position: { x: number; y: number };
  size: { width: number; height: number };

  maturity: number;                   // 0-1, affects population capacity
  level: number;                      // 1-3, density tier

  occupancy: number;                  // Current population/workers
  capacity: number;                   // Max population/workers

  happiness: number;                  // 0-100, local zone happiness
  demand: number;                     // -1 to 1, growth pressure
}

// Building Definition
interface Building {
  id: string;
  definitionId: BuildingDefinitionId; // References data/township/buildings.json
  position: { x: number; y: number };

  zone: string | null;                // Parent zone ID (if applicable)
  level: number;                      // Building tier

  serviceRadius: number;              // Tile range for service coverage
  provides: ServiceType[];            // Services this building offers
}

// Population State (Aggregated)
interface PopulationState {
  total: number;                      // Total citizens

  employed: number;                   // Citizens with jobs
  unemployed: number;                 // Jobless citizens

  homeless: number;                   // Citizens without housing

  growthRate: number;                 // Population change per tick
}

// Metrics Dashboard
interface TownshipMetrics {
  happiness: {
    overall: number;                  // 0-100
    factors: HappinessFactor[];       // Breakdown by category
  };

  demand: {
    residential: number;              // -1 to 1
    commercial: number;
    industrial: number;
  };

  coverage: {
    power: number;                    // % of zones with power
    water: number;                    // % of zones with water
    safety: number;                   // % of zones with police/fire
    education: number;                // % of zones with schools
  };
}

// Happiness Factor
interface HappinessFactor {
  category: 'housing' | 'employment' | 'services' | 'safety' | 'environment';
  value: number;                      // -50 to 50
  weight: number;                     // Importance multiplier
}
```

### 3.2 Simulation Systems

#### 3.2.1 Zone Growth System
```typescript
// Zones mature over time based on demand and conditions
function tickZoneGrowth(state: TownshipState, dt: number): void {
  for (const zone of state.zones) {
    if (zone.maturity >= 1.0) continue; // Fully mature

    // Calculate growth rate based on demand and services
    const demandModifier = state.metrics.demand[zone.type];
    const serviceModifier = calculateServiceCoverage(state, zone);
    const civModifier = getCivilizationGrowthBonus(state.civilization, zone.type);

    const growthRate = BASE_GROWTH_RATE
      * (1 + demandModifier)
      * serviceModifier
      * civModifier;

    zone.maturity = Math.min(1.0, zone.maturity + growthRate * dt);

    // Update capacity as zone matures
    zone.capacity = Math.floor(zone.maturity * getMaxCapacity(zone));
  }
}
```

#### 3.2.2 Population System
```typescript
// Population grows/shrinks based on housing availability and happiness
function tickPopulation(state: TownshipState, dt: number): void {
  const { population, zones, metrics } = state;

  // Calculate housing capacity
  const residentialZones = zones.filter(z => z.type === 'residential');
  const totalHousingCapacity = residentialZones.reduce((sum, z) => sum + z.capacity, 0);

  // Calculate job capacity
  const jobZones = zones.filter(z => z.type === 'commercial' || z.type === 'industrial');
  const totalJobCapacity = jobZones.reduce((sum, z) => sum + z.capacity, 0);

  // Growth factors
  const housingAvailable = totalHousingCapacity - population.total;
  const jobsAvailable = totalJobCapacity - population.employed;
  const happinessModifier = (metrics.happiness.overall - 50) / 100; // -0.5 to 0.5

  // Base growth rate (can be negative if conditions are poor)
  const growthRate = BASE_POPULATION_GROWTH
    * Math.min(housingAvailable / 100, 1.0)
    * Math.min(jobsAvailable / 100, 1.0)
    * (1 + happinessModifier);

  // Apply civilization bonus (e.g., Puebloan sustainability)
  const civBonus = getCivilizationPopulationBonus(state.civilization);
  const finalGrowthRate = growthRate * civBonus;

  // Update population
  population.growthRate = finalGrowthRate;
  population.total = Math.max(0, population.total + finalGrowthRate * dt);

  // Distribute population to zones
  distributePopulationToZones(state);
}
```

#### 3.2.3 Happiness Calculator
```typescript
// Multi-factor happiness system
function calculateHappiness(state: TownshipState): TownshipMetrics['happiness'] {
  const factors: HappinessFactor[] = [];

  // Housing factor: Homelessness penalty
  const homelessRatio = state.population.homeless / state.population.total;
  factors.push({
    category: 'housing',
    value: -50 * homelessRatio,
    weight: 2.0
  });

  // Employment factor: Unemployment penalty
  const unemploymentRatio = state.population.unemployed / state.population.total;
  factors.push({
    category: 'employment',
    value: -40 * unemploymentRatio,
    weight: 1.5
  });

  // Services factor: Coverage bonuses
  const avgServiceCoverage = (
    state.metrics.coverage.power +
    state.metrics.coverage.water +
    state.metrics.coverage.safety +
    state.metrics.coverage.education
  ) / 4;
  factors.push({
    category: 'services',
    value: 30 * avgServiceCoverage,
    weight: 1.0
  });

  // Civilization-specific bonuses (e.g., Maya education bonus)
  const civHappiness = getCivilizationHappinessBonus(state.civilization, state);
  if (civHappiness !== 0) {
    factors.push({
      category: 'environment',
      value: civHappiness,
      weight: 1.0
    });
  }

  // Calculate weighted average
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = factors.reduce((sum, f) => sum + f.value * f.weight, 0);
  const overall = 50 + (weightedSum / totalWeight); // Base 50, modified by factors

  return {
    overall: Math.max(0, Math.min(100, overall)),
    factors
  };
}
```

#### 3.2.4 Demand Curves
```typescript
// Calculate RCI demand based on current balance
function calculateDemand(state: TownshipState): TownshipMetrics['demand'] {
  const { zones, population } = state;

  // Count zones by type
  const residential = zones.filter(z => z.type === 'residential').length;
  const commercial = zones.filter(z => z.type === 'commercial').length;
  const industrial = zones.filter(z => z.type === 'industrial').length;

  // Ideal ratios: R=50%, C=30%, I=20% (adjustable per civilization)
  const total = residential + commercial + industrial || 1;
  const idealResidential = total * 0.5;
  const idealCommercial = total * 0.3;
  const idealIndustrial = total * 0.2;

  // Demand = (ideal - actual) / ideal, clamped to [-1, 1]
  return {
    residential: Math.max(-1, Math.min(1, (idealResidential - residential) / idealResidential)),
    commercial: Math.max(-1, Math.min(1, (idealCommercial - commercial) / idealCommercial)),
    industrial: Math.max(-1, Math.min(1, (idealIndustrial - industrial) / idealIndustrial))
  };
}
```

---

## 4. CIVILIZATION INTEGRATION (LORE)

### 4.1 Carrying Forward Homestead Bonuses

**Implementation:**
```typescript
// Township-specific civilization bonuses
interface TownshipCivilizationBonuses {
  populationGrowth: number;      // e.g., 1.10 = +10% growth
  constructionSpeed: number;     // e.g., 1.15 = +15% faster building
  happinessBonus: number;        // e.g., 5 = +5 base happiness
  zoneCapacity: number;          // e.g., 1.10 = +10% zone capacity
  serviceCoverage: number;       // e.g., 1.20 = +20% service radius
}

// Example: Maya civilization (Knowledge & Astronomy)
const mayaTownshipBonuses: TownshipCivilizationBonuses = {
  populationGrowth: 1.05,        // Slightly faster growth (educated population)
  constructionSpeed: 1.00,       // Normal construction
  happinessBonus: 10,            // +10 happiness from education focus
  zoneCapacity: 1.10,            // +10% capacity (efficient planning)
  serviceCoverage: 1.20          // +20% service radius (advanced infrastructure)
};

// Example: Teotihuacan (Solar Technology)
const teotihuacanTownshipBonuses: TownshipCivilizationBonuses = {
  populationGrowth: 1.00,
  constructionSpeed: 1.15,       // +15% faster (solar-powered tools)
  happinessBonus: 0,
  zoneCapacity: 1.00,
  serviceCoverage: 1.10          // +10% (solar power distribution)
};
```

### 4.2 Narrative Integration

**Advisor Dialogs (for C3):**
- Maya: "Our ancestors studied the stars. Now we design cities with the same precision."
- Teotihuacan: "The Sun's energy powers our tools. Construction proceeds swiftly."
- Moche: "Water flows through our districts as it did through our homestead terraces."
- Hopewell: "Trade routes that began at our homestead now span the township."
- Puebloan: "Sustainable practices from our homestead guide our urban planning."

---

## 5. HOMESTEAD → TOWNSHIP IMPORT

### 5.1 Import Adapter Design

```typescript
// Convert Homestead export to Township initial state
function importFromHomestead(
  homesteadExport: HomesteadTownshipExport,
  tables: DataTables
): TownshipState {
  // Generate deterministic district ID
  const districtId = `district-${homesteadExport.seed}-${homesteadExport.homestead.metadata.day}`;

  // Calculate starting bonuses from Homestead success
  const homesteadQuality = calculateHomesteadQuality(homesteadExport);
  const startingPopulation = Math.floor(50 + homesteadQuality * 50); // 50-100 citizens

  // Create initial zones based on Homestead structures
  const initialZones = generateStarterZones(homesteadExport.homestead.structures);

  return {
    version: 1,
    districtId,
    seed: homesteadExport.seed,
    gridSize: { width: 64, height: 64 },

    zones: initialZones,
    buildings: [],

    population: {
      total: startingPopulation,
      employed: Math.floor(startingPopulation * 0.7),
      unemployed: Math.floor(startingPopulation * 0.3),
      homeless: 0,
      growthRate: 0
    },

    metrics: {
      happiness: {
        overall: 60, // Start positive
        factors: []
      },
      demand: {
        residential: 0.5,
        commercial: 0.5,
        industrial: 0.5
      },
      coverage: {
        power: 0,
        water: 0,
        safety: 0,
        education: 0
      }
    },

    resources: homesteadExport.homestead.resources,
    civilization: homesteadExport.homestead.metadata.civilization || 'teotihuacan',

    timestamp: 0
  };
}

// Assess Homestead performance to determine Township starting conditions
function calculateHomesteadQuality(export: HomesteadTownshipExport): number {
  let quality = 0;

  // Resource stockpile (0-0.3)
  const totalResources = Object.values(export.homestead.resources).reduce((sum, amt) => sum + amt, 0);
  quality += Math.min(0.3, totalResources / 10000);

  // Structures built (0-0.3)
  quality += Math.min(0.3, export.homestead.structures.length / 20);

  // Livestock raised (0-0.2)
  const totalLivestock = export.homestead.livestock?.reduce((sum, l) => sum + l.mature + l.juvenile, 0) || 0;
  quality += Math.min(0.2, totalLivestock / 50);

  // Stamina management (0-0.2)
  quality += export.homestead.staminaPercent * 0.002; // 100% stamina = +0.2

  return Math.min(1.0, quality);
}
```

---

## 6. PERFORMANCE CONSIDERATIONS

### 6.1 Spatial Partitioning

**Problem:** Checking service coverage for 1000s of zones is O(n²)
**Solution:** Spatial hash grid

```typescript
class SpatialGrid<T> {
  private cellSize: number = 8; // 8×8 tile cells
  private grid: Map<string, T[]> = new Map();

  insert(item: T, position: { x: number; y: number }): void {
    const key = this.cellKey(position);
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key)!.push(item);
  }

  queryRadius(position: { x: number; y: number }, radius: number): T[] {
    const results: T[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = this.cellKey({
          x: position.x + dx * this.cellSize,
          y: position.y + dy * this.cellSize
        });
        const cell = this.grid.get(key);
        if (cell) results.push(...cell);
      }
    }

    return results;
  }

  private cellKey(pos: { x: number; y: number }): string {
    const cx = Math.floor(pos.x / this.cellSize);
    const cy = Math.floor(pos.y / this.cellSize);
    return `${cx},${cy}`;
  }
}
```

### 6.2 Lazy Evaluation

**Strategy:** Only recalculate metrics when state changes

```typescript
class TownshipManager {
  private dirty = {
    happiness: true,
    demand: true,
    coverage: true
  };

  private cachedMetrics: TownshipMetrics | null = null;

  markDirty(system: keyof typeof this.dirty): void {
    this.dirty[system] = true;
    this.cachedMetrics = null;
  }

  getMetrics(state: TownshipState): TownshipMetrics {
    if (this.cachedMetrics && !Object.values(this.dirty).some(d => d)) {
      return this.cachedMetrics;
    }

    // Recalculate only dirty subsystems
    const metrics = { ...this.cachedMetrics } as any;
    if (this.dirty.happiness) metrics.happiness = calculateHappiness(state);
    if (this.dirty.demand) metrics.demand = calculateDemand(state);
    if (this.dirty.coverage) metrics.coverage = calculateCoverage(state);

    Object.keys(this.dirty).forEach(k => this.dirty[k] = false);
    this.cachedMetrics = metrics;
    return metrics;
  }
}
```

---

## 7. DATA SCHEMAS

### 7.1 Building Definitions (`web/content/township/buildings.json`)

```json
{
  "house_small": {
    "id": "house_small",
    "name": "Small House",
    "type": "residential",
    "tier": 1,
    "cost": {
      "wood": 50,
      "stone": 30,
      "coins": 100
    },
    "buildTime": 30,
    "capacity": 4,
    "size": { "width": 1, "height": 1 },
    "effects": {
      "happiness": 0
    }
  },
  "market": {
    "id": "market",
    "name": "Market",
    "type": "commercial",
    "tier": 1,
    "cost": {
      "wood": 100,
      "stone": 50,
      "coins": 200
    },
    "buildTime": 60,
    "capacity": 10,
    "size": { "width": 2, "height": 2 },
    "effects": {
      "happiness": 5
    },
    "provides": ["shopping"],
    "serviceRadius": 8
  }
}
```

---

## 8. TESTING STRATEGY

### 8.1 Unit Tests

```typescript
describe('Zone Growth System', () => {
  it('zones mature based on demand and service coverage', () => {
    const zone = createTestZone({ maturity: 0, type: 'residential' });
    const state = createTestTownship({ zones: [zone], metrics: { demand: { residential: 0.5 }}});

    tickZoneGrowth(state, 1.0);

    expect(zone.maturity).toBeGreaterThan(0);
    expect(zone.capacity).toBeGreaterThan(0);
  });
});

describe('Homestead Import', () => {
  it('converts Homestead export to valid Township state', () => {
    const homesteadExport = createMockHomesteadExport();
    const township = importFromHomestead(homesteadExport, tables);

    expect(township.population.total).toBeGreaterThan(0);
    expect(township.civilization).toBe(homesteadExport.homestead.metadata.civilization);
    expect(township.zones.length).toBeGreaterThan(0);
  });
});
```

---

## 9. MILESTONES

**Week 13 (Wave Alpha Start):**
- ✅ Architecture document complete
- ✅ Type definitions established
- ⏳ Core simulation systems implemented
- ⏳ Homestead import adapter functional

**Week 14:**
- ⏳ Zone growth system tested
- ⏳ Population simulation stable
- ⏳ Happiness calculator validated

**Week 15 (Wave Alpha Complete):**
- ⏳ Civilization bonuses integrated
- ⏳ Contract tests passing
- ⏳ Ready for U3 (UI) and C3 (Content) integration

---

**Status:** Architecture design complete, ready for implementation
**Next:** Create type definitions and begin core systems
