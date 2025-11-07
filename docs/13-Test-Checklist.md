# Test Checklist (v0)

- Fixed-step sim runs at 20 Hz independent of GPU FPS.
- Save → quit → load reproduces budget within ±1 unit.
- A* respects terrain costs; water is impassable for land units.
- Homestead→Township converter: 9-field cluster → ≥1 agriculture district.
- Overlay hotkeys toggle without per-frame allocations > 1 KB (GC-safe).
