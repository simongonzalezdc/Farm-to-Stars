# Screaming Brain Studios 128×64 Isometric Grids Pack

## Why This Pack?

This pack contains **128×64 isometric tiles** which scale perfectly to our 160×80 target:
- **Scaling**: Only 1.25× (minimal pixelation)
- **Quality**: Excellent - would look almost native
- **Best free option** for 160×80 games

## Download Instructions

1. **Visit**: https://screamingbrainstudios.com/dl-isometric-grids-pack/
2. **Download**: The "Large" size pack (128×64)
3. **Extract**: Extract all files to this directory
4. **Verify**: Check that files are 128×64 pixels

## Integration

After downloading, update `web/src/assets/assetLoader.ts` to use these assets:

```typescript
const DEFAULT_ASSETS: Record<string, string> = {
  'tile:ground': '/assets/isometric/screaming-brain-128x64/ground.png',
  'tile:road': '/assets/isometric/screaming-brain-128x64/road.png',
  // ... etc
};
```

## License

Check the license on the download page. Most Screaming Brain Studios assets are free for use, but verify the specific license for this pack.

## Current Status

⏳ **Awaiting download** - Manual download required from website
