# Pathfinding Contracts

```csharp
public sealed class RoySquarePathfinder : IPathfinderSquare { /* RoyT.AStar grid */ }
public sealed class RoyHexPathfinder    : IPathfinderHex   { /* axial graph    */ }
```
- **Costs**: from `ITerrain.MoveCost` or a `Dictionary<Terrain,int>`.
- **Blocked**: buildings with `Impassable`; units optionally soft-blocked.
- **Acceptance**: goal reached within ±0.1f of tile center; blocked node recompute within 1 tick.
