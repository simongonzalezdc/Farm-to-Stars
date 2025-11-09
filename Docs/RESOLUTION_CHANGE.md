# Resolution Change: 96×48 → 64×32

## Why Change?

The game was using **96×48 isometric tiles**, but this resolution:
- Doesn't scale well with 16×16 pixel art assets
- Creates distortion when scaling top-down tiles
- Makes it harder to use pre-built asset packs

## New Resolution: 64×32

**64×32 isometric tiles** are better because:

1. **Clean Scaling**: 64×32 = 4×16 × 2×16
   - Width: 4× the 16×16 source
   - Height: 2× the 16×16 source (isometric 2:1 ratio)
   - Integer scaling = no pixelation artifacts

2. **Common Standard**: 64×32 is a widely-used isometric tile size
   - Many asset packs are designed for this size
   - Works well with pixel art
   - Good balance between detail and performance

3. **Better Asset Compatibility**:
   - 16×16 tiles scale cleanly to 64×32
   - True isometric assets often come in 64×32
   - Easier to find compatible asset packs

## What Changed

- **Tile Size**: `TILE_W = 64`, `TILE_H = 32` (was 96×48)
- **Building Sizes**: Scaled proportionally
  - Cottage: 48×32 (was 60×40)
  - Tent: 40×28 (was 48×32)
  - Well: 32×32 (was 40×40)
  - Crate: 32×24 (was 40×30)
- **Scaling Logic**: Updated to handle 16×16 → 64×32 scaling

## Benefits

✅ **Better Asset Support**: Can use more pre-built asset packs  
✅ **Cleaner Scaling**: Integer multiples reduce distortion  
✅ **Better Performance**: Smaller tiles = fewer pixels to render  
✅ **More Detail**: Still large enough for good visual quality  
✅ **Industry Standard**: Matches common isometric game resolutions  

## Asset Compatibility

With 64×32 tiles, you can now use:
- 16×16 top-down tiles (scale 4× width, 2× height)
- 32×16 isometric tiles (scale 2×)
- 64×32 isometric tiles (native size)
- 128×64 isometric tiles (scale 0.5×)

## Next Steps

1. Test the new resolution in-game
2. Consider downloading 64×32 isometric asset packs
3. Update any hardcoded tile size references
4. Adjust camera zoom if needed for optimal viewing

