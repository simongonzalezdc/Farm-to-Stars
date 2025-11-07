# Data Schemas (Markdown)

> Author content that conforms to these shapes. Keep `schemaVersion` for migrations.

## resource.schema
```json
{
  "schemaVersion": 1,
  "id": "wood",
  "display": "Wood",
  "stack": 9999
}
```

## building.schema
```json
{
  "schemaVersion": 1,
  "id": "power_coal_1",
  "phase": "township",
  "size": [2,2],
  "buildCost": {"money": 20000, "steel": 10},
  "upkeep": {"money": 200},
  "inputs": {"coal": 4},
  "outputs": {"power": 40},
  "effects": [
    {"type":"landValue","amount":-2,"radius":6},
    {"type":"pollution","amount":8,"radius":4}
  ],
  "workers": 12,
  "sprite": {"sheet":"tiles.png","src":[64,0,32,32]}
}
```

## unit.schema
```json
{
  "schemaVersion": 1,
  "id": "infantry_1",
  "move": 2,
  "sight": 2,
  "strength": 10,
  "terrainCost": {"hill": 2, "forest": 2, "plain": 1},
  "sprite": {"sheet":"units.png","src":[0,0,32,32]}
}
```

## tech.schema
```json
{
  "schemaVersion": 1,
  "id": "orbital_program",
  "prereq": ["advanced_materials", "rocketry"],
  "costScience": 600,
  "unlocks": ["building:spaceport", "project:satellite_launch"]
}
```
