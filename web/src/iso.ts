// 96×48 pixel-iso diamond helpers
export const TILE_W = 96;
export const TILE_H = 48;

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
