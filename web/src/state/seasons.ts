export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonChangeDetail {
  season: SeasonId;
  previousSeason: SeasonId | null;
}

export const EVENT_SEASON_CHANGED = 'season.changed';

const DEFAULT_SEASON: SeasonId = 'spring';

let currentSeason: SeasonId = DEFAULT_SEASON;

export const seasonEvents = new EventTarget();

export function getSeason(): SeasonId {
  return currentSeason;
}

export function setSeason(next: SeasonId) {
  if (next === currentSeason) {
    return;
  }
  const previousSeason = currentSeason;
  currentSeason = next;
  const detail: SeasonChangeDetail = { season: currentSeason, previousSeason };
  seasonEvents.dispatchEvent(
    new CustomEvent<SeasonChangeDetail>(EVENT_SEASON_CHANGED, { detail })
  );
}

export function resetSeason(season: SeasonId = DEFAULT_SEASON) {
  currentSeason = season;
}
