# Homestead Wave Delta Playtest Brief

_Last updated: Wave Delta hardening sprint._

## 1. Welcome & Objectives
- Validate end-to-end Homestead loop stability (farming, livestock, weather, mail, telemetry).
- Capture performance traces on low/mid hardware for Township sizing.
- Gather qualitative feedback on pacing, clarity of HUD coaching, and export excitement.

## 2. Getting Started
1. Install the hosted build from the playtest CDN link (see release email).
2. Launch the build, enable audio, and opt-in to anonymized telemetry via the HUD toggle.
3. Read the in-app status line to confirm telemetry buffers are capturing samples.

## 3. Session Flow
### Day 0 – Setup
- Import the provided save or create a fresh run.
- Verify debug overlay displays FPS/perf metrics and the Playtest row shows “Opted in”.

### Day 1–2 – Farming Core
- Tend fields until at least three crop cycles complete.
- Trigger weather events (rain/storm) and verify soil visuals.
- Feed livestock, confirm produce events, and note any starvation edge cases.

### Day 3 – Export Prep
- Play until the “Export to Township” button reports ≥1 shipment ready.
- Download the performance log once per day and attach it to the daily survey.
- Generate an export snapshot at end-of-day; upload JSON to the feedback form.

## 4. Reporting & Surveys
- Daily micro-survey link: _included in invite email_.
- Capture standout bugs with repro steps, expected vs. actual, and attach supporting logs/screenshots.
- Performance logs: run `npm run profile:homestead ./path/to/log.json` before submitting to note averages/p95 values.

## 5. Known Issues (Wave Delta RC)
- Audio ducking between overlapping rain/thunder layers is still being tuned.
- Export payload only captures agriculture districts; Township service zoning arrives in Wave Epsilon.
- Controller bindings for build rotation are experimental—fallback to keyboard/mouse if blocked.

Thank you for helping us harden Homestead ahead of Township ramp-up!
