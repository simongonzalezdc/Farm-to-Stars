export type ResourceId = 'wood' | 'stone' | 'food' | 'coins';
export type Resources = Record<ResourceId, number>;

export type BuildingType = 'cottage';

export interface Footprint {
  w: number;
  h: number;
}

export interface Structure {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  footprint: Footprint;
}

export interface BuildJob {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  footprint: Footprint;
  duration: number;
  remaining: number;
  status: 'queued' | 'building';
}

export type SaveV1 = {
  v: 1;
  seed: number;
  resources: Resources;
  structures: Structure[];
  buildQueue: BuildJob[];
  nextBuildId: number;
};

export type GameState = SaveV1;

export const defaultState = (): GameState => ({
  v: 1,
  seed: 12345,
  resources: { wood: 0, stone: 0, food: 0, coins: 0 },
  structures: [
    {
      id: 0,
      type: 'cottage',
      x: 10,
      y: 10,
      footprint: { w: 1, h: 1 }
    }
  ],
  buildQueue: [],
  nextBuildId: 1
});
