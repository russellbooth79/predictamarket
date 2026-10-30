/**
 * cashOut.js — live cash-out value for an open bet.
 *
 * Fair value is what the bet is worth right now: its potential return times
 * the current chance that every leg still wins. PUNT offers that less a
 * CASH_OUT_MARGIN. Legs on matches that haven't kicked off keep their price.
 *
 * Only match-result legs can be cashed out; next-goal and 5-minute bets
 * settle too quickly for it to be useful, so they return null.
 */

const CASH_OUT_MARGIN = 0.05;

/** @returns {number|null} cash-out offer in £, or null if unavailable */
export function cashOutValue(bet, getMatch, fixtures) {
  if (bet.status !== 'open') return null;
  let chance = 1;
  for (const leg of bet.selections) {
    if (leg.market && leg.market !== 'result') return null;
    if (!leg.outcomeId) return null; // older bets without an outcome id
    const match = getMatch(leg.eventId);
    if (match) {
      if (match.status === 'ft') return null; // settling
      chance *= match.prices.result[leg.outcomeId] / 100;
    } else {
      // Not in play yet: use the current pre-match price, else the price taken
      const fx = fixtures.find(f => f.id === leg.eventId);
      const outcome = fx?.outcomes?.find(o => o.id === leg.outcomeId);
      chance *= (outcome?.probability ?? leg.probability) / 100;
    }
  }
  const value = bet.potentialReturn * chance * (1 - CASH_OUT_MARGIN);
  return Math.max(0.01, Math.min(value, bet.potentialReturn * 0.99));
}
