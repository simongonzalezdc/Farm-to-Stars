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
import {
  createSeasonMusicController,
  logSeasonMusicState,
  type SeasonMusicController
} from './audio/musicLayers';
import {
  EVENT_SEASON_CHANGED,
  getSeason,
  seasonEvents,
  type SeasonChangeDetail,
  type SeasonId
} from './state/seasons';

let started = false;
let muted = false;
let transportRunning = false;

const master = new Tone.Gain(0.9).toDestination();
const ambience = new Tone.Gain(0.7).connect(master);
const eventsBus = new Tone.Gain(0.9).connect(master);
const musicBus = new Tone.Gain(0.75).connect(ambience);

Tone.Transport.bpm.value = 72;
Tone.Transport.loop = true;
Tone.Transport.loopEnd = '16m';

const seasonMusic: SeasonMusicController = createSeasonMusicController(musicBus, {
  crossfadeSeconds: 4,
  debug: DEBUG_AUDIO
});

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

const ui = new Howl({
  src: [UI_SPRITE_DATA],
  volume: 0.7,
  sprite: UI_SPRITES
});

const DEBUG_AUDIO = import.meta.env.DEV;

let currentSeason: SeasonId = getSeason();

function applySeason(season: SeasonId, immediate = false) {
  currentSeason = season;
  seasonMusic.setSeason(season, { immediate: immediate || !started });
}

function handleSeasonChanged(event: Event) {
  const detail = (event as CustomEvent<SeasonChangeDetail>).detail;
  applySeason(detail.season);
}

seasonEvents.addEventListener(EVENT_SEASON_CHANGED, handleSeasonChanged);
applySeason(currentSeason, true);

function playSprite(name: UiSpriteId) {
  if (!started || muted) {
    if (DEBUG_AUDIO) {
      console.debug('[audio] skip sfx', name, { started, muted });
    }
    return;
  }
  if (DEBUG_AUDIO) {
    console.debug('[audio] play sfx', name);
  }
  ui.play(name);
}

export function playSfx(name: UiSpriteId) {
  playSprite(name);
}

const resourceNotes: Record<ResourceId, string> = {
  wood: 'D5',
  stone: 'G4',
  food: 'A4',
  coins: 'E5'
};

function handleResourceProduced(event: Event) {
  const detail = (event as CustomEvent<ResourceProducedDetail>).detail;
  playSfx('resource');
  if (!started || muted) return;
  const note = resourceNotes[detail.resource] ?? 'E5';
  shimmer.triggerAttackRelease(note, '16n');
}

function handleBuildComplete(event: Event) {
  const detail = (event as CustomEvent<BuildCompleteDetail>).detail;
  playSfx('buildDone');
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

export function setSeasonLayerVolume(season: SeasonId, volume: number) {
  seasonMusic.setSeasonVolume(season, volume);
  if (DEBUG_AUDIO) {
    logSeasonMusicState(seasonMusic.getSnapshot(), `season-volume:${season}`);
  }
}

export function logActiveSeasonLayers(label = 'season-music') {
  logSeasonMusicState(seasonMusic.getSnapshot(), label);
}

export function transport() {
  return Tone.Transport;
}
