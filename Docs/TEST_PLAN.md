# Test Plan — QA & Acceptance (Slice)

## 1) Manual
- **Visual:** pixels are crisp at 3 zooms; y‑sort walk‑behind OK; day/night switch OK.
- **Build/Economy:** road/plot/cottage/market place; plot yields; market sells; counters move.
- **Platform:** PWA install; offline reload; audio unlock on tap.
- **Perf:**
  - Launch build with `npm run build && npm run preview`, open on target hardware.
  - Use in-game overlay (bottom-right) to confirm FPS ≥60 during idle camera pan and interaction bursts.
  - Track memory in overlay or browser devtools; ensure <300 MB steady-state after 5 minutes.
  - Measure cold start from navigation to first input ≤3s using browser performance timeline.

## 2) Automated
- **Unit tests:** economy math, construction timers, save migrations.
- **E2E smoke (Playwright):** load → place road → save → reload → verify persisted.

## Week 4 — Lighthouse & PWA Audit
- **Build & serve:** `npm run build` → `npm run preview -- --host 0.0.0.0 --port 4173`.
- **Lighthouse (mobile):** Attempted via `npx lighthouse http://127.0.0.1:4173/ --form-factor=mobile ...`; blocked by registry proxy (`npm ERR! 403 Forbidden`).
- **Key fixes applied:**
  - Added generated 192 px & 512 px PNG icons + maskable SVG in `public/manifest.webmanifest` and precache config to satisfy PWA installability.
  - Introduced `src/audioClient.ts` to lazy-load Tone/Howler stacks only after the user enables audio, reducing the initial JS payload by ~336 kB.
  - Refined HUD styling for better contrast and keyboard focus outlines (`index.html`).
- **Follow-up:** Re-run Lighthouse once registry access is restored; expect higher PWA & Best Practices scores from manifest/icon fixes and improved Performance from reduced initial bundle.
