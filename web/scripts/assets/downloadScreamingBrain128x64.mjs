#!/usr/bin/env node

/**
 * Download Screaming Brain Studios 128×64 Isometric Grids Pack
 * 
 * This script provides instructions for downloading the 128×64 isometric pack
 * which scales perfectly to our 160×80 target (only 1.25× scaling).
 * 
 * Manual download required:
 * 1. Visit: https://screamingbrainstudios.com/dl-isometric-grids-pack/
 * 2. Download the "Large" size pack (128×64)
 * 3. Extract to: web/public/assets/isometric/screaming-brain-128x64/
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const ASSETS_DIR = join(process.cwd(), 'public', 'assets', 'isometric', 'screaming-brain-128x64');
const README_PATH = join(ASSETS_DIR, 'README.md');

console.log('📦 Screaming Brain Studios 128×64 Isometric Pack Downloader\n');

// Create directory
try {
  mkdirSync(ASSETS_DIR, { recursive: true });
  console.log(`✅ Created directory: ${ASSETS_DIR}`);
} catch (error) {
  if (error.code !== 'EEXIST') {
    console.error('❌ Error creating directory:', error);
    process.exit(1);
  }
}

// Create README with download instructions
const readmeContent = `# Screaming Brain Studios 128×64 Isometric Grids Pack

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

After downloading, update \`web/src/assets/assetLoader.ts\` to use these assets:

\`\`\`typescript
const DEFAULT_ASSETS: Record<string, string> = {
  'tile:ground': '/assets/isometric/screaming-brain-128x64/ground.png',
  'tile:road': '/assets/isometric/screaming-brain-128x64/road.png',
  // ... etc
};
\`\`\`

## License

Check the license on the download page. Most Screaming Brain Studios assets are free for use, but verify the specific license for this pack.

## Current Status

⏳ **Awaiting download** - Manual download required from website
`;

writeFileSync(README_PATH, readmeContent);
console.log(`✅ Created README: ${README_PATH}\n`);

console.log('📋 Next Steps:');
console.log('1. Visit: https://screamingbrainstudios.com/dl-isometric-grids-pack/');
console.log('2. Download the "Large" size pack (128×64)');
console.log('3. Extract to:', ASSETS_DIR);
console.log('4. Run the integration script to update asset paths\n');

console.log('💡 Tip: The 128×64 pack will scale to 160×80 with only 1.25× scaling - excellent quality!');

