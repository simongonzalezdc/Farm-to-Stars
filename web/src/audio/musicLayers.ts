import * as Tone from 'tone';
import type { SeasonId } from '../state/seasons';

type Disposable = { dispose: () => void };

export interface SeasonMusicSnapshot {
  activeSeason: SeasonId | null;
  layers: Array<{
    id: SeasonId;
    currentVolume: number;
    targetVolume: number;
    defaultVolume: number;
  }>;
}

export interface SeasonMusicController {
  setSeason(season: SeasonId, options?: { immediate?: boolean }): void;
  setSeasonVolume(season: SeasonId, volume: number): void;
  getActiveSeason(): SeasonId | null;
  getSnapshot(): SeasonMusicSnapshot;
  dispose(): void;
}

export interface SeasonMusicConfig {
  crossfadeSeconds?: number;
  volumes?: Partial<Record<SeasonId, number>>;
  /**
   * When provided, debug logging will be triggered whenever the active season changes
   * or when the mix configuration is updated. Passing `true` uses the default logger.
   */
  debug?: boolean | ((snapshot: SeasonMusicSnapshot) => void);
}

const DEFAULT_CROSSFADE = 3.5;

export const DEFAULT_SEASON_VOLUMES: Record<SeasonId, number> = {
  spring: 0.7,
  summer: 0.65,
  autumn: 0.6,
  winter: 0.55
};

interface SeasonLayer extends Disposable {
  readonly id: SeasonId;
  defaultVolume: number;
  targetVolume: number;
  ensureStarted(): void;
  rampTo(volume: number, duration: number): void;
  getCurrentVolume(): number;
}

function createSeasonLayer(
  id: SeasonId,
  destination: Tone.Gain,
  defaultVolume: number
): SeasonLayer {
  switch (id) {
    case 'spring':
      return createSpringLayer(destination, defaultVolume);
    case 'summer':
      return createSummerLayer(destination, defaultVolume);
    case 'autumn':
      return createAutumnLayer(destination, defaultVolume);
    case 'winter':
      return createWinterLayer(destination, defaultVolume);
  }
}

function createLayer(
  id: SeasonId,
  destination: Tone.Gain,
  initialVolume: number,
  setup: (gain: Tone.Gain) => { loops: Tone.Loop[]; disposables: Disposable[] }
): SeasonLayer {
  const gain = new Tone.Gain(0).connect(destination);
  const { loops, disposables } = setup(gain);
  let started = false;
  let targetVolume = 0;
  let defaultVolume = initialVolume;

  function ensureStarted() {
    if (started) {
      return;
    }
    for (const loop of loops) {
      if (loop.state !== 'started') {
        loop.start(0);
      }
    }
    started = true;
  }

  return {
    id,
    get defaultVolume() {
      return defaultVolume;
    },
    set defaultVolume(volume: number) {
      defaultVolume = volume;
    },
    get targetVolume() {
      return targetVolume;
    },
    set targetVolume(volume: number) {
      targetVolume = volume;
    },
    ensureStarted,
    rampTo(volume: number, duration: number) {
      ensureStarted();
      targetVolume = volume;
      gain.gain.rampTo(volume, Math.max(duration, 0));
    },
    getCurrentVolume() {
      return gain.gain.value;
    },
    dispose() {
      for (const loop of loops) {
        loop.dispose();
      }
      for (const node of disposables) {
        node.dispose();
      }
      gain.dispose();
    }
  };
}

function createSpringLayer(destination: Tone.Gain, volume: number): SeasonLayer {
  return createLayer('spring', destination, volume, (gain) => {
    const padSynth = new Tone.PolySynth(Tone.Synth, {
      volume: -6,
      envelope: { attack: 1.5, decay: 0.3, sustain: 0.8, release: 3.5 },
      oscillator: { type: 'sine' }
    }).connect(gain);
    const bassSynth = new Tone.MonoSynth({
      volume: -12,
      oscillator: { type: 'triangle' },
      filter: { type: 'lowpass', Q: 1.5, rolloff: -24 },
      envelope: { attack: 0.3, decay: 0.4, sustain: 0.5, release: 1.2 }
    }).connect(gain);

    const padProgression = ['C4', 'G4', 'A4', 'F4'];
    let padStep = 0;
    const padLoop = new Tone.Loop((time) => {
      const root = padProgression[padStep % padProgression.length];
      const third = Tone.Frequency(root).transpose(4).toNote();
      padSynth.triggerAttackRelease([root, third], '2m', time);
      padStep += 1;
    }, '4m');

    const bassProgression = ['C2', 'G2', 'A2', 'F2'];
    let bassStep = 0;
    const bassLoop = new Tone.Loop((time) => {
      const root = bassProgression[bassStep % bassProgression.length];
      bassSynth.triggerAttackRelease(root, '1m', time);
      bassStep += 1;
    }, '2m');

    return {
      loops: [padLoop, bassLoop],
      disposables: [padSynth, bassSynth]
    };
  });
}

function createSummerLayer(destination: Tone.Gain, volume: number): SeasonLayer {
  return createLayer('summer', destination, volume, (gain) => {
    const filter = new Tone.Filter({ type: 'lowpass', frequency: 1200, Q: 0.8 }).connect(gain);
    const padSynth = new Tone.PolySynth(Tone.Synth, {
      volume: -8,
      envelope: { attack: 0.8, decay: 0.2, sustain: 0.6, release: 2.5 },
      oscillator: { type: 'sawtooth' }
    }).connect(filter);
    const pluck = new Tone.PluckSynth({
      dampening: 3000,
      resonance: 0.6
    }).connect(gain);

    const padProgression = ['A3', 'E4', 'F#4', 'D4'];
    let padStep = 0;
    const padLoop = new Tone.Loop((time) => {
      const root = padProgression[padStep % padProgression.length];
      const fifth = Tone.Frequency(root).transpose(7).toNote();
      padSynth.triggerAttackRelease([root, fifth], '2m', time);
      padStep += 1;
    }, '4m');

    const melody = ['A4', 'C#5', 'B4', 'E5'];
    let melodyStep = 0;
    const pluckLoop = new Tone.Loop((time) => {
      const note = melody[melodyStep % melody.length];
      pluck.triggerAttackRelease(note, '8n', time);
      melodyStep += 1;
    }, '1m');

    return {
      loops: [padLoop, pluckLoop],
      disposables: [padSynth, filter, pluck]
    };
  });
}

function createAutumnLayer(destination: Tone.Gain, volume: number): SeasonLayer {
  return createLayer('autumn', destination, volume, (gain) => {
    const chorus = new Tone.Chorus({ frequency: 0.6, delayTime: 2.5, depth: 0.5, wet: 0.4 }).start();
    const padSynth = new Tone.PolySynth(Tone.AMSynth, {
      envelope: { attack: 1.2, decay: 0.4, sustain: 0.7, release: 3.8 },
      harmonicity: 2.5,
      modulationIndex: 1.2,
      oscillator: { type: 'sine' }
    }).connect(chorus);
    chorus.connect(gain);

    const bells = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.3, release: 0.4 },
      harmonicity: 12,
      modulationIndex: 16,
      resonance: 800
    }).connect(gain);

    const padProgression = ['F3', 'C4', 'D4', 'Bb3'];
    let padStep = 0;
    const padLoop = new Tone.Loop((time) => {
      const root = padProgression[padStep % padProgression.length];
      const seventh = Tone.Frequency(root).transpose(10).toNote();
      padSynth.triggerAttackRelease([root, seventh], '2m', time);
      padStep += 1;
    }, '4m');

    let bellStep = 0;
    const bellLoop = new Tone.Loop((time) => {
      if (bellStep % 4 === 0) {
        const note = Tone.Frequency('C5').transpose((bellStep / 4) % 2 === 0 ? -2 : 0).toFrequency();
        bells.triggerAttackRelease(note, '16n', time);
      }
      bellStep += 1;
    }, '2n');

    return {
      loops: [padLoop, bellLoop],
      disposables: [padSynth, chorus, bells]
    };
  });
}

function createWinterLayer(destination: Tone.Gain, volume: number): SeasonLayer {
  return createLayer('winter', destination, volume, (gain) => {
    const reverb = new Tone.Reverb({ decay: 5, wet: 0.5, preDelay: 0.2 }).connect(gain);
    const padSynth = new Tone.PolySynth(Tone.FMSynth, {
      envelope: { attack: 2.5, decay: 0.6, sustain: 0.5, release: 5 },
      harmonicity: 0.5,
      modulationIndex: 8,
      oscillator: { type: 'triangle' }
    }).connect(reverb);
    const shimmer = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 1.4, sustain: 0, release: 3.2 }
    }).connect(reverb);

    const padProgression = ['D3', 'A3', 'G3', 'A3'];
    let padStep = 0;
    const padLoop = new Tone.Loop((time) => {
      const root = padProgression[padStep % padProgression.length];
      const fifth = Tone.Frequency(root).transpose(7).toNote();
      padSynth.triggerAttackRelease([root, fifth], '4m', time);
      padStep += 1;
    }, '8m');

    let shimmerStep = 0;
    const shimmerLoop = new Tone.Loop((time) => {
      if (shimmerStep % 6 === 0) {
        const note = Tone.Frequency('A5').transpose(shimmerStep % 12 === 0 ? -5 : -12).toNote();
        shimmer.triggerAttackRelease(note, '2n', time);
      }
      shimmerStep += 1;
    }, '1m');

    return {
      loops: [padLoop, shimmerLoop],
      disposables: [padSynth, shimmer, reverb]
    };
  });
}

export function createSeasonMusicController(
  destination: Tone.Gain,
  config: SeasonMusicConfig = {}
): SeasonMusicController {
  const crossfade = config.crossfadeSeconds ?? DEFAULT_CROSSFADE;
  const volumes: Record<SeasonId, number> = { ...DEFAULT_SEASON_VOLUMES, ...(config.volumes ?? {}) };
  const layers = new Map<SeasonId, SeasonLayer>();
  let active: SeasonLayer | null = null;

  function debugSnapshot() {
    if (!config.debug) {
      return;
    }
    const snapshot = getSnapshot();
    if (typeof config.debug === 'function') {
      config.debug(snapshot);
      return;
    }
    logSeasonMusicState(snapshot, 'season-music');
  }

  function getLayer(id: SeasonId): SeasonLayer {
    let layer = layers.get(id);
    if (!layer) {
      layer = createSeasonLayer(id, destination, volumes[id]);
      layers.set(id, layer);
    }
    return layer;
  }

  function setSeason(season: SeasonId, options?: { immediate?: boolean }) {
    const layer = getLayer(season);
    const fade = options?.immediate ? 0 : crossfade;
    layer.rampTo(volumes[season], fade);
    if (active && active !== layer) {
      active.rampTo(0, fade);
    }
    active = layer;
    debugSnapshot();
  }

  function setSeasonVolume(season: SeasonId, volume: number) {
    volumes[season] = volume;
    const layer = layers.get(season);
    if (layer) {
      layer.defaultVolume = volume;
      if (layer === active) {
        layer.rampTo(volume, 0.5);
      }
    }
    debugSnapshot();
  }

  function getSnapshot(): SeasonMusicSnapshot {
    return {
      activeSeason: active?.id ?? null,
      layers: Array.from(layers.values()).map((layer) => ({
        id: layer.id,
        currentVolume: layer.getCurrentVolume(),
        targetVolume: layer.targetVolume,
        defaultVolume: layer.defaultVolume
      }))
    };
  }

  function dispose() {
    for (const layer of layers.values()) {
      layer.dispose();
    }
    layers.clear();
  }

  return {
    setSeason,
    setSeasonVolume,
    getActiveSeason() {
      return active?.id ?? null;
    },
    getSnapshot,
    dispose
  };
}

export function logSeasonMusicState(snapshot: SeasonMusicSnapshot, label = 'season-music') {
  const table = snapshot.layers.map((layer) => ({
    season: layer.id,
    active: layer.id === snapshot.activeSeason,
    current: Number(layer.currentVolume.toFixed(3)),
    target: Number(layer.targetVolume.toFixed(3)),
    default: Number(layer.defaultVolume.toFixed(3))
  }));
  console.groupCollapsed(`[audio] ${label}`);
  console.table(table);
  console.log('active season:', snapshot.activeSeason ?? 'none');
  console.groupEnd();
}
