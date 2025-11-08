# Farm to Stars — End-to-End Build Guide

## 1. Vision Recap
- Deliver a four-phase strategy saga that graduates the player from a single homestead to interstellar stewardship while preserving cozy tactile play.
- Maintain shared values across phases: deterministic simulation, data-driven content, gentle but meaningful choices, and frictionless PWA access.
- Keep production grounded in lightweight tooling (Phaser/Vite for iso maps, React HUD wrappers, Node-based pipelines) to sustain rapid iteration.

## 2. Current State Snapshot (November 2025)
- **Vertical slice** remains the foundation: iso renderer, construction/economy loop, season cadence, and save/PWA scaffolding are shipping in `web/` and continue to serve as the production baseline.
- **Homestead arc** weeks 1–7 are implemented and stable: till/plant/water/harvest loop, stamina + day/night, audio layering, and migration-safe saves have regression coverage.
- **Outstanding Homestead tasks (Weeks 8–10)** are ready for execution once the team ramps for the long-form build: schema extensions, pacing/balance, UX polish, and QA automation are scoped but not yet started.

## 3. Guiding Principles for the Remainder
1. **Phase parity**: Each phase should stand alone in content depth while feeding into the next via deterministic converters.
2. **Shared systems**: Reuse the fixed-step simulation, data schema patterns, save/version infrastructure, and UI component library wherever possible.
3. **Content pipelines**: Every new data table (buildings, crops, policies, techs) must ship with CSV/JSON sources, schema validation, and automated tests.
4. **Tooling first**: Build editors/debug overlays before content bursts; invest in telemetry hooks for player pacing metrics.
5. **Live ops mindset**: PWA service worker updates, migration scripts, and feature flags must be exercised continuously to prevent regressions.

## 4. Phase-by-Phase Build Plan

### 4.1 Homestead (Weeks 8–12 · Target: Dec 2025 – Jan 2026)
**Goal:** Polish the farm-life experience into a content-complete, replayable loop that seeds Township progression.

#### 4.1.1 Parallel task board
Each task bundle below is designed to be executed on an isolated branch and merged independently.  Shared interfaces are frozen up front so teams can work simultaneously without rebasing churn.  The detailed task cards and "definition of ready" checklists for every bundle live in `Docs/HOMESTEAD_PARALLEL_TASKS.md` to help coordinators spin up parallel crews immediately.

| Bundle | Scope | Key Assets/Files | Cross-Team Contract |
| --- | --- | --- | --- |
| **S1 — Simulation Extensions** | Livestock lifecycle sim (feeding, growth, produce), dynamic weather events, NPC mail scheduler, background job queue worker. | `web/src/sim/livestock/*`, `web/src/sim/weather/*`, `web/src/sim/jobs/*`, save schema in `Docs/DATA_SCHEMAS.md`. | Provide protobuf/JSON schema v6 draft for review before implementation begins. Emits domain events consumed by UX and audio bundles. |
| **S2 — Save/Migration Ladder** | Versioned migration scripts for new entities, automated downgrade fixtures, regression harness in CI. | `web/src/save/*`, `web/scripts/migrate/*`, `Docs/TEST_PLAN.md` updates. | Consumes schema contract from S1. Must expose CLI `yarn migrate --from <v>` for QA bundle. |
| **C1 — Livestock & Festival Content** | Author data tables for animals, seasonal festivals, rare seeds; add narrative beats and audio cues. | `web/content/crops.csv`, `web/content/livestock.csv`, `web/content/festivals.json`, `Docs/AUDIO_PLAN.md`. | Requires event hooks emitted by S1. Delivers placeholder assets early for UX polish. |
| **C2 — Tool Mastery & Progression** | Implement tool proficiency perks, achievement journal entries, unlock requirements. | `web/src/sim/tools/*`, `web/content/perks.json`, `web/src/hud/journal/*`. | Consumes analytics hooks from T1 and exposes new HUD events. |
| **U1 — HUD Expansion** | Calendar, quest log, stamina tips, mailbox UI; responsive layout audit. | `web/src/hud/calendar/*`, `web/src/hud/quests/*`, `web/src/hud/stamina/*`, `web/styles/hud.scss`. | Depends on data feeds from S1/S2; publishes UI telemetry events defined with T1. |
| **U2 — Build Mode Polish** | Placement ghost previews, rotation controls, controller support, accessibility pass (colorblind palettes). | `web/src/hud/build/*`, `web/src/input/*`, `web/styles/build.scss`. | Requires no runtime changes from other bundles; coordinates QA screenshot baselines. |
| **A1 — Audio Integration** | Layer livestock SFX, festival music cues, ambience reacting to weather. | `web/src/audio/*`, `Docs/AUDIO_PLAN.md`. | Subscribes to event bus defined in S1; collaborates with QA on loudness targets. |
| **Q1 — Automated Soak & Visual Tests** | Multi-day crop soak scripts, screenshot diffs for seasons/build mode, controller input smoke tests. | `web/tests/sim/soak.spec.ts`, `web/tests/visual/*`, CI workflows. | Consumes CLI harness from S2 and UI states from U1/U2. Ships baseline artifacts for review. |
| **Q2 — Manual QA & Test Plan Refresh** | Update `Docs/TEST_PLAN.md`, write regression checklists, coordinate playtest scenarios. | `Docs/TEST_PLAN.md`, `Docs/MILESTONES.md`. | Integrates findings from Q1; feeds bug triage board shared across bundles. |
| **T1 — Telemetry & Debug Overlay** | Instrument analytics (day length, resource hoarding), offline buffering, in-game debug HUD. | `web/src/telemetry/*`, `web/src/hud/debug/*`, data pipeline scripts. | Emits event taxonomy consumed by U1, C2; ensures compliance with privacy guidelines. |

#### 4.1.2 Sprint wave alignment
- **Wave Alpha (Weeks 8–9):** Kick off S1, S2, T1, laying contracts. U2 starts with minimal dependencies.
- **Wave Beta (Weeks 9–10):** Parallelize C1, C2, U1 once simulation contracts land; A1 begins integration with mocked events.
- **Wave Gamma (Weeks 10–11):** Q1/Q2 activate when feature branches hit feature complete; soak tests run nightly.
- **Wave Delta (Week 12):** Hardening, bug bashes, release notes, Homestead→Township export prototype validation. Detailed task cards and hand-offs live in `Docs/HOMESTEAD_WAVE_DELTA_TASKS.md` so Delta crews can spin up in parallel immediately after Wave Gamma sign-off.

#### 4.1.3 Exit criteria
- 30 in-game day campaign stable with livestock, weather, festivals, and tool mastery loops.
- All new saves and migrations pass automated harness; downgrade path tested.
- Telemetry dashboard exposes core KPIs for pacing; debug overlay aids live QA triage.
- Homestead→Township export prototype generates starter district blueprint.

### 4.2 Township (Weeks 13–24 · Target: Jan 2026 – May 2026)
**Goal:** Introduce SimCity-style district management with infrastructure, population simulation, and civic services.

#### 4.2.1 Parallel task board
| Bundle | Scope | Key Assets/Files | Cross-Team Contract |
| --- | --- | --- | --- |
| **S3 — District Simulation Core** | Agent jobs/housing simulation, happiness metrics, zoning demand curves, Homestead import adapter. | `web/src/sim/township/agents/*`, `web/src/sim/township/zoning/*`, `web/content/township/import.json`. | Publishes protobuf/JSON schema v1 for district state; consumes Homestead export from S2. |
| **S4 — Utilities & Services Grid** | Power/water propagation, service area heatmaps, outage resolution workflows. | `web/src/sim/township/utilities/*`, `web/src/render/heatmaps/*`, `Docs/DATA_SCHEMAS.md`. | Shares service coverage API with U3 and telemetry hooks with T2. |
| **C3 — Civic Content & Ordinances** | Author building tiers, ordinances, advisor personalities, scripted disasters. | `web/content/township/buildings.csv`, `web/content/ordinances.json`, `Docs/NARRATIVE_BIBLE.md`. | Needs event contracts from S3/S4; delivers placeholder assets to U3 by end of Wave Beta. |
| **U3 — City HUD & Advisors** | District dashboards, advisor dialogs, zoning/build tools UI, accessibility modes. | `web/src/hud/township/*`, `web/src/ui/advisors/*`, `web/styles/township.scss`. | Consumes schemas from S3/S4 and audio cues from A2; emits telemetry defined with T2. |
| **A2 — City Soundscape** | Ambient city loops, advisor VO stingers, disaster SFX. | `web/src/audio/township/*`, `Docs/AUDIO_PLAN.md`. | Subscribes to event bus from S3/S4; coordinates loudness checks with Q3. |
| **Q3 — Systems QA & Scenario Lab** | Automated zoning validator, save/load stress tests, disaster scenario smoke tests. | `web/tests/township/*`, CI workflows, `Docs/TEST_PLAN.md`. | Requires CLI seeds from S3 and build snapshots from U3; delivers nightly reports to all bundles. |
| **T2 — Tooling & Telemetry** | City planner debug overlay, zoning heatmap inspector, analytics pipelines. | `web/src/tools/township/*`, `web/src/telemetry/township/*`, dashboard scripts. | Defines telemetry taxonomy consumed by U3 and C3; ships replay export for Nation converters. |

#### 4.2.2 Sprint wave alignment
- **Wave Alpha (Weeks 13–15):** S3, S4, and T2 establish schemas/contracts; U3 scaffolds UI shells with mocked data.
- **Wave Beta (Weeks 15–18):** C3 and A2 layer in content/audio using S3/S4 contracts; U3 iterates on dashboards with real data feeds.
- **Wave Gamma (Weeks 18–21):** Q3 activates regression suites; disaster scenarios and advisor flows harden.
- **Wave Delta (Weeks 21–24):** Cross-bundle polish, balancing, localization strings, Homestead→Township export verification.

**Exit Criteria:** Player can grow a thriving town of 5k citizens, resolve outages, pass ordinances, and export a governance dossier for Nation phase.

### 4.3 Nation (Weeks 25–40 · Target: May 2026 – Sep 2026)
**Goal:** Scale to a regional strategy layer with territorial control, diplomacy, research, and logistics.

#### 4.3.1 Parallel task board
| Bundle | Scope | Key Assets/Files | Cross-Team Contract |
| --- | --- | --- | --- |
| **S5 — Hex Engine & Simulation Clock** | Hex renderer, fog of war, simultaneous-turn scheduler, supply validation. | `web/src/engine/hex/*`, `web/src/sim/nation/clock.ts`, `web/src/sim/nation/supply/*`. | Provides render/service APIs for U4 and telemetry endpoints for T3. |
| **S6 — Pathfinding & Orders Service** | Multi-modal pathfinding (land/sea/air), queued orders, AI hooks. | `web/src/sim/nation/pathfinding/*`, `web/src/services/orders/*`. | Consumes map data from S5; exposes async job API for AI/QA bundles. |
| **C4 — Tech, Units, & Policies** | Author tech tree, unit roster, policy modifiers, narrative events. | `web/content/nation/tech.csv`, `web/content/nation/units.csv`, `Docs/NARRATIVE_BIBLE.md`. | Needs data schema validation from T3; supplies unlock data to U4. |
| **U4 — Command UI & Research Flows** | Strategic HUD, diplomacy panels, research tree, logistics dashboards. | `web/src/hud/nation/*`, `web/src/ui/diplomacy/*`, `web/styles/nation.scss`. | Depends on APIs from S5/S6 and content IDs from C4; publishes UX telemetry. |
| **A3 — Adaptive Score & State Audio** | Compose dynamic score layers per diplomacy state, war/peace transitions, UI stingers. | `web/src/audio/nation/*`, `Docs/AUDIO_PLAN.md`. | Listens to state events from S5/S6; coordinates mix review with Q4. |
| **Q4 — AI Autoplay & Performance Lab** | Large-map soak tests, AI autoplay harness, perf budget dashboards. | `web/tests/nation/autoplay.spec.ts`, `web/tests/perf/nation/*`, CI workflows. | Requires command API from S6 and telemetry feeds from T3; reports blockers to all bundles. |
| **T3 — Tooling, Converters, & Telemetry** | Township→Nation converter, map editor, analytics dashboards, mod hooks. | `tools/converters/township-to-nation/*`, `web/src/tools/nation/*`, data pipeline scripts. | Provides converter schemas for S5/C4; ensures logs align with live services. |

#### 4.3.2 Sprint wave alignment
- **Wave Alpha (Weeks 25–28):** S5, S6, and T3 define hex engine foundations and converter contracts.
- **Wave Beta (Weeks 28–32):** C4, U4, and A3 integrate on top of stable APIs; diplomacy/research flows iterate.
- **Wave Gamma (Weeks 32–36):** Q4 runs large-map autoplay suites; balancing feedback loops across bundles.
- **Wave Delta (Weeks 36–40):** Feature freeze, converter validation, performance polish, narrative integration.

**Exit Criteria:** Player can unify or ally across a continent, achieve at least one national victory (cultural/industrial/military), and unlock interstellar initiative dossier.

### 4.4 Stellar (Weeks 41–56 · Target: Sep 2026 – Jan 2027)
**Goal:** Deliver the interstellar finale with colony management, fleet logistics, diplomacy, and science victory conditions.

#### 4.4.1 Parallel task board
| Bundle | Scope | Key Assets/Files | Cross-Team Contract |
| --- | --- | --- | --- |
| **S7 — Star Map & Fleet Simulation** | Procedural sector generation, LOS exploration, fleet travel + encounters. | `web/src/engine/starfield/*`, `web/src/sim/stellar/fleets/*`, `web/content/stellar/sector-seeds.json`. | Supplies exploration events to U5 and analytics metrics to T4. |
| **S8 — Colony Management Systems** | Colony instancing, terraforming, morale, production queues, surface maps. | `web/src/sim/stellar/colonies/*`, `web/content/stellar/colonies.csv`, `web/src/render/colonies/*`. | Interfaces with converter outputs from T4; exposes hooks for narrative events from C5. |
| **C5 — Narrative, Factions, & Wonders** | Alien factions, treaties, science victory arcs, wonder projects, legacy codex lore. | `web/content/stellar/factions.json`, `Docs/NARRATIVE_BIBLE.md`, `Docs/LORE_TIMELINE.md`. | Needs event triggers from S7/S8; provides UI copy/audio cues to U5/A4. |
| **U5 — Galactic UI & Finale Experience** | Galactic council UI, treaty flows, victory timeline, credits, NG+ setup. | `web/src/hud/stellar/*`, `web/src/ui/finale/*`, `web/styles/stellar.scss`. | Consumes data from S7/S8/C5; publishes telemetry streams defined with T4. |
| **A4 — Interstellar Audio & VO** | Dynamic score layers, alien diplomacy soundscapes, finale crescendo. | `web/src/audio/stellar/*`, `Docs/AUDIO_PLAN.md`. | Subscribes to narrative beats from C5 and state events from S7/S8; coordinates mix reviews with Q5. |
| **Q5 — Full Saga Regression & Localization QA** | Multi-phase save promotion tests, localization verification, endgame soak. | `web/tests/stellar/*`, `web/tests/localization/*`, CI nightly matrix. | Requires converters from T4 and UI snapshots from U5; files defects into shared backlog. |
| **T4 — Converters, Telemetry, & Ops** | Nation→Stellar converter, NG+ seed generator, analytics dashboards, release ops scripts. | `tools/converters/nation-to-stellar/*`, `web/src/telemetry/stellar/*`, release pipelines. | Defines data contracts for S7/S8/C5; ensures compliance with privacy/localization guidelines. |

#### 4.4.2 Sprint wave alignment
- **Wave Alpha (Weeks 41–45):** S7, S8, and T4 lock simulation/converter contracts; U5 scaffolds finale UI flows.
- **Wave Beta (Weeks 45–49):** C5 and A4 integrate narrative/audio; U5 iterates with live data; NG+ hooks stabilized.
- **Wave Gamma (Weeks 49–53):** Q5 runs saga regression, localization sweeps, telemetry validation.
- **Wave Delta (Weeks 53–56):** Release prep, marketing tie-ins, final playtests, certification sign-off.

**Exit Criteria:** Player can achieve multiple victory types, see legacy summaries tracing all four phases, and restart a new saga with NG+ modifiers.

## 5. Cross-Cutting Workstreams

### 5.1 Parallel task board — Cross-cutting workstreams
| Bundle | Scope | Key Assets/Files | Cross-Team Contract |
| --- | --- | --- | --- |
| **X1 — Platform & Build Engineering** | Maintain mono-repo, CI scripts, nightly save replays, performance budgets. | `tools/build/*`, `.github/workflows/*`, `Docs/OPS_RUNBOOK.md`. | Provides stable build artifacts for every bundle; enforces branch protection + release cadence. |
| **X2 — Data Tooling & Validation** | CLI validators, localization extractors, telemetry log replay utilities. | `tools/cli/*`, `tools/validation/*`, `Docs/DATA_SCHEMAS.md`. | Supplies lint/validation contracts consumed by content bundles (C1–C5). |
| **X3 — Audio & Narrative Operations** | Adaptive soundtrack planning, advisor VO pipeline, seasonal content calendar. | `Docs/AUDIO_PLAN.md`, `Docs/NARRATIVE_BIBLE.md`, `content/audio/*`. | Synchronizes with phase-specific audio bundles (A1–A4) and content teams for asset delivery. |
| **X4 — QA Governance & Release Management** | Test plan updates, bug triage SLAs, crash reporting, external playtest coordination. | `Docs/TEST_PLAN.md`, `Docs/RELEASE_CHECKLIST.md`, telemetry dashboards. | Consumes automation from Q1–Q5 and telemetry from T1–T4; reports status weekly to leadership. |

## 6. Resource & Timeline Overview
- **Calendar framing:** With work kicking off in December 2025, the roadmap runs through January 2027, assuming steady velocity.
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
*Last updated: 2025-11-09*
