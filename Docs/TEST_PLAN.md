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
