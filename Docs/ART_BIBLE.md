# Art Bible — Pixel‑Iso (96×48)

## 1) Tile & scaling
- Tiles: **96×48** isometric diamonds.
- Phaser: `pixelArt:true`, `antialias:false`, `camera.roundPixels=true`.
- Provide **1× & 2× atlases**; pick via devicePixelRatio; clamp zoom (0.75–2.25).

## 2) Layers (draw order)
Ground → **Shadow** → Roads/Fields/Props → Units → Roofs → Weather → Vignette.

## 3) Palette & mood
- Default **warm spring** (greens with warm highlights).
- Seasonal grades for summer/autumn/winter (later via LUT or shader).

## 4) Shadows & depth
- Pre‑baked AO on a separate **shadow layer** (tintable per time‑of‑day).  
- Simple parallax sky; optional subtle vignette.

## 5) Animation
- Build/place anims 200–300ms; UI micro‑motions 80–120ms; ease‑out cubic.

## 6) Readability rules
- 3 zoom tiers must read silhouettes clearly.
- Avoid text in tiny sprites; keep silhouettes chunky and iconic.

## 7) Licensing
- **CC0** preferred; **CC‑BY** allowed with attribution; **no NC** assets.
- Maintain `/CREDITS.md` even for CC0 (good hygiene when monetizing).
