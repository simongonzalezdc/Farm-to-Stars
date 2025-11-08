# Data Schemas

## 1) Resources — `/web/src/data/resources.json`
```json
{
  "wood":  {"display": "Wood",  "stack": 9999},
  "stone": {"display": "Stone", "stack": 9999},
  "food":  {"display": "Food",  "stack": 9999},
  "coins": {"display": "Coins", "stack": 999999}
}
```

## 2) Buildings — `/web/src/data/buildings.json`
```json
{
  "road":    {"category":"infrastructure","buildTime":2.0,"size":[1,1],"effects":{"moveMul":1.3}},
  "plot":    {"category":"farm","buildTime":3.0,"size":[1,1],"production":"wheat"},
  "cottage": {"category":"housing","buildTime":8.0,"size":[2,2],"effects":{"popCap":4}},
  "market":  {"category":"commerce","buildTime":6.0,"size":[2,2],"production":"sell"}
}
```

## 3) Recipes — `/web/src/data/recipes.json`
```json
{
  "wheat": {"inputs":[["water",1.0]], "duration":30.0, "outputs":[["food",3]]},
  "sell":  {"inputs":[["food",1]],    "duration":2.0,  "outputs":[["coins",2]]}
}
```

## 4) Saves
```ts
// /web/src/types.ts (excerpt)
export type SaveV1 = { v:1; seed:number; resources:Record<string,number> /* + world, inventory, etc. */ };
```
- Add migrations: `migrateV1ToV2(save:SaveV1): SaveV2` (pure mapping).
