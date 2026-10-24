import express from 'express';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const ODDS_API_KEY = process.env.ODDS_API_KEY || '';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

// ── In-memory cache ──────────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { cache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// ── Odds API fetch helper ─────────────────────────────────────────────────────
async function oddsApiFetch(path, params = {}) {
  if (!ODDS_API_KEY) throw new Error('ODDS_API_KEY not configured');
  const url = new URL(`${ODDS_API_BASE}${path}`);
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

function transformEvent(ev) {
  // ev.bookmakers is array of { key, title, markets: [{ key, outcomes: [{name, price}] }] }
  const h2hBooks = ev.bookmakers
    .map(b => {
      const market = b.markets.find(m => m.key === 'h2h');
      if (!market) return null;
      const outcomes = market.outcomes;
      // Typical order: home, away, draw — sort consistently
      const home = outcomes.find(o => o.name === ev.home_team);
      const away = outcomes.find(o => o.name === ev.away_team);
      const draw = outcomes.find(o => o.name === 'Draw');
      if (!home || !away) return null;
      const rawProbs = [
        (1 / home.price) * 100,
        draw ? (1 / draw.price) * 100 : 0,
        (1 / away.price) * 100,
      ];
      const norm = normaliseProbabilities(rawProbs.filter(p => p > 0));
      return {
        bookmaker: b.title,
        bookmakerKey: b.key,
        homeProb: draw ? norm[0] : norm[0],
        drawProb: draw ? norm[1] : null,
        awayProb: draw ? norm[2] : norm[1],
        homeOdds: home.price,
        drawOdds: draw ? draw.price : null,
        awayOdds: away.price,
      };
    })
    .filter(Boolean);

  if (!h2hBooks.length) return null;

  // Best available probability per outcome (highest prob = best price)
  const bestHome = Math.max(...h2hBooks.map(b => b.homeProb));
  const bestDraw = Math.max(...h2hBooks.filter(b => b.drawProb != null).map(b => b.drawProb));
  const bestAway = Math.max(...h2hBooks.map(b => b.awayProb));

  const outcomes = [
    { id: 'home', label: `${ev.home_team.split(' ').slice(-1)[0]} Win`, probability: bestHome, team: ev.home_team },
    ...(h2hBooks.some(b => b.drawProb != null)
      ? [{ id: 'draw', label: 'Draw', probability: bestDraw }]
      : []),
    { id: 'away', label: `${ev.away_team.split(' ').slice(-1)[0]} Win`, probability: bestAway, team: ev.away_team },
  ];

  return {
    id: ev.id,
    sport: 'football',
    competition: 'Premier League',
    competitionShort: 'PL',
    homeTeam: ev.home_team,
    awayTeam: ev.away_team,
    kickoff: ev.commence_time,
    isLive: false,
    liveMinute: null,
    liveScore: null,
    outcomes,
    bookmakers: h2hBooks, // full per-book breakdown for the comparison chart
  };
}

// ── API Routes ────────────────────────────────────────────────────────────────
app.get('/api/odds/football', async (req, res) => {
  try {
    const cacheKey = 'football_epl';
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const data = await oddsApiFetch('/sports/soccer_epl/odds', {
      regions: 'uk',
      markets: 'h2h',
      oddsFormat: 'decimal',
      dateFormat: 'iso',
    });

    const events = data
      .map(transformEvent)
      .filter(Boolean)
      .slice(0, 12); // cap at 12 events

    setCache(cacheKey, events);
    res.json(events);
  } catch (err) {
    console.error('Football odds error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/odds/tennis', async (req, res) => {
  try {
    const cacheKey = 'tennis';
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const data = await oddsApiFetch('/sports/tennis_atp_french_open/odds', {
      regions: 'uk',
      markets: 'h2h',
      oddsFormat: 'decimal',
      dateFormat: 'iso',
    }).catch(() => []); // fallback if no live tournament

    const events = data
      .map(ev => {
        const h2hBooks = ev.bookmakers
          .map(b => {
            const market = b.markets.find(m => m.key === 'h2h');
            if (!market || market.outcomes.length < 2) return null;
            const [p1, p2] = market.outcomes;
            const raw = [1/p1.price * 100, 1/p2.price * 100];
            const norm = normaliseProbabilities(raw);
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

    setCache(cacheKey, events);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!ODDS_API_KEY,
    cacheSize: cache.size,
    timestamp: new Date().toISOString(),
  });
});

// ── Serve React build ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PredictaMarket server running on port ${PORT}`);
  console.log(`Odds API key: ${ODDS_API_KEY ? 'configured' : 'MISSING — using mock data'}`);
});
