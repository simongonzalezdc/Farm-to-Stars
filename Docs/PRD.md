# Product Requirements Document (PRD) — Farm to Stars (Web PWA)

## 1) Summary
“**Farm to Stars**” (working title) is a cozy‑strategic **2.5D pixel‑isometric** browser game that blends **Stardew‑like** farming, **old‑school SimCity** city‑building, and a light **Civ**-style layer (tiny techs + seasons). It’s **browser‑only** with **PWA** install, offline play, and quick iteration.

## 2) Objectives
- **Quality bar:** Crisp **pixel‑iso** visuals (tile **96×48**), readable at 3 zoom tiers, y‑sort walk‑behinds, warm spring palette.
- **Performance:** 60 FPS on mid phones; ≤3s time‑to‑first‑frame (cold); ≤10MB initial bundle; lazy‑load packs.
- **Testable vertical slice:** farm plot → harvest food → sell at market → build cottage → simple tech unlock.
- **Stability:** PWA offline, IndexedDB saves with versioning; auto‑update service worker.

## 3) Target users & goals
- Players who like cozy builders, light strategy, and frictionless “share a link → play.”
- **KPIs (slice):** median session ≥6 min; ≥20% return next day (prompt).

## 4) Core loop (slice)
Gather → Build → Produce → Unlock (tiny tech) → Repeat; seasons shift pacing & music layers.

## 5) Features (slice scope)
- Pixel‑iso map (96×48), pan/zoom, **y‑sort** occlusion.
- **Build mode** (ghost preview, validity feedback).
- **Economy system** (consume→progress→produce); **Construction** (timer→building).
- **Seasons** visuals & minor growth modifiers.
- **Saves** (IndexedDB), **PWA** offline/install/update.
- **Audio:** SFX (Howler), layered music (Tone.js).

## 6) Constraints & assumptions
- **Engine:** Phaser 3; `pixelArt: true`, `antialias: false`, `camera.roundPixels = true`.
- **Loop:** fixed‑step **10–20 Hz** simulation; render 60 FPS (accumulator).
- **Data:** JSON for resources/buildings/recipes; `schemaVersion` in saves; migrations supported.
- **Licenses:** CC0/CC‑BY only (no NC). Keep `CREDITS.md` even for CC0.

## 7) Acceptance criteria (slice)
- Visual: tiles crisp at 3 zooms; walk‑behind works; warm spring palette.
- Build: place road/plot/cottage/market; construction timer completes; becomes building.
- Economy: plot yields food; market converts food→coins on a timer; HUD updates live.
- Platform: PWA installable; offline reload works; save/load round‑trip; mobile audio gated by tap.
- Perf: 60 FPS on a mid phone doing camera pans; ≤3s first playable (cold).
