# Open Source Isometric Asset Resource Guide

## Overview
This document catalogs available open-source isometric game assets, their resolutions, and what types of games they're designed for.

## Asset Sources

### 1. Kenney.nl
**Website**: https://kenney.nl/assets

#### Available Isometric Packs:
- **Isometric Miniature Library** (CC0)
  - Resolution: 256×512 pixels per tile
  - Style: High-detail isometric, 30° × 45° viewpoint
  - Use case: Library environments, detailed isometric games
  - **Scaling**: Would need to scale DOWN to 160×80 (0.625× width, 0.156× height) - too large!
  - **Note**: Very high resolution, may be overkill
  
- **Isometric Prototypes Tiles** (Pay-what-you-want)
  - Resolution: Not specified (likely 64×32 or 96×48)
  - Style: Clean, modern isometric
  - Use case: General isometric games, city builders
  
- **Tiny Town** (CC0)
  - Resolution: 16×16 pixels
  - Style: Top-down pixel art (NOT true isometric)
  - Use case: Small-scale games, mobile games
  - **Scaling**: Scales poorly to 160×80 (10× width, 5× height) - very blurry
  - **Note**: Currently using this, but it looks bad scaled up
  
- **Tiny Dungeon** (CC0)
  - Resolution: 16×16 pixels
  - Style: Top-down pixel art (NOT true isometric)
  - Use case: Dungeon crawlers, RPGs
  - **Scaling**: Scales poorly to 160×80 (10× width, 5× height) - very blurry

**License**: Primarily CC0 (Public Domain)

---

### 2. OpenGameArt.org
**Website**: https://opengameart.org

#### Popular Isometric Packs:

- **Gioe's Basic Isometric Tileset**
  - Resolution: 64×64 pixels
  - Style: Retro pixel art isometric
  - Use case: RPGs, strategy games
  - License: Varies (check individual)
  - **Scaling to 160×80**: 2.5× width, 1.25× height - would look pixelated
  - **Better for**: 128×64 (2×) or 192×96 (3×) games

- **2D Isometric Tileset 32×32 "Plain"**
  - Resolution: 32×32 pixels
  - Style: Plain isometric tiles
  - Use case: General isometric games
  - License: Varies
  - **Scaling to 160×80**: 5× width, 2.5× height - would look very pixelated
  - **Better for**: 64×32 (2×) or 96×48 (3×) games

- **Free 32×32 Isometric Tile Pack**
  - Resolution: 32×32 pixels
  - Style: Grass and ground tiles
  - Use case: Basic isometric games
  - License: Free (check individual)
  - **Scaling to 160×80**: 5× width, 2.5× height - would look very pixelated

- **Isometric Tiles 32×32**
  - Resolution: 32×32 pixels
  - Style: Various isometric tiles
  - Use case: General isometric games
  - License: Varies
  - **Scaling to 160×80**: 5× width, 2.5× height - would look very pixelated

**License**: Varies per asset (CC0, CC-BY, GPL, etc.)

---

### 3. Itch.io (Free Assets Section)
**Website**: https://itch.io/game-assets/free

#### Notable Isometric Packs:

- **Isometric Tiles - Pixel Art** (by Devil's Workshop)
  - Resolution: 64×64 pixels
  - Style: Pixel art isometric
  - Use case: Unity Tilemap, general isometric games
  - License: Free (check individual)
  - **Scaling to 160×80**: 2.5× width, 1.25× height - would look pixelated
  - **Better for**: 128×64 (2×) games

- **Pixel Isometric Tiles** (by Scrabling)
  - Resolution: 32×32 pixels
  - Style: Pixel art isometric
  - Use case: General isometric games
  - License: Free (check individual)
  - **Scaling to 160×80**: 5× width, 2.5× height - would look very pixelated
  - **Better for**: 64×32 (2×) or 96×48 (3×) games

- **Isometric Asset Jumpstart Pack** (by PhilTacular)
  - Resolution: 32×32 pixels
  - Style: Pixel art with variations
  - Use case: Starter packs for isometric games
  - License: Free (check individual)
  - **Scaling to 160×80**: 5× width, 2.5× height - would look very pixelated

- **Isometric Pack1** (by C4T51K)
  - Resolution: 32×32 pixels
  - Style: Basic isometric blocks
  - Use case: General isometric games
  - License: Free (check individual)
  - **Scaling to 160×80**: 5× width, 2.5× height - would look very pixelated

**License**: Varies per creator (often CC0 or permissive)

---

### 4. Screaming Brain Studios
**Website**: https://screamingbrainstudios.com

#### Available Packs:

- **Isometric Grids Pack**
  - Resolution: **Small (32×16), Medium (64×32), Large (128×64)**
  - Style: Isometric grids and tiles
  - Use case: Designing isometric pixel art, building maps
  - License: Check individual
  - **Scaling to 160×80**:
    - 32×16: 5× width, 5× height - would look very pixelated
    - 64×32: 2.5× width, 2.5× height - would look pixelated but acceptable
    - 128×64: 1.25× width, 1.25× height - **BEST OPTION!** Clean scaling
  - **Note**: 128×64 version would scale very well to 160×80

### 5. GameDevMarket / Other Commercial Sources

#### Notable Packs:

- **Isometric World - Complete Game Assets Pack** (by MGG)
  - Resolution: Buildings 300×300 to 550×550, Tiles 160×160
  - Style: Detailed isometric assets
  - Use case: High-detail isometric games
  - License: Commercial (not free)
  - **Scaling to 160×80**: Tiles are 160×160 (square) - would need to crop/scale
  - **Note**: Not free, but tiles are close to your target size

- **Isometric Game Tileset** (by AnkitMartin)
  - Resolution: 32×32 pixels
  - Style: Classic isometric look
  - Use case: Classic isometric games
  - License: Commercial (not free)
  - **Scaling to 160×80**: 5× width, 2.5× height - would look very pixelated

- **2D Isometric Starter Pack** (by SoulHerder)
  - Resolution: 30-degree isometric blocks (size not specified)
  - Style: Layered AI files for easy modification
  - Use case: Customizable isometric games
  - License: Commercial (not free)
  - **Note**: Vector-based, can scale to any size

### 6. Art Game Sound
**Website**: https://artgamesound.com

**Focus**: CC0 assets only (no attribution required)

**Resolution Range**: Varies, but focuses on high-quality CC0 assets
**Use case**: Quick asset discovery for CC0-only projects

---

## Resolution Analysis

### Common Isometric Resolutions:

1. **16×16 pixels**
   - **Use case**: Mobile games, very small-scale games
   - **Scaling**: Poor when scaled to 160×80 (10× width, 5× height)
   - **Quality**: Blurry and pixelated at larger sizes
   - **Examples**: Kenney Tiny Town, Tiny Dungeon

2. **32×32 pixels**
   - **Use case**: Small to medium-scale isometric games
   - **Scaling**: Better than 16×16, but still pixelated at 160×80 (5× width, 2.5× height)
   - **Quality**: Acceptable at 64×32 (2×) or 96×48 (3×)
   - **Examples**: Many OpenGameArt packs, Itch.io packs

3. **64×32 pixels**
   - **Use case**: Standard isometric games (most common)
   - **Scaling**: Perfect for 160×80 (2.5× width, 2.5× height) - clean scaling
   - **Quality**: Excellent at native size, good when scaled
   - **Examples**: Industry standard for isometric games

4. **64×64 pixels**
   - **Use case**: Higher detail isometric games, RPGs
   - **Scaling**: Would scale to 128×64 (2×) or 192×96 (3×)
   - **Quality**: Very detailed, but may be too large for some games
   - **Examples**: Gioe's Basic Isometric Tileset

5. **96×48 pixels**
   - **Use case**: Medium to large-scale isometric games
   - **Scaling**: Would scale to 192×96 (2×) or 288×144 (3×)
   - **Quality**: Good detail, professional quality
   - **Examples**: Some commercial isometric games

6. **128×64 pixels**
   - **Use case**: High-detail isometric games
   - **Scaling**: Would scale to 256×128 (2×)
   - **Quality**: Very high detail, professional quality
   - **Examples**: Premium isometric games

7. **160×80 pixels**
   - **Use case**: Very high detail isometric games (your current target)
   - **Scaling**: Native size - no scaling needed
   - **Quality**: Maximum detail
   - **Examples**: Very few free assets at this resolution

---

## Recommendations for Your Game (160×80 target)

### Best Options (Ranked):

1. **128×64 assets** (Scale 1.25× to 160×80) ⭐ **BEST OPTION**
   - **Pros**: 
     - Very clean scaling (only 1.25×)
     - Minimal pixelation
     - Close to target resolution
   - **Cons**: Less common than smaller sizes
   - **Sources**: Screaming Brain Studios Isometric Grids Pack (Large size)
   - **Quality**: Excellent - would look almost native

2. **64×32 assets** (Scale 2.5× to 160×80) ⭐ **GOOD OPTION**
   - **Pros**: 
     - Clean scaling (2.5× is reasonable)
     - Widely available
     - Standard isometric resolution
   - **Cons**: Will look slightly pixelated (but much better than 16×16)
   - **Sources**: Screaming Brain Studios (Medium), various Itch.io packs
   - **Quality**: Good - acceptable pixelation

3. **96×48 assets** (Scale 1.67× to 160×80) ⭐ **GOOD OPTION**
   - **Pros**: 
     - Very clean scaling (1.67×)
     - Close to target resolution
   - **Cons**: Less common
   - **Sources**: Some commercial packs, may need to search
   - **Quality**: Excellent - would look almost native

4. **32×32 assets** (Scale 5× to 160×80) ⚠️ **ACCEPTABLE**
   - **Pros**: More available than 64×32
   - **Cons**: Will look pixelated (but better than 16×16)
   - **Sources**: OpenGameArt, Itch.io (many packs)
   - **Quality**: Acceptable - noticeable pixelation but usable

5. **Native 160×80 assets** ⭐ **PERFECT BUT RARE**
   - **Pros**: Perfect quality, no scaling
   - **Cons**: Very rare, may need to create custom
   - **Sources**: May need to commission or create yourself
   - **Quality**: Perfect - no scaling artifacts

6. **256×512 assets** (Kenney Miniature Library) ❌ **TOO LARGE**
   - **Pros**: Very high detail
   - **Cons**: Would need to scale DOWN (0.625× width, 0.156× height)
   - **Sources**: Kenney Isometric Miniature Library
   - **Quality**: Would lose detail when scaled down

### Alternative Approach:

**Use programmatic generation** (current approach)
- **Pros**: 
  - Native 160×80 resolution
  - No scaling artifacts
  - Can add textures and details
  - Full control over appearance
- **Cons**: 
  - Less "artistic" than hand-drawn assets
  - Requires code to generate
  - May look more "procedural"

---

## Where to Find Assets

### Free Sources:
1. **Kenney.nl** - https://kenney.nl/assets
2. **OpenGameArt.org** - https://opengameart.org
3. **Itch.io Free Assets** - https://itch.io/game-assets/free
4. **Art Game Sound** - https://artgamesound.com (CC0 only)

### Search Terms:
- "isometric tileset 64×32"
- "isometric tileset 32×32"
- "free isometric assets"
- "CC0 isometric tiles"
- "open source isometric game assets"

### Filtering Tips:
- Look for "isometric" not "top-down"
- Check resolution in asset description
- Verify license (CC0 preferred, CC-BY acceptable)
- Test scaling before committing

---

## Summary Table

| Resolution | Scale to 160×80 | Quality | Availability | Best For |
|------------|----------------|---------|--------------|----------|
| **16×16** | 10× width, 5× height | ❌ Very blurry | ✅ Very common | Mobile games |
| **32×16** | 5× width, 5× height | ⚠️ Pixelated | ✅ Common | Small games |
| **32×32** | 5× width, 2.5× height | ⚠️ Pixelated | ✅ Very common | Medium games |
| **64×32** | 2.5× width, 2.5× height | ✅ Good | ✅ Common | Standard games |
| **96×48** | 1.67× width, 1.67× height | ✅ Excellent | ⚠️ Less common | Medium-large games |
| **128×64** | 1.25× width, 1.25× height | ✅ Excellent | ⚠️ Less common | Large games |
| **160×80** | 1× (native) | ✅ Perfect | ❌ Very rare | Your target! |
| **256×512** | 0.625× width, 0.156× height | ❌ Too large | ⚠️ Rare | Very detailed games |

## Next Steps

### Immediate Actions:

1. **Download Screaming Brain Studios 128×64 pack** ⭐ **TOP PRIORITY**
   - URL: https://screamingbrainstudios.com/dl-isometric-grids-pack/
   - Resolution: 128×64 (Large size)
   - Scaling: Only 1.25× to reach 160×80 - **best option!**
   - Quality: Would look almost native

2. **Search for 64×32 isometric assets** ⭐ **SECOND PRIORITY**
   - Best balance of quality and availability
   - Scaling: 2.5× to reach 160×80 - acceptable
   - Sources: Screaming Brain Studios (Medium), Itch.io, OpenGameArt

3. **Continue with programmatic generation** ✅ **CURRENT APPROACH**
   - Native 160×80, no scaling artifacts
   - Better than 16×16 scaled assets
   - Can add textures and details
   - **Recommendation**: Keep using this while searching for better assets

4. **Consider 96×48 assets** (if found)
   - Very clean scaling (1.67×)
   - Would look almost native

### Long-term Options:

1. **Create custom 160×80 assets** - If budget allows
2. **Commission artist** - For native 160×80 assets
3. **Use vector-based assets** - Scale infinitely without quality loss

---

## Current Status

✅ **Using enhanced programmatic generation** - Native 160×80, no scaling artifacts
✅ **Better than 16×16 scaled assets** - Much clearer and less pixelated
✅ **Can add textures and details** - Full control over appearance

**Recommendation**: 
1. **Download Screaming Brain Studios 128×64 pack** (best free option)
2. **Continue with programmatic generation** as fallback
3. **Test 128×64 assets** - if they look good, use them; otherwise stick with programmatic

