#!/usr/bin/env node
/**
 * Asset Download Script
 * Downloads open-source game assets from various sources
 * 
 * Usage: node scripts/assets/downloadAssets.mjs [source]
 * Sources: kenney, opengameart, itch
 */

import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ASSETS_DIR = join(process.cwd(), 'public', 'assets');
const TILES_DIR = join(ASSETS_DIR, 'tiles');
const BUILDINGS_DIR = join(ASSETS_DIR, 'buildings');
const CROPS_DIR = join(ASSETS_DIR, 'crops');
const UI_DIR = join(ASSETS_DIR, 'ui');
const ICONS_DIR = join(ASSETS_DIR, 'icons');

// Asset sources and download information
const ASSET_SOURCES = {
  kenney: {
    name: 'Kenney Assets',
    license: 'CC0',
    url: 'https://kenney.nl/assets',
    description: 'High-quality CC0 assets including isometric tiles, buildings, and UI elements',
    downloads: [
      {
        name: 'Tiny Town',
        url: 'https://kenney.nl/assets/tiny-town',
        description: 'Isometric town building assets',
        category: 'buildings'
      },
      {
        name: 'Tiny Farm',
        url: 'https://kenney.nl/assets/tiny-farm',
        description: 'Farming and agricultural assets',
        category: 'crops'
      },
      {
        name: 'Tiny Dungeon',
        url: 'https://kenney.nl/assets/tiny-dungeon',
        description: 'Isometric tiles and props',
        category: 'tiles'
      },
      {
        name: 'UI Pack',
        url: 'https://kenney.nl/assets/ui-pack',
        description: 'User interface elements',
        category: 'ui'
      }
    ]
  },
  opengameart: {
    name: 'OpenGameArt',
    license: 'Various (CC0/CC-BY)',
    url: 'https://opengameart.org',
    description: 'Community-driven open-source game assets',
    downloads: [
      {
        name: 'Isometric Tileset',
        url: 'https://opengameart.org/content/isometric-tileset',
        description: 'Isometric ground and terrain tiles',
        category: 'tiles'
      },
      {
        name: 'Free Fantasy Game GUI',
        url: 'https://opengameart.org/content/free-fantasy-game-gui',
        description: 'UI elements for fantasy/strategy games',
        category: 'ui'
      }
    ]
  },
  itch: {
    name: 'Itch.io Free Assets',
    license: 'Various (check per asset)',
    url: 'https://itch.io/game-assets/free',
    description: 'Free game assets from indie developers',
    downloads: [
      {
        name: 'Tactical 2D Game Tile Set',
        url: 'https://free-game-assets.itch.io/tactical-2d-game-tile-set',
        description: 'Tiles for strategy games',
        category: 'tiles'
      },
      {
        name: 'Fantasy Strategy GUI',
        url: 'https://free-game-assets.itch.io/fantasy-strategy-gui',
        description: 'UI elements for strategy games',
        category: 'ui'
      }
    ]
  }
};

async function ensureDirectories() {
  const dirs = [ASSETS_DIR, TILES_DIR, BUILDINGS_DIR, CROPS_DIR, UI_DIR, ICONS_DIR];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

async function downloadFromUrl(url, destPath) {
  try {
    console.log(`Downloading from ${url}...`);
    // Use curl to download
    execSync(`curl -L -o "${destPath}" "${url}"`, { stdio: 'inherit' });
    console.log(`Downloaded to ${destPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to download from ${url}:`, error.message);
    return false;
  }
}

async function createAssetManifest() {
  const manifest = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    sources: Object.entries(ASSET_SOURCES).map(([key, source]) => ({
      id: key,
      name: source.name,
      license: source.license,
      url: source.url
    })),
    assets: {
      tiles: [],
      buildings: [],
      crops: [],
      ui: [],
      icons: []
    }
  };

  const manifestPath = join(ASSETS_DIR, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Created asset manifest: ${manifestPath}`);
}

function printInstructions(source) {
  if (source && ASSET_SOURCES[source]) {
    const src = ASSET_SOURCES[source];
    console.log(`\n=== ${src.name} ===`);
    console.log(`License: ${src.license}`);
    console.log(`URL: ${src.url}`);
    console.log(`\nRecommended downloads:`);
    src.downloads.forEach((dl, i) => {
      console.log(`\n${i + 1}. ${dl.name}`);
      console.log(`   Category: ${dl.category}`);
      console.log(`   Description: ${dl.description}`);
      console.log(`   URL: ${dl.url}`);
      console.log(`   Save to: public/assets/${dl.category}/`);
    });
  } else {
    console.log('\n=== Available Asset Sources ===\n');
    Object.entries(ASSET_SOURCES).forEach(([key, source]) => {
      console.log(`${key}:`);
      console.log(`  Name: ${source.name}`);
      console.log(`  License: ${source.license}`);
      console.log(`  URL: ${source.url}`);
      console.log(`  Downloads: ${source.downloads.length} recommended packs\n`);
    });
  }
  
  console.log('\n=== Manual Download Instructions ===');
  console.log('1. Visit the URLs listed above');
  console.log('2. Download the asset packs (usually ZIP files)');
  console.log('3. Extract the ZIP files');
  console.log('4. Copy relevant assets to the appropriate directories:');
  console.log('   - Tiles: public/assets/tiles/');
  console.log('   - Buildings: public/assets/buildings/');
  console.log('   - Crops: public/assets/crops/');
  console.log('   - UI: public/assets/ui/');
  console.log('   - Icons: public/assets/icons/');
  console.log('\n5. Update CREDITS.md with attribution for CC-BY assets');
  console.log('6. Run this script again to update the manifest');
}

async function main() {
  const source = process.argv[2];
  
  console.log('Asset Download Helper\n');
  
  await ensureDirectories();
  await createAssetManifest();
  
  printInstructions(source);
  
  console.log('\n=== Next Steps ===');
  console.log('After downloading assets manually:');
  console.log('1. Review and resize assets to match 96x48 tile size if needed');
  console.log('2. Update web/src/main.ts to load external assets instead of generating programmatically');
  console.log('3. Test asset loading in the game');
  console.log('4. Update CREDITS.md with proper attribution');
}

main().catch(console.error);

