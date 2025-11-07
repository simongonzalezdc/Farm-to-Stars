# Testing Guide - Farm to Stars

## Prerequisites

### 1. Install .NET 8 SDK

**On macOS:**
```bash
# Using Homebrew (recommended)
brew install --cask dotnet-sdk

# Or download from: https://dotnet.microsoft.com/download/dotnet/8.0
```

**Verify installation:**
```bash
dotnet --version
# Should show: 8.0.x or higher
```

### 2. Install MonoGame Content Pipeline (MGCB)

The MonoGame Content Pipeline tool is required to build content files.

**On macOS:**
```bash
# Install via .NET tool
dotnet tool install -g dotnet-mgcb-editor

# Or install MonoGame templates
dotnet new --install MonoGame.Templates.CSharp
```

## Testing Steps

### Step 1: Navigate to Game Directory

```bash
cd "/Users/simongonzalezdecruz/Desktop/Farm to Stars/Game"
```

### Step 2: Restore NuGet Packages

```bash
dotnet restore
```

This will download all required packages:
- MonoGame.Framework.DesktopGL
- MonoGame.Extended
- DefaultEcs
- Myra
- Newtonsoft.Json
- RoyT.AStar

### Step 3: Build the Project

```bash
dotnet build
```

**Expected output:**
- Should compile successfully
- May show warnings (these are normal)
- Should create `bin/` and `obj/` folders

### Step 4: Run the Game

```bash
dotnet run
```

**Expected behavior:**
- A game window should open (1280x720)
- Dark green background with grid lines
- White square entities visible
- FPS counter in bottom-left corner
- Myra UI panel in top-left corner
- Camera position info displayed

### Step 5: Test Controls

- **WASD Keys**: Move camera around the map
- **Mouse Wheel**: Zoom in/out
- **ESC**: Exit the game

## Troubleshooting

### Issue: "dotnet: command not found"

**Solution:** Install .NET 8 SDK (see Prerequisites above)

### Issue: "MGCB not found" or Content Pipeline errors

**Solution:** 
```bash
# Install MonoGame Content Pipeline
dotnet tool install -g dotnet-mgcb-editor
```

### Issue: Build errors about missing packages

**Solution:**
```bash
# Clear NuGet cache and restore
dotnet nuget locals all --clear
dotnet restore
```

### Issue: Runtime errors about missing content files

**Solution:** The font.spritefont should be built automatically. If not:
```bash
# Build content manually
dotnet mgcb-editor Content/Content.mgcb
# Then build and save in the editor
```

### Issue: Game window doesn't appear

**Solution:** Check console output for errors. Common issues:
- Missing graphics drivers
- Display permissions on macOS
- Content files not built

## Alternative: Using Visual Studio Code

1. Install the **C# Dev Kit** extension
2. Open the `Farm to Stars` folder
3. Press `F5` to run (will build and run automatically)

## Alternative: Using Visual Studio for Mac

1. Open `FarmToStars.sln`
2. Set `Game` as startup project
3. Press `Cmd+R` to run

## What You Should See

When running successfully:

1. **Game Window**: 1280x720 window with dark green background
2. **Grid**: Gray grid lines showing 32x32 pixel tiles
3. **Entities**: White square entities (32x32 pixels) at different positions
4. **UI Panel**: Blue semi-transparent panel in top-left showing:
   - "Farm to Stars"
   - Current phase (Homestead)
   - Control instructions
5. **FPS Counter**: Shows current frames per second (should be ~60)
6. **Camera Info**: Shows current camera position

## Next Steps After Testing

Once the game runs successfully, you can:
1. Move the camera with WASD to explore the map
2. Zoom in/out with mouse wheel
3. See entities rendered on the map
4. Verify the fixed-step simulation is running (20 Hz)

## Performance Expectations

- **FPS**: Should maintain ~60 FPS
- **Simulation**: Runs at 20 Hz (50ms per step)
- **Memory**: Should be minimal (< 100MB typically)

