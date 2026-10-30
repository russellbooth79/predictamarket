/**
 * inplayHelpers.js — non-component helpers for the in-play screens.
 */

import { MINUTE_MS } from './liveEngine.js';

export const EVENT_ICONS = {
  goal: '⚽', shot: '🎯', corner: '🚩', card: '🟨', attack: '⚡', kickoff: '▶️', ft: '🏁',
};

/** Was the last event within `ms` of the latest tick? */
export function isRecentEvent(match, ms) {
  return Boolean(match.lastEvent && match.updatedAt - match.lastEvent.at < ms);
}

/** Markets suspend for a couple of seconds after a goal, as real in-play does */
export function isSuspended(match) {
  return match.status === 'ft' || (match.lastEvent?.type === 'goal' && isRecentEvent(match, 2500));
}

/** Real seconds until a match minute is reached */
export function secondsUntil(match, minute) {
  return Math.max(0, Math.ceil(((minute - match.minute) * MINUTE_MS) / 1000));
}

export function momentumLabel(match) {
  const fx = match.fixture;
  if (match.status === 'ft') return 'Full time';
  if (match.momentum > 0.45) return `🔥 ${fx.homeTeam} on top`;
  if (match.momentum < -0.45) return `🔥 ${fx.awayTeam} on top`;
  return 'Evenly matched';
}

/** Probability (0-100) for an outcome on a live market */
export function livePrice(match, market, outcomeId) {
  if (!match) return null;
  if (market === 'result') return match.prices.result[outcomeId];
  if (market === 'nextGoal') return match.prices.nextGoal[outcomeId];
  if (market === 'micro') {
    const yes = match.micro?.probYes ?? 0;
    return outcomeId === 'yes' ? yes : 100 - yes;
  }
  return null;
}
