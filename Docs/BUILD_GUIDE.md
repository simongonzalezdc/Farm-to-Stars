# Farm to Stars — End-to-End Build Guide

## 1. Vision Recap
- Deliver a four-phase strategy saga that graduates the player from a single homestead to interstellar stewardship while preserving cozy tactile play.
- Maintain shared values across phases: deterministic simulation, data-driven content, gentle but meaningful choices, and frictionless PWA access.
- Keep production grounded in lightweight tooling (Phaser/Vite for iso maps, React HUD wrappers, Node-based pipelines) to sustain rapid iteration.

## 2. Current State Snapshot (June 2024)
- **Vertical slice** complete: iso renderer, construction/economy loop, season cadence, and save/PWA scaffolding are shipping in `web/`.
- **Homestead arc** weeks 1–7 implemented: till/plant/water/harvest loop, stamina + day/night, audio layering, and migration-safe saves.
- Outstanding Homestead tasks (Weeks 8–10) focus on schema extensions, tuning, polish, and QA automation.

## 3. Guiding Principles for the Remainder
1. **Phase parity**: Each phase should stand alone in content depth while feeding into the next via deterministic converters.
2. **Shared systems**: Reuse the fixed-step simulation, data schema patterns, save/version infrastructure, and UI component library wherever possible.
3. **Content pipelines**: Every new data table (buildings, crops, policies, techs) must ship with CSV/JSON sources, schema validation, and automated tests.
4. **Tooling first**: Build editors/debug overlays before content bursts; invest in telemetry hooks for player pacing metrics.
5. **Live ops mindset**: PWA service worker updates, migration scripts, and feature flags must be exercised continuously to prevent regressions.

## 4. Phase-by-Phase Build Plan

### 4.1 Homestead (Weeks 8–12)
**Goal:** Polish the farm-life experience into a content-complete, replayable loop that seeds Township progression.

| Track | Milestones | Notes |
| --- | --- | --- |
| Systems | Extend save schema for livestock, weather events, NPC mail; add async job queue for background timers. | Versioned migrations + regression fixtures. |
| Content | Add livestock husbandry, festivals, rare seeds, tool mastery perks. | Author data tables + audio cues. |
| UX | Expand HUD (calendar, quest log, stamina tips), improve build placement UX (snap previews, rotate). | Maintain mobile-first layout. |
| QA/Polish | Automated soak tests for multi-day crops, screenshot diff tests for seasons, audio balance pass. | Update `TEST_PLAN.md`. |
| Telemetry | Hook analytics events (day length, resource hoarding), add debug overlay for sim state. | Respect offline-mode buffering. |

**Exit Criteria:** Stable 30-day in-game campaign, all save migrations covered, Homestead→Township export prototype generates starter district blueprint.

### 4.2 Township (Weeks 13–24)
**Goal:** Introduce SimCity-style district management with infrastructure, population simulation, and civic services.

1. **Foundations (W13–16)**
   - Implement layered map renderer for zoning overlays and service heatmaps.
   - Extend simulation to support agents (citizens) with jobs, housing, and satisfaction.
   - Add utilities grid (power, water) with propagation algorithms and outage handling.
   - Create data schemas for districts, building upgrades, ordinances.

2. **Content & UX (W17–20)**
   - Build zoning toolset (residential/commercial/industrial/agricultural) with demand/supply feedback.
   - Surface city dashboards (population stats, tax income, happiness) in HUD panels.
   - Introduce civic buildings (school, clinic, police, entertainment) with upkeep and modifiers.
   - Integrate dynamic weather/disaster events impacting infrastructure.

3. **Integration & Polish (W21–24)**
   - Finalize Homestead→Township converter: map farm exports to founding districts, bring over NPC relationships as citizen traits.
   - Balance economy loops, tax schedules, and service coverage for difficulty tiers.
   - Add tutorial missions and council advisor dialog system.
   - Regression suite: zoning validator tests, utility propagation unit tests, city-wide save/load stress tests.

**Exit Criteria:** Player can grow a thriving town of 5k citizens, resolve outages, pass ordinances, and export a governance dossier for Nation phase.

### 4.3 Nation (Weeks 25–40)
**Goal:** Scale to a regional strategy layer with territorial control, diplomacy, research, and logistics.

1. **Engine Extensions (W25–30)**
   - Build hex-map renderer with fog of war and multi-layer terrain (land/sea/air lanes).
   - Implement pathfinding service (A*/JPS) with unit orders queue and supply line validation.
   - Expand simulation clock for turn/season sequencing; support simultaneous resolution.
   - Create data schemas for units, technologies, policies, and factions.

2. **Core Systems (W31–35)**
   - Develop diplomacy system (relations, treaties, trade routes) with AI personalities seeded from Township exports.
   - Add research tree UI with unlock prerequisites tied to Homestead/Township achievements.
   - Implement logistics/resource pipelines: moving goods from towns to fronts, attrition, morale.
   - Design event system for narrative arcs and crises.

3. **Content & Balance (W36–38)**
   - Populate tech tree tiers (agriculture, industry, governance, exploration).
   - Add unit roster (workers, militia, engineers, airships) with upgrade paths.
   - Create AI scripts for rival nations: expansion logic, diplomacy stances, war/peace triggers.
   - Compose score/mood audio suites per diplomatic state.

4. **Stabilization (W39–40)**
   - Ship Township→Nation converter translating town metrics into starting provinces and tech boosts.
   - Run large-map performance profiling, optimize serialization, and finalize QA harness (AI auto-play smoke tests).
   - Document modding hooks for community scenarios.

**Exit Criteria:** Player can unify or ally across a continent, achieve at least one national victory (cultural/industrial/military), and unlock interstellar initiative dossier.

### 4.4 Stellar (Weeks 41–56)
**Goal:** Deliver the interstellar finale with colony management, fleet logistics, diplomacy, and science victory conditions.

1. **Space Layer Foundations (W41–46)**
   - Build star map renderer with procedural sector generation and line-of-sight exploration.
   - Implement fleet travel simulation (fuel, travel time, encounters) and colony instancing (surface maps).
   - Extend save schema for multi-node states (star systems + colonies + fleets).
   - Author data schemas for colonies, star resources, alien factions, treaties.

2. **Systems & Progression (W47–52)**
   - Design colony management loops (terraforming, population morale, production queues).
   - Create interstellar diplomacy with multi-party treaties, cultural exchange, and espionage.
   - Implement science victory ladder (research milestones, wonder projects) and alternate win conditions.
   - Add narrative events bridging back to earlier phase choices (e.g., Homestead traditions influencing alien negotiations).

3. **Finale & Polish (W53–56)**
   - Nation→Stellar converter: translate global achievements into starting fleet, tech head start, and cultural ethos.
   - Build endgame UI (galactic council, victory timeline, legacy codex) and credits experience.
   - Conduct full regression pass across all phases, verifying save compatibility, converter correctness, and telemetry accuracy.
   - Localize key UI strings and tutorials.

**Exit Criteria:** Player can achieve multiple victory types, see legacy summaries tracing all four phases, and restart a new saga with NG+ modifiers.

## 5. Cross-Cutting Workstreams

### 5.1 Tooling & Infrastructure
- Maintain mono-repo with `web/` client, `content/` data sources, `tools/` pipelines, and CI scripts.
- Expand CLI tools for data validation, localization extraction, and telemetry log replay.
- Integrate automated visual regression (Chromatic/Playwright) and performance budgets in CI.
- Set up nightly build that replays representative saves from each phase.

### 5.2 Audio & Narrative
- Grow adaptive soundtrack layers per phase with smooth transitions driven by game state.
- Commission VO or text-only advisor personalities; integrate branching dialog authored in ink/JSON.
- Schedule seasonal content drops (festivals, events) with authoring calendar.

### 5.3 QA & Release Management
- Update `TEST_PLAN.md` with phase-specific checklists.
- Establish bug triage cadence, severity SLAs, and release gates (alpha/beta/stable).
- Implement crash/error reporting (Sentry-like) respecting offline buffering and privacy.
- Run external playtests at the end of each phase; synthesize findings into actionable backlog items.

## 6. Resource & Timeline Overview
- **Total duration:** ~56 weeks post-slice.
- **Team assumptions:**
  - 2 gameplay engineers (simulation + UI)
  - 1 tools engineer
  - 1 technical artist / animator
  - 1 designer (systems + content)
  - 1 writer/narrative designer
  - Part-time audio contractor
  - QA lead + external testers per milestone
- **Cadence:** Two-week sprints with milestone reviews at phase boundaries. Maintain backlog in Notion/Jira; sync docs weekly.

## 7. Risk Register & Mitigations
| Risk | Mitigation |
| --- | --- |
| Simulation complexity causing regression cascade | Modularize systems, enforce contract tests, invest in automated sim replays. |
| Performance degradation on low-end devices | Profiling per milestone, performance budgets, fallback rendering layers. |
| Content bloat / scope creep | Lock content lists per phase, require spec review before adding systems. |
| Save migration failures | Maintain schema version ladder, write downgrade scripts for dev saves, test conversions nightly. |
| Player onboarding overwhelm | Iterative UX testing, layered tutorials, context-sensitive help across phases. |

## 8. Deliverables Checklist
- [ ] Homestead completion report + converter spec
- [ ] Township phase alpha/beta release notes, tech/art bibles
- [ ] Nation phase design kit (AI behaviors, diplomacy matrices)
- [ ] Stellar phase content bible, localization kit, finale script
- [ ] Unified analytics dashboard covering KPIs per phase
- [ ] Marketing assets: teaser trailer per phase, press kit

## 9. Living Document Practices
- Update this guide at the close of every milestone review.
- Link sprint retrospectives and KPI dashboards in-line.
- Archive superseded plans in `Archive/` with date stamps.
- Keep PRD/GDD aligned; flag deltas needing leadership sign-off.

---
*Last updated: 2024-06-XX*
