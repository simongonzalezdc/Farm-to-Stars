import { describe, expect, it } from 'vitest';
import {
  defaultState,
  type BuildingDefinition,
  type BuildingId,
  type CropsTable,
  type GameState,
  type LivestockTable,
  type RecipeDefinition,
  type RecipeId
} from '../types';
import {
  EVENT_BUILD_COMPLETE,
  EVENT_RESOURCE_PRODUCED,
  gameEvents,
  initWorld,
  tick,
  type BuildCompleteDetail,
  type ResourceProducedDetail
} from '../world';

function withListener<T>(
  target: EventTarget,
  type: string,
  listener: (event: Event) => void,
  run: () => T
): T {
  target.addEventListener(type, listener);
  try {
    return run();
  } finally {
    target.removeEventListener(type, listener);
  }
}

describe('world audio events', () => {
  const buildingDefs = {
    cottage: {
      id: 'cottage',
      label: 'Cottage',
      buildTime: 1,
      footprint: { w: 1, h: 1 }
    }
  } as Record<BuildingId, BuildingDefinition>;
  const emptyRecipes = {} as Record<RecipeId, RecipeDefinition>;
  const emptyCrops = {} as CropsTable;
  const emptyLivestock = {} as LivestockTable;

  it('dispatches a build completion detail when construction finishes', () => {
    const state: GameState = {
      ...defaultState(),
      buildQueue: [
        {
          id: 99,
          type: 'cottage',
          x: 4,
          y: 2,
          footprint: { w: 1, h: 1 },
          duration: 1,
          remaining: 0.05,
          status: 'building'
        }
      ],
      constructionQueue: [
        {
          id: 99,
          buildingId: 'cottage',
          duration: 1,
          remaining: 0.05,
          footprint: { w: 1, h: 1 }
        }
      ]
    };
    initWorld(state);

    let captured: BuildCompleteDetail | undefined;
    withListener(
      gameEvents,
      EVENT_BUILD_COMPLETE,
      (event) => {
        captured = (event as CustomEvent<BuildCompleteDetail>).detail;
      },
      () => {
        tick(state, 0.1, buildingDefs, emptyRecipes, emptyCrops, emptyLivestock);
      }
    );

    expect(captured?.buildingId).toBe('cottage');
  });

  it('dispatches resource production details when resources accumulate', () => {
    const state = defaultState();
    initWorld(state);

    let captured: ResourceProducedDetail | undefined;
    withListener(
      gameEvents,
      EVENT_RESOURCE_PRODUCED,
      (event) => {
        captured = (event as CustomEvent<ResourceProducedDetail>).detail;
      },
      () => {
        state.resources.wood = 1.1;
        tick(state, 0.1, buildingDefs, emptyRecipes, emptyCrops, emptyLivestock);
      }
    );

    expect(captured?.resource).toBe('wood');
    expect(captured?.amount).toBe(1);
  });
});
