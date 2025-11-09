# Open Source Asset Recommendations

## Isometric Pixel Art Assets (96×48 tiles)

### Recommended Sources:

1. **Kenney.nl** (CC0 - No attribution required)
   - https://kenney.nl/assets
   - Search for "isometric" or "top-down"
   - Has farming, city-building, and nature packs
   - All assets are CC0 (public domain)

2. **OpenGameArt.org** (Various licenses, check per asset)
   - https://opengameart.org/
   - Search: "isometric", "pixel art", "farming", "city building"
   - Filter by license: CC0 or CC-BY
   - Many isometric tilesets available

3. **Itch.io Free Assets** (Various licenses)
   - https://itch.io/game-assets/free
   - Search: "isometric", "pixel art", "farming"
   - Many indie developers share free assets

4. **Craftpix.net** (Some free packs)
   - https://craftpix.net/freebies/
   - Has free isometric packs (check license)

5. **GameDev Market** (Free section)
   - https://www.gamedevmarket.net/category/free/
   - Filter by "isometric" and "2D"

### Specific Recommendations for Your Game:

**For Isometric Tiles (96×48):**
- Look for "isometric tileset" or "isometric terrain"
- Your tiles are 96×48 pixels (diamond shape)
- You may need to resize/adapt assets to match your tile size

**For Buildings:**
- Search for "isometric buildings" or "isometric structures"
- Look for cottage, farm, well, market, tent sprites
- Your buildings need to match the isometric perspective

**For Crops/Plants:**
- Search for "isometric crops" or "farming sprites"
- Wheat, potatoes, berries, trees
- Should match isometric view

**For Ground Tiles:**
- Grass, dirt, road, water tiles
- Isometric ground textures

### License Notes:
- **CC0** = Public domain, no attribution needed (preferred)
- **CC-BY** = Attribution required (check what's needed)
- **No NC** = No commercial use restrictions (avoid these)

### Integration Tips:
1. Assets may need resizing to match your 96×48 tile size
2. You'll need to convert to Phaser texture format
3. Consider creating a texture atlas for better performance
4. Match the pixel art style (no anti-aliasing)

### Current Status:
The game currently uses procedurally generated graphics via Phaser's Graphics API. This is why it looks plain - you need actual sprite assets to replace the generated shapes.

