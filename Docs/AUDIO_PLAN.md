# Audio Plan — SFX & Music

## 1) Tech
- **SFX:** Howler (single atlas/sprite).  
- **Music:** Tone.js transport; 2 layers/season (base + texture), crossfade on season change.
- **Mobile gate:** `Enable Audio` button → `Tone.start()`; persist mute state.

## 2) SFX (slice)
- `place`, `harvest`, `buildDone`, `ui`.

## 3) Music (slice)
- Spring base loop + soft texture loop; crossfade to light evening variant at day/night.

## 4) Mixing
- Gentle ducking during storms; master limiter around −1 dBFS; keep headroom.
