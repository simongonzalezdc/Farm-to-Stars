# Simulation Systems

## EconomySystem
- Inputs: `Production`, `Storage`.
- If inputs available → consume → advance `Progress`; on complete → produce outputs.
- Partial progress persists; outputs clamp to storage max.

## PopulationSystem
- Fill jobs up to workers; unemployment reduces land value; services boost growth.

## ConstructionSystem
- Decrease `Remaining`; on zero, replace entity with `BuildingTag`.

## OrdersSystem
- Execute `MoveToTile/BuildAtTile/Harvest`; path recompute when blocked.

## FowSystem
- Mark tiles visible by unit `Sight`; explored persists; overlay via `Heatmap`.
