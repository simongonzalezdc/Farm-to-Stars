# Coding Standards

- Namespace: `FarmToStars.*`
- File-per-type unless DTO.
- Public APIs documented with XML `<summary>`.
- Prefer `record` for immutable data DTOs.
- Units: world **pixels** (`float`); tiles **ints**; hex axial `(q,r)`.
- Method prefixes: `Try...`, `Get...`, `Set...`, `Ensure...`, `Compute...`.
- Logging: `ILogger` adapter with `Trace|Debug|Info|Warn|Error`.
