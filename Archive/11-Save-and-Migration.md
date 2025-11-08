# Save / Load / Migration

## Save Envelope
```json
{
  "schemaVersion": 1,
  "phase": "township",
  "world": { "seed": 12345, "size": [256,256] },
  "factions": [{ "id":1, "name":"Player", "policies":[] }],
  "entities": [
    { "id":1001, "components": {
        "TilePos":{"X":42,"Y":18},
        "BuildingTag":{"Id":"district_agriculture_1"},
        "Storage":{"Items":[{"id":"wheat","qty":20}]}
    }}
  ]
}
```

- If `schemaVersion < Current`, run sequential migrators before load.
