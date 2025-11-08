import * as Tone from 'tone';
import {
  EVENT_HOMESTEAD_WEATHER,
  EVENT_WEATHER_EVENT_ENDED,
  EVENT_WEATHER_EVENT_STARTED,
  gameEvents,
  type HomesteadWeatherDetail,
  type WeatherDynamicEventDetail
} from '../world';
import type { WeatherType } from '../types';

export interface WeatherAmbienceController {
  refresh(): void;
  dispose(): void;
}

export interface WeatherAmbienceOptions {
  shouldPlay: () => boolean;
  onDuckChange?: (amount: number) => void;
  debug?: boolean;
  rampSeconds?: number;
}

interface ActiveEventState {
  intensity: number;
  type: WeatherDynamicEventDetail['eventType'];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createWeatherAmbience(
  destination: Tone.Gain,
  options: WeatherAmbienceOptions
): WeatherAmbienceController {
  const { shouldPlay, onDuckChange, debug = false, rampSeconds = 0.6 } = options;

  const windPan = new Tone.AutoPanner({ frequency: 0.025, depth: 0.4 }).start();
  const rainPan = new Tone.AutoPanner({ frequency: 0.07, depth: 0.35 }).start();

  const windGain = new Tone.Gain(0).connect(windPan);
  const rainGain = new Tone.Gain(0).connect(rainPan);
  windPan.connect(destination);
  rainPan.connect(destination);

  const windNoise = new Tone.Noise('pink').start();
  const windFilter = new Tone.Filter({ type: 'lowpass', frequency: 900, Q: 0.5 });
  windNoise.connect(windFilter).connect(windGain);

  const rainNoise = new Tone.Noise('brown').start();
  const rainFilter = new Tone.Filter({ type: 'bandpass', frequency: 1800, Q: 1.2 });
  const rainAutoFilter = new Tone.AutoFilter({ frequency: 0.3, depth: 0.6 }).start();
  rainNoise.connect(rainFilter).connect(rainAutoFilter).connect(rainGain);

  const thunderGain = new Tone.Gain(0).connect(destination);
  const thunderFilter = new Tone.Filter({ type: 'lowpass', frequency: 500, Q: 0.8 }).connect(thunderGain);
  const thunderEnvelope = new Tone.AmplitudeEnvelope({ attack: 0.08, decay: 0.7, sustain: 0, release: 1.8 });
  const thunderNoise = new Tone.Noise('brown').start();
  thunderNoise.connect(thunderEnvelope).connect(thunderFilter);

  const rumble = new Tone.Oscillator({ type: 'sine', frequency: 42, volume: -18 }).start();
  const rumbleGain = new Tone.Gain(0).connect(destination);
  rumble.connect(rumbleGain);

  let thunderCooldown = 0;

  let weather: WeatherType = 'clear';
  const activeEvents = new Map<string, ActiveEventState>();
  let lastDuck = 0;

  function resolveIntensity(): number {
    let storm = 0;
    let rain = 0;
    for (const event of activeEvents.values()) {
      if (event.type === 'storm') {
        storm = Math.max(storm, event.intensity);
      } else if (event.type === 'rain') {
        rain = Math.max(rain, event.intensity);
      }
    }
    if (storm > 0) {
      return clamp(storm, 0, 1.2);
    }
    return clamp(rain, 0, 1.2);
  }

  function setGain(gain: Tone.Gain, value: number, ramp: number) {
    gain.gain.rampTo(clamp(value, 0, 1), Math.max(0.05, ramp));
  }

  function triggerThunder(intensity: number) {
    const playable = shouldPlay();
    const now = Tone.now();
    if (!playable || now < thunderCooldown) {
      return;
    }
    thunderCooldown = now + 2.5;
    const clamped = clamp(intensity, 0.3, 1.2);
    thunderEnvelope.triggerAttackRelease(1.9, now);
    thunderFilter.frequency.cancelAndHoldAtTime(now);
    thunderFilter.frequency.setValueAtTime(320, now);
    thunderFilter.frequency.exponentialRampToValueAtTime(720 * clamped, now + 0.6);
    thunderGain.gain.cancelAndHoldAtTime(now);
    thunderGain.gain.setValueAtTime(0, now);
    thunderGain.gain.linearRampToValueAtTime(0.55 * clamped, now + 0.18);
    thunderGain.gain.linearRampToValueAtTime(0, now + 2.4);
    rumbleGain.gain.cancelAndHoldAtTime(now);
    rumbleGain.gain.setValueAtTime(0, now);
    rumbleGain.gain.linearRampToValueAtTime(0.32 * clamped, now + 0.2);
    rumbleGain.gain.linearRampToValueAtTime(0, now + 2.6);
  }

  function updateAmbience() {
    const playable = shouldPlay();
    const intensity = resolveIntensity();
    let targetWind = 0.1;
    let targetRain = 0;
    let duck = 0;

    switch (weather) {
      case 'storm':
        targetWind = 0.22 + intensity * 0.1;
        targetRain = 0.42 + intensity * 0.22;
        duck = 0.18 + intensity * 0.12;
        break;
      case 'rain':
        targetWind = 0.12;
        targetRain = 0.28 + intensity * 0.18;
        duck = 0.08 + intensity * 0.08;
        break;
      default:
        targetWind = 0.14;
        targetRain = 0.04 * intensity;
        duck = 0.02 * intensity;
        break;
    }

    const ramp = rampSeconds;
    setGain(windGain, playable ? targetWind : 0, ramp);
    setGain(rainGain, playable ? targetRain : 0, ramp);

    const nextDuck = playable ? clamp(duck, 0, 0.6) : 0;
    if (Math.abs(nextDuck - lastDuck) > 0.005) {
      if (debug) {
        console.debug('[audio] weather.duck', { weather, intensity, duck: nextDuck });
      }
      onDuckChange?.(nextDuck);
      lastDuck = nextDuck;
    }
  }

  function handleWeather(event: Event) {
    const detail = (event as CustomEvent<HomesteadWeatherDetail>).detail;
    weather = detail.weather;
    if (debug) {
      console.debug('[audio] weather.state', detail);
    }
    updateAmbience();
  }

  function handleEventStarted(event: Event) {
    const detail = (event as CustomEvent<WeatherDynamicEventDetail>).detail;
    activeEvents.set(detail.eventId, { intensity: detail.intensity, type: detail.eventType });
    if (debug) {
      console.debug('[audio] weather.event.start', detail);
    }
    if (detail.eventType === 'lightning') {
      triggerThunder(detail.intensity);
    }
    updateAmbience();
  }

  function handleEventEnded(event: Event) {
    const detail = (event as CustomEvent<WeatherDynamicEventDetail>).detail;
    activeEvents.delete(detail.eventId);
    if (debug) {
      console.debug('[audio] weather.event.end', detail);
    }
    updateAmbience();
  }

  gameEvents.addEventListener(EVENT_HOMESTEAD_WEATHER, handleWeather);
  gameEvents.addEventListener(EVENT_WEATHER_EVENT_STARTED, handleEventStarted);
  gameEvents.addEventListener(EVENT_WEATHER_EVENT_ENDED, handleEventEnded);

  updateAmbience();

  return {
    refresh() {
      updateAmbience();
    },
    dispose() {
      gameEvents.removeEventListener(EVENT_HOMESTEAD_WEATHER, handleWeather);
      gameEvents.removeEventListener(EVENT_WEATHER_EVENT_STARTED, handleEventStarted);
      gameEvents.removeEventListener(EVENT_WEATHER_EVENT_ENDED, handleEventEnded);
      windNoise.dispose();
      windFilter.dispose();
      windGain.dispose();
      windPan.dispose();
      rainNoise.dispose();
      rainFilter.dispose();
      rainAutoFilter.dispose();
      rainGain.dispose();
      rainPan.dispose();
      thunderEnvelope.dispose();
      thunderNoise.dispose();
      thunderFilter.dispose();
      thunderGain.dispose();
      rumble.dispose();
      rumbleGain.dispose();
    }
  };
}
