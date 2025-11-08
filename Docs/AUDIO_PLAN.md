# Audio Plan — SFX & Music

## 1) Tech
- **SFX:** Howler (single atlas/sprite).  
- **Music:** Tone.js transport; 2 layers/season (base + texture), crossfade on season change.
- **Mobile gate:** `Enable Audio` button → `Tone.start()`; persist mute state.

## 2) SFX (slice)
- `place`, `harvest`, `buildDone`, `ui`.
- `livestock.produce` → pluck + bell accent scaled by yield.
- `livestock.starved` → low square alarm + brown-noise rush.

## 3) Music (slice)
- Spring base loop + soft texture loop; crossfade to light evening variant at day/night.
- Festival overlay pads/lead/bass triggered on seasonal milestones (fade 1.2 s).

## 4) Mixing
- Gentle ducking during storms; master limiter around −1 dBFS; keep headroom.
- Weather bed: pink wind (−16 LUFS) + brown rain (−18 LUFS) with autopan.
- Festival overlay trims active season layer by ~−3 dB during event window.

## 5) Weather Ambience
- Listen to homestead weather bus for `clear/rain/storm` state.
- Clear: wind @ −22 LUFS, light rustle only.
- Rain: add band-passed brown noise up to −18 LUFS, duck music by 0.1.
- Storm: intensify to −15 LUFS, duck music bus by 0.25 max.
- Dynamic events modulate intensity ±20% by event detail.

## 6) QA Routing & Loudness Notes
- Signal flow: Events→Master, Ambience→Master, Music→Duck bus→Ambience→Master→Limiter (−1 dBFS ceiling).
- Master gain idles at −1.4 dBFS for headroom; weather duck never pushes music bus below −9 dBFS (0.35 gain).
- Livestock cues land on events bus at −10 LUFS short-term; verify starve alarm sustains 350 ms release.
- QA: confirm mute toggles zero the limiter input while preserving duck snapshot after unmute.
