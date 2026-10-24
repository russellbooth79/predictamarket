import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const ODDS_API_KEY = process.env.ODDS_API_KEY || '';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

// ── In-memory cache ──────────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SPORTS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes for sports discovery

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
  });
  if (!res.ok) throw new Error(`Odds API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Normalise bookmaker odds to probabilities ─────────────────────────────────
function normaliseProbabilities(rawProbs) {
  const total = rawProbs.reduce((s, p) => s + p, 0);
  return rawProbs.map(p => Math.round((p / total) * 100));
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

// Boxing/MMA — two-way, no draw market
app.get('/api/odds/boxing', (req, res) =>
  fetchSportOdds(req, res, {
    sportKey: 'boxing',
    cacheKey: 'boxing',
    transformFn: transformTwoWayEvent,
    transformOpts: { sport: 'boxing', competition: 'Boxing', competitionShort: 'BOX' },
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

// Tennis (existing, preserving player1/player2 shape for TennisCard)
app.get('/api/odds/tennis', async (req, res) => {
  try {
    const cached = getCached('tennis');
    if (cached) return res.json(cached);

    const data = await oddsApiFetch('/sports/tennis_atp_us_open/odds', {
      regions: 'uk',
      markets: 'h2h',
      oddsFormat: 'decimal',
      dateFormat: 'iso',
    }).catch(() => []);

    const events = data
      .map(ev => {
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
          competition: 'ATP',
          player1: { name: ev.home_team },
          player2: { name: ev.away_team },
          matchTime: ev.commence_time,
          isLive: false,
          outcomes: [
            { id: 'p1', label: ev.home_team, probability: Math.max(...h2hBooks.map(b => b.p1Prob)) },
            { id: 'p2', label: ev.away_team, probability: Math.max(...h2hBooks.map(b => b.p2Prob)) },
          ],
          bookmakers: h2hBooks,
        };
      })
      .filter(Boolean)
      .slice(0, 6);

    setCache('tennis', events);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  console.log(`Odds API key: ${ODDS_API_KEY ? 'configured' : 'MISSING — serving mock data via frontend'}`);
});
