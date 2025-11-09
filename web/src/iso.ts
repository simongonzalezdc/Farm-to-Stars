// 160×80 pixel-iso diamond helpers
// Higher resolution for better visual clarity and reduced pixelation
// - 160×80 = 10×16 × 5×16 (clean scaling from 16×16 assets)
// - Much better detail and clarity than 96×48
// - Reduces pixelation while maintaining good performance
// - Large enough to see details clearly
export const TILE_W = 160;
export const TILE_H = 80;

export function gridToScreen(ix: number, iy: number, height = 0) {
  const x = (ix - iy) * (TILE_W / 2);
  const y = (ix + iy) * (TILE_H / 2) - height;
  return { x, y };
}

export function screenToGrid(x: number, y: number) {
  const ix = Math.floor((y / (TILE_H / 2) + x / (TILE_W / 2)) / 2);
  const iy = Math.floor((y / (TILE_H / 2) - x / (TILE_W / 2)) / 2);
  return { ix, iy };
}
