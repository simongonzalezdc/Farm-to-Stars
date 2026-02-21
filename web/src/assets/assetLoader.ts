/**
 * Asset Loader
 * Handles loading external game assets (sprites, tiles, UI elements)
 * Falls back to programmatic generation if assets are not available
 */

import type { Scene } from 'phaser';

export interface AssetManifest {
  version: string;
  lastUpdated: string;
  assets: {
    tiles: AssetEntry[];
    buildings: AssetEntry[];
    crops: AssetEntry[];
    ui: AssetEntry[];
    icons: AssetEntry[];
  };
}

export interface AssetEntry {
  key: string;
  path: string;
  width?: number;
  height?: number;
  description?: string;
}

const SKETCH_TOWN_DIR = '/assets/kenney/sketch-town/Tiles';
const SKETCH_TOWN_EXPANSION_DIR = '/assets/kenney/sketch-town-expansion/Tiles';
const SKETCH_DESERT_DIR = '/assets/kenney/sketch-desert/Tiles';
const LEGACY_ISO_DIR = '/assets/isometric/screaming-brain-128x64';
const TINY_TOWN_DIR = '/assets/tiles';

/**
 * Default asset paths - can be overridden by manifest
 * Maps game asset keys to downloaded tiles.
 *
 * Priority order:
 * 1. Kenney Sketch Town / Sketch Desert packs (homestead look & feel)
 * 2. Legacy 128×64 premium pack (if teams have it locally)
 * 3. 16×16 Kenney Tiny Town tiles – low-res fallback
 * 4. Programmatic generation – always available safety net
 */
const DEFAULT_ASSETS: Record<string, string> = {
  // --- Primary Sketch Town tiles for the homestead phase ---
  'tile:ground': `${SKETCH_TOWN_DIR}/grass_center_E.png`,
  'tile:ground:dry': `${SKETCH_DESERT_DIR}/dirt_center_E.png`,
  'tile:road': `${SKETCH_TOWN_DIR}/grass_path_E.png`,
  'tile:road:horizontal': `${SKETCH_TOWN_DIR}/grass_path_E.png`,
  'tile:road:vertical': `${SKETCH_TOWN_DIR}/grass_path_N.png`,
  'tile:road:intersection': `${SKETCH_TOWN_DIR}/grass_pathCrossing_E.png`,
  'tile:plot': `${SKETCH_TOWN_EXPANSION_DIR}/furrow_crop_E.png`,
  'tile:water': `${SKETCH_TOWN_DIR}/water_center_E.png`,

  // --- Legacy 128×64 premium pack (kept for teams who already have it locally) ---
  'tile:ground:premium': `${LEGACY_ISO_DIR}/ground/ground-tile.png`,
  'tile:road:premium': `${LEGACY_ISO_DIR}/roads/road-tile.png`,
  'tile:water:premium': `${LEGACY_ISO_DIR}/water/water-tile.png`,

  // --- 16×16 Kenney Tiny Town fallback ---
  'tile:ground_kenney': `${TINY_TOWN_DIR}/tile_0000.png`,
  'tile:water_kenney': `${TINY_TOWN_DIR}/tile_0001.png`,
  'tile:road_kenney': `${TINY_TOWN_DIR}/tile_0002.png`,
  'tile:dirt': `${TINY_TOWN_DIR}/tile_0003.png`,

  // Buildings - mapped to sketch homestead props
  'prop:cottage': `${SKETCH_TOWN_DIR}/building_center_E.png`,
  'prop:well': `${SKETCH_TOWN_EXPANSION_DIR}/well_E.png`,
  'prop:tent': `${SKETCH_DESERT_DIR}/structure_tent_E.png`,
  'prop:crate': `${SKETCH_TOWN_EXPANSION_DIR}/grass_block_E.png`,
  'prop:market': `${SKETCH_TOWN_DIR}/structure_arch_E.png`,

  // UI elements - placeholder paths (overridden once Pixel Adventure UI is wired up)
  'ui:button': '/assets/ui/ui-button.png',
  'ui:panel': '/assets/ui/ui-panel.png',
  'ui:icon': '/assets/ui/ui-icon.png'
};

/**
 * Load assets from manifest or use defaults
 */
export async function loadAssetManifest(): Promise<AssetManifest | null> {
  try {
    const response = await fetch('/assets/manifest.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Could not load asset manifest:', error);
  }
  return null;
}

/**
 * Load a single asset with fallback
 * Returns true if asset was queued for loading, false if it should be generated programmatically
 *
 * Note: Missing files will trigger 'fileerror' events, which are handled in main.ts
 * to suppress console errors and generate programmatic fallbacks.
 */
export function loadAsset(scene: Scene, key: string, fallbackPath?: string): boolean {
  const path = DEFAULT_ASSETS[key] || fallbackPath;

  if (path) {
    try {
      // Try to load external asset
      // Note: Phaser will handle scaling 16x16 tiles to match game's tile size
      // Missing files will trigger 'fileerror' events, which are handled in main.ts
      scene.load.image(key, path);
      return true;
    } catch (error) {
      // Silently fail - asset will be generated programmatically
      return false;
    }
  }

  // Asset will be generated programmatically in preload()
  return false;
}

/**
 * Load all game assets
 * Returns a set of asset keys that were successfully loaded
 *
 * Priority: Sketch Town assets > legacy premium > 16×16 fallback > programmatic
 *
 * Note: This function queues assets for loading. The actual check of which
 * assets loaded successfully happens after Phaser's load completes.
 * We return an empty set here - the caller should check textures.exists()
 * after loading completes to see which assets are actually available.
 */
export function loadGameAssets(scene: Scene): Set<string> {
  const loadedAssets = new Set<string>();

  // Try 128×64 assets first (best quality) - may not exist yet
  loadAsset(scene, 'tile:ground');
  loadAsset(scene, 'tile:road');
  loadAsset(scene, 'tile:road:horizontal');
  loadAsset(scene, 'tile:road:vertical');
  loadAsset(scene, 'tile:road:intersection');
  loadAsset(scene, 'tile:water');
  loadAsset(scene, 'tile:ground:dry');
  loadAsset(scene, 'tile:plot');

  // Also try 16×16 Kenney fallbacks (these should exist)
  loadAsset(scene, 'tile:ground_kenney');
  loadAsset(scene, 'tile:road_kenney');
  loadAsset(scene, 'tile:water_kenney');

  // Load other tiles (16×16 fallback)
  loadAsset(scene, 'tile:dirt');

  // Load buildings (these should exist from Kenney downloads)
  loadAsset(scene, 'prop:cottage');
  loadAsset(scene, 'prop:well');
  loadAsset(scene, 'prop:tent');
  loadAsset(scene, 'prop:crate');
  loadAsset(scene, 'prop:market');

  // Load UI elements (now available from Kenney UI Pack)
  loadAsset(scene, 'ui:button');
  loadAsset(scene, 'ui:panel');
  loadAsset(scene, 'ui:icon');

  // Return empty set - actual availability will be checked after load completes
  // The caller should use scene.textures.exists() to verify which assets loaded
  return loadedAssets;
}

/**
 * Check if an asset exists (for conditional loading)
 */
export function hasAsset(key: string): boolean {
  return key in DEFAULT_ASSETS;
}

/**
 * Get asset path for a given key
 */
export function getAssetPath(key: string): string | undefined {
  return DEFAULT_ASSETS[key];
}
