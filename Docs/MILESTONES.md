# Milestones — 4‑Week Vertical Slice

- **Week 1:** Iso render (96×48), camera pan/zoom, y‑sort; HUD; save/load; PWA shell.
- **Week 2:** Build mode (ghost, validity), Construction system; SFX.
- **Week 3:** Economy system; one recipe loop (plot→food→market→coins); seasons visuals; music layers.
- **Week 4:** Balance; polish; install prompt; Lighthouse pass; playtest checklist.

# Homestead Follow-on (6 Weeks)

- [x] **Week 5:** Establish Homestead farming systems (tilled soil, crop lifecycle, field saves). _Complete — toolbelt UI, soil lifecycle, and moisture-driven weather hooks now update the simulation each tick._
- [x] **Week 6:** Ship day/night clock, stamina loop, and weather-driven moisture. _Complete — time-of-day HUD, stamina
loop, and forecast-driven moisture events are wired into the Homestead simulation._
- [x] **Week 7:** Expand Homestead content set (crops, tools, starter structures, inventory hooks). _Complete — dynamic
inventory HUD, tool/seed bars, and tent/well/crate visual overrides now pull straight from the Homestead data tables._
- [x] **Week 8:** Extend save schema + migrations, hook UI/UX for new interactions. _Complete — schema v7 persists tool mastery progress and migration paths while perk unlock feedback now survives reloads._
- [x] **Week 9:** Balance Homestead pacing, tune weather, add audio/visual polish. _Complete — 13-minute days, stamina tuning, richer weather audio, and HUD glow bring the Homestead loop to life._
- [x] **Week 10:** Regression sweep, QA checklist updates, and playtest instrumentation for Homestead. _Complete — daily telemetry now flows into the playtest buffer alongside refreshed QA checklists and Homestead pacing scenarios._

**Status — Wave Delta Complete:** Bug bash, perf soak, playtest packaging, and the guarded export prototype all cleared their readiness gates. The Township export now rides behind `feature.exportTownship` and can be toggled for RC builds via `?feature.exportTownship=true`.

**Next Phase — Township Ramp (Weeks 13–24):** Spin up the city-building simulation, advisor/HUD layers, and supporting content/audio/QA bundles as outlined in the Build Guide (§4.2). Coordinate daily with Township leads while handing off the Homestead export payload samples captured during Delta.

## Leadership Summary — QA Enablement Additions

- **Regression Coverage:** Expanded Test Plan section 5 introduces livestock, festival, and advanced tool regression checklists, ready for Week 10 sweep sign-off.
- **Guided Playtests:** New `Docs/PLAYTEST_SCENARIOS.md` scripts cover livestock onboarding, festival cadence, and advanced tool specialization with clear success metrics for moderated sessions.
- **Operations Readiness:** Established bug triage board structure and SLA cadence in `Docs/BUG_TRIAGE.md`, aligning daily rituals and escalation paths ahead of live events.
