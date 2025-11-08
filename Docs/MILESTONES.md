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
- [ ] **Week 9:** Balance Homestead pacing, tune weather, add audio/visual polish.
- [ ] **Week 10:** Regression sweep, QA checklist updates, and playtest instrumentation for Homestead.

## Leadership Summary — QA Enablement Additions

- **Regression Coverage:** Expanded Test Plan section 5 introduces livestock, festival, and advanced tool regression checklists, ready for Week 10 sweep sign-off.
- **Guided Playtests:** New `Docs/PLAYTEST_SCENARIOS.md` scripts cover livestock onboarding, festival cadence, and advanced tool specialization with clear success metrics for moderated sessions.
- **Operations Readiness:** Established bug triage board structure and SLA cadence in `Docs/BUG_TRIAGE.md`, aligning daily rituals and escalation paths ahead of live events.
