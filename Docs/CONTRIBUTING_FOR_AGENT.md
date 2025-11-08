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

## Local npm registry checklist
To prevent package installs from failing with HTTP 403 errors, run through the following steps before installing dependencies:

1. Verify the registry and auth settings:
   - Run `npm config get registry` from the `web/` folder and ensure it returns `https://registry.npmjs.org/`.
   - Run `npm config list` and confirm no legacy auth tokens are present. If a stale token appears, remove it with `npm config delete //<registry>/:_authToken` or by editing your user‑level `.npmrc`.
   - Check for proxy environment variables (`npm_config_http_proxy`, `npm_config_https_proxy`) that might block access. Unset them or point them to a working proxy if required.

2. Clear and retry the install:
   - Execute `npm cache clean --force` to purge any cached 403 responses.
   - Run `npm install` afterwards. If the install still fails, attempt to fetch a known public package manually (e.g. `npm pack eslint-config-prettier@9.1.0`) to confirm the registry is reachable from your machine.

3. Escalate remaining access issues:
   - If the manual fetch also fails with 403, your network or proxy configuration likely blocks the npm registry. Work with your network admin to whitelist `https://registry.npmjs.org/`.
   - Document any environment overrides (such as custom proxies or service accounts) that you apply locally so other contributors can replicate the fix.
