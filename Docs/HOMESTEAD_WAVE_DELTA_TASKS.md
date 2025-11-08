# Wave Delta — Homestead Hardening & Playtest Prep

Wave Delta is the final sprint cluster before Homestead playtests. The bundles below are structured so crews can run in parallel once Wave Gamma sign-off is complete. Each bundle lists its Definition of Ready, parallel task cards, integration hand-offs, and recommended sync cadences.

## Parallel Lanes Overview

| Lane | Focus | Dependencies Cleared | Primary Outputs |
| --- | --- | --- | --- |
| D1 | Bug Bash & Stabilization | Wave Beta features merged, Q1 automation green | RC bug fixes, localization polish, nightly RC builds |
| D2 | Performance & Stability Pass | RC branch from D1, telemetry dashboards online | Profiling reports, optimized builds, updated perf thresholds |
| D3 | Playtest Ops & Packaging | RC build, perf targets signed off, playtest scenarios from Q2 | Playtest build, onboarding packet, telemetry routing |
| D4 | Homestead→Township Export Prototype | Homestead progression complete, schema v6 stable | Export snapshot tooling, UI trigger, documentation |

> **Agent pods:** Each lane is owned by a dedicated Wave Delta pod—Delta-Bash, Delta-Perf, Delta-Play, and Delta-Bridge. Their charters, automation hooks, and sync cadences are captured in [`Docs/HOMESTEAD_WAVE_DELTA_AGENTS.md`](./HOMESTEAD_WAVE_DELTA_AGENTS.md) so crews can spin up in parallel without waiting for further direction.

## D1 — Bug Bash & Stabilization

- **Definition of Ready**
  - RC branch cut from Wave Beta completion and merged with QA hotfixes.
  - Q1 automation suite passing on nightly builds.
  - Triage board seeded with Q1/Q2 issues labeled by severity.
- **Parallel Task Cards**
  1. Schedule multi-discipline bug bash (design, engineering, QA, audio) and capture findings in shared tracker (`jira/HOMESTEAD-DELTA`).
  2. Triage and assign priority fixes across disciplines, ensuring repro steps and validation notes accompany each issue.
  3. Resolve localization, VO timing, HUD polish, and accessibility defects; request QA verification on completion.
  4. Maintain release candidate branch with nightly cherry-picks, smoke tests, and change log updates.
- **Integration Hand-Off**
  - Provide signed-off bug bash summary, updated change log, and RC build identifiers to D2 and D3 leads.

## D2 — Performance & Stability Pass

- **Definition of Ready**
  - Receives RC branch and change log from D1.
  - Telemetry dashboards accessible with baseline thresholds.
  - Profiling captures from Q1 soak tests archived for comparison.
- **Parallel Task Cards**
  1. Profile low-end device build via `npm run profile:homestead`, capturing frame-time, CPU/GPU, and memory traces.
  2. Optimize hot simulation loops (`web/src/world.ts`, `web/src/sim/**`), HUD render paths, and audio mixing hotspots flagged by telemetry.
  3. Run long-session benchmarks validating memory/GC behavior; log results in `Docs/TEST_PLAN.md` performance appendix.
  4. Re-run soak, migration, and telemetry validation suites post-optimization to catch regressions; coordinate with QA for sign-off.
- **Integration Hand-Off**
  - Publish performance report, updated telemetry alert thresholds, and optimized build hashes to D3.

## D3 — Playtest Operations & Packaging

- **Definition of Ready**
  - Receives RC build and perf report from D1/D2.
  - Q2 playtest scenarios finalized with acceptance criteria.
  - CDN credentials and survey tooling access confirmed.
- **Parallel Task Cards**
  1. Produce hosted playtest build using `web/scripts/release/buildPlaytest.mjs`, upload to CDN, and verify checksum.
  2. Draft player onboarding packet (`Docs/PLAYTEST_BRIEF.md`) covering controls, feature overview, known issues, feedback channels.
  3. Configure telemetry flags, anonymized log routing, and opt-in prompts in HUD; verify with legal/compliance requirements.
  4. Schedule moderated sessions and async survey cadence; maintain participant roster and consent records in shared tracker.
- **Integration Hand-Off**
  - Deliver playtest build URL, onboarding packet, telemetry dashboard access, and session schedule to stakeholders.

## D4 — Homestead→Township Export Prototype

- **Definition of Ready**
  - Homestead progression milestones signed off and schema v6 migrations finalized.
  - Township import spec (`Docs/BUILD_GUIDE.md`) reviewed and approved.
  - Feature flag infrastructure ready for internal-only exposure.
- **Parallel Task Cards**
  1. Implement export snapshot generator (`web/src/sim/export/homesteadToTownship.ts`) with deterministic seeding and unit tests.
  2. Validate payload against Township import schema (`web/content/township/import.json`); collaborate with Township leads for edge cases.
  3. Surface gated export trigger in build menu UI with telemetry instrumentation for usage tracking.
  4. Document export workflow, migration interplay, and rollback procedure in `Docs/DATA_SCHEMAS.md` and `Docs/TEST_PLAN.md` appendices.
- **Integration Hand-Off**
  - Share export payload samples, validation checklist, and implementation notes with Township phase planning team.

## Coordination & Cadence

- Hold a 15-minute daily sync with leads from D1–D4 to flag blockers and negotiate hotfix merges.
- Keep the RC branch frozen except for approved hotfixes; all other work lands behind flags or in parallel branches.
- QA attends D1/D2 stand-ups to maintain visibility into fixes and performance risk.
- Update this doc at the end of each sprint with status notes and carry-over tasks.
