# Game Spec v0.1 — Farm to Stars (MonoGame, C#)

## Non‑negotiables
- **Engine/stack:** .NET 8+, MonoGame DesktopGL, MonoGame.Extended, DefaultEcs, Myra, Newtonsoft.Json, RoyT.AStar.
- **Ticking:** Render at 60 FPS; **simulation fixed at 20 Hz** (50 ms).
- **Save format:** JSON v1 with `schemaVersion` (forward-migratable).
- **Map abstraction:** `IMap` interface with 4 impls: **FarmMap** (square), **CityMap** (square), **HexMap** (axial), **StarMap** (graph).
- **Phase changes:** converter steps; entities map to next-phase constructs.
- **Scope v0:** minimal content per phase (see `08-Content-V0.md`).

## Four Phases (Vertical Slices)
### I) Homestead (Stardew-like)
- 200×200 square tiles; plant → water → harvest → sell → upgrade.
- Systems: day/night, stamina, seasons, moisture, weather.
- Exit: “Town Charter” milestone.

### II) Township (SimCity slice)
- Same region zoomed out; your farm becomes a **district**.
- Zoning (R/C/I), roads, power/water, taxes, services.
- Exit: Pop + industry score unlock “Nationhood”.

### III) Nation (Civ slice)
- Hex map (axial); cities, borders, research, units, diplomacy.
- A*, terrain costs, fog-of-war.
- Exit: “Orbital Program” + spaceport.

### IV) Stellar (Space 4X)
- Star nodes + hyperlanes; planets as sub-maps.
- Colonize, extract, fleets, treaties, victory.
- v0 victory: **Science**.
