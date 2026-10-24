/**
 * matchDetails.js
 *
 * Extended per-fixture data for the match detail view.
 *
 * STRUCTURE NOTES:
 * - Keyed by fixture ID to allow O(1) lookup from the detail screen.
 * - `probabilityHistory` serves the odds graph. Live fixtures use `minute`
 *   as the x-axis; pre-match fixtures use `hoursAgo` (24 = opening line,
 *   0 = current). The `type` field tells the graph component which axis
 *   label set to render.
 * - All probabilities sum to 100 per data point (post-normalisation).
 *   Small rounding residuals (±1) are absorbed by the dominant outcome,
 *   consistent with the approach in fixtures.js.
 * - Market odds are in-play values for live fixtures, current pre-match
 *   prices for upcoming fixtures. They are NOT synced to the 1X2 prices
 *   in fixtures.js — in production these would come from a separate
 *   markets feed.
 * - `stats` is only populated for live/completed fixtures. Pre-match
 *   fixtures have `stats: null`.
 * - `events` is only populated for live/completed fixtures. Pre-match
 *   fixtures have `events: []`.
 */

export const matchDetails = {
  // ---------------------------------------------------------------------------
  // epl-001: Man City vs Arsenal — LIVE 67', City leading 2-1
  // ---------------------------------------------------------------------------
  'epl-001': {
    id: 'epl-001',
    type: 'live',

    // Live match stats at 67 minutes. City's possession dominance reflects
    // their shape holding a one-goal lead.
    stats: {
      possession: { home: 61, away: 39 },
      shots: { home: 14, away: 8 },
      shotsOnTarget: { home: 6, away: 3 },
      corners: { home: 7, away: 3 },
      fouls: { home: 9, away: 14 },
      yellowCards: { home: 1, away: 3 },
      redCards: { home: 0, away: 0 },
      xG: { home: 2.31, away: 0.94 },
      passes: { home: 487, away: 312 },
      passAccuracy: { home: 91, away: 83 },
    },

    // Match timeline events. These are rendered chronologically on the
    // match centre timeline strip.
    events: [
      {
        minute: 23,
        type: 'goal',
        team: 'home',
        player: 'Erling Haaland',
        assist: 'Kevin De Bruyne',
        description: 'Haaland taps in from a yard after De Bruyne\'s low cross beats the keeper',
      },
      {
        minute: 34,
        type: 'yellow_card',
        team: 'away',
        player: 'Thomas Partey',
        description: 'Late tackle on Gündogan midfield',
      },
      {
        minute: 41,
        type: 'yellow_card',
        team: 'away',
        player: 'Gabriel Magalhães',
        description: 'Cynical foul halting a City counter-attack',
      },
      {
        minute: 45,
        type: 'whistle',
        team: null,
        player: null,
        description: 'Half time: Man City 1-0 Arsenal',
      },
      {
        minute: 56,
        type: 'goal',
        team: 'home',
        player: 'Bernardo Silva',
        assist: 'Phil Foden',
        description: 'Stunning strike from 25 yards, bends into the top corner',
      },
      {
        minute: 61,
        type: 'goal',
        team: 'away',
        player: 'Bukayo Saka',
        assist: 'Martin Ødegaard',
        description: 'Arsenal pull one back — Saka cuts inside and finishes low to Ederson\'s right',
      },
      {
        minute: 63,
        type: 'yellow_card',
        team: 'home',
        player: 'Rodri',
        description: 'Time-wasting after the Arsenal goal',
      },
    ],

    // Probability history for the live odds graph. Each point represents
    // the implied win probabilities at that match minute. Goals cause
    // sharp discontinuities; the market then mean-reverts slightly as
    // punters weigh time remaining. Probabilities sum to 100 at each point.
    probabilityHistory: [
      // Pre-match opening line
      { minute: 0, home: 52, draw: 24, away: 24 },
      // Game settles, no clear threat yet
      { minute: 10, home: 53, draw: 23, away: 24 },
      { minute: 18, home: 54, draw: 23, away: 23 },
      // Haaland goal at 23' — home probability spikes hard
      { minute: 23, home: 71, draw: 17, away: 12 },
      // Market stabilises, Arsenal showing some possession
      { minute: 30, home: 69, draw: 18, away: 13 },
      { minute: 38, home: 68, draw: 19, away: 13 },
      // Half time — draw probability ticks up slightly (more time for Arsenal)
      { minute: 45, home: 67, draw: 20, away: 13 },
      { minute: 50, home: 66, draw: 20, away: 14 },
      // Bernardo Silva goal at 56' — 2-0, home probability jumps to near-certainty
      { minute: 56, home: 83, draw: 11, away: 6 },
      // Saka goal at 61' — 2-1, market tightens back
      { minute: 61, home: 72, draw: 16, away: 12 },
      // Current — holding steady, City managing game
      { minute: 67, home: 72, draw: 16, away: 12 },
    ],

    // Extended markets beyond the 1X2 in fixtures.js.
    // Odds and probabilities reflect current in-play state (67', 2-1).
    markets: [
      {
        id: 'btts',
        name: 'Both Teams to Score',
        // BTTS already landed (Saka scored for Arsenal), so this market
        // is effectively settled. Shown here for historical context only —
        // in production a settled market would be flagged and removed from
        // the active trading UI.
        settled: true,
        settledOutcome: 'yes',
        outcomes: [
          { id: 'yes', label: 'Yes', probability: 100, decimalOdds: 1.00 },
          { id: 'no', label: 'No', probability: 0, decimalOdds: null },
        ],
      },
      {
        id: 'over-under-goals',
        name: 'Total Goals',
        // 3 goals already scored. Over 2.5 and over 3.5 settled.
        // Over 4.5 still live — meaningful at 2-1 with 23 mins remaining.
        outcomes: [
          { id: 'over35', label: 'Over 3.5', probability: 52, decimalOdds: 1.88 },
          { id: 'under35', label: 'Under 3.5', probability: 48, decimalOdds: 1.95 },
          { id: 'over45', label: 'Over 4.5', probability: 28, decimalOdds: 3.40 },
          { id: 'under45', label: 'Under 4.5', probability: 72, decimalOdds: 1.36 },
        ],
      },
      {
        id: 'next-goal',
        name: 'Next Goal',
        outcomes: [
          { id: 'home', label: 'Man City', probability: 55, decimalOdds: 1.70 },
          { id: 'no-goal', label: 'No More Goals', probability: 20, decimalOdds: 4.80 },
          { id: 'away', label: 'Arsenal', probability: 25, decimalOdds: 3.70 },
        ],
      },
      {
        id: 'correct-score',
        name: 'Correct Score (Most Likely)',
        outcomes: [
          { id: 'cs-2-1', label: '2-1', probability: 22, decimalOdds: 4.30 },
          { id: 'cs-3-1', label: '3-1', probability: 18, decimalOdds: 5.20 },
          { id: 'cs-2-2', label: '2-2', probability: 13, decimalOdds: 7.00 },
          { id: 'cs-3-2', label: '3-2', probability: 9, decimalOdds: 10.00 },
          { id: 'cs-4-1', label: '4-1', probability: 8, decimalOdds: 11.50 },
          { id: 'cs-other', label: 'Any Other Score', probability: 30, decimalOdds: 3.10 },
        ],
      },
      {
        id: 'asian-handicap',
        name: 'Asian Handicap',
        outcomes: [
          { id: 'home-minus1', label: 'Man City -1', probability: 50, decimalOdds: 1.90 },
          { id: 'away-plus1', label: 'Arsenal +1', probability: 50, decimalOdds: 1.90 },
        ],
      },
      {
        id: 'anytime-scorer',
        name: 'Anytime Goalscorer',
        outcomes: [
          { id: 'haaland', label: 'Haaland', probability: 48, decimalOdds: 2.00 },
          { id: 'foden', label: 'Foden', probability: 28, decimalOdds: 3.40 },
          { id: 'bernardo', label: 'Bernardo Silva', probability: 25, decimalOdds: 3.80 },
          { id: 'saka', label: 'Saka', probability: 32, decimalOdds: 3.00 },
          { id: 'odegaard', label: 'Ødegaard', probability: 18, decimalOdds: 5.25 },
          { id: 'jesus', label: 'Gabriel Jesus', probability: 14, decimalOdds: 6.80 },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // epl-002: Liverpool vs Chelsea — LIVE 23', goalless
  // ---------------------------------------------------------------------------
  'epl-002': {
    id: 'epl-002',
    type: 'live',

    // Stats at 23 minutes. Goalless but Liverpool are the dominant side —
    // xG and shots already pointing toward them.
    stats: {
      possession: { home: 57, away: 43 },
      shots: { home: 5, away: 3 },
      shotsOnTarget: { home: 2, away: 1 },
      corners: { home: 3, away: 1 },
      fouls: { home: 4, away: 7 },
      yellowCards: { home: 0, away: 1 },
      redCards: { home: 0, away: 0 },
      xG: { home: 0.61, away: 0.22 },
      passes: { home: 198, away: 152 },
      passAccuracy: { home: 88, away: 82 },
    },

    events: [
      {
        minute: 7,
        type: 'chance',
        team: 'home',
        player: 'Mohamed Salah',
        description: 'Salah fires wide from inside the box — good chance wasted',
      },
      {
        minute: 14,
        type: 'yellow_card',
        team: 'away',
        player: 'Malo Gusto',
        description: 'Late challenge on Luis Díaz on the left wing',
      },
      {
        minute: 19,
        type: 'chance',
        team: 'home',
        player: 'Darwin Núñez',
        description: 'Header from a corner cleared off the line by Colwill',
      },
    ],

    // Probability history for a game that started with Liverpool as mild
    // favourites. Goalless at 23' means the market has barely moved from
    // opening. Small drift toward the draw as time passes without a goal.
    probabilityHistory: [
      { minute: 0, home: 52, draw: 25, away: 23 },
      // Small chance for Chelsea early, market barely reacts
      { minute: 5, home: 52, draw: 25, away: 23 },
      // Liverpool dominant but no goal — draw probability nudges up slightly
      { minute: 10, home: 51, draw: 26, away: 23 },
      // Chelsea yellow card, Liverpool piling on pressure
      { minute: 14, home: 52, draw: 25, away: 23 },
      // Cleared header — Liverpool close, home probability ticks
      { minute: 19, home: 53, draw: 24, away: 23 },
      // Current — 23 mins, scoreless
      { minute: 23, home: 52, draw: 25, away: 23 },
    ],

    markets: [
      {
        id: 'btts',
        name: 'Both Teams to Score',
        outcomes: [
          { id: 'yes', label: 'Yes', probability: 55, decimalOdds: 1.78 },
          { id: 'no', label: 'No', probability: 45, decimalOdds: 2.10 },
        ],
      },
      {
        id: 'over-under-goals',
        name: 'Total Goals',
        outcomes: [
          { id: 'over15', label: 'Over 1.5', probability: 76, decimalOdds: 1.28 },
          { id: 'under15', label: 'Under 1.5', probability: 24, decimalOdds: 4.00 },
          { id: 'over25', label: 'Over 2.5', probability: 54, decimalOdds: 1.80 },
          { id: 'under25', label: 'Under 2.5', probability: 46, decimalOdds: 2.10 },
          { id: 'over35', label: 'Over 3.5', probability: 30, decimalOdds: 3.20 },
          { id: 'under35', label: 'Under 3.5', probability: 70, decimalOdds: 1.40 },
        ],
      },
      {
        id: 'next-goal',
        name: 'Next Goal',
        outcomes: [
          { id: 'home', label: 'Liverpool', probability: 51, decimalOdds: 1.86 },
          { id: 'no-goal', label: 'No More Goals', probability: 12, decimalOdds: 7.80 },
          { id: 'away', label: 'Chelsea', probability: 37, decimalOdds: 2.60 },
        ],
      },
      {
        id: 'result-btts',
        name: 'Win & BTTS',
        outcomes: [
          { id: 'home-yes', label: 'Liverpool Win & Yes', probability: 30, decimalOdds: 3.20 },
          { id: 'away-yes', label: 'Chelsea Win & Yes', probability: 13, decimalOdds: 7.20 },
          { id: 'home-no', label: 'Liverpool Win & No', probability: 22, decimalOdds: 4.40 },
          { id: 'draw-yes', label: 'Draw & Yes', probability: 12, decimalOdds: 7.80 },
          { id: 'draw-no', label: 'Draw & No', probability: 13, decimalOdds: 7.20 },
          { id: 'away-no', label: 'Chelsea Win & No', probability: 10, decimalOdds: 9.50 },
        ],
      },
      {
        id: 'asian-handicap',
        name: 'Asian Handicap',
        outcomes: [
          { id: 'home-minus05', label: 'Liverpool -0.5', probability: 52, decimalOdds: 1.88 },
          { id: 'away-plus05', label: 'Chelsea +0.5', probability: 48, decimalOdds: 1.95 },
        ],
      },
      {
        id: 'anytime-scorer',
        name: 'Anytime Goalscorer',
        outcomes: [
          { id: 'salah', label: 'Mohamed Salah', probability: 40, decimalOdds: 2.40 },
          { id: 'nunez', label: 'Darwin Núñez', probability: 32, decimalOdds: 3.00 },
          { id: 'diaz', label: 'Luis Díaz', probability: 22, decimalOdds: 4.40 },
          { id: 'jackson', label: 'Nicolas Jackson', probability: 28, decimalOdds: 3.40 },
          { id: 'palmer', label: 'Cole Palmer', probability: 24, decimalOdds: 3.90 },
          { id: 'nkunku', label: 'Christopher Nkunku', probability: 18, decimalOdds: 5.20 },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // epl-003: Tottenham vs Aston Villa — PRE-MATCH, KO 15:00 today
  // ---------------------------------------------------------------------------
  'epl-003': {
    id: 'epl-003',
    // Pre-match: no live stats, no in-game events.
    // probabilityHistory spans last 24 hours; x-axis is hoursAgo (24 = opening,
    // 0 = current price). The graph should label this axis differently to live.
    type: 'prematch',
    stats: null,
    events: [],

    // Odds movement over the last 24 hours. Spurs opened as stronger favourites,
    // then news of Son Heung-min being doubtful (hamstring, disclosed 18h ago)
    // compressed the home win probability meaningfully. Market partially
    // recovered on confirmation he passed a late fitness test (~2h ago).
    // This creates a visible dip-and-recover shape in the graph.
    probabilityHistory: [
      // Opening line, 24 hours out — Spurs comfortable favourites
      { hoursAgo: 24, home: 49, draw: 26, away: 25 },
      // Steady overnight
      { hoursAgo: 20, home: 48, draw: 26, away: 26 },
      { hoursAgo: 18, home: 48, draw: 27, away: 25 },
      // Son injury doubt breaks — Spurs price drifts, Villa shortens
      { hoursAgo: 16, home: 44, draw: 27, away: 29 },
      { hoursAgo: 12, home: 43, draw: 28, away: 29 },
      { hoursAgo: 8, home: 43, draw: 28, away: 29 },
      // Some recovery as rumours of Son passing fitness test circulate
      { hoursAgo: 4, home: 44, draw: 27, away: 29 },
      // Son confirmed fit — Spurs recover back toward opening
      { hoursAgo: 2, home: 46, draw: 27, away: 27 },
      { hoursAgo: 1, home: 46, draw: 27, away: 27 },
      // Current price — slight residual drift, market settles
      { hoursAgo: 0, home: 45, draw: 27, away: 28 },
    ],

    markets: [
      {
        id: 'btts',
        name: 'Both Teams to Score',
        outcomes: [
          { id: 'yes', label: 'Yes', probability: 58, decimalOdds: 1.68 },
          { id: 'no', label: 'No', probability: 42, decimalOdds: 2.30 },
        ],
      },
      {
        id: 'over-under-goals',
        name: 'Total Goals',
        outcomes: [
          { id: 'over15', label: 'Over 1.5', probability: 79, decimalOdds: 1.24 },
          { id: 'under15', label: 'Under 1.5', probability: 21, decimalOdds: 4.60 },
          { id: 'over25', label: 'Over 2.5', probability: 57, decimalOdds: 1.72 },
          { id: 'under25', label: 'Under 2.5', probability: 43, decimalOdds: 2.25 },
          { id: 'over35', label: 'Over 3.5', probability: 31, decimalOdds: 3.10 },
          { id: 'under35', label: 'Under 3.5', probability: 69, decimalOdds: 1.42 },
        ],
      },
      {
        id: 'result-btts',
        name: 'Win & BTTS',
        outcomes: [
          { id: 'home-yes', label: 'Spurs Win & Yes', probability: 27, decimalOdds: 3.60 },
          { id: 'away-yes', label: 'Villa Win & Yes', probability: 16, decimalOdds: 6.00 },
          { id: 'home-no', label: 'Spurs Win & No', probability: 18, decimalOdds: 5.30 },
          { id: 'draw-yes', label: 'Draw & Yes', probability: 14, decimalOdds: 6.80 },
          { id: 'draw-no', label: 'Draw & No', probability: 13, decimalOdds: 7.30 },
          { id: 'away-no', label: 'Villa Win & No', probability: 12, decimalOdds: 8.00 },
        ],
      },
      {
        id: 'asian-handicap',
        name: 'Asian Handicap',
        outcomes: [
          { id: 'home-minus05', label: 'Spurs -0.5', probability: 45, decimalOdds: 2.15 },
          { id: 'away-plus05', label: 'Villa +0.5', probability: 55, decimalOdds: 1.78 },
        ],
      },
      {
        id: 'first-goalscorer',
        name: 'First Goalscorer',
        outcomes: [
          { id: 'richarlison', label: 'Richarlison', probability: 18, decimalOdds: 5.30 },
          { id: 'son', label: 'Son Heung-min', probability: 16, decimalOdds: 5.90 },
          { id: 'maddison', label: 'James Maddison', probability: 11, decimalOdds: 8.50 },
          { id: 'watkins', label: 'Ollie Watkins', probability: 17, decimalOdds: 5.60 },
          { id: 'bailey', label: 'Leon Bailey', probability: 10, decimalOdds: 9.50 },
          { id: 'mcginn', label: 'John McGinn', probability: 8, decimalOdds: 11.50 },
          { id: 'other', label: 'Any Other', probability: 20, decimalOdds: 4.80 },
        ],
      },
      {
        id: 'correct-score',
        name: 'Correct Score (Top Selections)',
        outcomes: [
          { id: 'cs-1-0', label: '1-0', probability: 13, decimalOdds: 7.40 },
          { id: 'cs-2-1', label: '2-1', probability: 11, decimalOdds: 8.60 },
          { id: 'cs-2-0', label: '2-0', probability: 10, decimalOdds: 9.60 },
          { id: 'cs-1-1', label: '1-1', probability: 14, decimalOdds: 6.90 },
          { id: 'cs-0-1', label: '0-1', probability: 10, decimalOdds: 9.60 },
          { id: 'cs-1-2', label: '1-2', probability: 9, decimalOdds: 10.50 },
          { id: 'cs-other', label: 'Any Other Score', probability: 33, decimalOdds: 2.90 },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // epl-004: Newcastle vs Brighton — PRE-MATCH, KO 17:30 today
  // ---------------------------------------------------------------------------
  'epl-004': {
    id: 'epl-004',
    type: 'prematch',
    stats: null,
    events: [],

    // Odds movement over the last 24 hours. This is a more even contest.
    // Brighton have been in excellent form — the market has been steadily
    // shortening them over 24h, drifting Newcastle. No dramatic news events,
    // just gradual money coming in for the away side (possibly a large
    // syndicate bet placed 6h ago compressed Newcastle's price).
    probabilityHistory: [
      // Opening line — Newcastle slight home advantage
      { hoursAgo: 24, home: 51, draw: 25, away: 24 },
      // Gentle drift as Brighton form assessed
      { hoursAgo: 20, home: 50, draw: 26, away: 24 },
      { hoursAgo: 16, home: 50, draw: 25, away: 25 },
      { hoursAgo: 12, home: 49, draw: 26, away: 25 },
      // Noticeable Brighton money in — Newcastle drifts
      { hoursAgo: 8, home: 49, draw: 26, away: 25 },
      // Suspected syndicate activity shifts market
      { hoursAgo: 6, home: 47, draw: 26, away: 27 },
      { hoursAgo: 4, home: 47, draw: 27, away: 26 },
      // Market stabilises, minor recovery for Newcastle
      { hoursAgo: 2, home: 48, draw: 26, away: 26 },
      { hoursAgo: 1, home: 48, draw: 26, away: 26 },
      // Current — genuinely open market
      { hoursAgo: 0, home: 48, draw: 26, away: 26 },
    ],

    markets: [
      {
        id: 'btts',
        name: 'Both Teams to Score',
        outcomes: [
          { id: 'yes', label: 'Yes', probability: 60, decimalOdds: 1.62 },
          { id: 'no', label: 'No', probability: 40, decimalOdds: 2.40 },
        ],
      },
      {
        id: 'over-under-goals',
        name: 'Total Goals',
        outcomes: [
          { id: 'over15', label: 'Over 1.5', probability: 80, decimalOdds: 1.22 },
          { id: 'under15', label: 'Under 1.5', probability: 20, decimalOdds: 4.80 },
          { id: 'over25', label: 'Over 2.5', probability: 59, decimalOdds: 1.66 },
          { id: 'under25', label: 'Under 2.5', probability: 41, decimalOdds: 2.35 },
          { id: 'over35', label: 'Over 3.5', probability: 33, decimalOdds: 2.95 },
          { id: 'under35', label: 'Under 3.5', probability: 67, decimalOdds: 1.46 },
        ],
      },
      {
        id: 'result-btts',
        name: 'Win & BTTS',
        outcomes: [
          { id: 'home-yes', label: 'Newcastle Win & Yes', probability: 29, decimalOdds: 3.30 },
          { id: 'away-yes', label: 'Brighton Win & Yes', probability: 16, decimalOdds: 6.00 },
          { id: 'home-no', label: 'Newcastle Win & No', probability: 19, decimalOdds: 5.10 },
          { id: 'draw-yes', label: 'Draw & Yes', probability: 15, decimalOdds: 6.40 },
          { id: 'draw-no', label: 'Draw & No', probability: 11, decimalOdds: 8.80 },
          { id: 'away-no', label: 'Brighton Win & No', probability: 10, decimalOdds: 9.60 },
        ],
      },
      {
        id: 'asian-handicap',
        name: 'Asian Handicap',
        outcomes: [
          { id: 'home-minus05', label: 'Newcastle -0.5', probability: 48, decimalOdds: 2.02 },
          { id: 'away-plus05', label: 'Brighton +0.5', probability: 52, decimalOdds: 1.87 },
        ],
      },
      {
        id: 'first-goalscorer',
        name: 'First Goalscorer',
        outcomes: [
          { id: 'isak', label: 'Alexander Isak', probability: 22, decimalOdds: 4.40 },
          { id: 'gordon', label: 'Anthony Gordon', probability: 14, decimalOdds: 6.80 },
          { id: 'almiron', label: 'Miguel Almirón', probability: 10, decimalOdds: 9.50 },
          { id: 'welbeck', label: 'Danny Welbeck', probability: 16, decimalOdds: 6.00 },
          { id: 'mitoma', label: 'Kaoru Mitoma', probability: 13, decimalOdds: 7.40 },
          { id: 'adingra', label: 'Simon Adingra', probability: 9, decimalOdds: 10.50 },
          { id: 'other', label: 'Any Other', probability: 16, decimalOdds: 5.90 },
        ],
      },
      {
        id: 'correct-score',
        name: 'Correct Score (Top Selections)',
        outcomes: [
          { id: 'cs-1-0', label: '1-0', probability: 12, decimalOdds: 7.90 },
          { id: 'cs-2-1', label: '2-1', probability: 11, decimalOdds: 8.60 },
          { id: 'cs-2-0', label: '2-0', probability: 9, decimalOdds: 10.60 },
          { id: 'cs-1-1', label: '1-1', probability: 14, decimalOdds: 6.80 },
          { id: 'cs-0-1', label: '0-1', probability: 10, decimalOdds: 9.60 },
          { id: 'cs-1-2', label: '1-2', probability: 9, decimalOdds: 10.60 },
          { id: 'cs-other', label: 'Any Other Score', probability: 35, decimalOdds: 2.74 },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // epl-010: Crystal Palace vs Ipswich — LIVE halftime, 1-1
  // ---------------------------------------------------------------------------
  'epl-010': {
    id: 'epl-010',
    type: 'live',

    // Stats at halftime. Competitive match — Ipswich have been the more
    // direct side despite being away. Palace have more technical quality.
    stats: {
      possession: { home: 54, away: 46 },
      shots: { home: 7, away: 9 },
      shotsOnTarget: { home: 3, away: 4 },
      corners: { home: 4, away: 5 },
      fouls: { home: 7, away: 6 },
      yellowCards: { home: 1, away: 1 },
      redCards: { home: 0, away: 0 },
      xG: { home: 0.88, away: 1.12 },
      passes: { home: 243, away: 207 },
      passAccuracy: { home: 83, away: 79 },
    },

    events: [
      {
        minute: 12,
        type: 'goal',
        team: 'home',
        player: 'Jean-Philippe Mateta',
        assist: 'Eberechi Eze',
        description: 'Mateta powers a header in from Eze\'s left-wing cross',
      },
      {
        minute: 28,
        type: 'yellow_card',
        team: 'home',
        player: 'Jefferson Lerma',
        description: 'Professional foul on the edge of the box, stops a counter',
      },
      {
        minute: 38,
        type: 'goal',
        team: 'away',
        player: 'Liam Delap',
        assist: 'Omari Hutchinson',
        description: 'Delap equalises — ruthless finish after Palace ball-watched from a free kick',
      },
      {
        minute: 41,
        type: 'yellow_card',
        team: 'away',
        player: 'Sam Morsy',
        description: 'Needless foul in midfield',
      },
      {
        minute: 45,
        type: 'whistle',
        team: null,
        player: null,
        description: 'Half time: Crystal Palace 1-1 Ipswich Town',
      },
    ],

    // Palace opened as moderate favourites. Mateta goal swung it sharply,
    // Ipswich equaliser flattened it out completely. Now genuinely open.
    probabilityHistory: [
      // Pre-match opening
      { minute: 0, home: 45, draw: 27, away: 28 },
      { minute: 5, home: 45, draw: 27, away: 28 },
      // Mateta goal at 12' — Palace spike
      { minute: 12, home: 64, draw: 22, away: 14 },
      { minute: 20, home: 63, draw: 22, away: 15 },
      { minute: 28, home: 62, draw: 23, away: 15 },
      // Ipswich pressure building before equaliser
      { minute: 35, home: 60, draw: 24, away: 16 },
      // Delap equaliser at 38' — flattens the market dramatically
      { minute: 38, home: 43, draw: 28, away: 29 },
      // Market settles into halftime
      { minute: 45, home: 42, draw: 28, away: 30 },
    ],

    markets: [
      {
        id: 'btts',
        name: 'Both Teams to Score',
        // BTTS already landed
        settled: true,
        settledOutcome: 'yes',
        outcomes: [
          { id: 'yes', label: 'Yes', probability: 100, decimalOdds: 1.00 },
          { id: 'no', label: 'No', probability: 0, decimalOdds: null },
        ],
      },
      {
        id: 'over-under-goals',
        name: 'Total Goals',
        // Over 1.5 settled. Over 2.5 still live.
        outcomes: [
          { id: 'over25', label: 'Over 2.5', probability: 55, decimalOdds: 1.76 },
          { id: 'under25', label: 'Under 2.5', probability: 45, decimalOdds: 2.15 },
          { id: 'over35', label: 'Over 3.5', probability: 28, decimalOdds: 3.45 },
          { id: 'under35', label: 'Under 3.5', probability: 72, decimalOdds: 1.36 },
        ],
      },
      {
        id: 'next-goal',
        name: 'Next Goal',
        outcomes: [
          { id: 'home', label: 'Crystal Palace', probability: 44, decimalOdds: 2.18 },
          { id: 'no-goal', label: 'No More Goals', probability: 22, decimalOdds: 4.40 },
          { id: 'away', label: 'Ipswich', probability: 34, decimalOdds: 2.84 },
        ],
      },
      {
        id: 'correct-score',
        name: 'Correct Score (Most Likely)',
        outcomes: [
          { id: 'cs-1-1', label: '1-1', probability: 20, decimalOdds: 4.80 },
          { id: 'cs-2-1', label: '2-1', probability: 15, decimalOdds: 6.30 },
          { id: 'cs-1-2', label: '1-2', probability: 14, decimalOdds: 6.80 },
          { id: 'cs-2-2', label: '2-2', probability: 12, decimalOdds: 7.90 },
          { id: 'cs-other', label: 'Any Other Score', probability: 39, decimalOdds: 2.48 },
        ],
      },
      {
        id: 'asian-handicap',
        name: 'Asian Handicap',
        outcomes: [
          { id: 'home-level', label: 'Crystal Palace 0', probability: 42, decimalOdds: 2.30 },
          { id: 'away-level', label: 'Ipswich 0', probability: 58, decimalOdds: 1.68 },
        ],
      },
    ],
  },
};
