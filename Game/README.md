# Farm to Stars - Game Project

## Prerequisites

- .NET 8 SDK or later
- MonoGame DesktopGL templates installed
- MonoGame Content Pipeline (MGCB) tool

## Building and Running

### First Time Setup

1. Restore NuGet packages:
   ```bash
   cd Game
   dotnet restore
   ```

2. Build the project:
   ```bash
   dotnet build
   ```

3. Run the game:
   ```bash
   dotnet run
   ```

### Controls

- **WASD**: Move camera
- **Mouse Wheel**: Zoom in/out
- **ESC**: Exit game

## Project Structure

- `Game1.cs` - Main game loop with fixed-step simulation (20 Hz) and 60 FPS rendering
- `Sim/` - Simulation systems (Economy, Construction, etc.)
- `Maps/` - Map implementations (FarmMap, CityMap, HexMap, StarMap)
- `ECS/` - Entity Component System (Components, Tags, Systems)
- `Data/` - Data definitions and JSON content
- `UI/` - User interface components
- `Util/` - Utility classes (Camera, etc.)

## Features Implemented

✅ Fixed-step simulation at 20 Hz (50ms per step)  
✅ 60 FPS rendering with SpriteBatch  
✅ ECS system with DefaultEcs  
✅ Map system with IMap interface  
✅ Camera system with pan and zoom  
✅ Myra UI integration  
✅ Economy and Construction systems  
✅ JSON content loading  

## Next Steps

The project is ready for testing. You can:
1. Run `dotnet run` to see the game window
2. Use WASD to move the camera
3. Use mouse wheel to zoom
4. See test entities rendered on the map

