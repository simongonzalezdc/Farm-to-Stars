# Zero‑Ambiguity AI Prompts (P1–P10)

> Run **one prompt at a time**. Do not change file names or structure unless specified.

## P1 — Project scaffold
Create .NET 8 MonoGame DesktopGL solution `FarmToStars` with `Game` + `Game.Content`. Add folders per `02-Repo-Layout.md`. Implement `SimClock` (20 Hz), `PhaseManager`, and `Game1` that runs fixed-step sim + `SpriteBatch` render + Myra UI root. Add `Assets.LoadContent` to load `font.spritefont`. Build must run.

**Acceptance:** `dotnet run` shows a window with FPS and a placeholder panel.

## P2 — IMap + coords
Implement `IMap`, `FarmMap` (square), `CityMap` (square), `HexMap` (axial). Add `SquareCoord` and `HexCoord` with neighbors, distance, conversions. Include unit tests for hex neighbors/distance.

**Acceptance:** 6 neighbors for pointy-top axial; distance matches formula.

## P3 — ECS core & Render
Add DefaultEcs. Implement `Components.cs`, `Tags.cs`, `RenderSystem`, `MovementSystem`. Rendering uses `SpriteBatch` and draws `Sprite` at `Transform.Pos`.

**Acceptance:** Spawned entity renders and moves per tick.

## P4 — Economy & Construction
Implement `EconomySystem` and `ConstructionSystem`. Create DTOs for `Resource`, `Building`, `Rate`. Load JSON from `Data/Content`. Economy consumes inputs, advances `Progress`, outputs when complete; construction decrements and spawns `BuildingTag`.

**Acceptance:** Coal plant consumes coal and produces power per tick when inputs available.

## P5 — Overlays & UI
Implement `Heatmap<T>` + `OverlayRenderer` (power, water, land value). Add Myra `BuildPanel` and `BudgetPanel`. Hotkeys per `07-UI-and-Hotkeys.md`. Keep frame allocations under 1 KB.

**Acceptance:** Overlays 1–3 render; GC log stable.

## P6 — Pathfinding
Add `RoySquarePathfinder` and `RoyHexPathfinder`. Block impassables; hex costs from terrain. Implement `OrdersSystem` with `MoveToTile` and path recompute on block.

**Acceptance:** Unit reaches target; blocked node recalculates within 1 tick.

## P7 — Phase converters
Create `HomesteadToTownshipConverter`, `TownshipToNationConverter`, `NationToStellarConverter` per rules in `06-Phase-Converters.md`. Add `PhaseTransitionPreview` UI listing conversions with counts and confirm/cancel.

**Acceptance:** 9-field cluster converts to ≥1 agriculture district; summary shown.

## P8 — Save/Load + migration
Implement `SaveGame` with `schemaVersion`. Serialize components to JSON; add `SaveMigrator` to upgrade versions. Test round-trip and a rename migration.

**Acceptance:** Budgets match after reload; migration applies rename.

## P9 — Content v0
Author minimal content JSON per `05-Data-Schemas.md`. Wire MGCB to include textures/audio. Placeholder rectangles come from `tiles.png`.

**Acceptance:** Game boots; panels list entries without errors.

## P10 — Polish
Add screenshake, 60 ms hit-pause, pan/zoom with damping, and `Config.json` for tunables.

**Acceptance:** Changing config values updates behavior after reload.
