# Game Design Document (GDD) — Vertical Slice

## 1) Pillars
- **Tactile build & farm** with crisp pixel‑iso feedback.
- **Gentle strategy** via resources, simple techs, and seasons.
- **Short sessions, long tail**; daily goals and micro‑progress.

## 2) Mechanics (slice)
**Resources:** wood, stone, food, coins.  
**Buildings (slice):** 
- **Road** (movement bonus / future units).
- **Farm Plot** (seed→grow→harvest food).
- **Cottage** (population cap / flavor for later).
- **Market** (sell food→coins).

**Tech (tiny):** agriculture → masonry → trade (simple multipliers/unlocks).  
**Seasons:** spring (+growth), summer (−growth), autumn (+harvest), winter (−growth).

## 3) Progression targets
- First harvest ≤ 4 min; first cottage ≤ 8 min; first tech ≤ 12 min.

## 4) Input & UX
- Mouse/touch drag‑pan; wheel/pinch zoom (clamped to crisp ranges).
- HUD: resource bar (tabular numerals), clock/season, build toolbar, tooltips (inputs/outputs/upkeep).
- Build ghost with red/green validity.

## 5) Economy & Construction (slice)
- **Economy:** If inputs available → consume → advance progress; on completion → produce outputs (clamped to storage).
- **Construction:** Countdown timer; on 0 → entity becomes Building; play SFX; brief particle flourish.
