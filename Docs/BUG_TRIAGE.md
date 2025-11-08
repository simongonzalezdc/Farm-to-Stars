# Bug Triage Board & SLA Cadence

This playbook defines how the team tracks, prioritizes, and resolves issues across live slices and nightly builds. The board lives in Linear under the `FARM QA` team, mirrored to the internal Notion dashboard for leadership visibility.

## Board Structure
- **Columns**
  1. **Intake (New/Needs Triage):** Incoming issues from QA, playtests, and telemetry alerts. Auto-tagged with build number and environment.
  2. **Ready for Fix:** Severity + ownership assigned, reproduction notes verified, supporting media attached.
  3. **In Progress:** Engineering actively addressing the bug; linked branch/PR required.
  4. **In Review:** Fix in code review or awaiting validation build.
  5. **QA Verify:** QA retest against targeted build; includes checklist for regression impact.
  6. **Done:** Passed verification and merged to main; release notes updated.

- **Swimlanes**
  - **Critical Live Issues:** Player-blocking bugs in production builds.
  - **Content Blockers:** Issues preventing milestone content completion (livestock, festival, tools).
  - **Polish/Backlog:** Low severity, tracked for future sprints.

- **Required Fields on Ticket**
  - Build hash + platform
  - Repro steps (≤5 bullets)
  - Expected vs. actual behaviour
  - Attachments (video, logs, save file)
  - Severity (S0–S3) + priority (P0–P3)
  - Owning discipline (Engineering, Design, Art, Audio)

## SLA Cadence
| Severity | Definition | First Response SLA | Fix ETA | Verification Owner |
| --- | --- | --- | --- | --- |
| **S0** | Service outage, data corruption, blockers for all players. | 15 minutes (pager escalation). | Patch within 4 hours. | QA Lead + Engineering on-call |
| **S1** | Critical progression blocker, crash on launch, festival/market downtime. | 1 hour during working day, 2 hours off-hours. | Hotfix or rollback within 24 hours. | QA Lead |
| **S2** | Major feature broken (e.g., livestock chore loop, tool upgrade loss) but workaround exists. | 4 business hours. | Fix merged within 3 business days. | Feature QA owner |
| **S3** | Minor bug, cosmetic issue, or telemetry gap. | 1 business day. | Scheduled during next sprint (≤10 business days). | QA Specialist |

### Escalation Steps
1. SLA bot in Slack (`#farm-triage`) posts hourly digest with breaches highlighted.
2. On-call engineer rotates weekly (Monday stand-up handoff). Keep runbook updated in shared drive.
3. If S0/S1 fix misses target window, product lead convenes incident review within 24 hours.

## Rituals & Reporting
- **Daily (Mon–Thu) 15-minute triage stand-up:** QA lead, producer, feature engineers. Review new intake, SLA risks, and verify QA queue.
- **Friday Bug Review (30 minutes):** Aggregate metrics (open by severity, mean time to repair, regression count) presented to leadership.
- **Release Readiness Checklist:** Prior to each milestone build, ensure:
  - All S0/S1 closed or explicitly waived by product.
  - S2 backlog burn-down plan documented.
  - Regression checklists (Test Plan §5) completed for target features.
  - Playtest feedback (Docs/PLAYTEST_SCENARIOS.md) logged with dispositions.

## Tooling Hooks
- Linear automation assigns QA verify subtasks when `In Review` column reached.
- GitHub PR template references bug ID and requires checklist attestation.
- Telemetry pipeline pushes crash reports into `Intake` via webhook; duplicates resolved during daily triage.
- Jira/Notion sync runs nightly to update leadership dashboard and share SLA compliance metrics.
