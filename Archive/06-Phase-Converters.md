# Phase Converters (Deterministic)

## Homestead → Township
- Clusters of `FarmFieldTag` (≥3×3) → `building:district_agriculture_1` occupying same footprint.
- Player house → `building:city_hall_1` (+land value radius 6).
- Stored resources transfer to city `Storage`.

## Township → Nation
- Each district → a City center with summarized population → `Population.Citizens`.
- Rasterize square map to **hex** (nearest center); roads → hex roads.
- Power/water become baseline city yields.

## Nation → Stellar
- Capital city → homeworld.
- Cities with `spaceport` → starting colonies capacity.
- Strategic resources map to stellar equivalents (iron→alloys, oil→fuel).
