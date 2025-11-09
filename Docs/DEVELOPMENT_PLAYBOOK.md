# Farm-to-Stars Development Playbook

> Single source of truth for coding agents completing the Farm-to-Stars saga from the current vertical slice through the Stellar finale. Cross-reference the linked docs for authoritative specs and keep this playbook updated at every milestone review.

## Table of Contents
1. [Baseline References & Ownership](#1-baseline-references--ownership)
2. [Engineering Workflow](#2-engineering-workflow)
3. [Environment & Tooling Setup](#3-environment--tooling-setup)
4. [Phase Execution Plan](#4-phase-execution-plan)
5. [Cross-Cutting Workstreams](#5-cross-cutting-workstreams)
6. [Quality Assurance Pipeline](#6-quality-assurance-pipeline)
7. [Delivery Checklist](#7-delivery-checklist)
8. [Communication Rituals](#8-communication-rituals)
9. [Risk Management & Escalation](#9-risk-management--escalation)
10. [Appendix: Reference Checklists](#appendix-reference-checklists)

## 1. Baseline References & Ownership
| Area | Primary Doc(s) | Mandatory Owner | Backup Owner | Update Cadence |
| --- | --- | --- | --- | --- |
| Vision & Pillars | PRD (§1–§7), GDD (§1–§5) | Creative Director | Lead Narrative Designer | Weekly or on major narrative change |
| Engineering Contracts | TECH_SPEC, DATA_SCHEMAS | Lead Engineer | Systems Architect | After every merged schema/engine change |
| Production Roadmap | BUILD_GUIDE (§4), MILESTONES, HOMESTEAD_* | Producer | Engineering Producer | Reviewed in weekly leads sync |
| Process & QA | CONTRIBUTING_FOR_AGENT, TEST_PLAN, BUG_TRIAGE, PLAYTEST_* | QA Lead | Engineering Producer | Before each Wave Beta hand-off |
| Assets & Narrative | ART_BIBLE, AUDIO_PLAN, PRD appendices, NARRATIVE_BIBLE (pending) | Art Lead | Audio Lead | Sync with each milestone asset drop |

**Owner duties**
1. Confirm doc accuracy before any phase gate review.
2. Announce updates in #announcements with TL;DR and required actions.
3. Capture change log entries in the doc footer (include date, summary, and author).
4. Archive superseded versions to `/Archive/<DocName>_<YYYY-MM-DD>.md`.

## 2. Engineering Workflow
The web client lives in `web/` (Vite + Phaser). Follow these ground rules each sprint:

1. **Branching & PR discipline**
   - Branch naming: `<type>/<scope>-<short-description>` where type ∈ {`feat`, `fix`, `chore`, `perf`, `refactor`, `docs`}.
   - Open exactly one PR per branch. Link Jira/Linear ticket in the PR description and in commit bodies (`Refs: <ticket>`).
   - Mandatory reviewers: owning engineer + QA. Require green CI before requesting review.
   - Squash merge unless migration scripts span multiple authors (then use merge commit).

2. **Commit standards**
   - Conventional commits (`feat:`, `fix:`, etc.). No WIP commits after review request.
   - Include testing evidence in PR description (commands + results).
   - Attach profiling data when touching simulation/performance-critical code.

3. **TypeScript & Phaser configuration**
   - Enforce strict flags: `"strict": true`, `"noImplicitAny": true`, `"useUnknownInCatchVariables": true`.
   - Keep Phaser config consistent with TECH_SPEC defaults (`pixelArt: true`, `antialias: false`, `roundPixels: true`, `physics.arcade.fixedStep = true`).
   - Centralize config in `web/src/config/phaserConfig.ts`; changes require TECH_SPEC updates + regression test.

4. **Simulation loop**
   - All systems register via `web/src/world/world.ts::tick` and must be deterministic. Use `rng.ts` helper seeded from save file.
   - Integration pattern: `SystemNameSystem implements SimulationSystem`, exported from `web/src/world/systems/<systemName>.ts`.
   - Fixed timestep 100 ms (10 Hz) unless TECH_SPEC updates. Clamp accumulator to prevent spiral of death.

5. **Data-driven implementation**
   - Store content in `web/src/data/*.json`. Validate via `npm run validate:data` (add script if missing).
   - When adding new JSON fields, update `Docs/DATA_SCHEMAS.md`, create AJV schema, and expand tests in `web/src/data/__tests__/*`.
   - Prohibit inline literals for tunables; pull from `TuningRepository` or relevant data module.

6. **Saves & migrations**
   - Schema version file: `web/src/save/schemaVersion.ts`. Increment on breaking change.
   - Add migration in `web/src/save/migrations/v<from>_to_v<to>.ts`; include downgrade fixtures in `web/src/save/__fixtures__/`.
   - CI command `npm run migrate -- --from=<previous>` must be added/updated.

7. **Testing obligations**
   - Unit tests (Vitest) for each new system/service with ≥90% statement coverage. Configure coverage thresholds in `vitest.config.ts`.
   - Integration/UI tests (Playwright) covering primary flows. Tag tests by phase (`@homestead`, `@township`, etc.).
   - Long-running soak test script `npm run test:soak` (4-hour simulated time) must pass nightly.

8. **Performance budgets**
   - Maintain ≤1 KB allocations per frame (Chrome performance profile). Document regression analysis in PR.
   - Keep frame time ≤16 ms on target hardware defined in TECH_SPEC. Use `npm run profile:ci` to capture flamegraphs.

9. **Accessibility & UX**
   - Follow color contrast ≥4.5:1. Provide remapped inputs for controller + keyboard.
   - All HUD widgets must scale between 0.75× and 1.5× without layout breakage.
   - Run `npm run test:a11y` (axe-core) before merging UI changes.

10. **PWA discipline**
   - Service worker located at `web/src/service-worker.ts`. Update cache version per release.
   - Validate install/offline flows on Chrome + Safari using device lab checklist.

11. **Documentation updates**
   - Each substantive change requires updating relevant Docs.*.md files and README sections.
   - Append changelog entry to `Docs/BUILD_GUIDE.md` phase table.

## 3. Environment & Tooling Setup
| Step | Command / Action | Expected Output |
| --- | --- | --- |
| 1 | `nvm use` (Node 20.x LTS) | Shell reports `Now using Node v20.x.x` |
| 2 | `npm install -g pnpm@9` (if pnpm workflow preferred) | pnpm version confirmation |
| 3 | `cd web && npm install` | Lockfile updated, no audit warnings > severity low |
| 4 | `npm run lint` | ESLint passes with zero warnings |
| 5 | `npm run test` | Vitest suite green |
| 6 | `npm run test:playwright` | UI regression suite green |
| 7 | `npm run build` | Production bundle generated without size regression |
| 8 | `npm run validate:data` | All schema validations pass |
| 9 | `npm run migrate -- --dry-run` | Reports `All migrations successful` |

Additional tooling requirements:
- Install Playwright browsers (`npx playwright install chromium firefox webkit`).
- Configure VSCode workspace with recommended extensions (`.vscode/extensions.json`).
- Enable Prettier-on-save; follow `.prettierrc`.
- Configure IndexedDB inspector in devtools for `idb-keyval` store.

## 4. Phase Execution Plan
Each phase follows Wave Alpha → Beta → Gamma → Delta cadence. Respect bundle contracts before parallelizing. Maintain feature flags for in-progress systems. Every bullet below must have: implemented feature, associated tests, telemetry instrumentation, documentation updates, and regression verification.

### 4.1 Homestead Completion (Weeks 8–12)
**Goal:** Finalize farm-life loop with livestock, weather, festivals, tool mastery, and converter prototype.

| Track | Implementation Tasks | Data Authoring | Testing & Telemetry | Done Definition |
| --- | --- | --- | --- | --- |
| Simulation (S1) | Livestock lifecycle service, weather controller, NPC scheduler, background job queue. Wire into `world.ts::tick`. | Populate `livestock.json`, `weatherPatterns.json`, `npcSchedules.json`. | Unit tests for lifecycle + weather RNG; Playwright festival scenario; soak test covering 30 in-game days. | No fatal logs, deterministic replay, telemetry logs populated with events table. |
| Saves & Migrations (S2) | Version bump `schemaVersion`, migrations for livestock/weather/festival data, CLI harness `npm run migrate`. | Downgrade fixtures `v3_to_v2`. | Migration test suite added to CI, manual restore test. | Save/load 5 legacy saves without data loss. |
| Content (C1/C2) | Tool mastery progression data, festival scripts, narrative beats. Hook to quest system. | Update `Docs/NARRATIVE_BIBLE` once available. | Localization placeholders validated. | Festival event triggers correct VO stub. |
| UI/UX (U1/U2) | HUD calendar, quests, stamina tips, mailbox, build mode polish (ghost preview, rotation, controller support). | UI copy in `strings.json`. | Axe accessibility test, controller remap verification. | UI scales 0.75×–1.5× without clipping. |
| Audio (A1) | Livestock ambience, weather-reactive loops, event stingers. | Update `AUDIO_PLAN` cues. | Audio routing smoke test `npm run test:audio` (custom script). | Audio mix balanced, volume sliders persistent. |
| Telemetry (T1) | Instrument pacing analytics, offline buffering, debug HUD overlay toggled via dev console. | Schema updates in telemetry config. | Validate events in staging dashboard. | No missing event errors in logs. |
| QA (Q1/Q2) | Refresh TEST_PLAN sections, update PLAYTEST_SCENARIOS, automate controller smoke tests. | n/a | Weekly bug triage with severity SLA. | Zero Sev-1 bugs open at Wave Delta exit. |

### 4.2 Township Ramp (Weeks 13–24)
**Goal:** Launch city-building district management with utilities, advisors, and civic content.

| Track | Implementation Tasks | Data Authoring | Testing & Telemetry | Done Definition |
| --- | --- | --- | --- | --- |
| Simulation (S3/S4) | District agent AI, zoning demand curves, utilities propagation, outage workflow. Heatmaps in renderer. | `districts.json`, `utilities.json`, `eventsTownship.json`. | Deterministic AI unit tests, Playwright zoning scenario, soak test with 10 districts. | Outage resolves in ≤5 simulated minutes, no NaN states. |
| Content (C3) | Buildings, ordinances, advisor personalities, disaster scripts. | Update `Docs/DATA_SCHEMAS` for ordinance schema. | Localization placeholders validated. | Advisors deliver correct VO triggers. |
| UI/Audio (U3/A2) | City HUD, advisor dialogs, zoning/build tools, accessibility modes. | UI copy & audio cues update. | Axe + screen reader pass, audio regression. | UI supports keyboard/controller parity. |
| Tooling & Telemetry (T2) | Planner debug overlay, heatmap inspector, analytics pipeline for zoning KPIs, replay export CLI. | Document CLI usage in `Docs/BUILD_GUIDE`. | Replay integration test, telemetry ingestion test. | Planner overlay toggle persists across sessions. |
| QA (Q3) | Automated zoning validator, save/load stress tests, disaster smoke tests. | n/a | Add to nightly pipeline. | 48-hour soak run passes with ≤5% CPU variance. |

### 4.3 Nation Expansion (Weeks 25–40)
**Goal:** Introduce strategic hex-layer with diplomacy, logistics, and national victories.

| Track | Implementation Tasks | Data Authoring | Testing & Telemetry | Done Definition |
| --- | --- | --- | --- | --- |
| Simulation (S5/S6) | Hex renderer, fog of war service, turn scheduler, multi-modal pathfinding, orders service with AI hooks. | `nationHexMaps.json`, `units.json`, `orders.json`. | Pathfinding unit tests, fog-of-war visual regression, autoplay AI harness. | 200-turn autoplay stable; pathfinding CPU ≤8 ms. |
| Content (C4) | Tech tree, unit roster, policies, narrative events. | Update schema docs + localization. | Balance simulator runs (Monte Carlo). | Player achieves victory in ≤6 hours average. |
| UI/Audio (U4/A3) | Command HUD, diplomacy panels, research flows, dynamic score reacting to diplomacy state. | Strings + score cues updates. | UI automation for diplomacy, audio snapshot tests. | UI accessible, audio transitions smooth. |
| Tooling (T3) | Township→Nation converter, map editor, analytics dashboards, mod hooks (documented API). | Document mod schema. | CLI integration tests, dashboard smoke tests. | Converter generates nation save with <5% data drift. |
| QA (Q4) | AI autoplay harness, large-map soak, performance dashboards. | n/a | Nightly autoplay 500 turns, telemetry monitors. | No Sev-1 bugs at Wave Delta. |

### 4.4 Stellar Finale (Weeks 41–56)
**Goal:** Deliver interstellar colony and fleet management with NG+ setup.

| Track | Implementation Tasks | Data Authoring | Testing & Telemetry | Done Definition |
| --- | --- | --- | --- | --- |
| Simulation (S7/S8) | Procedural star map generator, LOS, fleet encounters, colony management loops. | `stellarSystems.json`, `fleetLoadouts.json`. | Procedural seed determinism tests, encounter regression tests. | 100 seeds reproduce identical maps; fleet combat under 12 ms/frame. |
| Content (C5) | Factions, treaties, wonders, finale narrative. | Update narrative docs + localization. | Branch coverage for narrative, QA sign-off for endings. | Multiple endings accessible; NG+ hook unlocked. |
| UI/Audio (U5/A4) | Galactic council UI, treaty flows, victory timeline, adaptive score/VO. | Strings, VO cues. | Accessibility + audio snapshots. | UI supports 4K + mobile; VO triggers correct languages. |
| Tooling (T4) | Nation→Stellar converter, NG+ seed generator, telemetry dashboards, release ops scripts. | Document CLI commands. | Telemetry pipeline validated, release scripts dry-run. | NG+ transition completes without manual intervention. |
| QA (Q5) | Multi-phase save promotion, localization verification, endgame soak tests. | n/a | Multi-locale UI tests, 72-hour soak. | Zero localization blockers, soak stable. |

## 5. Cross-Cutting Workstreams
- **X1 — Platform & Build Engineering:** Maintain GitHub Actions workflows, nightly replays, performance budgets, release packaging. Enforce branch protection rules (required reviews, status checks). Own release scripts in `web/scripts/`.
- **X2 — Data Tooling & Validation:** Build CLI validators (`tools/cli`). Add localization extractors, telemetry log replay tools. Ensure CI fails on schema drift.
- **X3 — Audio & Narrative Ops:** Manage adaptive soundtrack cues, VO pipeline, seasonal content calendar, asset delivery schedules. Keep `Docs/AUDIO_PLAN.md` and narrative docs in sync.
- **X4 — QA Governance & Release Management:** Maintain test plan, bug triage SLAs (Sev-1: 24h, Sev-2: 3d, Sev-3: 1 sprint), crash reporting, external playtests, telemetry reporting. Own release retro documentation.

## 6. Quality Assurance Pipeline
1. **Automation**
   - Vitest + coverage thresholds enforced in CI (`npm run test -- --coverage`).
   - Playwright suites separated by tag; smoke (`@smoke`) must run on every PR, full regression nightly.
   - Performance regression detection via `npm run profile:ci` + automated diff.
2. **Manual QA**
   - Maintain regression checklist per phase (Homestead, Township, Nation, Stellar). Store in `Docs/TEST_PLAN.md`.
   - Playtest scenarios tracked in `Docs/PLAYTEST_SCENARIOS.md`; update after each moderated session.
3. **Bug triage**
   - Daily triage board review during Wave Gamma/Delta. Assign DRI, set fix-by date.
   - Document risk mitigations in `Docs/BUG_TRIAGE.md`.
4. **Playtest cadence**
   - Schedule: Wave Alpha (internal), Wave Beta (friends & family), Wave Gamma (external closed), Wave Delta (marketing preview). Capture metrics in telemetry dashboard.
5. **Release gates**
   - Lighthouse ≥90 Performance, ≥90 Accessibility.
   - Save migration sign-off from QA + Engineering.
   - Telemetry dashboards verified live for latest build.
   - Audio mix reviewed by Audio Lead.

## 7. Delivery Checklist
- Phase-specific release notes, changelog entries, and marketing beats drafted and stored in `/Docs/releases/<phase>.md`.
- Updated docs: PRD, GDD, TECH_SPEC, DATA_SCHEMAS, TEST_PLAN, AUDIO_PLAN, plus any newly introduced docs.
- Service worker version bumped; offline/install flows smoke tested on Chrome desktop, Chrome Android, Safari iOS.
- Asset credits appended to `Docs/CREDITS.md` when new art/audio ships.
- Archive deprecated plans with links to replacements in `/Archive`.
- Verify localization strings exported/imported without diff noise (`npm run i18n:extract`, `npm run i18n:compile`).

## 8. Communication Rituals
- **Daily standup (15 min):** Cross-bundle sync focusing on contract dependencies, blockers, and telemetry anomalies.
- **Weekly leads review:** Verify roadmap alignment, refresh risk register, schedule upcoming playtests, review metrics.
- **Milestone retros:** Capture learnings, adjust BUILD_GUIDE timelines, refresh this playbook with action items.
- **Documentation sync:** Ensure all agents acknowledge updates; highlight breaking changes in #announcements with checkboxes requiring emoji acknowledgement.
- **Incident response huddle:** Triggered for Sev-1 bugs or CI downtime. Document timeline in `Docs/BUG_TRIAGE.md`.

## 9. Risk Management & Escalation
- Maintain risk register in `Docs/BUILD_GUIDE.md` (probability, impact, mitigation, owner).
- Escalation path: owning engineer → Lead Engineer → Producer → Studio Director.
- For schedule slips >2 days, file risk ticket and update MILESTONES doc.
- Track external dependencies (VO actors, localization vendors) with contract dates and fallback plans.
- Use feature flags (`web/src/features/*.ts`) to guard unstable systems; default to disabled in production builds.

## Appendix: Reference Checklists

**Pre-PR Checklist**
1. Branch up to date with `main` (no rebase conflicts).
2. All tests + linters + build succeed locally (commands in Section 3).
3. Added/updated unit tests, integration tests, telemetry instrumentation, docs.
4. Verified accessibility + localization impact.
5. Captured screenshots/video for UI changes and attached to PR.

**Post-merge Checklist**
1. Confirm CI pipeline succeeded on `main`.
2. Monitor telemetry dashboards for regressions.
3. Update release notes / changelog entry.
4. Notify stakeholders of feature availability.

Maintain this playbook as a living artifact. If conflicts arise between docs, defer to the most recent approved spec and document the resolution.
