# Farm-to-Stars Pivot: AI-Driven Grand Strategy

## Executive Summary

Transform Farm-to-Stars from a cozy farming simulation into a **Pax Historia-style AI-driven grand strategy platform**. Players create and play scenarios that progress from homestead farming to interstellar civilization, with AI generating emergent narratives, diplomatic responses, and world events.

**Core Innovation:** Every scenario is a "what if" sandbox where AI powers the world's response to player decisions, creating truly emergent stories that couldn't be pre-written.

---

## What Stays

| Element | Rationale |
|---------|-----------|
| 4-Phase Progression | Homestead → Township → Nation → Stellar. This narrative arc is the game's identity |
| 5 Civilizations | Solar, Celestial, Merchant, Mesa, Pioneer — each with distinct bonuses, aesthetics, and lore |
| Pixel Art Aesthetic | Differentiates from Pax Historia's clean geopolitical look. Retro-future farming vibe is memorable |
| Worldbuilding | All lore, festivals, seasonal themes, and civilization backstories carry forward |
| 56-Week Campaign | The full progression timeline — now as scenario chapters rather than real-time gameplay |

## What Changes

| From (Old) | To (New) |
|------------|----------|
| Direct control simulation (tilling soil, placing buildings) | Strategic decision-making at civilization level |
| Real-time crop growth, weather, stamina | Turn-based or phase-based progression with AI-generated outcomes |
| Player does the farming | Player *decides* what the civilization prioritizes, AI simulates results |
| Pre-written quest chains | AI-generated events based on scenario + player history |
| Single-player progression | Scenarios created by community, played by anyone |
| Phaser 3 real-time engine | Simpler renderer — strategic map + event cards |

---

## Gameplay Loop

### 1. Scenario Creation (Creators)

Players create scenarios using a scenario definition format:

```yaml
scenario:
  id: "mesa-first-township"
  name: "The Cliff Dwellers"
  civilization: mesa
  
  # Starting conditions
  starting_phase: homestead
  prompt: |
    You are a Mesa Pioneer clan who has settled in a canyon 
    with limited water but abundant stone. Your ancestors built 
    cliff dwellings. Can you build a township worthy of that legacy?
  
  # Constraints that shape AI behavior
  constraints:
    - water_scarcity: true
    - stone_abundance: true
    - solar_bonus: reduced (canyon shadows)
    
  # Victory conditions
  victory:
    - type: population_threshold
      target: 1000
      phase: township
    - type: building_constructed
      target: "cliff_palace"

  # Custom events that can trigger
  events:
    - id: flash_flood
      trigger: "random || water_project_built"
      prompt: "A flash flood surges through the canyon..."
```

### 2. Scenario Selection (Players)

- Browse community scenarios by civilization, difficulty, theme
- See play count, ratings, "most played this week"
- Official scenarios (by us) marked with a star

### 3. Core Game Loop (Playing)

```
┌─────────────────────────────────────────────────────────────┐
│  MAP VIEW                                                   │
│  ┌─────┐  ┌─────┐  ┌─────┐                                 │
│  │Zone1│  │Zone2│  │Zone3│   [Resources: Wood 50, Stone 20] │
│  └─────┘  └─────┘  └─────┘   [Population: 120]             │
│                                                             │
│  [Make Decision] → triggers AI processing                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  EVENT CARD                                                 │
│  ┌─────────────────────────────┐                            │
│  │  [Pixel Art Illustration]   │                            │
│  │                             │                            │
│  │  "The spring rains came     │                            │
│   │   early this year. Your    │                            │
│   │   crops flourish, but the  │                            │
│   │   river threatens to flood │                            │
│   │   the eastern fields."     │                            │
│  │                             │                            │
│  │  [Build Levees] [Relocate]  │                            │
│  │  [Do Nothing]               │                            │
│  └─────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  AI RESOLUTION (behind the scenes)                          │
│  - Minimax API call with structured prompt                  │
│  - Returns: outcome text, resource changes, follow-up flag  │
│  - Parsed into game state update                            │
└─────────────────────────────────────────────────────────────┘
```

### 4. Decision Types

| Decision | Example | AI Role |
|----------|---------|---------|
| **Resource Allocation** | "Dedicate 30% of labor to farming or infrastructure?" | Simulates outcomes, generates event text |
| **Diplomatic** | "Accept trade deal with neighboring township?" | Generates NPC response, consequences |
| **Crisis Response** | "Drought hits. How do you respond?" | Creates branching narrative |
| **Research** | "Unlock irrigation or masonry?" | Describes discovery, unlocks new decisions |
| **Transition** | "Advance to Nation phase?" | Generates transition narrative, unlocks new mechanics |

---

## Visual Design

### Strategic Map View

```
┌──────────────────────────────────────────────────────────────┐
│  FARM TO STARS                    [Week 12] [Mesa] [🌾]      │
│                                                              │
│     🏔️        ╭──────╮      ╭──────╮                        │
│    Mesa      │ FARM │      │ FARM │   [Wood: 50]             │
│   (Home)     ╰──┬───╯      ╰──┬───╯   [Stone: 120]          │
│                 │              │       [Water: ⚠️ LOW]       │
│              ╭──┴───╮      ╭──┴───╮    [Pop: 89/100]         │
│              │WELL  │      │ROAD  │                         │
│              ╰──────╯      ╰──┬───╯    🔔 2 events pending   │
│                               │                              │
│                            ╭──┴───╮                         │
│                            │MARKET│  [Decision needed ▼]     │
│                            ╰──────╯                         │
│                                                              │
│  [Map] [Resources] [Research] [Diplomacy] [Advance ▶]        │
└──────────────────────────────────────────────────────────────┘
```

**Visual style:**
- Isometric pixel art (reuse existing assets, zoomed out)
- Buildings rendered as small sprites
- Terrain tiles (grass, stone, water) in your established palette
- UI overlays for resources, population, current phase

### Event Cards

Full-screen modal with:
- Pixel art illustration (limited set, reused with variations)
- AI-generated narrative text
- 2-4 choice buttons
- Contextual information ("This will consume 20 wood")

---

## Architecture

### High-Level Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Player     │────▶│  Decision    │────▶│   AI Engine  │
│   (Browser)  │◀────│  Engine      │◀────│   (Minimax)  │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Scenario     │
                     │ Definition   │
                     └──────────────┘
```

### Core Modules

```
src/
├── ai/
│   ├── provider.ts          # Abstract LLM interface
│   ├── minimax.ts           # Minimax implementation
│   ├── prompts/
│   │   ├── event.ts         # Event generation prompts
│   │   ├── outcome.ts       # Decision outcome prompts
│   │   └── narrative.ts     # Story progression prompts
│   └── cache.ts             # Response caching (token $$$)
│
├── game/
│   ├── scenario/
│   │   ├── loader.ts        # Load YAML scenario definitions
│   │   ├── validator.ts     # Validate scenario structure
│   │   └── registry.ts      # Browse/discover scenarios
│   │
│   ├── state/
│   │   ├── gameState.ts     # Current game state
│   │   ├── history.ts       # Decision history for AI context
│   │   └── persistence.ts   # Save/load
│   │
│   ├── decisions/
│   │   ├── engine.ts        # Process player decisions
│   │   ├── types.ts         # Decision type definitions
│   │   └── resolver.ts      # Apply outcomes to state
│   │
│   └── progression/
│       ├── phases.ts        # Phase definitions (homestead, etc.)
│       ├── unlocks.ts       # What unlocks at each phase
│       └── transitions.ts   # Phase transition logic
│
├── ui/
│   ├── map/
│   │   ├── MapView.tsx      # Strategic map component
│   │   ├── Zone.tsx         # Map zone/territory component
│   │   └── icons.ts         # Asset mapping
│   │
│   ├── events/
│   │   ├── EventCard.tsx    # Full-screen event modal
│   │   ├── ChoiceButton.tsx # Decision buttons
│   │   └── Narrative.tsx    # AI text display with typewriter effect
│   │
│   └── hud/
│       ├── Resources.tsx    # Resource bar
│       ├── PhaseIndicator.tsx
│       └── CivilizationBadge.tsx
│
└── data/
    ├── civilizations.json   # Your existing civ data
    ├── buildings.json       # Existing building definitions
    └── scenarios/           # User/community scenarios
        ├── official/
        └── community/
```

### AI Provider Abstraction

```typescript
// ai/provider.ts
interface AIProvider {
  generateEvent(context: GameContext): Promise<EventResult>;
  resolveDecision(decision: Decision, context: GameContext): Promise<OutcomeResult>;
  generateNarrative(context: GameContext): Promise<string>;
}

// ai/minimax.ts
class MinimaxProvider implements AIProvider {
  // Uses Minimax API
  // Structured outputs for reliable parsing
  // Caching to reduce token costs
}

// Future: OpenAIProvider, AnthropicProvider, LocalProvider
```

### Prompt Strategy (Token Efficiency)

**The Problem:** Grand strategy = lots of AI calls. Unchecked, this burns through tokens.

**Solutions:**
1. **Structured prompts** — Always use JSON mode/structured outputs
2. **Context window management** — Summarize history after N decisions, not full log
3. **Caching** — Cache similar prompts ("drought event for Mesa civilization")
4. **Pre-generation** — Generate 3-5 events ahead during player reading time
5. **Hybrid content** — Common events ("harvest good/bad") pre-written, rare events AI-generated

**Example Event Prompt:**
```
You are the game master for Farm-to-Stars. Generate an event.

SCENARIO: Mesa Pioneers in canyon, water scarcity, stone abundance
PHASE: Township (week 12 of 24)
HISTORY: Built well (week 3), flash flood survived (week 8), market opened (week 10)
CURRENT STATE: Population 89, Wood 50, Stone 120, Water LOW
RECENT DECISION: Allocated 60% labor to farming

Generate:
1. Event title (string, max 50 chars)
2. Narrative text (string, 2-3 sentences, evocative)
3. Choices array (2-3 choices):
   - text: string (max 100 chars)
   - resource_cost: Record<string, number> or null
   - success_probability: 0-1 (for internal use)
4. Follow-up hint: string or null (for continuity)

Respond in JSON.
```

---

## Scenario System

### Official Scenarios (Launch)

1. **The Solar Awakening** (Solar Civilization)
   - From humble homestead to solar-powered township
   - Theme: Innovation, festivals, community

2. **The Cliff Dwellers** (Mesa Civilization)
   - Building in challenging terrain
   - Theme: Sustainability, water scarcity, ancient wisdom

3. **The Merchant's Gambit** (Merchant Civilization)
   - Trade-focused progression
   - Theme: Commerce, diplomacy, risk/reward

4. **Celestial Navigation** (Celestial Civilization)
   - Astronomy and planning themes
   - Theme: Precision, seasons, long-term thinking

5. **The Pioneer Spirit** (Pioneer Civilization)
   - Exploration and expansion
   - Theme: Resilience, adaptation, growth

### Community Scenarios

- YAML-based creation tool
- Validation before publish
- Rating system
- Featured section curated by us

---

## Technical Decisions

### Framework

- **Keep:** TypeScript, Vite, PWA capabilities
- **Remove:** Phaser 3 (overkill for strategic map + cards)
- **Add:** React or vanilla TS with custom renderer (simpler, faster)

### State Management

- Zustand or similar lightweight store
- Game state serializable for save/load
- History for AI context (summarized, not full)

### AI Costs (Minimax)

| Action | Est. Tokens | Cost per 1K calls |
|--------|-------------|-------------------|
| Event generation | ~500 | ~$0.50 |
| Decision resolution | ~300 | ~$0.30 |
| Narrative summary | ~200 | ~$0.20 |

**Mitigation:**
- Pre-generate during player reading
- Cache common scenarios
- Use cheaper model for routine, expensive for "wow" moments
- Hybrid: 80% pre-written templates, 20% AI-generated unique content

### Migration from Old Code

**Salvage:**
- `data/civilizations.ts` → civilization definitions
- `data/buildings.ts` → building unlocks/effects
- `data/resources.ts` → resource types
- Pixel art assets → map icons

**Deprecate:**
- All simulation systems (crop growth, weather physics, etc.)
- Real-time game loop
- Input handling for farming actions
- Most of the HUD components

**New:**
- AI provider layer
- Scenario system
- Decision engine
- Event card UI
- Strategic map renderer

---

## MVP Scope

### Week 1-2: Foundation
- [ ] AI provider abstraction + Minimax integration
- [ ] Scenario YAML loader + validator
- [ ] Basic game state management
- [ ] Decision engine (simple version)

### Week 3-4: UI
- [ ] Strategic map view (static, no interactions)
- [ ] Event card component
- [ ] HUD (resources, phase, civilization)

### Week 5-6: Integration
- [ ] One complete scenario ("The Solar Awakening")
- [ ] End-to-end: decision → AI → outcome → state update
- [ ] Save/load

### Week 7-8: Polish
- [ ] Animations/transitions
- [ ] Sound (reuse existing)
- [ ] PWA packaging
- [ ] First community scenario tools

---

## Open Questions

1. **Phase transitions:** How hands-on is the transition from Homestead → Township? Is it a single decision, or a series?

2. **Multiplayer:** Pax Historia has async multiplayer. Do we want that, or pure single-player for MVP?

3. **Narrative voice:** Do we preserve the "cozy" tone, or can it get darker? (Famine, war, etc.)

4. **Civilization differentiation:** How much do Mesa vs Solar scenarios actually differ? Just flavor text, or meaningful mechanical differences?

---

## Next Steps

1. **Review this doc** — what's wrong, what's missing?
2. **Decide on MVP scope** — full pivot or hybrid transition?
3. **AI provider test** — verify Minimax integration works
4. **Start implementation** — ai/ layer first, then scenario system

---

*Document Version: 0.1*
*Date: 2026-02-21*
*Status: Draft for review*
