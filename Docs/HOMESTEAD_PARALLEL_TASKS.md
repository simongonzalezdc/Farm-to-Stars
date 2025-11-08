# Homestead Parallel Task Matrix

This matrix expands the Wave Alpha/Alpha+ alignment from `Docs/BUILD_GUIDE.md` into concrete, parallelizable task cards.  Each bundle lists a "Definition of Ready" to confirm prerequisites, a backlog of scoped tasks, and clear integration hand-offs so the crews can work concurrently without blocking.

## Wave Alpha · Kickoff Bundles

### S1 — Simulation Extensions
- **Definition of Ready:** Schema v6 draft reviewed, livestock placeholders in content repo, event taxonomy stub in telemetry package.
- **Task Cards:**
  1. Implement livestock lifecycle state machine (`web/src/sim/livestock/lifecycle.ts`) with feed/growth/produce timers and unit tests.
  2. Add dynamic weather event scheduler (`web/src/sim/weather/events.ts`) emitting start/stop events and persistence hooks.
  3. Wire NPC mail job queue worker (`web/src/sim/jobs/mailQueue.ts`) with deterministic daily seeds.
  4. Publish domain event payloads through central event bus for UX/audio subscribers.
- **Integration Hand-off:** Provide TypeScript interfaces in `web/src/sim/events.ts` and update save schema draft in `Docs/DATA_SCHEMAS.md`.

### S2 — Save/Migration Ladder
- **Definition of Ready:** Receives schema updates from S1, migration CLI skeleton available.
- **Task Cards:**
  1. Scaffold migration runner CLI (`web/scripts/migrate/run.ts`) exposing `yarn migrate --from <v>` entry.
  2. Author migrations for livestock/weather entities with downgrade fixtures in `web/scripts/migrate/__fixtures__`.
  3. Extend automated regression harness covering load/save/version downgrade in `web/tests/save/migration.spec.ts`.
  4. Document migration ladder workflow in `Docs/TEST_PLAN.md`.
- **Integration Hand-off:** Publish version map JSON for QA bundles and update CI workflow to execute migrations nightly.

### T1 — Telemetry & Debug Overlay
- **Definition of Ready:** Event taxonomy from S1 approved, overlay mounting point reserved in Phaser scene.
- **Task Cards:**
  1. Implement buffered telemetry queue with offline caching safeguards in `web/src/telemetry/buffer.ts`.
  2. Instrument day length/resource pacing metrics hooking into S1 events in `web/src/telemetry/homesteadMetrics.ts`.
  3. Replace placeholder overlay with tabbed debug HUD in `web/src/hud/debug/Overlay.tsx`.
  4. Add Vitest coverage for telemetry rate calculations and overlay render guards in `web/src/telemetry/__tests__/`.
- **Integration Hand-off:** Publish analytics event contract to U1/C2; surface overlay toggles for QA automation.

### U2 — Build Mode Polish
- **Definition of Ready:** Build mode UX audit completed, accessibility palette references checked.
- **Task Cards:**
  1. Implement placement ghost preview shader in `web/src/hud/build/PlacementGhost.ts`.
  2. Add rotation controls with controller bindings in `web/src/input/buildControls.ts`.
  3. Perform accessibility pass on `web/styles/build.scss` including colorblind palettes.
  4. Capture baseline screenshots for QA in `web/tests/visual/build-mode.spec.ts`.
- **Integration Hand-off:** Deliver screenshot diffs and input mapping docs to Q1.

## Wave Beta · Content & UX Bundles

### C1 — Livestock & Festival Content
- **Definition of Ready:** Receives event hooks from S1, baseline audio cues available.
- **Task Cards:**
  1. Author `web/content/livestock.csv` with balance tuning + localization notes.
  2. Script seasonal festival timeline in `web/content/festivals.json` including quest hooks.
  3. Add rare seed catalog entries to `web/content/crops.csv`.
  4. Coordinate placeholder audio cues referenced in `Docs/AUDIO_PLAN.md`.
- **Integration Hand-off:** Provide content diffs to U1 for UI surfacing and to A1 for audio layering.

### C2 — Tool Mastery & Progression
- **Definition of Ready:** Telemetry hooks from T1 published, achievements schema stable.
- **Task Cards:**
  1. Build proficiency perk modifiers in `web/src/sim/tools/perks.ts` with tests.
  2. Populate achievement journal entries in `web/content/perks.json` and `web/src/hud/journal/entries.ts`.
  3. Expose unlock requirements via event bus for UI consumption.
  4. Update UX copy and localization placeholders.
- **Integration Hand-off:** Provide telemetry events to T1 and UI states to U1.

### U1 — HUD Expansion
- **Definition of Ready:** Calendar/quest data schemas finalized, UI telemetry contract available.
- **Task Cards:**
  1. Implement calendar component in `web/src/hud/calendar/Calendar.tsx` with responsive layout.
  2. Build quest log module in `web/src/hud/quests/QuestLog.tsx` hooking into S1 events.
  3. Add stamina tip overlays in `web/src/hud/stamina/Tips.tsx` using T1 metrics.
  4. Audit HUD responsiveness and update `web/styles/hud.scss` tokens.
- **Integration Hand-off:** Emit UI telemetry events to T1; deliver layout specs to QA.

### A1 — Audio Integration
- **Definition of Ready:** Event bus from S1 stabilized, content cues from C1 prioritized.
- **Task Cards:**
  1. Layer livestock SFX triggers in `web/src/audio/livestock.ts`.
  2. Integrate festival music playlist logic in `web/src/audio/festivals.ts`.
  3. Balance ambient weather mixes referencing `Docs/AUDIO_PLAN.md`.
  4. Document loudness targets and routing in audio plan appendices.
- **Integration Hand-off:** Provide cue list to QA for regression and to UX for toggle controls.

## Wave Gamma · QA Bundles

### Q1 — Automated Soak & Visual Tests
- **Definition of Ready:** Simulation contracts stable, CLI harness from S2 available.
- **Task Cards:**
  1. Author multi-day crop soak scripts in `web/tests/sim/soak.spec.ts` with deterministic seeds.
  2. Implement screenshot diff harness for seasons/build mode in `web/tests/visual/seasons.spec.ts`.
  3. Add controller input smoke tests to `web/tests/input/controller.spec.ts`.
  4. Configure CI workflow to run soak tests nightly with artifact retention.
- **Integration Hand-off:** Publish baseline artifacts and bug triage checklist to Q2.

### Q2 — Manual QA & Test Plan Refresh
- **Definition of Ready:** Receives artifacts from Q1, updated migration notes from S2.
- **Task Cards:**
  1. Update regression checklists in `Docs/TEST_PLAN.md` for new systems.
  2. Draft playtest scenarios covering livestock, festivals, and tool mastery.
  3. Coordinate bug triage board and SLA schedule in shared tracker.
  4. Summarize findings in milestone report appended to `Docs/MILESTONES.md`.
- **Integration Hand-off:** Feed prioritized bug list back to engineering bundles and leadership review.

## Usage Notes
- Track each card in the shared sprint board and tag with the bundle code (e.g., `S1-2`).
- Maintain frozen interfaces for active wave; escalations go through daily sync.
- Update this matrix at the close of each sprint to reflect completion status and roll new cards forward.
