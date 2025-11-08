# Technical Specification — Phaser 3 Pixel‑Iso PWA

## 1) Stack
- **Engine:** Phaser 3, `render: { pixelArt:true, antialias:false }`, `camera.roundPixels = true`.
- **Language/Build:** TypeScript + Vite.
- **Audio:** Howler (SFX), Tone.js (transport/music layers; user‑gesture gate).
- **Storage:** IndexedDB via `idb-keyval`, saves with `schemaVersion` and migrations.
- **PWA:** `vite-plugin-pwa` (manifest, SW auto‑update).

## 2) Loop (deterministic sim + render)
- **Render:** 60 FPS target (`requestAnimationFrame`).
- **Sim:** fixed‑step at 10–20 Hz using an accumulator; cap catch‑up on resume.

## 3) Folder structure (web app)
```
/web
  package.json, tsconfig.json, vite.config.ts, index.html
  /public
    manifest.webmanifest
    /icons (192, 512)         # optional initially
  /src
    main.ts                   # scene boot, camera, y-sort, HUD glue
    iso.ts                    # 96×48 grid helpers
    world.ts                  # tick glue (fixed-step)
    storage.ts                # IndexedDB save/load
    audio.ts                  # Tone gate + Howler SFX
    /systems                  # economy.ts, construction.ts (ported semantics)
    /maps                     # IMapSquare.ts (now), IMapHex.ts (later)
    /data                     # JSON tables
    /assets                   # tilesets, props, UI atlas
```

## 4) Key modules
- **iso.ts:** `TILE_W=96`, `TILE_H=48`, `gridToScreen(ix,iy,height)` and `screenToGrid(x,y)`.
- **main.ts:** Phaser config; pan/zoom; y‑sort by screen Y; zoom clamps (0.75–2.25).
- **world.ts:** accumulator loop; `tick(state, dt)` central hook.
- **storage.ts:** `load()`/`save()` IndexedDB; future `migrate(vN→vN+1)`.
- **audio.ts:** `enableAudio()` → `Tone.start()`; `toggleMute()`; SFX sprites later.

## 5) Systems (to implement)
- **construction.ts:** component `{remaining:number}` → decrement by `dt`; on ≤0, replace with `BuildingTag`.
- **economy.ts:** component `{recipeId, progress, inputs[], outputs[]}` → if inputs sufficed then `progress+=dt`; on completion push outputs (clamp by storage).

## 6) Data & schema
- `/src/data/resources.json`, `/src/data/buildings.json`, `/src/data/recipes.json` (see DATA_SCHEMAS.md).
- Saves: `{ v:number, seed:number, resources:Record<string,number>, ... }`.

## 7) Performance
- Texture atlases; sprite batching; chunked tile culling; avoid per‑frame allocations.
- Target ≤1KB alloc/frame; profile on low‑end Android.
