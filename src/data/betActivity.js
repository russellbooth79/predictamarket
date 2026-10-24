/**
 * betActivity.js
 *
 * Mock data and generator for the live bet activity feed.
 *
 * DESIGN NOTES:
 * - `generateBetActivity(fixture)` is the primary export for real-time use.
 *   The feed component calls this on an interval (e.g. every 2.5–5s) and
 *   prepends the result to its local list.
 * - `initialBetActivity` seeds the feed on mount so it does not appear
 *   empty. Items are pre-timestamped to simulate the last ~5 minutes of
 *   activity. The component should render these oldest-first, newest-top.
 * - Stakes are drawn from a weighted distribution that reflects how a
 *   real UK sportsbook bet-size histogram looks: heavily right-skewed,
 *   with the median bet around £10–£15 and a long tail of larger stakes.
 * - Outcome labels come from the fixture's own outcomes array so they
 *   are consistent with what the betslip displays.
 * - IDs are generated with a lightweight counter + timestamp to avoid
 *   collisions across a single session. In production, the server assigns
 *   IDs — this pattern is prototype-only.
 *
 * WHAT THIS DOES NOT DO:
 * - Does not simulate actual probability-weighted outcome selection
 *   (i.e. users don't bet in proportion to true probability).
 *   Real feed would skew toward favourites but with noise from value
 *   bettors taking outsiders. We approximate this with a mild favourite
 *   weight below.
 */

import { footballFixtures } from './fixtures.js';

// ---------------------------------------------------------------------------
// Internal counter for unique IDs within a session
// ---------------------------------------------------------------------------

let _activityCounter = 1000;

function nextId() {
  // Simple monotonic counter — no crypto needed for prototype mock IDs.
  // Prefix 'ba' (bet activity) to distinguish from fixture/outcome IDs.
  return `ba-${Date.now()}-${++_activityCounter}`;
}

// ---------------------------------------------------------------------------
// Punter pool — 40 realistic UK names, mix of demographics
// ---------------------------------------------------------------------------

const PUNTERS = [
  'Jamie T.',   'Sarah M.',   'Marcus B.',  'Priya K.',   'Tom H.',
  'Eleanor W.', 'Danny F.',   'Chloe R.',   'Ross J.',    'Aisha N.',
  'Ben C.',     'Fatima S.',  'Luke P.',    'Grace O.',   'Mohammed A.',
  'Connor D.',  'Yasmin L.',  'Ryan O.',    'Natalie B.', 'Jordan K.',
  'Sian E.',    'Tyler M.',   'Amelia G.',  'Declan W.',  'Kofi A.',
  'Harriet N.', 'Aaron T.',   'Leila F.',   'Jack S.',    'Danielle H.',
  'Sam R.',     'Isla C.',    'Tariq M.',   'Bethany P.', 'Owen L.',
  'Zara K.',    'Alex J.',    'Ciara B.',   'Theo W.',    'Nadia O.',
];

// ---------------------------------------------------------------------------
// Stake distribution — weighted toward smaller amounts.
//
// A real UK sportsbook bet-size distribution is heavily right-skewed.
// Repeated values below act as weights (more entries = higher selection
// probability when picking randomly). This gives roughly:
//   £5  → ~28% of bets
//   £10 → ~24%
//   £20 → ~16%
//   £25 → ~8%
//   £50 → ~8%
//   £100 → ~6%
//   £200 → ~4%
//   £500 → ~4%
//   £1000 → ~2%
// ---------------------------------------------------------------------------

const STAKE_POOL = [
  5, 5, 5, 5, 5, 5, 5,
  10, 10, 10, 10, 10, 10,
  20, 20, 20, 20,
  25, 25,
  50, 50,
  100, 100,
  200,
  500,
  1000,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a random element from an array.
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Picks an outcome from a fixture, with a mild favourite bias.
 *
 * Pure random selection would mean every outcome is equally likely to
 * appear in the feed. In practice, favourites attract disproportionate
 * money volume (not just count). We weight selection probability toward
 * the outcome with the highest probability while still allowing outsider
 * activity to appear.
 *
 * Weighting method: square-root of probability as selection weight, then
 * normalise. This compresses the spread vs raw probability while keeping
 * outsiders visible.
 *
 * @param {Array<{id: string, label: string, probability: number, decimalOdds: number}>} outcomes
 * @returns {{id: string, label: string, probability: number, decimalOdds: number}}
 */
function weightedOutcome(outcomes) {
  const weights = outcomes.map((o) => Math.sqrt(o.probability));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < outcomes.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return outcomes[i];
  }
  // Fallback — floating point edge case
  return outcomes[outcomes.length - 1];
}

/**
 * Generates a timestamp (Date object) in the past, up to `maxSecondsAgo`.
 * Used to pre-seed the initial activity feed with realistic recency spread.
 *
 * @param {number} maxSecondsAgo
 * @returns {Date}
 */
function recentTimestamp(maxSecondsAgo) {
  const offset = Math.floor(Math.random() * maxSecondsAgo * 1000);
  return new Date(Date.now() - offset);
}

// ---------------------------------------------------------------------------
// Core generator
// ---------------------------------------------------------------------------

/**
 * Generates a single bet activity item for a given fixture.
 *
 * The component prepends this to its feed list on each interval tick.
 * Timestamp defaults to now — pass an explicit `timestamp` for seeding
 * historical items.
 *
 * @param {{
 *   id: string,
 *   homeTeam?: string,
 *   awayTeam?: string,
 *   competition: string,
 *   outcomes: Array<{id: string, label: string, probability: number, decimalOdds: number}>,
 * }} fixture - Must have at least `id`, `competition`, and `outcomes`.
 * @param {Date} [timestamp] - Defaults to now if omitted.
 * @returns {{
 *   id: string,
 *   user: string,
 *   stake: number,
 *   potentialReturn: number,
 *   outcome: string,
 *   outcomeId: string,
 *   decimalOdds: number,
 *   probability: number,
 *   timestamp: Date,
 *   fixtureId: string,
 *   fixtureName: string,
 *   competition: string,
 * }}
 */
export function generateBetActivity(fixture, timestamp = new Date()) {
  const outcome = weightedOutcome(fixture.outcomes);
  const stake = randomFrom(STAKE_POOL);
  // Round potential return to 2dp — avoids floating point display noise.
  const potentialReturn = Math.round(stake * outcome.decimalOdds * 100) / 100;

  const fixtureName = fixture.homeTeam && fixture.awayTeam
    ? `${fixture.homeTeam} vs ${fixture.awayTeam}`
    : fixture.raceName || fixture.fixtureName || fixture.id;

  return {
    id: nextId(),
    user: randomFrom(PUNTERS),
    stake,
    potentialReturn,
    outcome: outcome.label,
    outcomeId: outcome.id,
    decimalOdds: outcome.decimalOdds,
    probability: outcome.probability,
    timestamp,
    fixtureId: fixture.id,
    fixtureName,
    competition: fixture.competition,
  };
}

// ---------------------------------------------------------------------------
// Initial feed — seeded history for the last 5 minutes
//
// 28 items across the live and pre-match football fixtures.
// Timestamps are spread across 0–300 seconds ago so the feed looks
// authentically active on first render.
//
// We only use footballFixtures here because the feed is football-scoped
// in the current prototype. The generator itself is sport-agnostic.
// ---------------------------------------------------------------------------

// Fixtures that are active enough to attract current betting volume.
// Live fixtures attract heavier activity volume — reflected by including
// them more frequently in the seeded pool.
const _feedFixturePool = [
  // Live matches get 3x weight — they drive the most in-play volume
  ...footballFixtures.filter((f) => f.isLive),
  ...footballFixtures.filter((f) => f.isLive),
  ...footballFixtures.filter((f) => f.isLive),
  // Pre-match today games get 1x weight
  ...footballFixtures.filter((f) => !f.isLive && f.kickoff.startsWith('2026-10-24')),
];

/**
 * Pre-seeded activity history. 28 items representing approximately
 * the last 5 minutes of activity before the user opens the feed.
 *
 * Sorted newest-first so the component can render as-is without sorting.
 */
export const initialBetActivity = Array.from({ length: 28 }, (_, i) => {
  const fixture = randomFrom(_feedFixturePool);
  // Spread timestamps: item 0 is ~5s ago, item 27 is up to 300s ago.
  // Not perfectly linear — random spread within range gives natural look.
  const maxAge = 10 + i * 10; // 10s to 280s ago
  const timestamp = recentTimestamp(maxAge);
  return generateBetActivity(fixture, timestamp);
}).sort((a, b) => b.timestamp - a.timestamp); // newest first

// ---------------------------------------------------------------------------
// Feed configuration constants — exported so components can reference
// them rather than hardcoding magic numbers
// ---------------------------------------------------------------------------

/**
 * How often the feed component should poll for a new bet event (ms).
 * A real feed would use WebSocket push — this constant governs the
 * setInterval fallback in the prototype.
 */
export const FEED_POLL_INTERVAL_MS = 3000;

/**
 * Maximum items to keep in the feed list before dropping oldest.
 * Prevents unbounded memory growth in long-running sessions.
 */
export const FEED_MAX_ITEMS = 100;

/**
 * Minimum stake threshold for "high roller" visual treatment.
 * Items with stake >= this value get a highlighted badge in the feed.
 */
export const HIGH_ROLLER_STAKE_THRESHOLD = 200;
