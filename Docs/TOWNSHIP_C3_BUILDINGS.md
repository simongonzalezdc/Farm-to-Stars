# Township C3: Building Data Schema

**Status:** ✅ Complete
**Bundle:** C3 (Civic Content)
**Dependencies:** S3 (District Simulation Core)

---

## Overview

Complete building catalog for Township phase with 24 building types across 4 categories.

## Building Categories

### 🏠 Residential (3 tiers)
Buildings that house citizens.

| Building | Tier | Capacity | Cost | Build Time | Description |
|----------|------|----------|------|------------|-------------|
| Small House | 1 | 4 | 100 coins, 50 wood, 30 stone | 30s | Low density housing |
| Apartment Building | 2 | 12 | 500 coins, 150 wood, 100 stone | 60s | Medium density (unlocks at 250 pop) |
| Luxury Condominium | 3 | 30 | 1500 coins, 300 wood, 250 stone | 120s | High density (unlocks at 1000 pop) |

**Design Notes:**
- 3× capacity increase per tier (4 → 12 → 30)
- ~5× cost increase per tier
- Higher tiers have negative environment impact
- Maintenance scales with tier

### 🏪 Commercial (3 tiers)
Buildings that provide jobs and shopping services.

| Building | Tier | Jobs | Service Radius | Cost | Description |
|----------|------|------|----------------|------|-------------|
| General Store | 1 | 3 | 8 tiles | 150 coins, 40 wood, 20 stone | Basic shopping |
| Market Plaza | 2 | 10 | 12 tiles | 600 coins, 120 wood, 80 stone | Bustling marketplace (250 pop) |
| Office Complex | 3 | 25 | 0 | 1800 coins, 250 wood, 200 stone | Professional jobs (1500 pop) |

**Design Notes:**
- Provide "shopping" service + happiness bonus
- Lower tiers boost happiness more (markets > offices)
- Jobs scale: 3 → 10 → 25

### 🏭 Industrial (3 tiers)
Buildings that provide jobs but cause pollution.

| Building | Tier | Jobs | Environment | Cost | Description |
|----------|------|------|-------------|------|-------------|
| Artisan Workshop | 1 | 5 | -5 | 200 coins, 60 wood, 40 stone | Small-scale production |
| Manufacturing Plant | 2 | 15 | -15 | 800 coins, 200 wood, 150 stone | Large-scale factory (400 pop) |
| Industrial Park | 3 | 40 | -30 | 2500 coins, 400 wood, 350 stone | Massive complex (2000 pop) |

**Design Notes:**
- Jobs scale: 5 → 15 → 40
- Pollution increases with tier
- No happiness bonuses (trade-off)
- Highest job-to-cost ratio

### ⚙️ Service Buildings (14 types)
Essential infrastructure providing services to zones.

#### Power (3 buildings)
| Building | Radius | Special | Civilization |
|----------|--------|---------|--------------|
| Power Plant | 15 tiles | -10 environment | Universal |
| Solar Power Array | 20 tiles | +5 happiness, +5 environment | **Teotihuacan only** (500 pop) |

#### Water (3 buildings)
| Building | Radius | Special | Civilization |
|----------|--------|---------|--------------|
| Water Tower | 12 tiles | Basic water | Universal |
| Water Treatment Facility | 18 tiles | +3 happiness | Universal (600 pop) |
| Grand Aqueduct | 25 tiles | +10 happiness | **Moche only** (1200 pop) |

#### Safety (2 buildings)
| Building | Radius | Special |
|----------|--------|---------|
| Police Station | 10 tiles | +5 happiness (200 pop) |
| Fire Station | 12 tiles | +4 happiness (200 pop) |

#### Education (2 buildings)
| Building | Radius | Special | Civilization |
|----------|--------|---------|--------------|
| School | 10 tiles | +8 happiness (300 pop) |
| Observatory | 15 tiles | +15 happiness | **Maya only** (800 pop) |

#### Health (1 building)
| Building | Radius | Special |
|----------|--------|---------|
| Medical Center | 12 tiles | +10 happiness (500 pop) |

#### Recreation (3 buildings)
| Building | Radius | Special | Civilization |
|----------|--------|---------|--------------|
| Community Park | 8 tiles | +6 happiness, +10 environment (150 pop) |
| Central Plaza | 12 tiles | +15 happiness, +20 environment | **Puebloan only** (700 pop) |
| Trading Post | 15 tiles | +12 happiness, shopping service | **Hopewell only** (600 pop) |

---

## Civilization-Specific Buildings

### 🌞 Teotihuacan
- **Solar Power Array**: Clean energy with extended radius and happiness boost

### 📜 Maya
- **Observatory**: Advanced education with massive happiness boost

### 💧 Moche
- **Grand Aqueduct**: Monumental water infrastructure with huge coverage

### 🤝 Hopewell
- **Trading Post**: Commerce hub combining shopping service + happiness

### 🏛️ Puebloan
- **Central Plaza**: Sustainable gathering space with best environment bonus

---

## Balance Design

### Tier Progression
- **Cost**: ~5× increase per tier
- **Capacity/Jobs**: ~3× increase per tier
- **Maintenance**: ~3× increase per tier
- **Build Time**: ~2× increase per tier

### Trade-offs
- **Residential**: Higher tiers = more capacity but worse environment
- **Commercial**: Tier 1-2 = shops (happiness), Tier 3 = offices (jobs only)
- **Industrial**: Best job ratios but heavy pollution penalty
- **Service**: Essential but expensive to maintain

### Service Coverage
- **Power/Water**: 12-25 tile radius (wide area)
- **Safety/Education**: 10-15 tile radius (moderate)
- **Recreation**: 8-12 tile radius (localized)

### Unlock Gates
- **Population thresholds**: 150, 200, 250, 300, 400, 500, 600, 700, 800, 1000, 1200, 1500, 2000
- **Civilization-specific**: 5 unique buildings (1 per civ)

---

## Implementation

### Files Created
```
web/content/township/
└── buildings.json (24 buildings, ~500 lines)

web/src/sim/township/data/
├── buildingsLoader.ts (loader + validation)
└── __tests__/
    └── buildingsLoader.test.ts (31 tests)
```

### Usage Example
```typescript
import { getBuildingsTable, isBuildingUnlocked } from '@/sim/township/data/buildingsLoader';

// Load all buildings
const buildings = getBuildingsTable();

// Check if player can build
const canBuild = isBuildingUnlocked(
  buildings.residential_apartment,
  state.population.total,
  state.civilization
);

// Get buildings for current civ
const myBuildings = getBuildingsForCivilization('maya');
```

### Integration with S3
The buildings.json schema matches `BuildingDefinition` type from `types.township.ts`:
- All required fields validated
- Costs apply civilization modifiers (e.g., Moche water discount)
- Service radius uses civilization coverage bonuses
- Population gates check against TownshipState

---

## Test Coverage

✅ **31 tests, 100% passing**

**Validation Tests:**
- All buildings have required fields
- Service buildings have `provides` array
- Service buildings have radius > 0
- Residential buildings have capacity > 0

**Functionality Tests:**
- Load buildings by ID
- Filter by type (residential/commercial/industrial/service)
- Filter by civilization
- Unlock gating (population + civilization)
- Caching behavior

**Balance Tests:**
- Higher tier = higher cost
- Higher tier = higher capacity
- Higher tier = higher maintenance
- Industrial buildings = negative environment
- Parks = positive environment
- Build times in reasonable range (10s - 3min)

---

## Next Steps

**Immediate:**
1. ✅ C3 Complete - Buildings data ready
2. 🔄 U3 - Build construction UI that references these buildings
3. 🔄 Integration - Wire TownshipManager to use buildings for service coverage

**Future Enhancements:**
1. Add more tier 3 buildings (universities, research labs)
2. Add special buildings (monuments, wonders)
3. Add seasonal/event buildings
4. Add building upgrades/demolition mechanics

---

**Status:** Production-ready
**Blocked By:** None
**Blocks:** U3 (City HUD), Integration Testing
