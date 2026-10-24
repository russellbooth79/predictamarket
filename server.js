import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ODDS_API_KEY = process.env.ODDS_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

// ── In-memory cache ──────────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
const SPORTS_CACHE_TTL_MS = 10 * 60 * 1000;

function getCached(key, ttl = CACHE_TTL_MS) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttl) { cache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// ── Odds API fetch helper ─────────────────────────────────────────────────────
async function oddsApiFetch(apiPath, params = {}) {
  if (!ODDS_API_KEY) throw new Error('ODDS_API_KEY not configured');
  const url = new URL(`${ODDS_API_BASE}${apiPath}`);
  url.searchParams.set('apiKey', ODDS_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'PredictaMarket/1.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Odds API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Normalise bookmaker odds to probabilities ─────────────────────────────────
function normaliseProbabilities(rawProbs) {
  const total = rawProbs.reduce((s, p) => s + p, 0);
  return rawProbs.map(p => Math.round((p / total) * 100));
}

// ── Decimal to fractional odds (for horse racing display) ─────────────────────
function decimalToFractional(decimal) {
  if (!decimal || decimal <= 1) return 'EVS';
  const frac = decimal - 1;
  // Find a reasonable fraction representation
  const denominators = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 25, 33, 50, 100];
  let bestNum = Math.round(frac);
  let bestDen = 1;
  let bestErr = Math.abs(frac - bestNum / bestDen);
  for (const den of denominators) {
    const num = Math.round(frac * den);
    const err = Math.abs(frac - num / den);
    if (err < bestErr) { bestErr = err; bestNum = num; bestDen = den; }
  }
  return `${bestNum}/${bestDen}`;
}

// ── Shared transform: three-way (football/soccer with draw) ───────────────────
function transformThreeWayEvent(ev, { sport = 'football', competition = 'Premier League', competitionShort = 'PL' } = {}) {
  const h2hBooks = ev.bookmakers
    .map(b => {
      const market = b.markets.find(m => m.key === 'h2h');
      if (!market) return null;
      const outcomes = market.outcomes;
      const home = outcomes.find(o => o.name === ev.home_team);
      const away = outcomes.find(o => o.name === ev.away_team);
      const draw = outcomes.find(o => o.name === 'Draw');
      if (!home || !away) return null;
      const rawProbs = [
        (1 / home.price) * 100,
        draw ? (1 / draw.price) * 100 : 0,
        (1 / away.price) * 100,
      ].filter(p => p > 0);
      const norm = normaliseProbabilities(rawProbs);
      return {
        bookmaker: b.title,
        bookmakerKey: b.key,
        homeProb: norm[0],
        drawProb: draw ? norm[1] : null,
        awayProb: draw ? norm[2] : norm[1],
        homeOdds: home.price,
        drawOdds: draw ? draw.price : null,
        awayOdds: away.price,
      };
    })
    .filter(Boolean);

  if (!h2hBooks.length) return null;

  const bestHome = Math.max(...h2hBooks.map(b => b.homeProb));
  const bestDraw = h2hBooks.some(b => b.drawProb != null)
    ? Math.max(...h2hBooks.filter(b => b.drawProb != null).map(b => b.drawProb))
    : null;
  const bestAway = Math.max(...h2hBooks.map(b => b.awayProb));

  const outcomes = [
    { id: 'home', label: `${ev.home_team.split(' ').slice(-1)[0]} Win`, probability: bestHome, team: ev.home_team },
    ...(bestDraw != null ? [{ id: 'draw', label: 'Draw', probability: bestDraw }] : []),
    { id: 'away', label: `${ev.away_team.split(' ').slice(-1)[0]} Win`, probability: bestAway, team: ev.away_team },
  ];

  return {
    id: ev.id,
    sport,
    competition,
    competitionShort,
    homeTeam: ev.home_team,
    awayTeam: ev.away_team,
    kickoff: ev.commence_time,
    isLive: false,
    liveMinute: null,
    liveScore: null,
    outcomes,
    bookmakers: h2hBooks,
  };
}

// ── Shared transform: two-way (boxing, NFL, etc.) ─────────────────────────────
function transformTwoWayEvent(ev, { sport = 'boxing', competition = 'Boxing', competitionShort = 'BOX' } = {}) {
  const h2hBooks = ev.bookmakers
    .map(b => {
      const market = b.markets.find(m => m.key === 'h2h');
      if (!market || market.outcomes.length < 2) return null;
      const [p1, p2] = market.outcomes;
      const norm = normaliseProbabilities([1/p1.price * 100, 1/p2.price * 100]);
      return { bookmaker: b.title, bookmakerKey: b.key, p1Prob: norm[0], p2Prob: norm[1] };
    })
    .filter(Boolean);

  if (!h2hBooks.length) return null;

  return {
    id: ev.id,
    sport,
    competition,
    competitionShort,
    homeTeam: ev.home_team,
    awayTeam: ev.away_team,
    kickoff: ev.commence_time,
    isLive: false,
    outcomes: [
      { id: 'home', label: ev.home_team, probability: Math.max(...h2hBooks.map(b => b.p1Prob)) },
      { id: 'away', label: ev.away_team, probability: Math.max(...h2hBooks.map(b => b.p2Prob)) },
    ],
    bookmakers: h2hBooks,
  };
}

// ── Transform: tennis (player1/player2 shape for TennisCard) ─────────────────
function transformTennisEvent(ev, competitionTitle) {
  const h2hBooks = ev.bookmakers
    .map(b => {
      const market = b.markets.find(m => m.key === 'h2h');
      if (!market || market.outcomes.length < 2) return null;
      const [p1, p2] = market.outcomes;
      const norm = normaliseProbabilities([1/p1.price * 100, 1/p2.price * 100]);
      return { bookmaker: b.title, bookmakerKey: b.key, p1Prob: norm[0], p2Prob: norm[1] };
    })
    .filter(Boolean);

  if (!h2hBooks.length) return null;

  return {
    id: ev.id,
    sport: 'tennis',
    competition: competitionTitle || 'ATP',
    competitionShort: 'ATP',
    player1: { name: ev.home_team },
    player2: { name: ev.away_team },
    matchTime: ev.commence_time,
    kickoff: ev.commence_time,
    isLive: false,
    outcomes: [
      { id: 'p1', label: ev.home_team, probability: Math.max(...h2hBooks.map(b => b.p1Prob)) },
      { id: 'p2', label: ev.away_team, probability: Math.max(...h2hBooks.map(b => b.p2Prob)) },
    ],
    bookmakers: h2hBooks,
  };
}

// ── Transform: horse racing (runners shape for HorseRacingCard) ───────────────
function transformHorseRaceEvent(ev) {
  // Aggregate all runner prices across bookmakers for best odds
  const runnerPrices = {};
  for (const bm of ev.bookmakers) {
    const market = bm.markets.find(m => m.key === 'h2h');
    if (!market) continue;
    for (const outcome of market.outcomes) {
      if (!runnerPrices[outcome.name]) runnerPrices[outcome.name] = [];
      runnerPrices[outcome.name].push(outcome.price);
    }
  }

  const runnerNames = Object.keys(runnerPrices);
  if (runnerNames.length < 2) return null;

  // Use best (highest) decimal odds per runner
  const rawRunners = runnerNames.map(name => {
    const best = Math.max(...runnerPrices[name]);
    return { name, decimalOdds: best, rawProb: (1 / best) * 100 };
  });

  // Normalise probabilities
  const totalProb = rawRunners.reduce((s, r) => s + r.rawProb, 0);
  const runners = rawRunners
    .sort((a, b) => b.rawProb - a.rawProb) // sort favourite first
    .map((r, i) => ({
      id: `runner-${i}`,
      name: r.name,
      saddleNumber: i + 1,
      probability: Math.max(1, Math.round((r.rawProb / totalProb) * 100)),
      decimalOdds: r.decimalOdds,
      fractionalOdds: decimalToFractional(r.decimalOdds),
      jockey: 'TBC',
      trainer: 'TBC',
      form: '-----',
    }));

  // Race name from home_team field (Odds API uses this for race name/venue)
  const raceName = ev.home_team || ev.away_team || 'Race';
  const competition = ev.sport_title || 'UK Racing';

  return {
    id: ev.id,
    sport: 'horseracing',
    competition,
    competitionShort: 'HR',
    raceName,
    raceTime: ev.commence_time,
    kickoff: ev.commence_time,
    isLive: false,
    going: 'Good',
    trackType: 'Flat',
    distance: '',
    raceClass: '',
    prizeMoney: null,
    runners,
  };
}

// ── Generic sport odds fetcher ────────────────────────────────────────────────
async function fetchSportOdds(req, res, { sportKey, cacheKey, transformFn, transformOpts = {}, maxEvents = 12 }) {
  try {
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const data = await oddsApiFetch(`/sports/${sportKey}/odds`, {
      regions: 'uk',
      markets: 'h2h',
      oddsFormat: 'decimal',
      dateFormat: 'iso',
    });

    const events = data.map(ev => transformFn(ev, transformOpts)).filter(Boolean).slice(0, maxEvents);
    setCache(cacheKey, events);
    res.json(events);
  } catch (err) {
    console.error(`${cacheKey} odds error:`, err.message);
    res.status(500).json({ error: err.message });
  }
}

// ── AI Bet Builder ────────────────────────────────────────────────────────────

app.post('/api/ai-bet', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  if (!anthropic) {
    return res.status(503).json({ error: 'AI not configured' });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You are a sports betting assistant for PredictaMarket. Return ONLY a JSON object with these fields:
{
  "fixture_id": "ai-<short-alphanumeric-id>",
  "eventName": "Home Team vs Away Team",
  "market": "Market type (e.g. Match Result, Both Teams to Score, Over/Under 2.5)",
  "selection": "Selection label",
  "odds": "X.XX",
  "probability": <integer 5-90>,
  "reasoning": "One or two sentences explaining the pick.",
  "confidence": "high" | "medium" | "low"
}
No other text. Only valid JSON.`,
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const suggestion = JSON.parse(jsonMatch[0]);
    res.json(suggestion);
  } catch (err) {
    console.error('AI bet error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────

// Premier League
app.get('/api/odds/football', (req, res) =>
  fetchSportOdds(req, res, {
    sportKey: 'soccer_epl',
    cacheKey: 'football_epl',
    transformFn: transformThreeWayEvent,
    transformOpts: { sport: 'football', competition: 'Premier League', competitionShort: 'PL' },
  })
);

// Champions League
app.get('/api/odds/champions-league', (req, res) =>
  fetchSportOdds(req, res, {
    sportKey: 'soccer_uefa_champs_league',
    cacheKey: 'football_ucl',
    transformFn: transformThreeWayEvent,
    transformOpts: { sport: 'football', competition: 'Champions League', competitionShort: 'UCL' },
  })
);

// EFL Championship
app.get('/api/odds/championship', (req, res) =>
  fetchSportOdds(req, res, {
    sportKey: 'soccer_efl_champ',
    cacheKey: 'football_efl',
    transformFn: transformThreeWayEvent,
    transformOpts: { sport: 'football', competition: 'EFL Championship', competitionShort: 'EFL' },
  })
);

// La Liga
app.get('/api/odds/la-liga', (req, res) =>
  fetchSportOdds(req, res, {
    sportKey: 'soccer_spain_la_liga',
    cacheKey: 'football_laliga',
    transformFn: transformThreeWayEvent,
    transformOpts: { sport: 'football', competition: 'La Liga', competitionShort: 'LAL' },
  })
);

// Boxing/MMA
app.get('/api/odds/boxing', (req, res) =>
  fetchSportOdds(req, res, {
    sportKey: 'boxing',
    cacheKey: 'boxing',
    transformFn: transformTwoWayEvent,
    transformOpts: { sport: 'boxing', competition: 'Boxing', competitionShort: 'BOX' },
    maxEvents: 8,
  })
);

// MMA
app.get('/api/odds/mma', (req, res) =>
  fetchSportOdds(req, res, {
    sportKey: 'mma_mixed_martial_arts',
    cacheKey: 'mma',
    transformFn: transformTwoWayEvent,
    transformOpts: { sport: 'boxing', competition: 'UFC / MMA', competitionShort: 'MMA' },
    maxEvents: 8,
  })
);

// NFL
app.get('/api/odds/nfl', (req, res) =>
  fetchSportOdds(req, res, {
    sportKey: 'americanfootball_nfl',
    cacheKey: 'nfl',
    transformFn: transformTwoWayEvent,
    transformOpts: { sport: 'americanfootball', competition: 'NFL', competitionShort: 'NFL' },
    maxEvents: 10,
  })
);

// NBA
app.get('/api/odds/nba', (req, res) =>
  fetchSportOdds(req, res, {
    sportKey: 'basketball_nba',
    cacheKey: 'nba',
    transformFn: transformTwoWayEvent,
    transformOpts: { sport: 'basketball', competition: 'NBA', competitionShort: 'NBA' },
    maxEvents: 10,
  })
);

// Tennis — dynamically finds the active tournament via sports discovery
app.get('/api/odds/tennis', async (req, res) => {
  try {
    const cached = getCached('tennis');
    if (cached) return res.json(cached);

    if (!ODDS_API_KEY) {
      setCache('tennis', []);
      return res.json([]);
    }

    // Discover active tennis sports from the API
    let activeTennisKeys = [];
    try {
      const sportsUrl = new URL(`${ODDS_API_BASE}/sports`);
      sportsUrl.searchParams.set('apiKey', ODDS_API_KEY);
      const sportsRes = await fetch(sportsUrl.toString(), {
        headers: { 'User-Agent': 'PredictaMarket/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      if (sportsRes.ok) {
        const sports = await sportsRes.json();
        activeTennisKeys = sports
          .filter(s => s.active && s.group?.toLowerCase() === 'tennis')
          .map(s => ({ key: s.key, title: s.title }));
      }
    } catch {
      // Fall through to static fallbacks
    }

    // Static fallbacks if discovery fails or returns nothing
    if (activeTennisKeys.length === 0) {
      activeTennisKeys = [
        { key: 'tennis_atp_us_open', title: 'ATP US Open' },
        { key: 'tennis_wta_us_open', title: 'WTA US Open' },
        { key: 'tennis_atp_french_open', title: 'ATP French Open' },
        { key: 'tennis_wta_french_open', title: 'WTA French Open' },
        { key: 'tennis_atp_wimbledon', title: 'ATP Wimbledon' },
        { key: 'tennis_wta_wimbledon', title: 'WTA Wimbledon' },
        { key: 'tennis_atp_aus_open', title: 'ATP Australian Open' },
      ];
    }

    let events = [];
    // Try up to 3 active tournaments to get some data without burning API quota
    for (const { key, title } of activeTennisKeys.slice(0, 3)) {
      try {
        const data = await oddsApiFetch(`/sports/${key}/odds`, {
          regions: 'uk',
          markets: 'h2h',
          oddsFormat: 'decimal',
          dateFormat: 'iso',
        });
        if (Array.isArray(data) && data.length > 0) {
          const transformed = data
            .map(ev => transformTennisEvent(ev, title))
            .filter(Boolean)
            .slice(0, 6);
          events.push(...transformed);
          if (events.length >= 6) break;
        }
      } catch {
        // Try next tournament
      }
    }

    events = events.slice(0, 6);
    setCache('tennis', events);
    res.json(events);
  } catch (err) {
    console.error('Tennis odds error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Horse Racing — UK & Ireland win markets
app.get('/api/odds/horse-racing', async (req, res) => {
  try {
    const cached = getCached('horse_racing');
    if (cached) return res.json(cached);

    if (!ODDS_API_KEY) {
      setCache('horse_racing', []);
      return res.json([]);
    }

    const data = await oddsApiFetch('/sports/horse_racing_uk_and_ire_win_market/odds', {
      regions: 'uk',
      markets: 'h2h',
      oddsFormat: 'decimal',
      dateFormat: 'iso',
    });

    const events = data
      .map(ev => transformHorseRaceEvent(ev))
      .filter(Boolean)
      .slice(0, 8);

    setCache('horse_racing', events);
    res.json(events);
  } catch (err) {
    // Horse racing may not be available on all API tiers — return empty gracefully
    console.error('Horse racing odds error:', err.message);
    setCache('horse_racing', []);
    res.json([]);
  }
});

// ── Sports discovery endpoint ─────────────────────────────────────────────────
app.get('/api/sports', async (req, res) => {
  try {
    const cached = getCached('sports_discovery', SPORTS_CACHE_TTL_MS);
    if (cached) return res.json(cached);

    if (!ODDS_API_KEY) {
      const staticSports = [
        { key: 'soccer_epl', title: 'Premier League', group: 'Soccer', active: true },
        { key: 'soccer_uefa_champs_league', title: 'Champions League', group: 'Soccer', active: true },
        { key: 'soccer_efl_champ', title: 'EFL Championship', group: 'Soccer', active: true },
        { key: 'soccer_spain_la_liga', title: 'La Liga', group: 'Soccer', active: true },
        { key: 'boxing', title: 'Boxing', group: 'Boxing', active: true },
        { key: 'mma_mixed_martial_arts', title: 'UFC / MMA', group: 'MMA', active: true },
        { key: 'americanfootball_nfl', title: 'NFL', group: 'American Football', active: true },
        { key: 'basketball_nba', title: 'NBA', group: 'Basketball', active: true },
      ];
      setCache('sports_discovery', staticSports);
      return res.json(staticSports);
    }

    const url = new URL(`${ODDS_API_BASE}/sports`);
    url.searchParams.set('apiKey', ODDS_API_KEY);
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'PredictaMarket/1.0' },
    });

    if (!response.ok) throw new Error(`Sports API ${response.status}`);

    const sports = await response.json();
    const result = sports
      .filter(s => s.active)
      .map(s => ({
        key: s.key,
        title: s.title,
        group: s.group,
        active: s.active,
        description: s.description || null,
      }));

    setCache('sports_discovery', result);
    res.json(result);
  } catch (err) {
    console.error('Sports discovery error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!ODDS_API_KEY,
    cacheSize: cache.size,
    timestamp: new Date().toISOString(),
  });
});

// ── Serve React build ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PredictaMarket server running on port ${PORT}`);
  console.log(`Odds API key: ${ODDS_API_KEY ? 'configured' : 'MISSING — serving empty data for live sports'}`);
});
