# Farm-to-Stars Development Playbook

> Single source of truth for coding agents completing the Farm-to-Stars saga from the current vertical slice through the Stellar finale. Cross-reference the linked docs for authoritative specs and keep this playbook updated at every milestone review.

## 1. Baseline References & Ownership
- **Creative intent:** PRD (§1–§7) for objectives, quality bars, KPIs. GDD (§1–§5) for pillars, core mechanics, UX expectations.
- **Technical contracts:** TECH_SPEC for engine stack, deterministic sim loop, module responsibilities, and performance constraints. DATA_SCHEMAS for content file formats and validation rules.
- **Production roadmap:** BUILD_GUIDE (§4) for phased task boards and exit criteria. MILESTONES for high-level schedule status. HOMESTEAD_* docs for Wave Delta hand-offs.
- **Process governance:** CONTRIBUTING_FOR_AGENT for change control, performance expectations, and testing obligations. TEST_PLAN, BUG_TRIAGE, PLAYTEST_* for QA cadence.
- **Asset & narrative bibles:** ART_BIBLE, AUDIO_PLAN, PRD, NARRATIVE_BIBLE (when available) for style, sound, and storytelling requirements.

Assign a maintainer per document and confirm owners before kicking off each phase. Escalate spec deltas in weekly leads syncs.

## 2. Engineering Workflow
1. **Branching:** One feature/fix per branch and PR. Follow semantic prefixes (`feat/`, `fix/`, `chore/`). No file moves/renames without explicit approval.
2. **TypeScript standards:** Keep Phaser configuration aligned with TECH_SPEC defaults (`pixelArt: true`, `antialias: false`, `camera.roundPixels = true`). Enforce strict TypeScript flags in `tsconfig` and avoid implicit `any`.
3. **Simulation loop:** Maintain fixed-step simulation (10–20 Hz) with accumulator cap. All systems hook through `world.ts::tick` and must be deterministic (no `Math.random` without seeded RNG).
4. **Data-driven systems:** Add gameplay/content through JSON/CSV tables (resources, recipes, buildings, etc.). Update DATA_SCHEMAS and validators when adding fields. Prohibit magic numbers in code—read from data tables.
5. **Saves & migrations:** Increment `schemaVersion` when schema changes. Ship forward and backward migrations plus downgrade fixtures. Ensure CLI `yarn migrate --from <v>` remains green in CI.
6. **Testing:** Extend unit/integration coverage with every feature. Minimum obligations: Jest/Vitest unit tests for systems, Playwright smoke tests for user journeys, soak tests for simulation longevity.
7. **Performance budgets:** Target ≤1 KB allocations per frame; profile mobile scenarios each milestone. Use Phaser debugging overlays and telemetry dashboards to catch regressions.
8. **Accessibility & UX:** Integrate colorblind palettes, controller support, scalable UI, and audio gating per PRD/BUILD_GUIDE requirements. Confirm HUD readability at all zoom levels.
9. **PWA discipline:** Keep `vite-plugin-pwa` configuration up to date, run Lighthouse audits each milestone, and test install/update/offline paths on desktop + mobile.
10. **Documentation:** Update relevant docs (PRD, TECH_SPEC, DATA_SCHEMAS, TEST_PLAN) alongside code. Archive superseded plans in `/Archive` with date stamps.

## 3. Environment & Tooling Setup
- Validate npm registry access per CONTRIBUTING_FOR_AGENT (registry check, cache purge, proxy verification).
- Install dependencies from `web/`: `npm install` (or `yarn`). Add lockfile changes to commits.
- Run baseline checks before development: `npm run lint`, `npm run test`, `npm run test:playwright` (or equivalent), `npm run build`.
- Configure local storage debugging via browser devtools for IndexedDB (`idb-keyval`).
- Use provided CLI scripts for migrations, telemetry replay, and data validation (`tools/cli` when implemented). Document any new scripts in README/Docs.

## 4. Phase Execution Plan
Each phase follows Wave Alpha → Beta → Gamma → Delta cadence. Respect bundle contracts before parallelizing. Maintain feature flags for in-progress systems.

### 4.1 Homestead Completion (Weeks 8–12)
**Goal:** Finalize farm-life loop with livestock, weather, festivals, tool mastery, and converter prototype.

- **Simulation (S1):** Implement livestock lifecycle, dynamic weather, NPC scheduling, background job queue. Publish event taxonomy for HUD/audio.
- **Saves & migrations (S2):** Add schema migrations for new entities, downgrade fixtures, CLI harness.
- **Content (C1/C2):** Ship livestock, festival, tool mastery data tables and narrative beats. Coordinate with audio for placeholders.
- **UI/UX (U1/U2):** Expand HUD (calendar, quests, stamina tips, mailbox) and polish build mode (ghost previews, rotation, controller support, accessibility palettes).
- **Audio (A1):** Integrate livestock/festival ambience reacting to weather/events.
- **Telemetry (T1):** Instrument pacing analytics, offline buffering, debug HUD overlay.
- **QA (Q1/Q2):** Automate soak/visual/controller tests; refresh TEST_PLAN and playtest scripts.
- **Exit criteria:** 30-day campaign stability, migrations validated, telemetry dashboards live, Homestead→Township export prototype functional.

### 4.2 Township Ramp (Weeks 13–24)
**Goal:** Launch city-building district management with utilities, advisors, and civic content.

- **Simulation (S3/S4):** Build district agent simulation, zoning demand, utilities propagation, heatmaps, outage workflows.
- **Content (C3):** Author buildings, ordinances, advisor personalities, disasters.
- **UI/Audio (U3/A2):** Implement city HUD, advisor dialogs, zoning/build tools, accessibility modes; layer ambient city audio + VO.
- **Tooling & Telemetry (T2):** Deliver planner debug overlay, heatmap inspector, analytics pipeline, replay export.
- **QA (Q3):** Automated zoning validator, save/load stress tests, disaster smoke tests.
- **Exit criteria:** Town of 5k citizens sustainable, outages resolvable, ordinances passable, governance dossier export ready.

### 4.3 Nation Expansion (Weeks 25–40)
**Goal:** Introduce strategic hex-layer with diplomacy, logistics, and national victories.

- **Simulation (S5/S6):** Build hex renderer, fog of war, turn scheduler, multi-modal pathfinding, orders service with AI hooks.
- **Content (C4):** Craft tech tree, unit roster, policies, narrative events.
- **UI/Audio (U4/A3):** Develop command HUD, diplomacy panels, research flows, dynamic score reacting to diplomacy state.
- **Tooling (T3):** Township→Nation converter, map editor, analytics dashboards, mod hooks.
- **QA (Q4):** AI autoplay harness, large-map soak, performance dashboards.
- **Exit criteria:** National victory achievable, diplomacy loop stable, interstellar dossier unlocked.

### 4.4 Stellar Finale (Weeks 41–56)
**Goal:** Deliver interstellar colony and fleet management with NG+ setup.

- **Simulation (S7/S8):** Procedural star map, LOS, fleet encounters, colony management (terraforming, morale, production).
- **Content (C5):** Author factions, treaties, wonders, finale narrative.
- **UI/Audio (U5/A4):** Galactic council UI, treaty flows, victory timeline, adaptive score and VO.
- **Tooling (T4):** Nation→Stellar converter, NG+ seed generator, telemetry dashboards, release ops scripts.
- **QA (Q5):** Multi-phase save promotion, localization verification, endgame soak tests.
- **Exit criteria:** Multiple victory types, legacy summaries across phases, NG+ loop functional.

## 5. Cross-Cutting Workstreams
- **X1 — Platform & Build Engineering:** Maintain CI workflows, nightly replays, performance budgets, release packaging. Ensure branch protections and artifact distribution.
- **X2 — Data Tooling & Validation:** CLI validators, localization extractors, telemetry log replays. Enforce schema linting in CI before merges.
- **X3 — Audio & Narrative Ops:** Coordinate adaptive soundtrack, VO pipeline, seasonal content calendar, asset delivery schedules.
- **X4 — QA Governance & Release Management:** Test plan updates, bug triage SLAs, crash reporting, external playtests, telemetry reporting.

## 6. Quality Assurance Pipeline
1. **Automation:** Keep Jest/Vitest, Playwright, soak, and performance suites green before merge. Expand coverage with new systems.
2. **Manual QA:** Update regression checklists, exploratory charters, and playtest scenarios per phase. Capture telemetry for pacing insights.
3. **Bug triage:** Maintain triage board with severity SLAs. Escalate blockers daily during Wave Gamma/Delta.
4. **Playtest cadence:** Schedule moderated sessions at each milestone, using PLAYTEST_SCENARIOS for scripts and success metrics.
5. **Release gates:** Require Lighthouse reports, save migration sign-offs, telemetry dashboards, and audio mix reviews before RC tags.

## 7. Delivery Checklist
- Phase-specific release notes, changelog entries, and marketing beats drafted.
- Updated docs: PRD, GDD, TECH_SPEC, DATA_SCHEMAS, TEST_PLAN, AUDIO_PLAN as scope evolves.
- Service worker version bumped; smoke test offline/install flows.
- Asset credits appended to CREDITS.md when new art/audio ships.
- Archive deprecated plans and link replacements.

## 8. Communication Rituals
- **Daily standup:** Cross-bundle sync with focus on contract dependencies and blockers.
- **Weekly leads review:** Verify roadmap alignment, update risk register, plan playtests.
- **Milestone retros:** Capture learnings, adjust BUILD_GUIDE timelines, refresh this playbook.
- **Documentation sync:** Ensure all agents acknowledge updates; highlight breaking changes in #announcements.

Maintain this playbook as a living artifact. If conflicts arise between docs, defer to the most recent approved spec and document the resolution.
