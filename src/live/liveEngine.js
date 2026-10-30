/**
 * liveEngine.js
 *
 * Pure football match simulator for the in-play experience. No React.
 *
 * Each live match advances in small ticks. Per tick it moves momentum
 * (a random walk), places the ball, and rolls for events — dangerous
 * attacks, shots, corners, cards and goals — with rates driven by the
 * pre-match odds and current momentum.
 *
 * Live prices come from a Poisson model of the goals still to come:
 *   - match result: P(final home goals > / = / < away goals)
 *   - next goal:    home / no more goals / away
 *   - micro market: "goal (or corner) in the next 5 minutes?"
 *
 * Demo pacing: one match minute passes every MINUTE_MS of real time, so a
 * full 90 minutes takes about 4.5 minutes to watch.
 */

export const MINUTE_MS = 3000;
export const TICK_MS = 500;
const MIN_PER_TICK = TICK_MS / MINUTE_MS;

const GOALS_PER_90 = 2.7;
const CORNERS_PER_90 = 10;
const CARDS_PER_90 = 3.8;
const SHOTS_PER_90 = 24;

const MICRO_OPEN_MIN = 3;   // betting window before the 5 minutes start
const MICRO_LENGTH_MIN = 5;

// ── Small helpers ────────────────────────────────────────────────────────────

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function poisson(k, mu) {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return (Math.exp(-mu) * mu ** k) / f;
}

/** Split expected goals per 90 between the sides using the pre-match odds */
function baseRates(fixture) {
  const p = Object.fromEntries(fixture.outcomes.map(o => [o.id, o.probability / 100]));
  const homeShare = clamp((p.home ?? 0.4) + (p.draw ?? 0.25) / 2, 0.15, 0.85);
  return { home: GOALS_PER_90 * homeShare, away: GOALS_PER_90 * (1 - homeShare) };
}

/** Rates per 90 for the rest of the match, nudged by current momentum */
function liveRates(m) {
  const boost = 0.35 * m.momentum; // momentum in -1..1, positive = home on top
  return { home: m.rates.home * (1 + boost), away: m.rates.away * (1 - boost) };
}

// ── Pricing ──────────────────────────────────────────────────────────────────

/** Match result probabilities (0-100) given the score and minutes left */
export function resultProbabilities(m) {
  const left = Math.max(0, 90 - m.minute);
  const r = liveRates(m);
  const muH = (r.home * left) / 90;
  const muA = (r.away * left) / 90;
  let home = 0, draw = 0, away = 0;
  for (let i = 0; i <= 8; i++) {
    for (let j = 0; j <= 8; j++) {
      const p = poisson(i, muH) * poisson(j, muA);
      const diff = m.score.home + i - (m.score.away + j);
      if (diff > 0) home += p; else if (diff < 0) away += p; else draw += p;
    }
  }
  const total = home + draw + away;
  return { home: (home / total) * 100, draw: (draw / total) * 100, away: (away / total) * 100 };
}

/** Next goal: home / none / away (0-100) */
export function nextGoalProbabilities(m) {
  const left = Math.max(0, 90 - m.minute);
  const r = liveRates(m);
  const muH = (r.home * left) / 90;
  const muA = (r.away * left) / 90;
  const none = Math.exp(-(muH + muA));
  const any = 1 - none;
  const total = muH + muA || 1;
  return { home: any * (muH / total) * 100, none: none * 100, away: any * (muA / total) * 100 };
}

function microProbability(m, market, minutes) {
  const r = liveRates(m);
  const perMin = market === 'goal' ? (r.home + r.away) / 90 : CORNERS_PER_90 / 90;
  return (1 - Math.exp(-perMin * minutes)) * 100;
}

const MICRO_MARKETS = [
  { id: 'goal', question: 'Goal in the next 5 minutes?' },
  { id: 'corner', question: 'Corner in the next 5 minutes?' },
];

function newMicroWindow(m, index) {
  const market = MICRO_MARKETS[index % MICRO_MARKETS.length];
  const opensAt = m.minute;
  const from = Math.ceil(opensAt + MICRO_OPEN_MIN);
  const to = from + MICRO_LENGTH_MIN;
  return {
    id: `${m.id}-micro-${index}`,
    index,
    market: market.id,
    question: market.question,
    from, to,
    status: to > 90 ? 'void' : 'open', // 'open' (betting) → 'running' → 'settled'
    probYes: microProbability(m, market.id, MICRO_LENGTH_MIN),
    happened: false,
    result: null, // 'yes' | 'no'
  };
}

/** Recompute every price on the match */
function reprice(m) {
  m.prices = {
    result: resultProbabilities(m),
    nextGoal: nextGoalProbabilities(m),
  };
  if (m.micro?.status === 'open') {
    m.micro.probYes = microProbability(m, m.micro.market, MICRO_LENGTH_MIN);
  }
  return m;
}

// ── Setup ────────────────────────────────────────────────────────────────────

/**
 * Plausible momentum for minutes played before we started simulating, so a
 * match joined at 67' doesn't show a flat graph. Deterministic per fixture.
 */
function seedMomentum(fixture, minutes) {
  let seed = 0;
  for (const ch of fixture.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const rates = baseRates(fixture);
  const strength = (rates.home - rates.away) / GOALS_PER_90;
  let m = 0;
  return Array.from({ length: minutes }, () => {
    m = clamp(m * 0.8 + (rand() - 0.5) * 0.9 + strength * 0.15, -1, 1);
    return m;
  });
}

/** Create sim state for a fixture. Live fixtures resume from their minute. */
export function createMatch(fixture, { kickOff = false } = {}) {
  const minute = kickOff ? 0 : (fixture.liveMinute ?? 0);
  const score = kickOff ? { home: 0, away: 0 } : { ...(fixture.liveScore ?? { home: 0, away: 0 }) };
  const m = {
    id: fixture.id,
    fixture,
    minute,
    score,
    status: 'live', // 'live' | 'ft'
    rates: baseRates(fixture),
    momentum: 0,
    momentumHistory: seedMomentum(fixture, Math.floor(minute)),
    ball: { x: 50, y: 50 },
    stats: {
      possession: 50,
      shots: { home: Math.round(minute / 9), away: Math.round(minute / 12) },
      onTarget: { home: Math.round(minute / 25), away: Math.round(minute / 35) },
      corners: { home: Math.round(minute / 18), away: Math.round(minute / 22) },
      cards: { home: Math.round(minute / 50), away: Math.round(minute / 40) },
    },
    events: kickOff ? [{ minute: 0, type: 'kickoff', side: null, text: 'Kick-off' }] : [],
    lastEvent: null,
    updatedAt: Date.now(),
    microIndex: 0,
    micro: null,
    finishedAt: null,
  };
  // Seed a goal event per goal already scored so the timeline isn't empty
  if (!kickOff) {
    for (let i = 0; i < score.home; i++) m.events.push({ minute: Math.round(((i + 1) * minute) / (score.home + 2)), type: 'goal', side: 'home', text: `Goal! ${fixture.homeTeam}` });
    for (let i = 0; i < score.away; i++) m.events.push({ minute: Math.round(((i + 1.5) * minute) / (score.away + 2)), type: 'goal', side: 'away', text: `Goal! ${fixture.awayTeam}` });
    m.events.sort((a, b) => b.minute - a.minute);
  }
  m.micro = newMicroWindow(m, m.microIndex++);
  return reprice(m);
}

// ── Tick ─────────────────────────────────────────────────────────────────────

function addEvent(m, type, side, text) {
  const e = { minute: Math.floor(m.minute) || 1, type, side, text, at: Date.now() };
  m.events = [e, ...m.events].slice(0, 40);
  m.lastEvent = e;
  return e;
}

/**
 * Advance a match by one tick. Returns { match, events } where events are
 * the notable things that happened this tick (for alerts and settlement).
 * Never mutates the input.
 */
export function tick(prev, rand = Math.random) {
  if (prev.status !== 'live') return { match: prev, events: [] };

  const m = {
    ...prev,
    score: { ...prev.score },
    ball: { ...prev.ball },
    stats: {
      ...prev.stats,
      shots: { ...prev.stats.shots },
      onTarget: { ...prev.stats.onTarget },
      corners: { ...prev.stats.corners },
      cards: { ...prev.stats.cards },
    },
    micro: prev.micro ? { ...prev.micro } : null,
  };
  const happened = [];
  const fx = m.fixture;
  m.updatedAt = Date.now(); // sim clock, so renders don't need Date.now()
  const name = side => (side === 'home' ? fx.homeTeam : fx.awayTeam);

  const prevMinuteFloor = Math.floor(m.minute);
  m.minute = Math.min(90, m.minute + MIN_PER_TICK);

  // Momentum: mean-reverting random walk, nudged by team strength
  const strength = (m.rates.home - m.rates.away) / GOALS_PER_90; // ~ -0.7..0.7
  m.momentum = clamp(m.momentum * 0.92 + (rand() - 0.5) * 0.45 + strength * 0.04, -1, 1);
  const attacking = rand() < 0.5 + m.momentum * 0.35 ? 'home' : 'away';

  // Ball drifts towards the attacking team's target end (home attacks right)
  const targetX = attacking === 'home' ? 60 + rand() * 32 : 8 + rand() * 32;
  m.ball.x = clamp(m.ball.x + (targetX - m.ball.x) * 0.45, 3, 97);
  m.ball.y = clamp(m.ball.y + (rand() - 0.5) * 30, 8, 92);
  m.stats.possession = clamp(m.stats.possession + (attacking === 'home' ? 0.6 : -0.6), 30, 70);

  // Event rolls (rates per tick)
  const r = liveRates(m);
  const per = rate => (rate / 90) * MIN_PER_TICK;
  const sideRate = side => (side === 'home' ? r.home : r.away);
  const sideShare = sideRate(attacking) / (r.home + r.away);

  if (rand() < per(GOALS_PER_90) * 2 * sideShare) {
    m.score[attacking] += 1;
    m.stats.shots[attacking] += 1;
    m.stats.onTarget[attacking] += 1;
    m.ball.x = attacking === 'home' ? 96 : 4;
    m.ball.y = 50;
    happened.push({ ...addEvent(m, 'goal', attacking, `GOAL! ${name(attacking)}`), score: { ...m.score } });
    if (m.micro?.status === 'running' && m.micro.market === 'goal') m.micro.happened = true;
  } else if (rand() < per(SHOTS_PER_90) * sideShare) {
    m.stats.shots[attacking] += 1;
    const onTarget = rand() < 0.38;
    if (onTarget) m.stats.onTarget[attacking] += 1;
    addEvent(m, 'shot', attacking, onTarget ? `Shot saved — ${name(attacking)}` : `Shot off target — ${name(attacking)}`);
  } else if (rand() < per(CORNERS_PER_90) * sideShare * 1.6) {
    m.stats.corners[attacking] += 1;
    m.ball.x = attacking === 'home' ? 99 : 1;
    m.ball.y = rand() < 0.5 ? 2 : 98;
    addEvent(m, 'corner', attacking, `Corner — ${name(attacking)}`);
    if (m.micro?.status === 'running' && m.micro.market === 'corner') m.micro.happened = true;
  } else if (rand() < per(CARDS_PER_90) * 0.5) {
    const defending = attacking === 'home' ? 'away' : 'home';
    m.stats.cards[defending] += 1;
    addEvent(m, 'card', defending, `Yellow card — ${name(defending)}`);
  } else if (rand() < 0.07) {
    addEvent(m, 'attack', attacking, `Dangerous attack — ${name(attacking)}`);
  }

  // Momentum history: one bar per completed minute
  if (Math.floor(m.minute) > prevMinuteFloor) {
    m.momentumHistory = [...prev.momentumHistory, m.momentum];
  }

  // Micro market lifecycle
  if (m.micro) {
    if (m.micro.status === 'open' && m.minute >= m.micro.from) m.micro.status = 'running';
    if (m.micro.status === 'running' && m.minute >= m.micro.to) {
      m.micro.status = 'settled';
      m.micro.result = m.micro.happened ? 'yes' : 'no';
      m.micro.settledAt = Date.now();
      happened.push({ type: 'micro-settled', micro: { ...m.micro } });
    }
    // Next window opens two minutes after one settles (or straight away if void)
    const ready = (m.micro.status === 'settled' && m.minute >= m.micro.to + 2) || m.micro.status === 'void';
    if (ready && m.minute < 90 - MICRO_OPEN_MIN - MICRO_LENGTH_MIN) {
      m.micro = newMicroWindow(m, m.microIndex);
      m.microIndex += 1;
    }
  }

  // Full time
  if (m.minute >= 90) {
    m.status = 'ft';
    m.finishedAt = Date.now();
    addEvent(m, 'ft', null, `Full time: ${fx.homeTeam} ${m.score.home}–${m.score.away} ${fx.awayTeam}`);
    const result = m.score.home > m.score.away ? 'home' : m.score.home < m.score.away ? 'away' : 'draw';
    happened.push({ type: 'ft', result, score: { ...m.score } });
    if (m.micro && m.micro.status !== 'settled') {
      m.micro.status = 'settled';
      m.micro.result = m.micro.happened ? 'yes' : 'no';
      happened.push({ type: 'micro-settled', micro: { ...m.micro } });
    }
  }

  return { match: reprice(m), events: happened };
}

/** Period label for the clock, e.g. "67'" / "HT" / "FT" */
export function clockLabel(m) {
  if (m.status === 'ft') return 'FT';
  const min = Math.floor(m.minute);
  return min === 45 ? 'HT' : `${Math.max(1, min)}'`;
}
