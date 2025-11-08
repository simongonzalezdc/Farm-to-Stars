# Audio Plan — SFX & Music

## 1) Tech
- **SFX:** Howler (single atlas/sprite).
- **Music:** Tone.js transport; 2 layers/season (base + texture), crossfade on season change.
- **Mobile gate:** `Enable Audio` button → `Tone.start()`; persist mute state.
- **Content hooks:** Festival timeline (`web/content/festivals.json`) and livestock tables (`web/content/livestock.csv`) expose cue IDs for runtime lookups.

## 2) SFX (slice)
- `place`, `harvest`, `buildDone`, `ui`.
- Livestock placeholders keyed to herd events:
  - `sfx.livestock.chicken.cluck` — trigger on chicken feeding + produce pickup.
  - `sfx.livestock.cow.low` — trigger on cow feeding and produce ready notification.
  - `sfx.livestock.goat.bleat` — trigger when goats request feed or deliver milk.
  - `sfx.livestock.alpaca.hum` — trigger during fiber shearing completion.

## 3) Music (slice)
- Spring base loop + soft texture loop; crossfade to light evening variant at day/night.
- Seasonal festival themes align with `audioCue` fields in `web/content/festivals.json`:
  - `music.spring_wake.theme` — uptempo acoustic ensemble with light percussion.
  - `music.starlight_soiree.waltz` — three-quarter meter with vibraphone lead; enable skybox shimmer.
  - `music.comet_harvest.procession` — marching drums with brass swells; fade in parade crowd loop.
  - `music.lunar_vigil.chant` — layered choirs + soft pads, keep noise floor low for narration.

## 4) Mixing
- Gentle ducking during storms; master limiter around −1 dBFS; keep headroom.
- Route livestock SFX through dynamics bus with soft knee compression to avoid sudden peaks.
- Festival music sidechains environmental beds by −4 dB to highlight quest callouts.

## 5) Placeholder Cue Map

| Hook | Cue ID | Notes |
| --- | --- | --- |
| `world.livestock.produce` (chicken) | `sfx.livestock.chicken.cluck` | Layer quick cluck burst when eggs spawn. |
| `world.livestock.produce` (cow) | `sfx.livestock.cow.low` | Longer tail, reinforce dairy harvest reward. |
| `world.livestock.produce` (goat) | `sfx.livestock.goat.bleat` | Pitch up slightly for juvenile goats. |
| `world.livestock.produce` (alpaca) | `sfx.livestock.alpaca.hum` | Soft hum loop while fiber shearing progress bar runs. |
| `festival:start:spring_wake` | `music.spring_wake.theme` | Fade in over 1.5s, crossfade out at dusk fireworks. |
| `festival:start:starlight_soiree` | `music.starlight_soiree.waltz` | Sync lantern lighting animation to downbeat. |
| `festival:start:comet_harvest` | `music.comet_harvest.procession` | Introduce drum cadence as parade spawns. |
| `festival:start:lunar_vigil` | `music.lunar_vigil.chant` | Begin with single pad, layer choir after shrine lighting. |

## 6) Implementation Notes
- Cue IDs should map 1:1 with content rows to simplify localization review.
- Provide stub assets (1–2 second loops) under `web/public/audio/placeholders/` before QA dry run.
- Document final routing tweaks in an appendix once real stems arrive.
