# Test Plan — QA & Acceptance (Slice)

## 1) Manual
- **Visual:** pixels are crisp at 3 zooms; y‑sort walk‑behind OK; day/night switch OK.
- **Build/Economy:** road/plot/cottage/market place; plot yields; market sells; counters move.
- **Pacing:** passive income + farm/market loop fund the Week 3 set (road, plot, market, cottage) within 8–10 minutes; first harvest lands <4 minutes; seasons cycle every 2.5 minutes.
- **Platform:** PWA install; offline reload; audio unlock on tap.
- **Perf:**
  - Launch build with `npm run build && npm run preview`, open on target hardware.
  - Use in-game overlay (bottom-right) to confirm FPS ≥60 during idle camera pan and interaction bursts.
  - Track memory in overlay or browser devtools; ensure <300 MB steady-state after 5 minutes.
  - Measure cold start from navigation to first input ≤3s using browser performance timeline.

## 2) Automated
- **Unit tests:** economy math, construction timers, save migrations.
- **E2E smoke (Playwright):** load → place road → save → reload → verify persisted.
- **Migration CLI:** `npm run migrate -- --input web/scripts/migrate/__fixtures__/v5-basic.json --output tmp.json` should emit a
  schema v6 save with populated mail/livestock fields (verify via diff or `jq '.schemaVersion'`).

## 3) Week 1–4 Playtest Checklist

Use this page as a printable or digital worksheet during guided playtests. Check items as they are observed and capture any deviations immediately.

### Setup & Install Readiness
1. [ ] **Build freshness** – Install dependencies and run `npm run build && npm run preview` on target hardware.
   - **Pass:** Build completes without errors; preview launches in <30 s.
   - **Fail:** Any build error, preview crash, or load time ≥30 s.
   - **Observer Notes:** _______________________________________
2. [ ] **PWA install prompt** – From a clean browser profile, load the preview URL and trigger the install prompt.
   - **Pass:** Install icon appears within 10 s; app installs and launches from home screen with correct icon/text.
   - **Fail:** Prompt never appears, install fails, or launch opens fallback tab.
   - **Observer Notes:** _______________________________________
3. [ ] **First-run assets** – Confirm initial camera framing, HUD layout, and tutorial copy (if present) render without missing art/SFX.
   - **Pass:** Iso tiles crisp at 96×48; HUD elements aligned; opening music layer plays on first interaction.
   - **Fail:** Blurry sprites, HUD clipping, missing audio trigger.
   - **Observer Notes:** _______________________________________

### Core Loop Validation (Weeks 1–3)
4. [ ] **Camera & controls** – Pan, zoom (3 levels), and character y-sort.
   - **Pass:** Smooth pan without stutter; zoom levels swap correctly; avatar occludes/appears as expected when walking behind structures.
   - **Fail:** Input lag >150 ms, stuck zoom level, or incorrect draw order.
   - **Observer Notes / Timing (s):** ____________________________
5. [ ] **Construction flow** – Enter build mode, place road, plot, cottage, and market.
   - **Pass:** Ghost preview respects validity; construction timers run; placements snap to grid; confirmation SFX plays.
   - **Fail:** Invalid tiles allowed, timer stalls, missing audio.
   - **Observer Notes / Bugs:** ________________________________
6. [ ] **Economy loop** – Plant plot → harvest ingredient → craft food → sell at market → earn coins.
   - **Pass:** Harvest increments inventory; recipe consumes inputs; market sale updates coin counter and HUD tooltip.
   - **Fail:** Resource loss, UI desync, or blocked interactions.
   - **Observer Notes / Timing (loop duration):** _______________
7. [ ] **Save/Load** – Exit to menu (or reload page) and resume session.
   - **Pass:** Latest placements and currency persist; construction timers resume with correct remaining time.
   - **Fail:** Save missing, timers reset/complete unexpectedly.
   - **Observer Notes:** _______________________________________

### Edge Cases & Regression Sweeps
8. [ ] **Seasonal visuals toggle** – Advance time or trigger season change.
   - **Pass:** Palette shift applies across terrain, crops, and sky without popping.
   - **Fail:** Mixed season assets, animation hitch >0.5 s.
   - **Observer Notes:** _______________________________________
9. [ ] **Offline resilience** – Install as PWA, disable network, and relaunch.
   - **Pass:** App opens offline; cached assets load; last save accessible.
   - **Fail:** Offline error modal, missing textures/audio.
   - **Observer Notes:** _______________________________________
10. [ ] **Performance burst** – Trigger busy scene (multiple constructions + market interactions) while observing overlay FPS/memory.
    - **Pass:** FPS ≥60; steady-state memory <300 MB after 5 min; cold start ≤3 s (log actual below).
    - **Fail:** FPS dips <55 for >3 s, memory spike >350 MB, cold start ≥3 s.
    - **Observer Notes / FPS / Memory / Start time:** ____________
11. [ ] **Audio polish** – Verify SFX layering and music transitions between day/night.
    - **Pass:** Interaction SFX audible without clipping; music cross-fades smoothly with day/night switch.
    - **Fail:** Missing cues, abrupt cuts, volume imbalance.
    - **Observer Notes:** _______________________________________
12. [ ] **Lighthouse regression** – Run Lighthouse (PWA category) on installable build.
    - **Pass:** PWA ≥90, Performance ≥80, Accessibility ≥95.
    - **Fail:** Any score below target or critical audit regression.
    - **Observer Notes / Scores:** ______________________________

### Debrief & Bugs
- **Top issues surfaced:** ______________________________________
- **Follow-up bugs logged (ID/status):** _________________________
- **Additional observations or player quotes:** ___________________

> Tip: Snap a photo or export PDF after each session to keep historical regression evidence.

## 4) Homestead Phase Checks

- **Farming lifecycle:** Use the toolbelt (Hoe/Water/Sickle) and seed bar to till soil, plant wheat/potato/berry, water through a dry spell, and confirm harvest yields populate the new resources (wheat, potato, berries, fiber) with stamina costs applied.
- **Time & stamina loop:** Ensure stamina drains on tool use, regenerates via rest, and that the day/night HUD reflects the updated clock cadence (rest button should advance to dawn and clear exhaustion states).
- **Weather/moisture:** Advance several in-game days to observe rain/storm rolls, verify soil moisture overlays recolor tiles, and confirm crops wither if ignored.
- **Save migration:** Load a pre-Homestead save to confirm crops/time/weather defaults populate without data loss and that new saves persist field state.
- **Inventory & build hooks:** Verify the HUD resource row lists fiber/wheat/potato/berries, toolbelt/seed buttons auto-populate from data tables, and the build menu offers tent, well, and crate with updated sprites/costs.

## 5) Regression Checklists — Livestock, Festivals, Tools

Use these suites when validating new content drops or cross-feature merges. Capture a short screen recording for every failure and cross-link the bug ID in the test log.

### Livestock Systems
1. [ ] **Barn placement & upgrades** – Place base barn, upgrade to tier 2, and relocate.
   - **Pass:** Placement grid respects fencing, upgrade timer progresses, and relocation refunds 75% resources.
   - **Fail:** Barn overlaps invalid tiles, timers stall, or refunds incorrect.
   - **Artifacts / Notes:** ______________________________________
2. [ ] **Animal care loop** – Adopt cow/chicken, feed twice, clean stall, collect output (milk/eggs).
   - **Pass:** Happiness meter increases, feed bins decrement, produce enters inventory with correct rarity tag.
   - **Fail:** State desync, missing produce, happiness freeze.
   - **Artifacts / Notes:** ______________________________________
3. [ ] **Breeding & lifecycle** – Trigger breeding event, track gestation, age offspring to adult.
   - **Pass:** Gestation timer matches design doc, offspring inherits genetics table, milestone journal updates.
   - **Fail:** Timer stuck, traits missing, journal entry absent.
   - **Artifacts / Notes:** ______________________________________
4. [ ] **Livestock incidentals** – Force weather extreme and predator event.
   - **Pass:** Shelter status mitigates debuffs, alert banner fires, auto-save captures state.
   - **Fail:** Animals vanish, shelter buffs ignored, save corruption.
   - **Artifacts / Notes:** ______________________________________

### Festival Cadence
1. [ ] **Event calendar sync** – Advance in-game calendar to festival announcement.
   - **Pass:** Notice board posts 3 days prior, NPC dialog swaps, map marker appears.
   - **Fail:** Announcement missing or misdated, dialog fallback.
   - **Artifacts / Notes:** ______________________________________
2. [ ] **Festival questline** – Accept invitation, complete 3-stage quest, redeem rewards.
   - **Pass:** Quest tracker updates per stage, festival currency tallies, reward chest grants items.
   - **Fail:** Quest blocker, currency not issued, reward duplication.
   - **Artifacts / Notes:** ______________________________________
3. [ ] **Mini-game stability** – Run festival mini-game on desktop + mobile sessions.
   - **Pass:** Input responsive, score table persists, PWA offline flag handled.
   - **Fail:** Controls drop, scoreboard reset, offline crash.
   - **Artifacts / Notes:** ______________________________________
4. [ ] **Festival teardown** – Let event end naturally and skip via time advance.
   - **Pass:** Decorations clean up, vendors rotate back, calendar resets cooldown.
   - **Fail:** Props persist, vendor stuck, calendar double-books.
   - **Artifacts / Notes:** ______________________________________

### Advanced Tools & Crafting
1. [ ] **Unlock gating** – Purchase blacksmith upgrade, craft advanced hoe/hammer.
   - **Pass:** Unlock prerequisites honored, crafting queue respects resources, durability starts at 100%.
   - **Fail:** Unlock bypass, queue stalls, durability mis-set.
   - **Artifacts / Notes:** ______________________________________
2. [ ] **Tool ability validation** – Use tool special ability on crops/buildings/terrain.
   - **Pass:** Ability radius renders, stamina drain matches spec, cooldown UI counts down accurately.
   - **Fail:** Radius misaligned, stamina exploit, cooldown freeze.
   - **Artifacts / Notes:** ______________________________________
3. [ ] **Upgrade regression** – Downgrade tool, swap enchantments, repair at forge.
   - **Pass:** Downgrade refunds delta cost, enchantment effects toggle, repair resets durability without wiping mods.
   - **Fail:** Resource loss, enchantments stick, repair wipes modifiers.
   - **Artifacts / Notes:** ______________________________________
4. [ ] **Cross-system hooks** – Confirm new tools interact with livestock/festival scripts.
   - **Pass:** Tool use updates ranch chore list, festival mini-games detect advanced tools, analytics events emit.
   - **Fail:** Hooks missing, analytics silent, chores stale.
   - **Artifacts / Notes:** ______________________________________
