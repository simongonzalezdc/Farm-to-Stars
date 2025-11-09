# Visual Clarity Notes

## Current Issue

The downloaded Kenney assets are **16×16 top-down tiles**, but the game uses **96×48 isometric tiles**. When scaled, they look distorted because:

1. **Aspect ratio mismatch**: 16×16 (square) vs 96×48 (2:1 ratio)
2. **Perspective mismatch**: Top-down vs isometric
3. **Pixel art scaling**: Pixel art doesn't scale well to non-integer ratios

## Current Solutions Implemented

1. **Color Tints**: Added color tints to distinguish tile types:
   - Ground tiles: Brown tint (`0x8b6f47`)
   - Road tiles: Gray tint (`0x5a5a5a`)
   - Buildings: Different colored tints per building type

2. **Tutorial System**: Created interactive tutorial that explains:
   - What the map represents
   - How to build structures
   - How to use tools
   - How to plant crops

3. **Map Legend**: Added a legend button that shows:
   - What different colored tiles mean
   - What buildings look like
   - Basic controls

4. **Visual Improvements**:
   - Slight transparency on tiles to reduce visual noise
   - Buildings scaled 20% larger than tiles
   - Different color tints for different building types

## Recommended Solutions

### Short-term (Current)
- ✅ Color tints to distinguish elements
- ✅ Tutorial system
- ✅ Map legend
- ✅ Visual feedback

### Medium-term (Future)
1. **Find True Isometric Assets**: Look for assets specifically designed for 96×48 isometric tiles
2. **Custom Tile Generation**: Create programmatic isometric tiles that match the game's style
3. **Better Asset Mapping**: Review all 268 tiles and select better matches
4. **Visual Labels**: Add text labels or icons to identify buildings

### Long-term (Future)
1. **Custom Art**: Commission or create custom isometric assets
2. **Asset Pipeline**: Create tools to convert top-down assets to isometric
3. **Multiple Asset Sets**: Support different visual styles

## How to Use Current System

1. **Tutorial**: Click "📚 Show Tutorial" button in the HUD to learn the basics
2. **Map Legend**: Click "🗺️ Map Legend" button to see what different elements mean
3. **Visual Cues**: 
   - Brown tiles = Ground/soil
   - Gray tiles = Roads
   - Colored squares = Buildings (different colors for different types)

## Note

The current assets work functionally, but may not look perfect due to the perspective mismatch. The tutorial and legend help players understand what they're looking at despite the visual distortion.

