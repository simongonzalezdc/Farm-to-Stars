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

  it('advances growth before enabling production', () => {
    const state = defaultState(RESOURCES);
    const animal = {
      id: 7,
      speciesId: 'cow' as const,
      ageDays: 0.5,
      growth: 0.3,
      hunger: 0.1,
      produceProgress: LIVESTOCK.cow.produceIntervalSeconds - 5,
      lastFedDay: state.homestead.time.day - 1,
      alive: true
    };
    state.homestead.livestock.animals = [animal];
    state.resources.food = 10;
    state.resources.milk = 0;

    const secondsPerDay = state.homestead.time.secondsPerDay;
    const result = tickLivestock(state, secondsPerDay / 2, LIVESTOCK);

    expect(animal.ageDays).toBeGreaterThan(0.5);
    expect(animal.growth).toBeGreaterThan(0.3);
    expect(result.events).not.toContainEqual(
      expect.objectContaining({ type: 'livestock.produce', livestockId: 7 })
    );

    const matureResult = tickLivestock(state, secondsPerDay, LIVESTOCK);
    expect(matureResult.events).toContainEqual(
      expect.objectContaining({ type: 'livestock.produce', livestockId: 7, resource: 'milk' })
    );
  });

  it('processes multiple production cycles during long ticks', () => {
    const state = defaultState(RESOURCES);
    state.resources.eggs = 0;
    state.resources.wheat = 10;
    state.homestead.livestock.animals = [
      {
        id: 9,
        speciesId: 'chicken',
        ageDays: 3,
        growth: 1,
        hunger: 0,
        produceProgress: LIVESTOCK.chicken.produceIntervalSeconds * 0.5,
        lastFedDay: state.homestead.time.day,
        alive: true
      }
    ];

    const dt = LIVESTOCK.chicken.produceIntervalSeconds * 3;
    const result = tickLivestock(state, dt, LIVESTOCK);

    expect(result.events).toContainEqual({
      type: 'livestock.produce',
      livestockId: 9,
      speciesId: 'chicken',
      resource: 'eggs',
      amount: LIVESTOCK.chicken.produceAmount * 3
    });
    expect(state.resources.eggs).toBe(LIVESTOCK.chicken.produceAmount * 3);
  });

  it('feeds animals for every missed day when supplies exist', () => {
    const state = defaultState(RESOURCES);
    state.resources.wheat = 10;
    const animal = {
      id: 2,
      speciesId: 'chicken' as const,
      ageDays: 2,
      growth: 1,
      hunger: 0.5,
      produceProgress: 0,
      lastFedDay: state.homestead.time.day - 3,
      alive: true
    };
    state.homestead.livestock.animals = [animal];

    const result = tickLivestock(state, 10, LIVESTOCK);

    expect(result.feedConsumed.wheat).toBeCloseTo(3, 5);
    expect(animal.hunger).toBeLessThan(0.5);
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

    expect(result.events).toContainEqual({ type: 'livestock.starved', livestockId: 5, speciesId: 'cow' });
    expect(state.homestead.livestock.animals[0]?.alive).toBe(false);
  });
});
