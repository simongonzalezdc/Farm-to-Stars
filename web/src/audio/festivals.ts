import * as Tone from 'tone';
import {
  EVENT_HOMESTEAD_TIME,
  EVENT_SEASON_CHANGED,
  gameEvents,
  type HomesteadTimeDetail,
  type SeasonChangedDetail
} from '../world';
import type { SeasonId } from '../state/seasons';

export interface FestivalSnapshot {
  id: string;
  label: string;
  season: SeasonId;
  day: number;
  progress: number;
  volume: number;
}

export interface FestivalMusicController {
  isActive(): boolean;
  getActiveFestival(): FestivalSnapshot | null;
  refresh(): void;
  dispose(): void;
}

export interface FestivalMusicOptions {
  shouldPlay: () => boolean;
  getSeason: () => SeasonId;
  onFestivalActiveChange?: (active: boolean, snapshot: FestivalSnapshot | null) => void;
  debug?: boolean;
  rampSeconds?: number;
}

interface FestivalDefinition {
  id: string;
  label: string;
  season: SeasonId;
  day: number;
  start: number;
  end: number;
  pads: string[][];
  melody: string[];
  bass: string[];
  groove: Array<0 | 1>;
  volume: number;
}

const FESTIVALS: FestivalDefinition[] = [
  {
    id: 'spring-blossom-gala',
    label: 'Blossom Gala',
    season: 'spring',
    day: 7,
    start: 0.42,
    end: 0.78,
    pads: [
      ['C4', 'E4', 'G4'],
      ['F4', 'A4', 'C5'],
      ['D4', 'F4', 'A4'],
      ['G3', 'B3', 'D4']
    ],
    melody: ['E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5'],
    bass: ['C3', 'F3', 'D3', 'G2'],
    groove: [1, 0, 1, 0],
    volume: 0.65
  },
  {
    id: 'summer-firefly-social',
    label: 'Firefly Social',
    season: 'summer',
    day: 12,
    start: 0.48,
    end: 0.86,
    pads: [
      ['A3', 'C#4', 'E4'],
      ['E3', 'G#3', 'B3'],
      ['F#3', 'A3', 'C#4'],
      ['D3', 'F#3', 'A3']
    ],
    melody: ['C#5', 'E5', 'F#5', 'E5', 'B4', 'C#5', 'A4', 'E5'],
    bass: ['A2', 'E2', 'F#2', 'D2'],
    groove: [1, 0, 1, 1],
    volume: 0.68
  },
  {
    id: 'autumn-harvest-jamboree',
    label: 'Harvest Jamboree',
    season: 'autumn',
    day: 20,
    start: 0.36,
    end: 0.82,
    pads: [
      ['D4', 'F4', 'A4'],
      ['Bb3', 'D4', 'F4'],
      ['G3', 'Bb3', 'D4'],
      ['C4', 'E4', 'G4']
    ],
    melody: ['F5', 'A5', 'C6', 'A5', 'F5', 'E5', 'D5', 'C5'],
    bass: ['D3', 'Bb2', 'G2', 'C3'],
    groove: [1, 1, 0, 1],
    volume: 0.7
  },
  {
    id: 'winter-lantern-procession',
    label: 'Lantern Procession',
    season: 'winter',
    day: 26,
    start: 0.4,
    end: 0.76,
    pads: [
      ['E4', 'G4', 'B4'],
      ['C4', 'E4', 'G4'],
      ['A3', 'C4', 'E4'],
      ['B3', 'D4', 'F#4']
    ],
    melody: ['G5', 'B5', 'D6', 'B5', 'A5', 'G5', 'E5', 'F#5'],
    bass: ['E3', 'C3', 'A2', 'B2'],
    groove: [1, 0, 0, 1],
    volume: 0.64
  }
];

const PRE_ROLL = 0.05;

interface FestivalLayer {
  ensureStarted(): void;
  setTarget(volume: number, rampSeconds: number): void;
  dispose(): void;
}

// Helper to safely start Tone.js nodes after AudioContext is running
// Stores nodes that need to be started and starts them after user interaction
const pendingNodes: Array<{ start: () => void }> = [];

function safeStart(node: { start: () => void }): void {
  // Only start if AudioContext is running, otherwise defer
  if (Tone.context.state === 'running') {
    try {
      node.start();
    } catch (e) {
      // If start fails, add to pending list
      pendingNodes.push(node);
    }
  } else {
    // AudioContext not running yet, defer starting
    pendingNodes.push(node);
  }
}

// Start all pending nodes after AudioContext is running
export function startPendingNodes(): void {
  while (pendingNodes.length > 0) {
    const node = pendingNodes.shift();
    if (node) {
      try {
        node.start();
      } catch (e) {
        // Ignore errors - node may already be started
      }
    }
  }
}

function createFestivalLayer(destination: Tone.Gain, resolveDefinition: () => FestivalDefinition | null): FestivalLayer {
  const autoPan = new Tone.AutoPanner({ frequency: 0.03, depth: 0.35 });
  safeStart(autoPan);
  const gain = new Tone.Gain(0).connect(autoPan);
  autoPan.connect(destination);

  const padSynth = new Tone.PolySynth(Tone.Synth, {
    volume: -10,
    oscillator: { type: 'sine' },
    envelope: { attack: 1.4, decay: 0.5, sustain: 0.7, release: 3.2 }
  }).connect(gain);
  const leadSynth = new Tone.Synth({
    volume: -8,
    oscillator: { type: 'square' },
    envelope: { attack: 0.02, decay: 0.25, sustain: 0.2, release: 0.9 }
  }).connect(gain);
  const bassSynth = new Tone.MonoSynth({
    volume: -6,
    oscillator: { type: 'triangle' },
    filter: { type: 'lowpass', frequency: 520, Q: 0.9 },
    envelope: { attack: 0.03, decay: 0.3, sustain: 0.5, release: 1.6 },
    filterEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 1.4, baseFrequency: 180, octaves: 1 }
  }).connect(gain);
  const percussion = new Tone.MembraneSynth({
    volume: -12,
    pitchDecay: 0.04,
    octaves: 3,
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.3 }
  }).connect(gain);

  let started = false;
  let padStep = 0;
  let melodyStep = 0;
  let bassStep = 0;
  let grooveStep = 0;

  const padLoop = new Tone.Loop((time) => {
    const def = resolveDefinition();
    if (!def) {
      return;
    }
    const chord = def.pads[padStep % def.pads.length] ?? def.pads[0];
    padSynth.triggerAttackRelease(chord, '2m', time, 0.7);
    padStep += 1;
  }, '2m');

  const melodyLoop = new Tone.Loop((time) => {
    const def = resolveDefinition();
    if (!def) {
      return;
    }
    const note = def.melody[melodyStep % def.melody.length] ?? def.melody[0];
    leadSynth.triggerAttackRelease(note, '8n', time, 0.9);
    melodyStep += 1;
  }, '1m');

  const bassLoop = new Tone.Loop((time) => {
    const def = resolveDefinition();
    if (!def) {
      return;
    }
    const note = def.bass[bassStep % def.bass.length] ?? def.bass[0];
    bassSynth.triggerAttackRelease(note, '2n', time, 0.8);
    bassStep += 1;
  }, '2m');

  const grooveLoop = new Tone.Loop((time) => {
    const def = resolveDefinition();
    if (!def) {
      return;
    }
    const beat = def.groove[grooveStep % def.groove.length] ?? 0;
    if (beat) {
      percussion.triggerAttackRelease('C2', '16n', time, 0.7);
    }
    grooveStep += 1;
  }, '4n');

  function ensureStarted() {
    if (started) {
      return;
    }
    for (const loop of [padLoop, melodyLoop, bassLoop, grooveLoop]) {
      if (loop.state !== 'started') {
        loop.start(0);
      }
    }
    started = true;
  }

  function setTarget(volume: number, rampSeconds: number) {
    gain.gain.rampTo(Math.max(0, Math.min(volume, 1)), Math.max(0.01, rampSeconds));
  }

  return {
    ensureStarted,
    setTarget,
    dispose() {
      for (const loop of [padLoop, melodyLoop, bassLoop, grooveLoop]) {
        loop.dispose();
      }
      padSynth.dispose();
      leadSynth.dispose();
      bassSynth.dispose();
      percussion.dispose();
      gain.dispose();
      autoPan.dispose();
    }
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function createFestivalMusicController(destination: Tone.Gain, options: FestivalMusicOptions): FestivalMusicController {
  const { shouldPlay, getSeason, onFestivalActiveChange, debug = false, rampSeconds = 1.2 } = options;

  let currentSeason: SeasonId = getSeason();
  let currentDay = 1;
  let normalizedTime = 0;
  let activeDefinition: FestivalDefinition | null = null;
  let snapshot: FestivalSnapshot | null = null;
  let lastShouldPlay = shouldPlay();

  const layer = createFestivalLayer(destination, () => activeDefinition);

  function resolveDefinition(): FestivalDefinition | null {
    const def = FESTIVALS.find((festival) => festival.season === currentSeason && festival.day === currentDay);
    return def ?? null;
  }

  function computeSnapshot(def: FestivalDefinition | null): FestivalSnapshot | null {
    if (!def) {
      return null;
    }
    const span = Math.max(def.end - def.start, 0.01);
    const t = clamp01((normalizedTime - def.start) / span);
    return {
      id: def.id,
      label: def.label,
      season: def.season,
      day: def.day,
      progress: t,
      volume: def.volume
    };
  }

  function updateFestivalState() {
    const playable = shouldPlay();
    const definition = resolveDefinition();
    const inWindow = definition
      ? normalizedTime >= definition.start - PRE_ROLL && normalizedTime <= definition.end + PRE_ROLL
      : false;

    const nextDefinition = inWindow ? definition : null;
    const nextSnapshot = computeSnapshot(nextDefinition);
    const becameActive = nextDefinition && !activeDefinition;
    const becameInactive = !nextDefinition && !!activeDefinition;

    activeDefinition = nextDefinition;
    snapshot = nextSnapshot;

    if (becameActive) {
      layer.ensureStarted();
      if (debug) {
        console.debug('[audio] festival.start', snapshot);
      }
      onFestivalActiveChange?.(true, snapshot);
    } else if (becameInactive && debug) {
      console.debug('[audio] festival.stop');
    }
    if (becameInactive) {
      onFestivalActiveChange?.(false, null);
    }

    const targetVolume = playable && snapshot ? snapshot.volume : 0;
    const ramp = snapshot && playable ? rampSeconds : Math.min(rampSeconds, 0.6);
    layer.setTarget(targetVolume, ramp);

    if (lastShouldPlay !== playable && !playable) {
      // ensure we silence quickly if playback has been disabled
      layer.setTarget(0, 0.2);
    }
    lastShouldPlay = playable;
  }

  function handleSeason(event: Event) {
    const detail = (event as CustomEvent<SeasonChangedDetail>).detail;
    currentSeason = detail.season;
    currentDay = 1;
    updateFestivalState();
  }

  function handleTime(event: Event) {
    const detail = (event as CustomEvent<HomesteadTimeDetail>).detail;
    currentDay = detail.day;
    normalizedTime = detail.normalizedTime;
    updateFestivalState();
  }

  gameEvents.addEventListener(EVENT_SEASON_CHANGED, handleSeason);
  gameEvents.addEventListener(EVENT_HOMESTEAD_TIME, handleTime);

  updateFestivalState();

  return {
    isActive() {
      return !!snapshot;
    },
    getActiveFestival() {
      return snapshot;
    },
    refresh() {
      updateFestivalState();
    },
    dispose() {
      gameEvents.removeEventListener(EVENT_SEASON_CHANGED, handleSeason);
      gameEvents.removeEventListener(EVENT_HOMESTEAD_TIME, handleTime);
      layer.dispose();
    }
  };
}
