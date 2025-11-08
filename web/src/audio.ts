import * as Tone from 'tone';
import { Howl } from 'howler';
import {
  EVENT_BUILD_COMPLETE,
  EVENT_RESOURCE_PRODUCED,
  gameEvents,
  type BuildCompleteDetail,
  type ResourceProducedDetail
} from './world';
import type { ResourceId } from './types';
import { UI_SPRITE_DATA, UI_SPRITES, type UiSpriteId } from './audioSprite';

let started = false;
let muted = false;
let transportRunning = false;

const master = new Tone.Gain(0.9).toDestination();
const ambience = new Tone.Gain(0.7).connect(master);
const eventsBus = new Tone.Gain(0.9).connect(master);

Tone.Transport.bpm.value = 72;
Tone.Transport.loop = true;
Tone.Transport.loopEnd = '16m';

const padSynth = new Tone.PolySynth(Tone.Synth, {
  envelope: { attack: 2.0, release: 4.5 },
  oscillator: { type: 'sine' }
}).connect(ambience);

const bassSynth = new Tone.MonoSynth({
  envelope: { attack: 0.4, decay: 0.3, sustain: 0.6, release: 1.2 },
  filter: { type: 'lowpass', rolloff: -24, Q: 2 },
  oscillator: { type: 'triangle' }
}).connect(ambience);

const shimmer = new Tone.Synth({
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.4 }
}).connect(eventsBus);

const bell = new Tone.FMSynth({
  harmonicity: 6,
  modulationIndex: 12,
  modulation: { type: 'sine' },
  envelope: { attack: 0.02, decay: 0.8, sustain: 0, release: 1.2 }
}).connect(eventsBus);

const padProgression = ['C4', 'G4', 'A4', 'F4'];
let padStep = 0;

new Tone.Loop((time) => {
  const root = padProgression[padStep % padProgression.length];
  const fifth = Tone.Frequency(root).transpose(7).toNote();
  padSynth.triggerAttackRelease([root, fifth], '2m', time);
  padStep++;
}, '4m').start(0);

const bassProgression = ['C2', 'G2', 'A2', 'F2'];
let bassStep = 0;

new Tone.Loop((time) => {
  const bassRoot = bassProgression[bassStep % bassProgression.length];
  bassSynth.triggerAttackRelease(bassRoot, '1m', time);
  bassStep++;
}, '2m').start('0:2:0');

const ui = new Howl({
  src: [UI_SPRITE_DATA],
  volume: 0.7,
  sprite: UI_SPRITES
});

function playSprite(name: UiSpriteId) {
  if (!started || muted) return;
  ui.play(name);
}

const resourceNotes: Record<ResourceId, string> = {
  wood: 'D5',
  stone: 'G4',
  food: 'A4',
  coins: 'E5'
};

function handleResourceProduced(event: Event) {
  const detail = (event as CustomEvent<ResourceProducedDetail>).detail;
  playSprite('resource');
  if (!started || muted) return;
  const note = resourceNotes[detail.resource] ?? 'E5';
  shimmer.triggerAttackRelease(note, '16n');
}

function handleBuildComplete(event: Event) {
  const detail = (event as CustomEvent<BuildCompleteDetail>).detail;
  playSprite('build');
  if (!started || muted) return;
  const note = detail.buildingId === 'cottage' ? 'C5' : 'E5';
  bell.triggerAttackRelease(note, '2n');
}

gameEvents.addEventListener(EVENT_RESOURCE_PRODUCED, handleResourceProduced);
gameEvents.addEventListener(EVENT_BUILD_COMPLETE, handleBuildComplete);

export async function enableAudio() {
  if (started) return;
  await Tone.start();
  started = true;
  if (!transportRunning) {
    Tone.Transport.start();
    transportRunning = true;
  }
}

export function toggleMute(): boolean {
  muted = !muted;
  master.gain.rampTo(muted ? 0 : 0.9, 0.05);
  ui.mute(muted);
  return muted;
}

export function playPlace() {
  playSprite('place');
}

export function transport() {
  return Tone.Transport;
}
