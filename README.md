# Farm to Stars

A 4-phase game in C# + MonoGame that evolves from **Homestead → Township → Nation → Stellar**.

## 🚀 Quick Start

### Easiest Way (macOS)

**Just double-click `run.command`** - That's it!

Or run from terminal:
```bash
./run.sh
```

The script will:
- ✅ Check for .NET 8 SDK
- ✅ Install it automatically if needed (via Homebrew)
- ✅ Restore all NuGet packages
- ✅ Build the project
- ✅ Launch the game

### Manual Way

If you prefer to do it manually:

```bash
cd Game
dotnet restore
dotnet run
```

## 🎮 Controls

- **WASD** - Move camera
- **Mouse Wheel** - Zoom in/out
- **ESC** - Exit game

## 📋 Prerequisites

- macOS (tested on macOS 14+)
- Homebrew (for automatic .NET SDK installation)
- OR .NET 8 SDK installed manually

## 🛠️ What's Included

- ✅ Fixed-step simulation (20 Hz)
- ✅ 60 FPS rendering
- ✅ ECS system with DefaultEcs
- ✅ Map system (Farm, City, Hex, Star maps)
- ✅ Camera system with pan/zoom
- ✅ Myra UI integration
- ✅ Economy and Construction systems
- ✅ JSON content loading

## 📁 Project Structure

```
Game/
├── Game1.cs          # Main game loop
├── Sim/              # Simulation systems
├── Maps/             # Map implementations
├── ECS/              # Entity Component System
├── Data/             # Data definitions & JSON
├── UI/               # User interface
├── Util/             # Utilities (Camera, etc.)
└── Content/          # Game content (fonts, etc.)
```

## 🐛 Troubleshooting

### Script doesn't run
```bash
chmod +x run.sh
./run.sh
```

### .NET SDK not found
The script will try to install it automatically. If that fails:
```bash
brew install --cask dotnet-sdk
```

### Build errors
```bash
cd Game
dotnet clean
dotnet restore
dotnet build
```

### Content pipeline errors
The font should build automatically. If not:
```bash
cd Game
dotnet mgcb-editor Content/Content.mgcb
```

## 📚 Documentation

See the `docs/` folder for detailed documentation:
- `01-Game-Spec.md` - Game specification
- `02-Repo-Layout.md` - Project structure
- `03-Coding-Standards.md` - Coding standards
- And more...

## 🎯 Next Steps

Once the game runs:
1. Explore the map with WASD
2. Zoom in/out with mouse wheel
3. See test entities rendered
4. Check the UI panel for game info

Enjoy! 🎮
