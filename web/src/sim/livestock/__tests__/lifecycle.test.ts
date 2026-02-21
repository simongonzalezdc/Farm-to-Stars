import { describe, expect, it } from 'vitest';
import { tickLivestock } from '../lifecycle';
import { defaultState, type LivestockTable, type ResourcesTable } from '../../../types';

const RESOURCES: ResourcesTable = {
  food: { display: 'Food', stack: 9999 },
  wheat: { display: 'Wheat', stack: 500 },
  eggs: { display: 'Eggs', stack: 250 },
  milk: { display: 'Milk', stack: 250 },
  letters: { display: 'Mail', stack: 99 }
};

const LIVESTOCK: LivestockTable = {
  chicken: {
    id: 'chicken',
    label: 'Hen',
    growthDays: 1,
    feedResource: 'wheat',
    feedPerDay: 1,
    produceResource: 'eggs',
    produceAmount: 2,
    produceIntervalSeconds: 120,
    hungerToleranceDays: 1
  },
  cow: {
    id: 'cow',
    label: 'Cow',
    growthDays: 2,
    feedResource: 'food',
    feedPerDay: 2,
    produceResource: 'milk',
    produceAmount: 3,
    produceIntervalSeconds: 200,
    hungerToleranceDays: 2
  }
};

describe('tickLivestock', () => {
  it('consumes feed and produces goods when mature', () => {
    const state = defaultState(RESOURCES);
    state.resources.wheat = 5;
    state.resources.eggs = 0;
    state.homestead.livestock.animals = [
      {
        id: 1,
        speciesId: 'chicken',
        ageDays: 2,
        growth: 1,
        hunger: 0,
        produceProgress: 0,
        lastFedDay: state.homestead.time.day - 1,
        alive: true
      }
    ];

    const result = tickLivestock(state, LIVESTOCK.chicken.produceIntervalSeconds, LIVESTOCK);

    expect(result.events).toContainEqual({
      type: 'livestock.produce',
      livestockId: 1,
      speciesId: 'chicken',
      resource: 'eggs',
      amount: 2
    });
    expect(state.resources.eggs).toBe(2);
    expect(result.feedConsumed.wheat).toBe(1);
  });

  it('marks animals as starved when feed is unavailable', () => {
    const state = defaultState(RESOURCES);
    state.resources.food = 0;
    state.homestead.livestock.animals = [
      {
        id: 5,
        speciesId: 'cow',
        ageDays: 4,
        growth: 1,
        hunger: 0.9,
        produceProgress: 0,
        lastFedDay: state.homestead.time.day - 1,
        alive: true
      }
    ];

    const result = tickLivestock(state, state.homestead.time.secondsPerDay, LIVESTOCK);

    expect(result.events).toContainEqual({
      type: 'livestock.starved',
      livestockId: 5,
      speciesId: 'cow'
    });
    expect(state.homestead.livestock.animals[0]?.alive).toBe(false);
  });
});
