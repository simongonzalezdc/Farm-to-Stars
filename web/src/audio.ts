import * as Tone from 'tone';
import { Howl } from 'howler';

let started = false;
let muted = false;

// you can wire sprites later like: new Howl({ src:['/sfx.ogg','/sfx.mp3'], sprite:{ place:[0,200] }})
const ui = new Howl({ src: [] });
const master = new Tone.Gain(1).toDestination();

export async function enableAudio() {
  if (started) return;
  await Tone.start(); // user gesture gate for mobile
  started = true;
}

export function toggleMute(): boolean {
  muted = !muted;
  master.gain.rampTo(muted ? 0 : 1, 0.05);
  ui.mute(muted);
  return muted;
}

export function playPlace() {
  if (started && !muted) ui.play('place');
}

export function transport() {
  return Tone.Transport;
}
