# Wave Delta Agent Pods

This roster defines the autonomous agents assigned to Wave Delta's four parallel lanes. Each pod operates semi-independently, sharing artifacts through the Wave Delta playbook and the Homestead parallel task matrix. The goal is to keep every lane unblocked while marching toward the Homestead playtest milestone.

## Pod overview

| Pod | Focus lane | Primary outputs | Sync rhythm |
| --- | --- | --- | --- |
| **Delta-Bash** | D1 — Bug Bash & Stabilization | Triage tracker updates, nightly RC build, changelog rollups | Twice-daily stand-up with QA + end-of-day drop notes |
| **Delta-Perf** | D2 — Performance & Stability | Profiling captures, optimization patches, perf report updates | Daily perf huddle after soak reruns |
| **Delta-Play** | D3 — Playtest Ops & Packaging | Hosted build links, onboarding brief, telemetry routing checklist | Morning ops sync + playtest dry-run reviews |
| **Delta-Bridge** | D4 — Homestead→Township Export Prototype | Export payload samples, feature flag config, integration notes | Alternating-day joint sync with Township leads |

Each pod follows the shared cadence called out in the Wave Delta plan—15-minute daily leadership sync plus RC branch coordination protocol.

## Pod charters & workflows

### Delta-Bash (D1)
- **Mission**: Drain the bug bash backlog, polish localized copy, and keep the release candidate builds shippable.
- **Inputs**: Q1 automation dashboards, D1 triage tracker, localization QA notes, RC branch status.
- **Outputs**: Updated `jira/HOMESTEAD-DELTA` issues, RC build artifacts, nightly changelog slice, verified localization fixes.
- **Automation hooks**:
  - Trigger `npm run test:rc` after each cherry-pick.
  - Update `Docs/TEST_PLAN.md` bug appendix when severity A/B issues close.
  - Post RC hash and blocker status to the shared Wave Delta Slack channel (`#homestead-delta`) before 19:00 local.

### Delta-Perf (D2)
- **Mission**: Lock in performance budgets on low-end hardware and make telemetry-based optimizations safe for playtest volume.
- **Inputs**: D1 RC build hash, telemetry baselines, soak test capture logs, profiling scripts.
- **Outputs**: `Docs/TEST_PLAN.md` perf appendix deltas, `web/src/` optimization PRs, updated telemetry alert thresholds.
- **Automation hooks**:
  - Run `npm run profile:homestead -- --preset=low-end` nightly and archive results under `Archive/PerfRuns/<date>.json`.
  - Kick off soak regression via `npm run test:soak` after landing optimizations; attach summaries to the perf report.
  - Notify Delta-Play when perf regressions are detected so packaging can pause builds.

### Delta-Play (D3)
- **Mission**: Package the playtest build, run onboarding dry-runs, and coordinate participant communications.
- **Inputs**: RC build hashes, perf report PDFs, Q2 playtest scenarios, CDN credentials, telemetry routing checklist.
- **Outputs**: Playtest CDN URL + checksum, `Docs/PLAYTEST_BRIEF.md`, telemetry opt-in flow validation notes, session calendar.
- **Automation hooks**:
  - Execute `node web/scripts/release/buildPlaytest.mjs --channel=delta` for every promoted RC build.
  - Validate CDN uploads with `npm run verify:cdn` and record checksums in `Docs/TEST_PLAN.md` packaging appendix.
  - Sync with Player Support to confirm survey tooling before invites go out.

### Delta-Bridge (D4)
- **Mission**: Deliver the Homestead→Township export prototype under a guarded feature flag without risking player saves.
- **Inputs**: Schema v6 artifacts, Township import spec, feature flag configs, telemetry taxonomy.
- **Outputs**: `web/src/sim/export/homesteadToTownship.ts`, validation test fixtures, export workflow docs, rollback plan.
- **Automation hooks**:
  - Guard new export commands behind `feature.exportTownship` flag in config and CI checks.
  - Run dedicated contract tests via `npm run test:export` before merges.
  - Provide sanitized export payload samples to Township leads through the shared integration repo.

## Cross-pod coordination
- Share blocking issues during the daily Wave Delta leadership sync; assign owner pods immediately.
- Keep the RC branch frozen—pods branch off the latest RC and use approved hotfix channels for merges.
- Update the Homestead parallel task matrix with pod status at the end of each sprint review.
- Maintain a single source of truth for playtest readiness in `Docs/MILESTONES.md` under the Wave Delta section.

## Activation checklist
1. Confirm Wave Gamma exit criteria signed off in the build guide.
2. Assign pod leads and deputies, recording them in the sprint tracker.
3. Spin up shared communication spaces (`#homestead-delta`, Confluence status page, and the playtest roster sheet).
4. Review this roster with all leads during kickoff and adapt task cards as scope evolves.
5. Begin execution, keeping artifacts synced across docs, trackers, and code.
