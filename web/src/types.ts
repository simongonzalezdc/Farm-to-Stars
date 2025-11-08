export type ResourceId = 'wood' | 'stone' | 'food' | 'coins';
export type Resources = Record<ResourceId, number>;

export type SaveV0 = { seed: number } & Resources;
export type SaveV1 = { v: 1; seed: number; resources: Resources };
export type GameState = SaveV1;

export const defaultState = (): GameState => ({
  v: 1,
  seed: 12345,
  resources: { wood: 0, stone: 0, food: 0, coins: 0 }
});
