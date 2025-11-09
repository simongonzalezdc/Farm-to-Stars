# Downloaded Assets

This document lists all assets that have been downloaded and organized in this directory.

## Kenney Assets (CC0 - No Attribution Required)

### Tiny Town (1.1)
- **Source**: https://kenney.nl/assets/tiny-town
- **License**: CC0 (Creative Commons Zero)
- **Download Date**: 2025-11-09
- **Contents**:
  - 132 tiles (16×16 pixels)
  - Town buildings, roads, ground tiles
  - Location: `tiles/tile_*.png`
- **Note**: Tiles are 16×16 pixels and may need to be scaled to match the game's 96×48 tile size

### Tiny Dungeon
- **Source**: https://kenney.nl/assets/tiny-dungeon
- **License**: CC0 (Creative Commons Zero)
- **Download Date**: 2025-11-09
- **Contents**:
  - 136 tiles (16×16 pixels)
  - Dungeon tiles, walls, floors, props
  - Location: `tiles/tile_*.png`
- **Note**: Tiles are 16×16 pixels and may need to be scaled to match the game's 96×48 tile size

## Asset Organization

- **Tiles**: `tiles/` - Contains 132+ tile sprites from Tiny Town and Tiny Dungeon
- **Buildings**: `buildings/` - Ready for building sprites (to be organized from tiles)
- **Crops**: `crops/` - Ready for crop/plant sprites
- **UI**: `ui/` - Ready for UI elements
- **Icons**: `icons/` - Ready for icon sprites

## Next Steps

1. Review tiles and identify which ones are suitable for:
   - Ground tiles (grass, dirt, water)
   - Building sprites (cottage, well, tent, crate)
   - Crop/plant sprites
   - UI elements

2. Scale/resize tiles to match game's 96×48 isometric tile size if needed

3. Rename and organize tiles into appropriate subdirectories:
   - `tiles/tile-grass.png`, `tiles/tile-water.png`, etc.
   - `buildings/building-cottage.png`, etc.
   - `crops/crop-wheat.png`, etc.

4. Update `main.ts` to load external assets instead of generating programmatically

## License Compliance

All downloaded assets are CC0 (Public Domain), meaning:
- ✅ No attribution required
- ✅ Free to use in personal, educational, and commercial projects
- ✅ Can be modified and redistributed

However, it's good practice to credit Kenney in the game's credits (see `Docs/CREDITS.md`).

