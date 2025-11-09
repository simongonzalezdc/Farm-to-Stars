# 128×64 Asset Download Guide

## Best Option: Screaming Brain Studios Packs

### Available on Itch.io (CC0 - Public Domain)

Screaming Brain Studios has **multiple free isometric packs** available on itch.io, all under CC0 license (no attribution required):

1. **Isometric Pathways Pack** ⭐ **BEST FOR ROADS**
   - URL: https://screamingbrainstudios.itch.io/isometric-pathways-pack
   - Resolution: **128×64** and 256×128
   - Content: Over 5,500 pathway tiles (roads, dirt paths, rivers)
   - Perfect for: Road tiles, paths, water features
   - **Scaling to 160×80**: Only 1.25× - excellent quality!

2. **Isometric Overworld Pack** ⭐ **BEST FOR TERRAIN**
   - URL: https://screamingbrainstudios.itch.io/iso-overworld-pack
   - Resolution: **128×64** and 256×128
   - Content: 360 terrain tiles (grass, water, mountains)
   - Perfect for: Ground tiles, terrain features
   - **Scaling to 160×80**: Only 1.25× - excellent quality!

3. **Isometric Floor Pack** ⭐ **BEST FOR GROUND**
   - URL: https://screamingbrainstudios.itch.io/isotilepack
   - Resolution: **128×64** and 256×128
   - Content: 1,008 floor tiles (various patterns and textures)
   - Perfect for: Ground tiles, floor patterns
   - **Scaling to 160×80**: Only 1.25× - excellent quality!

4. **Isometric Object Pack**
   - URL: https://screamingbrainstudios.itch.io/isometric-object-pack
   - Resolution: 128×128 and 64×64
   - Content: 395 object tiles (columns, crates, stairs)
   - Perfect for: Buildings, props
   - **Note**: 128×128 is square, would need to crop/scale

5. **Isometric Wall Pack**
   - URL: https://screamingbrainstudios.itch.io/isowallpack
   - Resolution: Large (128×192) and Small (64×96)
   - Content: 1,872 wall tiles
   - Perfect for: Buildings, structures

### Download Instructions

1. **Visit itch.io pages** (links above)
2. **Click "Download"** button (usually "Name your price" - set to $0 for free)
3. **Extract ZIP files** to `web/public/assets/isometric/screaming-brain-128x64/`
4. **Organize files**:
   - Ground tiles → `ground/` subdirectory
   - Road tiles → `roads/` subdirectory
   - Water tiles → `water/` subdirectory
   - Building tiles → `buildings/` subdirectory

### Recommended Downloads (Priority Order)

1. **Isometric Overworld Pack** (for ground/terrain) ⭐ **TOP PRIORITY**
2. **Isometric Pathways Pack** (for roads/paths) ⭐ **TOP PRIORITY**
3. **Isometric Floor Pack** (for additional ground variety)
4. **Isometric Object Pack** (for buildings/props)

---

## Alternative: Screaming Brain Studios Website

### Isometric Grids Pack

- **URL**: https://screamingbrainstudios.com/dl-isometric-grids-pack/
- **Resolution**: Small (32×16), Medium (64×32), **Large (128×64)**
- **Content**: 30 isometric grids and tiles
- **License**: Check individual (likely free)
- **Note**: This is a grid pack (for designing), not game tiles

**Download Steps**:
1. Visit the URL above
2. Click the "Download" button
3. Extract the "Large" size pack (128×64)
4. Place in `web/public/assets/isometric/screaming-brain-128x64/`

---

## After Downloading

### Integration Steps

1. **Update `assetLoader.ts`** to use 128×64 assets:
   ```typescript
   const DEFAULT_ASSETS: Record<string, string> = {
     'tile:ground': '/assets/isometric/screaming-brain-128x64/ground/ground-tile.png',
     'tile:road': '/assets/isometric/screaming-brain-128x64/roads/road-tile.png',
     // ... etc
   };
   ```

2. **Update scaling logic** in `main.ts`:
   - 128×64 assets scale to 160×80 with only 1.25× scaling
   - Much better quality than 16×16 scaled assets

3. **Test in game**:
   - Assets should look almost native quality
   - Minimal pixelation
   - Clear and crisp visuals

---

## Current Status

✅ **Directory created**: `web/public/assets/isometric/screaming-brain-128x64/`
✅ **Documentation ready**: This guide
⏳ **Awaiting download**: Manual download required from itch.io or website

---

## Why 128×64 is Perfect

- **Native scaling**: Only 1.25× to reach 160×80 (minimal pixelation)
- **Excellent quality**: Almost native resolution
- **Widely available**: Multiple free packs on itch.io
- **CC0 license**: No attribution required
- **Professional quality**: Used in commercial games

---

## Next Steps

1. **Download Isometric Overworld Pack** from itch.io (for ground)
2. **Download Isometric Pathways Pack** from itch.io (for roads)
3. **Extract and organize** files in the directory
4. **Update asset loader** to use new assets
5. **Test in game** - should look much better than current 16×16 scaled assets!

