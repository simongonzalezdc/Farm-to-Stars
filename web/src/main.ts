import Phaser from 'phaser';
import { gridToScreen, TILE_W, TILE_H } from './iso';
import { defaultState, type GameState } from './types';
import { load, save } from './storage';
import { enableAudio, toggleMute } from './audio';
import { tick, fmt } from './world';

const woodEl = document.getElementById('wood')!;
const stoneEl = document.getElementById('stone')!;
(document.getElementById('installAudio') as HTMLButtonElement).addEventListener('click', enableAudio);
(document.getElementById('mute') as HTMLButtonElement).addEventListener('click', () => {
  const m = toggleMute();
  (document.getElementById('mute') as HTMLButtonElement).setAttribute('aria-pressed', String(m));
});

type PerformanceWithMemory = Performance & {
  memory?: {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

class DebugOverlay {
  private readonly container: HTMLDivElement;
  private frameCount = 0;
  private lastSample = performance.now();
  private fps = 0;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'debug-overlay';
    this.container.style.position = 'fixed';
    this.container.style.right = '0.5rem';
    this.container.style.bottom = '0.5rem';
    this.container.style.padding = '0.25rem 0.5rem';
    this.container.style.background = 'rgba(0, 0, 0, 0.6)';
    this.container.style.color = '#ffffff';
    this.container.style.fontFamily = 'monospace';
    this.container.style.fontSize = '0.75rem';
    this.container.style.zIndex = '1000';
    this.container.setAttribute('aria-live', 'polite');
    document.body.appendChild(this.container);
  }

  update(deltaMs: number) {
    this.frameCount += 1;
    const now = performance.now();
    const elapsed = now - this.lastSample;
    if (elapsed >= 500) {
      this.fps = (this.frameCount * 1000) / elapsed;
      this.frameCount = 0;
      this.lastSample = now;
    }

    const memoryInfo = (performance as PerformanceWithMemory).memory;
    const memoryText = memoryInfo
      ? ` | Mem: ${(memoryInfo.usedJSHeapSize / 1048576).toFixed(1)} / ${(
          memoryInfo.jsHeapSizeLimit / 1048576
        ).toFixed(0)} MB`
      : '';

    this.container.textContent = `FPS: ${this.fps.toFixed(1)} | Frame: ${deltaMs.toFixed(2)} ms${memoryText}`;
  }
}

const debugOverlay = new DebugOverlay();

class IsoScene extends Phaser.Scene {
  state: GameState = defaultState();
  private accum = 0;
  private ground!: Phaser.GameObjects.Container;
  private props!: Phaser.GameObjects.Container;

  preload() {
    // placeholder pixel-iso textures (replace with real atlas later)
    const g = this.add.graphics({ x: 0, y: 0 });

    // ground diamond (pixel crisp)
    g.fillStyle(0x2b2f33, 1);
    g.fillPoints(
      [{ x: TILE_W / 2, y: 0 }, { x: TILE_W, y: TILE_H / 2 }, { x: TILE_W / 2, y: TILE_H }, { x: 0, y: TILE_H / 2 }],
      true
    );
    g.generateTexture('tile:ground', TILE_W, TILE_H);
    g.clear();

    // road diamond
    g.fillStyle(0x444444, 1);
    g.fillPoints(
      [{ x: TILE_W / 2, y: 4 }, { x: TILE_W - 4, y: TILE_H / 2 }, { x: TILE_W / 2, y: TILE_H - 4 }, { x: 4, y: TILE_H / 2 }],
      true
    );
    g.generateTexture('tile:road', TILE_W, TILE_H);
    g.clear();

    // cottage (simple pixel block to start)
    g.fillStyle(0xb38b6d, 1);
    g.fillRect(0, 0, 52, 36);
    g.generateTexture('prop:cottage', 52, 36);
    g.destroy();
  }

  async create() {
    const loaded = await load();
    this.state = loaded ?? defaultState();

    const cam = this.cameras.main;
    cam.setBackgroundColor('#0e0e10');
    cam.centerOn(0, 0);
    cam.setZoom(1.0);
    cam.roundPixels = true; // keep pixels crisp at sub-pixel positions

    this.ground = this.add.container(0, 0);
    this.props = this.add.container(0, 0);

    // tiny 20×20 patch to start
    for (let iy = 0; iy < 20; iy++) {
      for (let ix = 0; ix < 20; ix++) {
        const { x, y } = gridToScreen(ix, iy, 0);
        const key = (ix + iy) % 5 === 0 ? 'tile:road' : 'tile:ground';
        const t = this.add.image(x, y, key).setOrigin(0.5, 0.5);
        this.ground.add(t);
      }
    }

    // one cottage at (10,10), shifted up a bit to sit on diamond
    const { x, y } = gridToScreen(10, 10, 8);
    const house = this.add.image(x, y - 8, 'prop:cottage').setOrigin(0.5, 1.0);
    this.props.add(house);

    // drag to pan
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown) {
        cam.scrollX -= p.velocity.x / cam.zoom;
        cam.scrollY -= p.velocity.y / cam.zoom;
      }
    });

    // wheel to zoom (clamped for readability on web+mobile)
    this.input.on('wheel', (_p: any, _go: any, _dx: number, dy: number) => {
      const next = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.75, 2.25);
      cam.setZoom(next);
    });

    // autosave every 5s
    this.time.addEvent({ delay: 5000, loop: true, callback: () => save(this.state) });
  }

  update(_time: number, deltaMs: number) {
    // fixed 10 Hz sim (you can switch to 20 Hz by changing 0.1 → 0.05)
    this.accum += deltaMs / 1000;
    while (this.accum >= 0.1) {
      tick(this.state, 0.1);
      this.accum -= 0.1;
    }

    woodEl.textContent = fmt(this.state.resources.wood);
    stoneEl.textContent = fmt(this.state.resources.stone);

    // y-sort props by screen y
    this.props.list.sort((a, b) => (a as any).y - (b as any).y);

    debugOverlay.update(deltaMs);
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: window.innerWidth,
  height: window.innerHeight,
  scene: [IsoScene],
  render: { pixelArt: true, antialias: false },
  scale: { mode: Phaser.Scale.RESIZE }
};

new Phaser.Game(config);
