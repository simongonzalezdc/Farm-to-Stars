# Guided Playtest Scenarios — Livestock, Festivals, Tools

These guided scenarios are designed for moderated sessions with 1–2 players and a QA notetaker. Each script assumes the latest nightly build with debug overlays enabled. Capture video, player quotes, and session metrics in the shared playtest folder.

## Scenario A: Livestock Onboarding & Ranch Flow
- **Objective:** Validate clarity of the livestock tutorial, chore cadence, and emotional bond loops.
- **Participant Profile:** Returning slice player familiar with farming loop, but new to livestock.
- **Duration:** 30 minutes (including debrief).
- **Instrumentation:** Enable ranch telemetry panel (`Alt+L`), capture happiness/health graphs, export `livestock-session.json` after play.

### Moderator Script
1. Set up save with unlocked barn plot but no animals. Brief participant on "you just unlocked the ranch!"
2. Prompt player to adopt their first animal using in-game prompts only.
3. Observe how quickly they locate feed and watering tools; remind only if stuck for >3 minutes.
4. Introduce optional breeding quest via mail after first chore cycle.
5. Ask player to complete one full day, including nighttime check-in and morning chores.
6. Trigger dynamic weather (storm) via debug if it has not occurred naturally by minute 20.
7. Debrief with targeted questions:
   - What parts of the tutorial felt unclear or overwhelming?
   - Did the chore cadence feel satisfying or tedious?
   - How did the weather event change your priorities?

### Success Criteria
- Player completes adoption and first produce collection without moderator intervention (other than step 6).
- Tutorial notifications are acknowledged within 10 seconds.
- Ranch happiness remains ≥60% throughout the session.
- Player articulates next-day goals clearly during debrief.

## Scenario B: Festival Headliner & Social Loop
- **Objective:** Stress-test calendar notifications, multi-stage quests, and social scenes during the Moonlight Festival.
- **Participant Profile:** Narrative-focused player who enjoys social interactions and mini-games.
- **Duration:** 40 minutes plus 10-minute debrief.
- **Instrumentation:** Enable festival analytics overlay (`Ctrl+Shift+F`), log quest progression via `/festival questlog dump`, collect chat transcript if using remote play.

### Moderator Script
1. Load save 5 in-game days before the Moonlight Festival with base questline unfinished.
2. Ask participant to follow the notice board hints to prepare for the festival.
3. Observe response to NPC invitation scenes; note emotional reactions and confusion.
4. Encourage participation in at least two festival mini-games and one co-op activity.
5. Push the in-game clock forward to the festival finale if pacing stalls after minute 30.
6. Debrief topics:
   - Which quest objectives were unclear?
   - How satisfying were the mini-game rewards and social interactions?
   - Did the festival feel connected to the broader farm progression?

### Success Criteria
- Participant enters festival with required items and no blocking bugs.
- Mini-games report scores and rewards correctly in both solo and co-op tests.
- Social reputation system reflects at least one rank change by session end.
- Player expresses desire to return for next seasonal event during debrief.

## Scenario C: Advanced Tools & Crafting Specialization
- **Objective:** Evaluate comprehension of advanced tool unlocks, ability usage, and crafting depth for mid-core players.
- **Participant Profile:** Systems-oriented player with ≥5 hours of slice time, comfortable with crafting menus.
- **Duration:** 35 minutes with 5-minute wrap-up.
- **Instrumentation:** Record session FPS/memory via overlay, enable crafting analytics (`/craft log`), and export tool usage metrics (`tool-telemetry.csv`).

### Moderator Script
1. Provide save with blacksmith expansion ready to unlock and sufficient resources.
2. Instruct player to pursue "the best tool loadout for tomorrow's chores" with minimal guidance.
3. Observe how they allocate stamina and materials between crafting, upgrades, and repairs.
4. Introduce optional time pressure by scheduling a storm or festival overlapping with crafting tasks at minute 15.
5. Request they test each advanced tool ability on at least two target types (crop, structure, terrain).
6. Debrief questions:
   - Did the UI clearly communicate unlock requirements and upgrade benefits?
   - Were there moments of resource scarcity or decision paralysis?
   - How did advanced tools change your plan for the next in-game day?

### Success Criteria
- Player unlocks at least two advanced tools and uses their abilities without moderator hints.
- Crafting queue logs no failed recipes due to unclear inputs.
- Durability, stamina, and cooldown indicators remain legible and responsive.
- Player surfaces at least one balance or UX improvement idea during debrief.

## Scenario D: Homestead Pace & Telemetry Calibration
- **Objective:** Validate the rebalanced day/night cadence, stamina flow, and playtest instrumentation for Homestead.
- **Participant Profile:** Returning farming loop player comfortable with toolbelt interactions.
- **Duration:** 25 minutes including debrief.
- **Instrumentation:** Enable telemetry opt-in, keep the debug overlay visible, and note the HUD playtest status counter before/after each in-game day.

### Moderator Script
1. Start from a fresh Homestead save and guide the participant through opting into telemetry via the HUD toggle.
2. Observe the player tending three plots (till, water, plant, harvest) while tracking stamina usage and rest prompts.
3. Encourage at least one manual rest before sunset to verify day skip flow and the new feedback styling.
4. After each day, export telemetry logs and confirm `homestead.daySummary` entries appear with crop/stamina/weather deltas.
5. Debrief questions:
   - Did the shorter day length feel rushed, relaxed, or just right?
   - Were stamina costs readable after the balance pass?
   - Did the HUD and audio feedback reinforce changing weather states?

### Success Criteria
- Player completes two full in-game days (one natural, one rested) without moderator intervention.
- Telemetry export contains daily summaries with non-zero stamina `spent` and accurate rest counts.
- Participant calls out at least one instance of weather audio/visual feedback influencing their choices.
