/**
 * discover.js
 *
 * Content for the Discover feed and the function that assembles it.
 *
 * Card types:
 *   match    — a big fixture you can bet on in place
 *   insight  — a stat about a fixture (crowd vs the odds, form runs)
 *   boost    — a boosted price on a single outcome
 *   casino   — a new casino release
 *   offer    — a promotion the user can opt into
 *   feature  — something new on PUNT
 *   safer    — safer-gambling check-in (limits used this week)
 *
 * The feed is filtered by intent: sports-only users never see casino cards,
 * casino-only users never see match/insight/boost cards. Static content is
 * mocked here; production would serve it from a CMS / promotions API.
 */

import { getBetCount, getCrowdSplit, generateForm, outcomeShortName } from '../utils/fixtureMeta.js';

export const BOOSTS = [
  {
    id: 'boost-haaland',
    title: 'Haaland to score anytime',
    match: 'Manchester City vs Arsenal',
    was: 1.8, now: 2.25,
    note: 'Max stake £10 · boosted price applies to the full stake',
  },
  {
    id: 'boost-btts',
    title: 'Both teams to score in Liverpool vs Chelsea',
    match: 'Liverpool vs Chelsea',
    was: 1.62, now: 2.0,
    note: 'Max stake £10',
  },
  {
    id: 'boost-lebron',
    title: 'LeBron 25+ points',
    match: 'Lakers vs Celtics',
    was: 2.1, now: 2.6,
    note: 'Max stake £5',
  },
];

export const NEW_RELEASES = [
  {
    id: 'nr-neon',
    name: 'Neon Heist',
    provider: 'Pragmatic Play',
    category: 'Slot',
    rtp: 96.4, volatility: 'High', maxWin: '15,000x',
    emoji: '💎',
    gradient: 'linear-gradient(160deg, #FF3366 0%, #6C63FF 55%, #0B0F1E 100%)',
    blurb: 'Cascading reels, sticky multipliers and a free-spins heist round.',
  },
  {
    id: 'nr-tidal',
    name: 'Tidal Roulette',
    provider: 'Evolution',
    category: 'Live table',
    rtp: 97.3, volatility: 'Low', maxWin: '500x',
    emoji: '🌊',
    gradient: 'linear-gradient(160deg, #00D4FF 0%, #1A4BFF 55%, #0B0F1E 100%)',
    blurb: 'Live roulette with lightning numbers, hosted from a beach studio.',
  },
  {
    id: 'nr-rocket',
    name: 'Rocket Run',
    provider: 'Spribe',
    category: 'Crash game',
    rtp: 97.0, volatility: 'Medium', maxWin: '10,000x',
    emoji: '🚀',
    gradient: 'linear-gradient(160deg, #FFB547 0%, #FF6B35 50%, #0B0F1E 100%)',
    blurb: 'Cash out before the rocket bursts. Rounds last seconds.',
  },
];

export const OFFERS = [
  {
    id: 'offer-freebet-club',
    product: 'sports',
    emoji: '🎟️',
    title: 'Free Bet Club',
    body: 'Bet £10 across the week on any sport and get a £5 free bet every Monday.',
    terms: '18+. Min odds 1.5 (67%). Free bet expires in 7 days. Full T&Cs apply.',
  },
  {
    id: 'offer-acca-insurance',
    product: 'sports',
    emoji: '🛡️',
    title: 'Acca safety net',
    body: 'One leg lets down your 4+ fold football acca? Get your stake back as a free bet, up to £10.',
    terms: '18+. Pre-match accas only. One refund per week. Full T&Cs apply.',
  },
  {
    id: 'offer-spins',
    product: 'casino',
    emoji: '🎰',
    title: '20 free spins on Neon Heist',
    body: 'Opt in and play £10 on any slot this week. Spins land within 24 hours, with no wagering on winnings.',
    terms: '18+. Spins worth 10p each. Expire after 3 days. Full T&Cs apply.',
  },
];

export const FEATURES = [
  {
    id: 'feat-share',
    emoji: '🔗',
    title: 'Share your slip',
    body: 'Send your picks to the group chat. Anyone who opens the link gets the same slip, ready to stake.',
    cta: 'Build a slip',
    target: 'home',
  },
  {
    id: 'feat-mates',
    emoji: '👥',
    title: "Mates' accas",
    body: "See what your friends are backing on every match, and copy their accas with one tap.",
    cta: "See your mates' picks",
    target: 'home',
  },
  {
    id: 'feat-challenge',
    emoji: '🏆',
    title: 'Daily challenge',
    body: 'One free prediction a day. Get it right to climb the weekly leaderboard. No stake needed.',
    cta: 'Play today’s challenge',
    target: 'home',
  },
];

// ── Insights derived from fixtures ───────────────────────────────────────────

function crowdVsOddsInsight(fixture) {
  const split = getCrowdSplit(fixture);
  // The outcome where the crowd is furthest from the odds
  const gaps = fixture.outcomes.map((o, i) => ({ outcome: o, crowd: split[i].share, gap: split[i].share - o.probability }));
  const biggest = gaps.reduce((a, b) => (Math.abs(b.gap) > Math.abs(a.gap) ? b : a));
  const name = outcomeShortName(biggest.outcome.label);
  const keener = biggest.gap > 0;
  return {
    kind: 'crowd',
    headline: keener ? `The crowd loves ${name}` : `The crowd is sleeping on ${name}`,
    stat: `${biggest.crowd}%`,
    statLabel: 'of PUNT bets',
    compare: `${Math.round(biggest.outcome.probability)}%`,
    compareLabel: 'chance by the odds',
    body: keener
      ? `PUNT users are backing ${name} more than the odds suggest. Bandwagon, or do they know something?`
      : `${name} gets more respect from the odds than from PUNT users. Value, or a trap?`,
    outcome: biggest.outcome,
  };
}

function formInsight(fixture) {
  const sides = [
    { team: fixture.homeTeam, side: 'home', form: generateForm(fixture.homeTeam) },
    { team: fixture.awayTeam, side: 'away', form: generateForm(fixture.awayTeam) },
  ];
  const scored = sides.map(s => ({ ...s, points: s.form.reduce((p, r) => p + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0) }));
  const hot = scored.reduce((a, b) => (b.points > a.points ? b : a));
  const unbeaten = hot.form.filter(r => r !== 'L').length;
  return {
    kind: 'form',
    headline: `${hot.team} are in form`,
    stat: `${hot.points}/15`,
    statLabel: 'points from last 5',
    compare: `${unbeaten}/5`,
    compareLabel: 'unbeaten',
    body: `Form isn't everything, but ${hot.team} have picked up ${hot.points} points from their last five.`,
    form: hot.form,
    outcome: fixture.outcomes.find(o => o.id === hot.side) ?? null,
  };
}

// ── Feed assembly ────────────────────────────────────────────────────────────

/**
 * Build the Discover feed.
 * @param {object[]} fixtures football fixtures
 * @param {'sports'|'casino'|'both'|null} intent
 * @returns {{ id: string, type: string, data: object }[]}
 */
export function buildDiscoverFeed(fixtures, intent) {
  const sports = intent !== 'casino';
  const casino = intent !== 'sports';

  const bigMatches = [...fixtures]
    .sort((a, b) => (b.isLive - a.isLive) || (getBetCount(b.id) - getBetCount(a.id)))
    .slice(0, 4);

  const pools = {
    match: sports ? bigMatches.map(f => ({ id: `match-${f.id}`, type: 'match', data: { fixture: f } })) : [],
    insight: sports ? bigMatches.slice(0, 3).map((f, i) => ({
      id: `insight-${f.id}`, type: 'insight',
      data: { fixture: f, insight: i % 2 ? formInsight(f) : crowdVsOddsInsight(f) },
    })) : [],
    boost: sports ? BOOSTS.map(b => ({ id: b.id, type: 'boost', data: b })) : [],
    casino: casino ? NEW_RELEASES.map(g => ({ id: g.id, type: 'casino', data: g })) : [],
    offer: OFFERS
      .filter(o => (o.product === 'casino' ? casino : sports))
      .map(o => ({ id: o.id, type: 'offer', data: o })),
    feature: FEATURES
      .filter(() => sports) // all current features are sports-side
      .map(f => ({ id: f.id, type: 'feature', data: f })),
  };

  // A repeating rhythm so no two similar cards sit together
  const rhythm = ['match', 'insight', 'boost', 'casino', 'match', 'offer', 'feature', 'insight', 'casino', 'match', 'boost', 'offer', 'feature', 'casino', 'match', 'insight', 'boost', 'feature'];
  const feed = [];
  const cursors = Object.fromEntries(Object.keys(pools).map(k => [k, 0]));
  for (const type of rhythm) {
    const pool = pools[type];
    if (cursors[type] < pool.length) feed.push(pool[cursors[type]++]);
  }
  // Anything the rhythm didn't reach goes on the end
  for (const [type, pool] of Object.entries(pools)) {
    feed.push(...pool.slice(cursors[type]));
  }

  // Safer-gambling check-in after the 6th card (or at the end of a short feed)
  feed.splice(Math.min(6, feed.length), 0, { id: 'safer', type: 'safer', data: {} });
  return feed;
}
