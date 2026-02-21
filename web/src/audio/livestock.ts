import * as Tone from 'tone';
import {
  EVENT_LIVESTOCK_PRODUCE,
  EVENT_LIVESTOCK_STARVED,
  gameEvents,
  type LivestockProduceDetail,
  type LivestockStarvedDetail
} from '../world';
import type { LivestockId, ResourceId } from '../types';

export interface LivestockAudioController {
  dispose(): void;
}

export interface LivestockAudioOptions {
  shouldPlay: () => boolean;
  debug?: boolean;
  sustainSeconds?: number;
}

const PRODUCE_NOTES: Partial<Record<ResourceId, string>> = {
  milk: 'C4',
  cheese: 'D4',
  egg: 'E4',
  wool: 'G4',
  honey: 'A4',
  food: 'B4'
};

const SPECIES_OVERTONES: Partial<Record<LivestockId, string>> = {
  cow: 'E5',
  chicken: 'G5',
  goat: 'D5',
  sheep: 'C5',
  alpaca: 'A5'
};

const WARNING_NOTES: Partial<Record<LivestockId, string>> = {
  cow: 'C3',
  chicken: 'A2',
  goat: 'D3',
  sheep: 'B2',
  alpaca: 'E3'
};

function rampGain(gain: Tone.Gain, value: number, duration: number) {
  const now = Tone.now();
  gain.gain.cancelAndHoldAtTime(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(value, now + Math.max(duration, 0.01));
}

function scheduleRelease(gain: Tone.Gain, duration: number) {
  const now = Tone.now();
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + Math.max(duration, 0.08));
}

export function createLivestockAudio(
  destination: Tone.Gain,
  options: LivestockAudioOptions
): LivestockAudioController {
  const { shouldPlay, debug = false, sustainSeconds = 0.35 } = options;

  const produceGain = new Tone.Gain(0).connect(destination);
  const warningGain = new Tone.Gain(0).connect(destination);

  const producePluck = new Tone.PluckSynth({
    dampening: 3200,
    resonance: 0.85
  }).connect(produceGain);
  const produceBell = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.35, sustain: 0, release: 0.4 }
  }).connect(produceGain);

  const warningMono = new Tone.MonoSynth({
    volume: -4,
    oscillator: { type: 'square' },
    filter: { type: 'lowpass', frequency: 420 },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 1.6 },
    filterEnvelope: {
      attack: 0.02,
      decay: 0.35,
      sustain: 0,
      release: 1.2,
      baseFrequency: 220,
      octaves: 1.1
    }
  }).connect(warningGain);
  const warningNoise = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: { attack: 0.02, decay: 0.5, sustain: 0, release: 1.4 }
  }).connect(warningGain);

  function handleProduce(event: Event) {
    if (!shouldPlay()) {
      return;
    }
    const detail = (event as CustomEvent<LivestockProduceDetail>).detail;
    const base = PRODUCE_NOTES[detail.resource] ?? 'D4';
    const overtone = SPECIES_OVERTONES[detail.speciesId] ?? 'A4';
    const velocity = Math.min(1, 0.55 + detail.amount * 0.05);
    if (debug) {
      console.debug('[audio] livestock.produce', detail, { base, overtone, velocity });
    }
    const rampSeconds = 0.08;
    rampGain(produceGain, 0.65, rampSeconds);
    producePluck.triggerAttack(base, undefined, velocity);
    produceBell.triggerAttackRelease(overtone, '16n', undefined, 0.7);
    scheduleRelease(produceGain, sustainSeconds);
  }

  function handleStarved(event: Event) {
    if (!shouldPlay()) {
      return;
    }
    const detail = (event as CustomEvent<LivestockStarvedDetail>).detail;
    const note = WARNING_NOTES[detail.speciesId] ?? 'F2';
    if (debug) {
      console.debug('[audio] livestock.starved', detail, { note });
    }
    const rampSeconds = 0.12;
    rampGain(warningGain, 0.75, rampSeconds);
    warningMono.triggerAttackRelease(note, '1m', undefined, 0.9);
    warningNoise.triggerAttackRelease('2n');
    scheduleRelease(warningGain, sustainSeconds + 0.45);
  }

  gameEvents.addEventListener(EVENT_LIVESTOCK_PRODUCE, handleProduce);
  gameEvents.addEventListener(EVENT_LIVESTOCK_STARVED, handleStarved);

  return {
    dispose() {
      gameEvents.removeEventListener(EVENT_LIVESTOCK_PRODUCE, handleProduce);
      gameEvents.removeEventListener(EVENT_LIVESTOCK_STARVED, handleStarved);
      producePluck.dispose();
      produceBell.dispose();
      warningMono.dispose();
      warningNoise.dispose();
      produceGain.dispose();
      warningGain.dispose();
    }
  };
}
