# True Isometric Assets Guide

## Problem

The current Kenney assets (Tiny Town, Tiny Dungeon) are **16×16 top-down tiles**, but the game uses **96×48 isometric tiles** (2:1 ratio). When scaled, they look distorted because:

1. **Aspect ratio mismatch**: 16×16 (square) vs 96×48 (2:1 ratio)
2. **Perspective mismatch**: Top-down vs isometric
3. **Pixel art scaling**: Pixel art doesn't scale well to non-integer ratios

## Solution: True Isometric Assets

We need to find and download **true isometric assets** that match the game's 96×48 format.

## Recommended Sources

### 1. Kenney Isometric Prototypes Tiles (CC0)
- **URL**: https://kenney-assets.itch.io/isometric-prototypes-tiles
- **License**: CC0 (Public Domain)
- **Content**: Over 50 isometric tiles (walls, floors, objects, doorways)
- **Also includes**: Character sprites with 8 directions / 3 animations
- **Download**: Click "Download Now" → "No thank you, just take me to the download"
- **Extract to**: `web/public/assets/isometric/kenney-prototypes/`

### 2. Screaming Brain Studios - Isometric Floor Pack (CC0)
- **URL**: https://screamingbrainstudios.itch.io/isotilepack
- **License**: CC0 (Public Domain)
- **Content**: 1,008 isometric floor tiles in true 2D 2:1 isometric perspective
- **Perfect for**: Ground/floor tiles
- **Download**: Click "Download Now" on itch.io page
- **Extract to**: `web/public/assets/isometric/screaming-brain-floors/`

### 3. Screaming Brain Studios - Isometric Grids Pack (Free)
- **URL**: https://screamingbrainstudios.com/dl-isometric-grids-pack/
- **License**: Free
- **Content**: 30 isometric grids and tiles
- **Useful for**: Prototyping and design
- **Extract to**: `web/public/assets/isometric/screaming-brain-grids/`

## File Organization

After downloading, organize files like this:

```
web/public/assets/isometric/
├── tiles/
│   ├── ground-*.png
│   ├── road-*.png
│   └── dirt-*.png
├── buildings/
│   ├── cottage-*.png
│   ├── well-*.png
│   └── tent-*.png
└── props/
    ├── crate-*.png
    └── market-*.png
```

## Integration Steps

1. **Download the assets** from the sources above
2. **Extract and organize** them in `web/public/assets/isometric/`
3. **Review the tiles** and select ones that match your game's style
4. **Update `web/src/assets/assetLoader.ts`** to point to new isometric assets:
   ```typescript
   const DEFAULT_ASSETS: Record<string, string> = {
     'tile:ground': '/assets/isometric/tiles/ground-01.png',
     'tile:road': '/assets/isometric/tiles/road-01.png',
     // ... etc
   };
   ```
5. **Remove color tints** from `web/src/main.ts` (they won't be needed with true isometric)
6. **Test the game** to ensure tiles look correct

## Benefits

- ✅ **No distortion**: True isometric assets match the 96×48 format
- ✅ **Better visuals**: Proper isometric perspective looks professional
- ✅ **No color tints needed**: Assets are designed for isometric view
- ✅ **Consistent style**: All assets use the same perspective

## Notes

- These assets are **true isometric** (2:1 ratio), so they should look much better than the current top-down tiles when scaled to 96×48
- All recommended sources use **CC0 or free licenses**, so they're safe for commercial use
- The Kenney Isometric Prototypes pack is the most comprehensive and includes both tiles and character sprites

