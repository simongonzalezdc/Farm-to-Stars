let audioModulePromise: Promise<typeof import('./audio')> | null = null;

function loadAudioModule() {
  if (!audioModulePromise) {
    audioModulePromise = import('./audio');
  }
  return audioModulePromise;
}

export async function enableAudio() {
  const audio = await loadAudioModule();
  await audio.enableAudio();
}

export async function toggleMute() {
  const audio = await loadAudioModule();
  return audio.toggleMute();
}

function fire(callback: (audio: typeof import('./audio')) => void) {
  void loadAudioModule()
    .then((audio) => {
      callback(audio);
    })
    .catch((error) => {
      console.error('[audio] failed to load module', error);
    });
}

export function playPlacementSfx() {
  fire((audio) => audio.playPlacementSfx());
}

export function playInvalidPlacementSfx() {
  fire((audio) => audio.playInvalidPlacementSfx());
}

export function playSfx(name: Parameters<typeof import('./audio').playSfx>[0]) {
  fire((audio) => audio.playSfx(name));
}
