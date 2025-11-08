# Test Plan — QA & Acceptance (Slice)

## 1) Manual
- **Visual:** pixels are crisp at 3 zooms; y‑sort walk‑behind OK; day/night switch OK.
- **Build/Economy:** road/plot/cottage/market place; plot yields; market sells; counters move.
- **Platform:** PWA install; offline reload; audio unlock on tap.
- **Perf:** 60 FPS on mid phone; ≤3s to first playable (cold).

## 2) Automated
- **Unit tests:** economy math, construction timers, save migrations.
- **E2E smoke (Playwright):** load → place road → save → reload → verify persisted.
