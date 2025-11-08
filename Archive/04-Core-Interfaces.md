# Core Interfaces & Signatures

## IMap
```csharp
public interface IMap
{
    RectangleF BoundsWorld { get; }
    IEnumerable<Point> TilesInView(Camera2D cam);           // square maps
    IEnumerable<HexCoord> HexesInView(Camera2D cam);        // hex maps
    ITerrain GetTerrain(int x, int y);                      // square
    ITerrain GetTerrain(HexCoord hex);                      // hex
    IEnumerable<Point> Neighbors(Point t);
    IEnumerable<HexCoord> Neighbors(HexCoord h);
    Vector2 ToWorldCenter(Point t);
    Vector2 ToWorldCenter(HexCoord h);
}
```

## SimClock (20 Hz)
```csharp
public sealed class SimClock
{
    public static readonly TimeSpan Step = TimeSpan.FromMilliseconds(50);
    public TimeSpan Accumulator { get; private set; }
    public void AddElapsed(TimeSpan dt) => Accumulator += dt;
    public bool ShouldStep() => Accumulator >= Step;
    public void ConsumeStep() => Accumulator -= Step;
}
```

## ECS Components (subset)
```csharp
public struct Transform { public Vector2 Pos; public float Rot; }
public struct TilePos { public int X, Y; }
public struct HexPos { public int Q, R; }
public struct Sprite { public Texture2D Tex; public Rectangle Src; public Vector2 Origin; }

public struct Storage { public ResourceStack[] Items; }
public struct Production { public Rate[] Inputs; public Rate[] Outputs; public float Progress; }
public struct Construction { public TimeSpan Remaining; public string BuildingId; }
public struct Population { public int Citizens; public int Employed; }
public struct Orders { public Queue<Order> Queue; }
public struct Owner { public int FactionId; }

public struct PlayerTag { }
public struct CityTag { }
public struct FarmFieldTag { }
public struct BuildingTag { public string Id; }
public struct UnitTag { public string Id; }
```

## Orders & Pathing
```csharp
public enum OrderKind { MoveToTile, BuildAtTile, Harvest, Attack, Patrol, Wait }
public readonly record struct Order(OrderKind Kind, int X, int Y);

public interface IPathfinderSquare
{
    bool TryPath(Point start, Point goal, out IReadOnlyList<Point> path);
}
public interface IPathfinderHex
{
    bool TryPath(HexCoord start, HexCoord goal, out IReadOnlyList<HexCoord> path);
}
```
