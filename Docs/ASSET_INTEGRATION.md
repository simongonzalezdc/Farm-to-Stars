# Asset Integration Guide

This guide explains how to download, integrate, and use open-source game assets in Farm to Stars.

## Asset Directory Structure

```
web/public/assets/
├── tiles/          # Ground tiles, water, roads (96x48 isometric)
├── buildings/      # Building sprites (cottage, well, tent, crate, etc.)
├── crops/          # Crop and plant sprites
├── ui/             # UI elements (buttons, panels, icons)
├── icons/          # Small icons for resources, tools, etc.
└── manifest.json   # Asset manifest (auto-generated)
```

## Quick Start

1. **Run the asset download helper:**
   ```bash
   cd web
   node scripts/assets/downloadAssets.mjs
   ```

2. **Follow the instructions** to download assets from recommended sources

3. **Place assets** in the appropriate directories

4. **Update the code** to load external assets (see below)

## Recommended Asset Sources

### 1. Kenney.nl (CC0 - No Attribution Required)
- **Tiny Town**: Isometric town buildings
- **Tiny Farm**: Farming and agricultural assets
- **Tiny Dungeon**: Isometric tiles and props
- **UI Pack**: User interface elements

**URL**: https://kenney.nl/assets

### 2. OpenGameArt.org (Various Licenses)
- Search for "isometric tileset"
- Search for "farming sprites"
- Filter by CC0 or CC-BY license

**URL**: https://opengameart.org

### 3. Itch.io Free Assets
- **Tactical 2D Game Tile Set**: Strategy game tiles
- **Fantasy Strategy GUI**: UI elements

**URL**: https://itch.io/game-assets/free

## Asset Requirements

### Tile Assets (96×48 pixels)
- **Format**: PNG with transparency
- **Size**: 96×48 pixels (isometric diamond)
- **Naming**: `tile-{name}.png` (e.g., `tile-grass.png`, `tile-water.png`, `tile-road.png`)
- **Required tiles**:
  - Ground/grass
  - Water
  - Road/path
  - Dirt/soil

### Building Assets
- **Format**: PNG with transparency
- **Size**: Variable (should match isometric perspective)
- **Naming**: `building-{name}.png` (e.g., `building-cottage.png`, `building-well.png`)
- **Required buildings**:
  - Cottage
  - Well
  - Tent
  - Crate/Storage

### Crop Assets
- **Format**: PNG with transparency
- **Size**: Variable (should match isometric perspective)
- **Naming**: `crop-{name}.png` (e.g., `crop-wheat.png`, `crop-potato.png`)
- **Required crops**: Match crops in `web/src/data/crops.json`

### UI Assets
- **Format**: PNG with transparency (or SVG)
- **Size**: Variable (scalable preferred)
- **Naming**: `ui-{name}.png` (e.g., `ui-button.png`, `ui-panel.png`)

## Integration Steps

### Step 1: Download Assets

Use the download helper script or manually download from recommended sources:

```bash
cd web
node scripts/assets/downloadAssets.mjs kenney
```

### Step 2: Resize/Adapt Assets

Assets may need to be resized to match the 96×48 tile size. Use image editing software or a script:

```bash
# Example using ImageMagick (if installed)
magick convert input.png -resize 96x48 output.png
```

### Step 3: Update Asset Loading Code

Modify `web/src/main.ts` to load external assets instead of generating them programmatically:

```typescript
preload() {
  // Load tile assets
  this.load.image('tile:ground', '/assets/tiles/tile-grass.png');
  this.load.image('tile:water', '/assets/tiles/tile-water.png');
  this.load.image('tile:road', '/assets/tiles/tile-road.png');
  
  // Load building assets
  this.load.image('prop:cottage', '/assets/buildings/building-cottage.png');
  this.load.image('prop:well', '/assets/buildings/building-well.png');
  this.load.image('prop:tent', '/assets/buildings/building-tent.png');
  this.load.image('prop:crate', '/assets/buildings/building-crate.png');
  
  // Load crop assets (dynamically based on crops.json)
  // ... load crops based on data/crops.json
}
```

### Step 4: Create Texture Atlas (Optional but Recommended)

For better performance, create a texture atlas:

```typescript
// Load atlas
this.load.atlas('game-atlas', '/assets/atlas/game-atlas.png', '/assets/atlas/game-atlas.json');

// Use in code
this.add.image(x, y, 'game-atlas', 'tile-grass');
```

### Step 5: Update Credits

Add asset attribution to `Docs/CREDITS.md`:

```markdown
## External Assets

### Kenney Assets
- **Source**: https://kenney.nl/assets
- **License**: CC0 (Public Domain)
- **Assets Used**: Tiny Town, Tiny Farm, UI Pack
- **Attribution**: Not required (CC0), but listed for reference

### OpenGameArt Assets
- **Source**: https://opengameart.org/content/[asset-name]
- **License**: CC-BY 3.0
- **Author**: [Author Name]
- **Attribution**: Required - see game credits
```

## Asset Naming Conventions

- **Tiles**: `tile-{name}.png`
- **Buildings**: `building-{name}.png` or `prop:{name}` (for Phaser texture keys)
- **Crops**: `crop-{name}.png`
- **UI**: `ui-{name}.png`
- **Icons**: `icon-{name}.png`

## Performance Considerations

1. **Texture Atlas**: Combine multiple sprites into a single texture atlas for better performance
2. **Asset Size**: Keep individual assets under 512KB when possible
3. **Compression**: Use PNG compression tools (e.g., `pngquant`, `optipng`)
4. **Lazy Loading**: Load assets on-demand for large asset packs

## Troubleshooting

### Assets Not Loading
- Check file paths (must be in `public/assets/`)
- Verify file names match exactly (case-sensitive)
- Check browser console for 404 errors

### Assets Wrong Size
- Resize to match 96×48 tile dimensions
- Maintain aspect ratio for isometric perspective
- Use image editing software to adjust

### Performance Issues
- Create texture atlas instead of individual images
- Reduce asset file sizes with compression
- Use sprite sheets for animations

## License Compliance

- **CC0**: No attribution required, but good practice to list in credits
- **CC-BY**: Attribution required - must credit author in game and documentation
- **CC-BY-SA**: Attribution + ShareAlike - must use same license
- **No NC**: Cannot use if planning to monetize

Always check individual asset licenses before use!

