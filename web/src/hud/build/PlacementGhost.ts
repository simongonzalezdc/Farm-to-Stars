import Phaser from 'phaser';

import type { Orientation } from '../../types';

export type PlacementGhostState = 'valid' | 'blocked' | 'invalid' | 'unaffordable';

interface PlacementGhostPaletteEntry {
  tint: number;
  outline: number;
  alpha: number;
  outlineStrength: number;
  glow: number;
}

const DEFAULT_PALETTE: Record<PlacementGhostState, PlacementGhostPaletteEntry> = {
  valid: {
    tint: 0x6ef2c1,
    outline: 0x34d399,
    alpha: 0.9,
    outlineStrength: 1.0,
    glow: 0.32
  },
  blocked: {
    tint: 0xfbbf24,
    outline: 0xf97316,
    alpha: 0.82,
    outlineStrength: 1.15,
    glow: 0.28
  },
  invalid: {
    tint: 0xfb7185,
    outline: 0xf43f5e,
    alpha: 0.8,
    outlineStrength: 1.3,
    glow: 0.24
  },
  unaffordable: {
    tint: 0xfacc15,
    outline: 0xf59e0b,
    alpha: 0.78,
    outlineStrength: 1.0,
    glow: 0.2
  }
};

const FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

uniform vec3 uTint;
uniform vec3 uOutlineColor;
uniform float uAlpha;
uniform float uOutlineStrength;
uniform float uGlow;

void main() {
  vec4 tex = texture2D(uMainSampler, outTexCoord);
  if (tex.a <= 0.0) {
    discard;
  }

  float luminance = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
  vec3 base = mix(vec3(luminance), uTint, 0.8);

  float edge = smoothstep(0.0, 0.4, 1.0 - tex.a);
  vec3 outlined = mix(base, uOutlineColor, clamp(edge * uOutlineStrength, 0.0, 1.0));

  float glow = pow(luminance, 1.4) * uGlow;
  vec3 color = clamp(outlined + glow, 0.0, 1.0);

  gl_FragColor = vec4(color, tex.a * uAlpha);
}
`;

interface PlacementGhostPipelineInstance {
  set3f(name: string, x: number, y: number, z: number): void;
  set1f(name: string, value: number): void;
}

interface PlacementGhostPipelineManager {
  has(key: string): boolean;
  add(key: string, pipeline: PlacementGhostPipelineInstance): void;
  get(key: string): PlacementGhostPipelineInstance;
}

interface RendererWithPipelines {
  pipelines?: PlacementGhostPipelineManager;
}

interface SinglePipelineConstructor {
  new (config: Record<string, unknown>): PlacementGhostPipelineInstance;
}

const PipelineNamespace = Phaser.Renderer.WebGL.Pipelines as
  | { SinglePipeline?: SinglePipelineConstructor }
  | undefined;
const SinglePipeline = PipelineNamespace?.SinglePipeline;
const PlacementGhostPipeline = SinglePipeline
  ? class extends SinglePipeline {
      constructor(game: Phaser.Game) {
        super({
          game,
          renderer: game.renderer,
          fragShader: FRAGMENT_SHADER,
          uniforms: [
            'uProjectionMatrix',
            'uMainSampler',
            'uResolution',
            'uTint',
            'uOutlineColor',
            'uAlpha',
            'uOutlineStrength',
            'uGlow'
          ]
        });
      }
    }
  : null;

function toVec3(hex: number): [number, number, number] {
  const rgb = Phaser.Display.Color.IntegerToRGB(hex);
  return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
}

export interface PlacementGhostOptions {
  pipelineKey?: string;
  depth?: number;
  palette?: Partial<Record<PlacementGhostState, Partial<PlacementGhostPaletteEntry>>>;
}

export class PlacementGhost extends Phaser.GameObjects.Image {
  static readonly PIPELINE_KEY = 'placement-ghost';

  private readonly pipelineKey: string;
  private pipeline: PlacementGhostPipelineInstance | null = null;
  private readonly palette: Record<PlacementGhostState, PlacementGhostPaletteEntry>;
  private state: PlacementGhostState = 'valid';

  constructor(scene: Phaser.Scene, texture: string, options: PlacementGhostOptions = {}) {
    super(scene, 0, 0, texture);
    this.pipelineKey = options.pipelineKey ?? PlacementGhost.PIPELINE_KEY;
    this.palette = applyPaletteOverrides(options.palette);

    scene.add.existing(this);
    this.setDepth(options.depth ?? 950);
    this.setOrigin(0.5, 1.0);
    this.setVisible(false);
    this.setAlpha(1);

    if (this.ensurePipeline()) {
      this.setPipeline(this.pipelineKey);
    }
    this.refreshUniforms();
  }

  private ensurePipeline(): boolean {
    if (!PlacementGhostPipeline) {
      return false;
    }
    const renderer = this.scene.game.renderer as unknown as RendererWithPipelines;
    const manager = renderer.pipelines;
    if (!manager) {
      return false;
    }
    if (!manager.has(this.pipelineKey)) {
      manager.add(this.pipelineKey, new PlacementGhostPipeline(this.scene.game));
    }
    this.pipeline = manager.get(this.pipelineKey);
    return true;
  }

  private refreshUniforms() {
    const palette = this.palette[this.state];
    if (!this.pipeline) {
      this.setTint(palette.tint);
      this.setAlpha(Phaser.Math.Clamp(palette.alpha, 0, 1));
      return;
    }
    const [rt, gt, bt] = toVec3(palette.tint);
    const [ro, go, bo] = toVec3(palette.outline);

    this.pipeline.set3f('uTint', rt, gt, bt);
    this.pipeline.set3f('uOutlineColor', ro, go, bo);
    this.pipeline.set1f('uAlpha', Phaser.Math.Clamp(palette.alpha, 0, 1));
    this.pipeline.set1f('uOutlineStrength', Phaser.Math.Clamp(palette.outlineStrength, 0, 2));
    this.pipeline.set1f('uGlow', Phaser.Math.Clamp(palette.glow, 0, 1));
  }

  setState(state: PlacementGhostState) {
    if (this.state === state) {
      return;
    }
    this.state = state;
    this.refreshUniforms();
  }

  setPaletteState(state: PlacementGhostState, overrides: Partial<PlacementGhostPaletteEntry>) {
    this.palette[state] = {
      ...this.palette[state],
      ...overrides
    };
    if (this.state === state) {
      this.refreshUniforms();
    }
  }

  show(texture?: string) {
    if (texture) {
      this.setTexture(texture);
    }
    if (!this.visible) {
      this.setVisible(true);
    }
    this.refreshUniforms();
  }

  hide() {
    this.setVisible(false);
  }

  setOrientation(orientation: Orientation) {
    this.setRotation((Math.PI / 2) * orientation);
  }

  override setVisible(value: boolean): this {
    const result = super.setVisible(value);
    if (value) {
      this.refreshUniforms();
    }
    return result;
  }
}

function applyPaletteOverrides(
  overrides: PlacementGhostOptions['palette']
): Record<PlacementGhostState, PlacementGhostPaletteEntry> {
  if (!overrides) {
    return { ...DEFAULT_PALETTE };
  }
  const resolved: Partial<Record<PlacementGhostState, PlacementGhostPaletteEntry>> = {};
  for (const key of Object.keys(DEFAULT_PALETTE) as PlacementGhostState[]) {
    resolved[key] = {
      ...DEFAULT_PALETTE[key],
      ...overrides[key]
    } as PlacementGhostPaletteEntry;
  }
  return resolved as Record<PlacementGhostState, PlacementGhostPaletteEntry>;
}
