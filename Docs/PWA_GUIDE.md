# PWA Guide — Manifest, SW, Offline

## 1) Manifest
- Name/short_name, icons (192/512), `display: "standalone"`, `start_url: "/"`, theme colors.

## 2) Service Worker (vite-plugin-pwa)
- Auto‑update mode; show “update available” toast (optional later).
- Precache core bundle; runtime cache tiles/audio.

## 3) Offline & Install UX
- First visit caches shell; offline reload works.
- Offer Install prompt after ~2 min play or on first level complete.
