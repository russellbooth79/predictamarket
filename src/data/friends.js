/**
 * friends.js
 *
 * Mock social layer: the user's mates, which outcome each mate is backing on
 * a fixture, and mates' accas that can be copied into the bet slip.
 * Deterministic (hash-based) so picks stay stable across renders.
 * Production would read these from a friends/social API.
 */

import { simpleHash } from '../utils/fixtureMeta.js';

export const FRIENDS = [
  { id: 'jade',  name: 'Jade',  initials: 'JD', colour: '#FF6B9A' },
  { id: 'kofi',  name: 'Kofi',  initials: 'KO', colour: '#00D4FF' },
  { id: 'liam',  name: 'Liam',  initials: 'LM', colour: '#FFB547' },
  { id: 'priya', name: 'Priya', initials: 'PR', colour: '#C6FF3D' },
  { id: 'sam',   name: 'Sam',   initials: 'SM', colour: '#B06FFF' },
];

/** Selection object in the shape the bet slip expects */
export function toSelection(fixture, outcome) {
  return {
    eventId: fixture.id,
    eventName: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
    outcomeId: outcome.id,
    outcomeName: outcome.label,
    probability: outcome.probability,
    decimalOdds: outcome.decimalOdds,
    sport: 'football',
  };
}

// Pick an outcome for a friend, leaning towards favourites
function pickOutcome(fixture, salt) {
  const roll = simpleHash(fixture.id + salt) % 100;
  let acc = 0;
  for (const o of fixture.outcomes) {
    acc += o.probability;
    if (roll < acc) return o;
  }
  return fixture.outcomes[0];
}

/**
 * Mates with a bet on this fixture: [{ friend, outcome }].
 * Roughly 0–3 per match.
 */
export function getFriendPicks(fixture) {
  return FRIENDS
    .filter(f => simpleHash(fixture.id + f.id) % 5 < 2)
    .map(f => ({ friend: f, outcome: pickOutcome(fixture, f.id) }));
}

/** "Jade is on Man City", "Jade +2 are on Man City" etc. for the most-backed outcome */
export function friendPicksHeadline(picks) {
  if (!picks.length) return null;
  const counts = new Map();
  picks.forEach(p => counts.set(p.outcome.id, [...(counts.get(p.outcome.id) ?? []), p]));
  const [, top] = [...counts.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  const name = top[0].friend.name;
  const team = top[0].outcome.label === 'Draw' ? 'the draw' : top[0].outcome.label.replace(/ Win$/, '');
  return top.length === 1 ? `${name} is on ${team}` : `${name} +${top.length - 1} on ${team}`;
}

/**
 * Mates' accas built from the current fixtures (upcoming first).
 * Each: { friend, legs: [{ fixture, outcome }], combinedProbability }
 */
export function getFriendAccas(fixtures, count = 3) {
  const pool = fixtures.filter(f => f.outcomes?.length);
  if (pool.length < 2) return [];
  return FRIENDS.slice(0, count).map((friend, i) => {
    const legCount = 2 + (simpleHash(friend.id) % 3); // 2–4 legs
    const start = simpleHash(friend.id + 'start') % pool.length;
    const legs = Array.from({ length: Math.min(legCount, pool.length) }, (_, k) => {
      const fixture = pool[(start + k * (i + 2)) % pool.length];
      return { fixture, outcome: pickOutcome(fixture, friend.id + 'acca') };
    }).filter((leg, k, arr) => arr.findIndex(l => l.fixture.id === leg.fixture.id) === k);
    const combinedProbability = legs.reduce((acc, l) => acc * (l.outcome.probability / 100), 1) * 100;
    return { friend, legs, combinedProbability };
  }).filter(a => a.legs.length >= 2);
}

// ── Shareable slip links ─────────────────────────────────────────────────────
// ?slip=<eventId>.<outcomeId>~<eventId>.<outcomeId>  — short and readable

export function encodeSlip(selections) {
  return selections.map(s => `${encodeURIComponent(s.eventId)}.${encodeURIComponent(s.outcomeId)}`).join('~');
}

/** Resolve a ?slip= value against known fixtures; unknown legs are dropped */
export function decodeSlip(value, fixtures) {
  if (!value) return [];
  return value.split('~').flatMap(part => {
    // Split on the last dot: outcome ids never contain one, event ids might
    const dot = part.lastIndexOf('.');
    const eventId = decodeURIComponent(part.slice(0, dot));
    const outcomeId = decodeURIComponent(part.slice(dot + 1));
    const fixture = fixtures.find(f => f.id === eventId);
    const outcome = fixture?.outcomes?.find(o => o.id === outcomeId);
    return fixture && outcome ? [toSelection(fixture, outcome)] : [];
  });
}
