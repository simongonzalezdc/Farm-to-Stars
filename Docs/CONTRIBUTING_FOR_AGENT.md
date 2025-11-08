# Contributing Guide (for Coding Agent)

## Rules of engagement
1) One change per PR; do not rename/move files unless task specifies.
2) Add unit tests when touching systems or data schemas.
3) Avoid per‑frame allocations; keep under ~1KB/frame.
4) Keep `schemaVersion` updated in saves; write migrations.
5) Maintain pixel‑crisp settings: `pixelArt:true`, `antialias:false`, `camera.roundPixels=true`.
6) Follow data‑driven approach: add new buildings/recipes via JSON; no hardcoding.

## Task backlog (slice)
- [ ] Implement `/src/systems/construction.ts` (countdown → BuildingTag).
- [ ] Implement `/src/systems/economy.ts` (consume→progress→produce).
- [ ] Implement `/src/maps/IMapSquare.ts` (tilesInView, neighbors, toWorldCenter).
- [ ] Add `/src/data/*.json` per DATA_SCHEMAS.md and load on boot.
- [ ] Replace placeholder textures with a CC0 pixel‑iso tileset; add `/CREDITS.md`.
- [ ] Add Playwright smoke test: load→place→save→reload.
