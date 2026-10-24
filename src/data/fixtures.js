/**
 * fixtures.js
 *
 * Mock fixture data for PredictaMarket prototype.
 *
 * DATA INTEGRITY NOTES:
 * - All probabilities are pre-normalised (sum to 100 per event) so components
 *   can render directly without running normalisation at render time.
 * - Decimal odds reflect realistic UK bookmaker prices as of late October 2026.
 * - Live fixtures have liveMinute and liveScore populated.
 * - kickoff/raceTime/matchTime are ISO 8601 UTC strings.
 *
 * Boxing fixtures carry both homeTeam/awayTeam (for generic card compatibility)
 * and fighter1/fighter2 objects (for FightCard rich display).
 *
 * NFL/NBA fixtures carry both gameTime and kickoff (alias) plus spread, overUnder,
 * venue, and conference for AmericanSportsCard.
 */

// ---------------------------------------------------------------------------
// FOOTBALL -- Premier League
// ---------------------------------------------------------------------------

export const footballFixtures = [
  {
    id: 'epl-001', sport: 'football', competition: 'Premier League', competitionShort: 'PL',
    homeTeam: 'Manchester City', awayTeam: 'Arsenal',
    kickoff: '2026-10-24T12:30:00Z', isLive: true, liveMinute: 67, liveScore: { home: 2, away: 1 },
    source: 'bet365',
    outcomes: [
      { id: 'home', label: 'Man City Win', probability: 72, decimalOdds: 1.32 },
      { id: 'draw', label: 'Draw', probability: 16, decimalOdds: 5.50 },
      { id: 'away', label: 'Arsenal Win', probability: 12, decimalOdds: 7.50 },
    ],
  },
  {
    id: 'epl-002', sport: 'football', competition: 'Premier League', competitionShort: 'PL',
    homeTeam: 'Liverpool', awayTeam: 'Chelsea',
    kickoff: '2026-10-24T15:00:00Z', isLive: true, liveMinute: 23, liveScore: { home: 0, away: 0 },
    source: 'Sky Bet',
    outcomes: [
      { id: 'home', label: 'Liverpool Win', probability: 52, decimalOdds: 1.90 },
      { id: 'draw', label: 'Draw', probability: 25, decimalOdds: 3.60 },
      { id: 'away', label: 'Chelsea Win', probability: 23, decimalOdds: 4.00 },
    ],
  },
  {
    id: 'epl-003', sport: 'football', competition: 'Premier League', competitionShort: 'PL',
    homeTeam: 'Tottenham Hotspur', awayTeam: 'Aston Villa',
    kickoff: '2026-10-24T15:00:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'Paddy Power',
    outcomes: [
      { id: 'home', label: 'Spurs Win', probability: 45, decimalOdds: 2.20 },
      { id: 'draw', label: 'Draw', probability: 27, decimalOdds: 3.40 },
      { id: 'away', label: 'Aston Villa Win', probability: 28, decimalOdds: 3.30 },
    ],
  },
  {
    id: 'epl-004', sport: 'football', competition: 'Premier League', competitionShort: 'PL',
    homeTeam: 'Newcastle United', awayTeam: 'Brighton & Hove Albion',
    kickoff: '2026-10-24T17:30:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'Ladbrokes',
    outcomes: [
      { id: 'home', label: 'Newcastle Win', probability: 48, decimalOdds: 2.10 },
      { id: 'draw', label: 'Draw', probability: 26, decimalOdds: 3.50 },
      { id: 'away', label: 'Brighton Win', probability: 26, decimalOdds: 3.50 },
    ],
  },
  {
    id: 'epl-005', sport: 'football', competition: 'Premier League', competitionShort: 'PL',
    homeTeam: 'West Ham United', awayTeam: 'Brentford',
    kickoff: '2026-10-24T16:30:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'bet365',
    outcomes: [
      { id: 'home', label: 'West Ham Win', probability: 41, decimalOdds: 2.40 },
      { id: 'draw', label: 'Draw', probability: 28, decimalOdds: 3.30 },
      { id: 'away', label: 'Brentford Win', probability: 31, decimalOdds: 3.10 },
    ],
  },
  {
    id: 'epl-006', sport: 'football', competition: 'Premier League', competitionShort: 'PL',
    homeTeam: 'Manchester United', awayTeam: 'Nottingham Forest',
    kickoff: '2026-10-25T20:00:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'Sky Bet',
    outcomes: [
      { id: 'home', label: 'Man Utd Win', probability: 55, decimalOdds: 1.80 },
      { id: 'draw', label: 'Draw', probability: 24, decimalOdds: 3.75 },
      { id: 'away', label: 'Forest Win', probability: 21, decimalOdds: 4.50 },
    ],
  },
  {
    id: 'epl-007', sport: 'football', competition: 'Premier League', competitionShort: 'PL',
    homeTeam: 'Everton', awayTeam: 'Wolverhampton Wanderers',
    kickoff: '2026-10-25T15:00:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'Paddy Power',
    outcomes: [
      { id: 'home', label: 'Everton Win', probability: 37, decimalOdds: 2.70 },
      { id: 'draw', label: 'Draw', probability: 30, decimalOdds: 3.20 },
      { id: 'away', label: 'Wolves Win', probability: 33, decimalOdds: 3.00 },
    ],
  },
  {
    id: 'epl-008', sport: 'football', competition: 'Premier League', competitionShort: 'PL',
    homeTeam: 'Chelsea', awayTeam: 'Leicester City',
    kickoff: '2026-10-25T12:30:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'Ladbrokes',
    outcomes: [
      { id: 'home', label: 'Chelsea Win', probability: 62, decimalOdds: 1.60 },
      { id: 'draw', label: 'Draw', probability: 22, decimalOdds: 4.00 },
      { id: 'away', label: 'Leicester Win', probability: 16, decimalOdds: 5.50 },
    ],
  },
  {
    id: 'epl-009', sport: 'football', competition: 'Premier League', competitionShort: 'PL',
    homeTeam: 'Fulham', awayTeam: 'AFC Bournemouth',
    kickoff: '2026-10-25T15:00:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'bet365',
    outcomes: [
      { id: 'home', label: 'Fulham Win', probability: 40, decimalOdds: 2.50 },
      { id: 'draw', label: 'Draw', probability: 28, decimalOdds: 3.40 },
      { id: 'away', label: 'Bournemouth Win', probability: 32, decimalOdds: 3.10 },
    ],
  },
  {
    id: 'epl-010', sport: 'football', competition: 'Premier League', competitionShort: 'PL',
    homeTeam: 'Crystal Palace', awayTeam: 'Ipswich Town',
    kickoff: '2026-10-24T15:00:00Z', isLive: true, liveMinute: 45, liveScore: { home: 1, away: 1 },
    source: 'Sky Bet',
    outcomes: [
      { id: 'home', label: 'Crystal Palace Win', probability: 42, decimalOdds: 2.30 },
      { id: 'draw', label: 'Draw', probability: 28, decimalOdds: 3.40 },
      { id: 'away', label: 'Ipswich Win', probability: 30, decimalOdds: 3.20 },
    ],
  },
];

// ---------------------------------------------------------------------------
// FOOTBALL -- Champions League
// ---------------------------------------------------------------------------

export const championsLeagueFixtures = [
  {
    id: 'ucl-001', sport: 'football', competition: 'Champions League', competitionShort: 'UCL',
    homeTeam: 'Real Madrid', awayTeam: 'Manchester City',
    kickoff: '2026-10-28T20:00:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'bet365',
    outcomes: [
      { id: 'home', label: 'Real Madrid Win', probability: 42, decimalOdds: 2.35 },
      { id: 'draw', label: 'Draw', probability: 27, decimalOdds: 3.40 },
      { id: 'away', label: 'Man City Win', probability: 31, decimalOdds: 3.10 },
    ],
  },
  {
    id: 'ucl-002', sport: 'football', competition: 'Champions League', competitionShort: 'UCL',
    homeTeam: 'Bayern Munich', awayTeam: 'Paris Saint-Germain',
    kickoff: '2026-10-28T20:00:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'Ladbrokes',
    outcomes: [
      { id: 'home', label: 'Bayern Win', probability: 50, decimalOdds: 1.95 },
      { id: 'draw', label: 'Draw', probability: 25, decimalOdds: 3.60 },
      { id: 'away', label: 'PSG Win', probability: 25, decimalOdds: 3.60 },
    ],
  },
  {
    id: 'ucl-003', sport: 'football', competition: 'Champions League', competitionShort: 'UCL',
    homeTeam: 'Barcelona', awayTeam: 'Inter Milan',
    kickoff: '2026-10-29T20:00:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'Sky Bet',
    outcomes: [
      { id: 'home', label: 'Barcelona Win', probability: 48, decimalOdds: 2.05 },
      { id: 'draw', label: 'Draw', probability: 26, decimalOdds: 3.50 },
      { id: 'away', label: 'Inter Win', probability: 26, decimalOdds: 3.50 },
    ],
  },
  {
    id: 'ucl-004', sport: 'football', competition: 'Champions League', competitionShort: 'UCL',
    homeTeam: 'Liverpool', awayTeam: 'Borussia Dortmund',
    kickoff: '2026-10-29T20:00:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'Paddy Power',
    outcomes: [
      { id: 'home', label: 'Liverpool Win', probability: 58, decimalOdds: 1.70 },
      { id: 'draw', label: 'Draw', probability: 22, decimalOdds: 4.10 },
      { id: 'away', label: 'Dortmund Win', probability: 20, decimalOdds: 4.50 },
    ],
  },
];

// ---------------------------------------------------------------------------
// BOXING / MMA
// ---------------------------------------------------------------------------

export const boxingFixtures = [
  {
    id: 'box-001', sport: 'boxing', competition: 'Boxing', competitionShort: 'BOX',
    homeTeam: 'Tyson Fury', awayTeam: 'Oleksandr Usyk',
    fighter1: { name: 'Tyson Fury', nationality: 'GBR', record: '34-1-1 (24 KOs)', weightClass: 'Heavyweight' },
    fighter2: { name: 'Oleksandr Usyk', nationality: 'UKR', record: '22-0 (14 KOs)', weightClass: 'Heavyweight' },
    isTitleFight: true, beltInfo: 'WBC, WBA, IBF, WBO Heavyweight Titles',
    venue: 'Kingdom Arena, Riyadh', eventDate: '2026-11-15',
    kickoff: '2026-11-15T22:00:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'bet365',
    outcomes: [
      { id: 'home', label: 'Fury Win', probability: 42, decimalOdds: 2.35 },
      { id: 'away', label: 'Usyk Win', probability: 58, decimalOdds: 1.70 },
    ],
  },
  {
    id: 'box-002', sport: 'boxing', competition: 'Boxing', competitionShort: 'BOX',
    homeTeam: 'Artur Beterbiev', awayTeam: 'Dmitry Bivol',
    fighter1: { name: 'Artur Beterbiev', nationality: 'RUS', record: '20-0 (20 KOs)', weightClass: 'Light Heavyweight' },
    fighter2: { name: 'Dmitry Bivol', nationality: 'RUS', record: '23-0 (12 KOs)', weightClass: 'Light Heavyweight' },
    isTitleFight: true, beltInfo: 'Undisputed Light Heavyweight Championship',
    venue: 'T-Mobile Arena, Las Vegas', eventDate: '2026-11-08',
    kickoff: '2026-11-08T23:00:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'Sky Bet',
    outcomes: [
      { id: 'home', label: 'Beterbiev Win', probability: 52, decimalOdds: 1.90 },
      { id: 'away', label: 'Bivol Win', probability: 48, decimalOdds: 2.05 },
    ],
  },
  {
    id: 'box-003', sport: 'boxing', competition: 'MMA - UFC', competitionShort: 'UFC',
    homeTeam: 'Islam Makhachev', awayTeam: 'Charles Oliveira',
    fighter1: { name: 'Islam Makhachev', nationality: 'RUS', record: '26-1', weightClass: 'Lightweight' },
    fighter2: { name: 'Charles Oliveira', nationality: 'BRA', record: '34-9 (1 NC)', weightClass: 'Lightweight' },
    isTitleFight: true, beltInfo: 'UFC Lightweight Championship',
    venue: 'Etihad Arena, Abu Dhabi', eventDate: '2026-11-22',
    kickoff: '2026-11-22T04:00:00Z', isLive: false, liveMinute: null, liveScore: null,
    source: 'Paddy Power',
    outcomes: [
      { id: 'home', label: 'Makhachev Win', probability: 68, decimalOdds: 1.45 },
      { id: 'away', label: 'Oliveira Win', probability: 32, decimalOdds: 3.00 },
    ],
  },
];

// ---------------------------------------------------------------------------
// NFL -- American Football
// ---------------------------------------------------------------------------

export const nflFixtures = [
  {
    id: 'nfl-001', sport: 'nfl', competition: 'NFL', competitionShort: 'NFL',
    homeTeam: 'Kansas City Chiefs', awayTeam: 'San Francisco 49ers',
    gameTime: '2026-10-26T20:20:00Z', kickoff: '2026-10-26T20:20:00Z',
    isLive: false, liveMinute: null, liveScore: null,
    conference: 'AFC vs NFC', venue: 'Arrowhead Stadium, Kansas City',
    spread: { home: '-3.5', away: '+3.5' }, overUnder: '49.5',
    source: 'bet365',
    outcomes: [
      { id: 'home', label: 'Chiefs Win', probability: 56, decimalOdds: 1.75 },
      { id: 'away', label: '49ers Win', probability: 44, decimalOdds: 2.25 },
    ],
  },
  {
    id: 'nfl-002', sport: 'nfl', competition: 'NFL', competitionShort: 'NFL',
    homeTeam: 'Dallas Cowboys', awayTeam: 'Philadelphia Eagles',
    gameTime: '2026-10-26T17:00:00Z', kickoff: '2026-10-26T17:00:00Z',
    isLive: false, liveMinute: null, liveScore: null,
    conference: 'NFC East', venue: 'AT&T Stadium, Arlington',
    spread: { home: '+2.5', away: '-2.5' }, overUnder: '46.5',
    source: 'Sky Bet',
    outcomes: [
      { id: 'home', label: 'Cowboys Win', probability: 45, decimalOdds: 2.20 },
      { id: 'away', label: 'Eagles Win', probability: 55, decimalOdds: 1.80 },
    ],
  },
  {
    id: 'nfl-003', sport: 'nfl', competition: 'NFL', competitionShort: 'NFL',
    homeTeam: 'Buffalo Bills', awayTeam: 'Miami Dolphins',
    gameTime: '2026-10-27T13:00:00Z', kickoff: '2026-10-27T13:00:00Z',
    isLive: false, liveMinute: null, liveScore: null,
    conference: 'AFC East', venue: 'Highmark Stadium, Orchard Park',
    spread: { home: '-6.5', away: '+6.5' }, overUnder: '51.5',
    source: 'Ladbrokes',
    outcomes: [
      { id: 'home', label: 'Bills Win', probability: 60, decimalOdds: 1.65 },
      { id: 'away', label: 'Dolphins Win', probability: 40, decimalOdds: 2.45 },
    ],
  },
  {
    id: 'nfl-004', sport: 'nfl', competition: 'NFL', competitionShort: 'NFL',
    homeTeam: 'Detroit Lions', awayTeam: 'Green Bay Packers',
    gameTime: '2026-10-27T17:25:00Z', kickoff: '2026-10-27T17:25:00Z',
    isLive: false, liveMinute: null, liveScore: null,
    conference: 'NFC North', venue: 'Ford Field, Detroit',
    spread: { home: '-1.5', away: '+1.5' }, overUnder: '48.0',
    source: 'Paddy Power',
    outcomes: [
      { id: 'home', label: 'Lions Win', probability: 53, decimalOdds: 1.88 },
      { id: 'away', label: 'Packers Win', probability: 47, decimalOdds: 2.10 },
    ],
  },
];

// ---------------------------------------------------------------------------
// NBA -- Basketball
// ---------------------------------------------------------------------------

export const nbaFixtures = [
  {
    id: 'nba-001', sport: 'nba', competition: 'NBA', competitionShort: 'NBA',
    homeTeam: 'Los Angeles Lakers', awayTeam: 'Golden State Warriors',
    gameTime: '2026-10-27T02:30:00Z', kickoff: '2026-10-27T02:30:00Z',
    isLive: false, liveMinute: null, liveScore: null,
    conference: 'Western Conference', venue: 'Crypto.com Arena, Los Angeles',
    spread: { home: '+2.5', away: '-2.5' }, overUnder: '224.5',
    source: 'bet365',
    outcomes: [
      { id: 'home', label: 'Lakers Win', probability: 46, decimalOdds: 2.15 },
      { id: 'away', label: 'Warriors Win', probability: 54, decimalOdds: 1.85 },
    ],
  },
  {
    id: 'nba-002', sport: 'nba', competition: 'NBA', competitionShort: 'NBA',
    homeTeam: 'Boston Celtics', awayTeam: 'Milwaukee Bucks',
    gameTime: '2026-10-26T23:00:00Z', kickoff: '2026-10-26T23:00:00Z',
    isLive: true, liveMinute: null, liveScore: { home: 78, away: 71 },
    quarter: 3,
    conference: 'Eastern Conference', venue: 'TD Garden, Boston',
    spread: { home: '-4.5', away: '+4.5' }, overUnder: '218.5',
    source: 'Sky Bet',
    outcomes: [
      { id: 'home', label: 'Celtics Win', probability: 62, decimalOdds: 1.60 },
      { id: 'away', label: 'Bucks Win', probability: 38, decimalOdds: 2.60 },
    ],
  },
  {
    id: 'nba-003', sport: 'nba', competition: 'NBA', competitionShort: 'NBA',
    homeTeam: 'Denver Nuggets', awayTeam: 'Oklahoma City Thunder',
    gameTime: '2026-10-28T01:00:00Z', kickoff: '2026-10-28T01:00:00Z',
    isLive: false, liveMinute: null, liveScore: null,
    conference: 'Western Conference', venue: 'Ball Arena, Denver',
    spread: { home: '-1.5', away: '+1.5' }, overUnder: '221.0',
    source: 'Ladbrokes',
    outcomes: [
      { id: 'home', label: 'Nuggets Win', probability: 52, decimalOdds: 1.90 },
      { id: 'away', label: 'Thunder Win', probability: 48, decimalOdds: 2.05 },
    ],
  },
];

// ---------------------------------------------------------------------------
// HORSE RACING -- Three meetings
// ---------------------------------------------------------------------------

export const horseRacingFixtures = [
  {
    id: 'racing-che-001', sport: 'horseracing', competition: 'Cheltenham', competitionShort: 'CHE',
    raceName: '2m Novices\' Hurdle', raceTime: '2026-10-24T13:10:00Z', isLive: false,
    going: 'Good to Soft', distance: '2m', raceClass: 'Class 3', source: 'Ladbrokes',
    trackType: 'National Hunt', prizeMoney: '\u00A328,000',
    runners: [
      { id: 'che-001-r1', saddleNumber: 1, name: 'Brightwater Lad', jockey: 'P. Townend', trainer: 'W.P. Mullins', form: '1-1-2-1', probability: 38, fractionalOdds: '5/4', decimalOdds: 2.25, weight: '11-7', age: 5 },
      { id: 'che-001-r2', saddleNumber: 2, name: 'Storm Petrel', jockey: 'R. Blackmore', trainer: 'H. de Bromhead', form: '2-1-3-2', probability: 22, fractionalOdds: '9/2', decimalOdds: 5.50, weight: '11-4', age: 4 },
      { id: 'che-001-r3', saddleNumber: 3, name: 'Glen Forsa', jockey: 'N. de Boinville', trainer: 'N. Henderson', form: '3-2-1-F', probability: 18, fractionalOdds: '11/2', decimalOdds: 6.50, weight: '11-4', age: 5 },
      { id: 'che-001-r4', saddleNumber: 4, name: 'Allaho\'s Way', jockey: 'D. Maxwell', trainer: 'T. Mullins', form: '4-3-2-3', probability: 12, fractionalOdds: '8/1', decimalOdds: 9.00, weight: '11-0', age: 5 },
      { id: 'che-001-r5', saddleNumber: 5, name: 'Red Tornado', jockey: 'J. Quinlan', trainer: 'G. Elliott', form: 'P-3-4-2', probability: 7, fractionalOdds: '14/1', decimalOdds: 15.00, weight: '10-12', age: 6 },
      { id: 'che-001-r6', saddleNumber: 6, name: 'Midnight Charter', jockey: 'M. Walsh', trainer: 'J. Harrington', form: '0-4-3-P', probability: 3, fractionalOdds: '33/1', decimalOdds: 34.00, weight: '10-10', age: 5 },
    ],
  },
  {
    id: 'racing-che-002', sport: 'horseracing', competition: 'Cheltenham', competitionShort: 'CHE',
    raceName: '2m4f Beginners\' Chase', raceTime: '2026-10-24T13:45:00Z', isLive: false,
    going: 'Good to Soft', distance: '2m 4f', raceClass: 'Class 2', source: 'Ladbrokes',
    trackType: 'National Hunt', prizeMoney: '\u00A345,000',
    runners: [
      { id: 'che-002-r1', saddleNumber: 1, name: 'Ferny Hollow', jockey: 'P. Townend', trainer: 'W.P. Mullins', form: '1-1-1-1', probability: 45, fractionalOdds: 'Evs', decimalOdds: 2.00, weight: '11-7', age: 6 },
      { id: 'che-002-r2', saddleNumber: 2, name: 'Shishkin\'s Brother', jockey: 'N. de Boinville', trainer: 'N. Henderson', form: '1-2-1-3', probability: 25, fractionalOdds: '7/2', decimalOdds: 4.50, weight: '11-4', age: 6 },
      { id: 'che-002-r3', saddleNumber: 3, name: 'Hurricane Fly II', jockey: 'D. Russell', trainer: 'G. Elliott', form: '2-1-4-2', probability: 16, fractionalOdds: '11/2', decimalOdds: 6.50, weight: '11-2', age: 5 },
      { id: 'che-002-r4', saddleNumber: 4, name: 'Cape Gentleman', jockey: 'R. Johnson', trainer: 'P. Nicholls', form: '3-3-2-4', probability: 9, fractionalOdds: '10/1', decimalOdds: 11.00, weight: '11-0', age: 6 },
      { id: 'che-002-r5', saddleNumber: 5, name: 'Lalor\'s Pride', jockey: 'A. Coleman', trainer: 'K. Bailey', form: '5-4-3-4', probability: 5, fractionalOdds: '20/1', decimalOdds: 21.00, weight: '10-12', age: 7 },
    ],
  },
  {
    id: 'racing-kmp-001', sport: 'horseracing', competition: 'Kempton', competitionShort: 'KMP',
    raceName: '1m2f Handicap (AW)', raceTime: '2026-10-24T16:00:00Z', isLive: false,
    going: 'Standard (Polytrack)', distance: '1m 2f', raceClass: 'Class 5', source: 'bet365',
    trackType: 'All Weather', prizeMoney: '\u00A312,000',
    runners: [
      { id: 'kmp-001-r1', saddleNumber: 3, name: 'Duke of Marmalade\'s Boy', jockey: 'F. Dettori', trainer: 'J. Gosden', form: '2-1-1-3', probability: 29, fractionalOdds: '5/2', decimalOdds: 3.50, weight: '9-7', age: 4 },
      { id: 'kmp-001-r2', saddleNumber: 7, name: 'Night Reflection', jockey: 'R. Havlin', trainer: 'J. Gosden', form: '1-4-2-1', probability: 21, fractionalOdds: '4/1', decimalOdds: 5.00, weight: '9-4', age: 5 },
      { id: 'kmp-001-r3', saddleNumber: 1, name: 'Satchville Flyer', jockey: 'T. Marquand', trainer: 'R. Hannon', form: '3-2-4-2', probability: 18, fractionalOdds: '11/2', decimalOdds: 6.50, weight: '9-2', age: 4 },
      { id: 'kmp-001-r4', saddleNumber: 5, name: 'Arrogant Prince', jockey: 'J. Doyle', trainer: 'A. Balding', form: '4-3-2-4', probability: 13, fractionalOdds: '7/1', decimalOdds: 8.00, weight: '9-0', age: 6 },
      { id: 'kmp-001-r5', saddleNumber: 2, name: 'Windshear', jockey: 'S. de Sousa', trainer: 'M. Johnston', form: '5-5-3-5', probability: 9, fractionalOdds: '10/1', decimalOdds: 11.00, weight: '8-12', age: 5 },
      { id: 'kmp-001-r6', saddleNumber: 4, name: 'Bluebell Valley', jockey: 'L. Morris', trainer: 'C. Appleby', form: '0-6-5-3', probability: 6, fractionalOdds: '16/1', decimalOdds: 17.00, weight: '8-10', age: 4 },
      { id: 'kmp-001-r7', saddleNumber: 6, name: 'Top Mark', jockey: 'P. Cosgrave', trainer: 'W. Haggas', form: '7-0-6-6', probability: 4, fractionalOdds: '25/1', decimalOdds: 26.00, weight: '8-7', age: 5 },
    ],
  },
  {
    id: 'racing-kmp-002', sport: 'horseracing', competition: 'Kempton', competitionShort: 'KMP',
    raceName: '7f Conditions Stakes (AW)', raceTime: '2026-10-24T16:35:00Z', isLive: false,
    going: 'Standard (Polytrack)', distance: '7f', raceClass: 'Class 3', source: 'bet365',
    trackType: 'All Weather', prizeMoney: '\u00A322,000',
    runners: [
      { id: 'kmp-002-r1', saddleNumber: 1, name: 'Palace Pier\'s Legacy', jockey: 'F. Dettori', trainer: 'J. Gosden', form: '1-1-2-1', probability: 41, fractionalOdds: '5/4', decimalOdds: 2.25, weight: '9-3', age: 3 },
      { id: 'kmp-002-r2', saddleNumber: 2, name: 'Berkshire Shadow', jockey: 'O. Murphy', trainer: 'A. Balding', form: '2-1-1-3', probability: 26, fractionalOdds: '3/1', decimalOdds: 4.00, weight: '9-0', age: 4 },
      { id: 'kmp-002-r3', saddleNumber: 3, name: 'Tactical', jockey: 'W. Buick', trainer: 'C. Appleby', form: '3-3-2-2', probability: 19, fractionalOdds: '9/2', decimalOdds: 5.50, weight: '9-0', age: 4 },
      { id: 'kmp-002-r4', saddleNumber: 4, name: 'Robin of Navan', jockey: 'R. Kingscote', trainer: 'T. Easterby', form: '4-4-3-4', probability: 10, fractionalOdds: '9/1', decimalOdds: 10.00, weight: '8-12', age: 5 },
      { id: 'kmp-002-r5', saddleNumber: 5, name: 'Amhran Na Bhfiann', jockey: 'C. Keane', trainer: 'A. O\'Brien', form: '5-2-4-5', probability: 4, fractionalOdds: '25/1', decimalOdds: 26.00, weight: '8-10', age: 3 },
    ],
  },
  {
    id: 'racing-hay-001', sport: 'horseracing', competition: 'Haydock', competitionShort: 'HAY',
    raceName: '3m Chase (Listed)', raceTime: '2026-10-25T14:15:00Z', isLive: false,
    going: 'Heavy', distance: '3m', raceClass: 'Listed', source: 'Paddy Power',
    trackType: 'National Hunt', prizeMoney: '\u00A365,000',
    runners: [
      { id: 'hay-001-r1', saddleNumber: 2, name: 'Cloth Cap', jockey: 'T. Scudamore', trainer: 'J. O\'Shea', form: '1-P-1-1', probability: 33, fractionalOdds: '2/1', decimalOdds: 3.00, weight: '11-10', age: 9 },
      { id: 'hay-001-r2', saddleNumber: 1, name: 'Aye Right', jockey: 'C. Bewley', trainer: 'H. Whittington', form: '2-1-3-2', probability: 24, fractionalOdds: '3/1', decimalOdds: 4.00, weight: '11-4', age: 8 },
      { id: 'hay-001-r3', saddleNumber: 3, name: 'Sam Brown', jockey: 'A. Coleman', trainer: 'A. King', form: '3-2-2-3', probability: 19, fractionalOdds: '9/2', decimalOdds: 5.50, weight: '11-2', age: 8 },
      { id: 'hay-001-r4', saddleNumber: 4, name: 'Kingswell Theatre', jockey: 'S. Twiston-Davies', trainer: 'N. Twiston-Davies', form: '4-4-1-4', probability: 13, fractionalOdds: '6/1', decimalOdds: 7.00, weight: '11-0', age: 9 },
      { id: 'hay-001-r5', saddleNumber: 5, name: 'Elegant Escape', jockey: 'T. O\'Brien', trainer: 'C. Williams', form: '5-3-4-2', probability: 8, fractionalOdds: '12/1', decimalOdds: 13.00, weight: '10-12', age: 10 },
      { id: 'hay-001-r6', saddleNumber: 6, name: 'Rock The Kasbah', jockey: 'R. Patrick', trainer: 'P. Hobbs', form: '6-5-F-5', probability: 3, fractionalOdds: '33/1', decimalOdds: 34.00, weight: '10-8', age: 11 },
    ],
  },
  {
    id: 'racing-hay-002', sport: 'horseracing', competition: 'Haydock', competitionShort: 'HAY',
    raceName: '2m Hurdle (Handicap)', raceTime: '2026-10-25T14:50:00Z', isLive: false,
    going: 'Heavy', distance: '2m', raceClass: 'Class 4', source: 'Paddy Power',
    trackType: 'National Hunt', prizeMoney: '\u00A318,000',
    runners: [
      { id: 'hay-002-r1', saddleNumber: 4, name: 'Verdana Blue', jockey: 'N. de Boinville', trainer: 'N. Henderson', form: '1-3-1-2', probability: 27, fractionalOdds: '5/2', decimalOdds: 3.50, weight: '11-8', age: 7 },
      { id: 'hay-002-r2', saddleNumber: 2, name: 'If The Cap Fits', jockey: 'M. Walsh', trainer: 'H. Whittington', form: '2-1-3-1', probability: 21, fractionalOdds: '4/1', decimalOdds: 5.00, weight: '11-4', age: 8 },
      { id: 'hay-002-r3', saddleNumber: 6, name: 'Mister Fisher', jockey: 'A. Coleman', trainer: 'N. Henderson', form: '3-2-4-3', probability: 16, fractionalOdds: '11/2', decimalOdds: 6.50, weight: '11-2', age: 7 },
      { id: 'hay-002-r4', saddleNumber: 1, name: 'Faugheen\'s Legacy', jockey: 'P. Townend', trainer: 'W.P. Mullins', form: '4-4-2-4', probability: 14, fractionalOdds: '6/1', decimalOdds: 7.00, weight: '11-0', age: 6 },
      { id: 'hay-002-r5', saddleNumber: 3, name: 'Aux Ptits Soins', jockey: 'D. Jacob', trainer: 'P. Nicholls', form: '5-5-3-5', probability: 11, fractionalOdds: '8/1', decimalOdds: 9.00, weight: '10-10', age: 9 },
      { id: 'hay-002-r6', saddleNumber: 5, name: 'Thomas Darby', jockey: 'J. Moore', trainer: 'O. Murphy', form: '6-6-5-6', probability: 7, fractionalOdds: '12/1', decimalOdds: 13.00, weight: '10-6', age: 8 },
      { id: 'hay-002-r7', saddleNumber: 7, name: 'Western Ryder', jockey: 'C. Deutsch', trainer: 'A. West', form: '0-7-6-7', probability: 4, fractionalOdds: '25/1', decimalOdds: 26.00, weight: '10-2', age: 7 },
    ],
  },
];

// ---------------------------------------------------------------------------
// TENNIS -- ATP Finals + WTA Year-End Championships
// ---------------------------------------------------------------------------

export const tennisFixtures = [
  {
    id: 'tennis-001', sport: 'tennis', competition: 'ATP Finals', competitionShort: 'ATP Finals',
    venue: 'O2 Arena, London', surface: 'Hard (Indoor)',
    round: 'Round Robin \u2014 Green Group',
    player1: { name: 'Carlos Alcaraz', ranking: 3, nationality: 'ESP' },
    player2: { name: 'Jannik Sinner', ranking: 1, nationality: 'ITA' },
    headToHead: { player1Wins: 4, player2Wins: 6 },
    matchTime: '2026-10-25T14:00:00Z', isLive: false, liveScore: null, source: 'Sky Bet',
    outcomes: [
      { id: 'p1', label: 'Alcaraz', probability: 43, decimalOdds: 2.20 },
      { id: 'p2', label: 'Sinner', probability: 57, decimalOdds: 1.72 },
    ],
  },
  {
    id: 'tennis-002', sport: 'tennis', competition: 'ATP Finals', competitionShort: 'ATP Finals',
    venue: 'O2 Arena, London', surface: 'Hard (Indoor)',
    round: 'Round Robin \u2014 Red Group',
    player1: { name: 'Novak Djokovic', ranking: 5, nationality: 'SRB' },
    player2: { name: 'Holger Rune', ranking: 8, nationality: 'DEN' },
    headToHead: { player1Wins: 3, player2Wins: 1 },
    matchTime: '2026-10-25T19:30:00Z', isLive: false, liveScore: null, source: 'bet365',
    outcomes: [
      { id: 'p1', label: 'Djokovic', probability: 68, decimalOdds: 1.40 },
      { id: 'p2', label: 'Rune', probability: 32, decimalOdds: 3.00 },
    ],
  },
  {
    id: 'tennis-003', sport: 'tennis', competition: 'WTA Finals', competitionShort: 'WTA Finals',
    venue: 'King Saud University Indoor Arena, Riyadh', surface: 'Hard (Indoor)',
    round: 'Round Robin \u2014 Purple Group',
    player1: { name: 'Iga Swiatek', ranking: 1, nationality: 'POL' },
    player2: { name: 'Aryna Sabalenka', ranking: 2, nationality: 'BLR' },
    headToHead: { player1Wins: 9, player2Wins: 7 },
    matchTime: '2026-10-24T10:00:00Z', isLive: true,
    liveScore: { sets: [{ p1: 6, p2: 4 }, { p1: 3, p2: 2 }], currentServer: 'p2' },
    source: 'Ladbrokes',
    outcomes: [
      { id: 'p1', label: 'Swiatek', probability: 65, decimalOdds: 1.50 },
      { id: 'p2', label: 'Sabalenka', probability: 35, decimalOdds: 2.75 },
    ],
  },
  {
    id: 'tennis-004', sport: 'tennis', competition: 'WTA Finals', competitionShort: 'WTA Finals',
    venue: 'King Saud University Indoor Arena, Riyadh', surface: 'Hard (Indoor)',
    round: 'Round Robin \u2014 Yellow Group',
    player1: { name: 'Coco Gauff', ranking: 4, nationality: 'USA' },
    player2: { name: 'Zheng Qinwen', ranking: 6, nationality: 'CHN' },
    headToHead: { player1Wins: 3, player2Wins: 2 },
    matchTime: '2026-10-25T16:00:00Z', isLive: false, liveScore: null, source: 'Paddy Power',
    outcomes: [
      { id: 'p1', label: 'Gauff', probability: 52, decimalOdds: 1.90 },
      { id: 'p2', label: 'Zheng Qinwen', probability: 48, decimalOdds: 2.05 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Combined export -- consumers can filter by sport from allFixtures
// ---------------------------------------------------------------------------

export const allFixtures = [
  ...footballFixtures,
  ...championsLeagueFixtures,
  ...horseRacingFixtures,
  ...tennisFixtures,
  ...boxingFixtures,
  ...nflFixtures,
  ...nbaFixtures,
];
