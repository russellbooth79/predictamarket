/**
 * useOdds.js
 *
 * Custom hooks for fetching live odds from the PredictaMarket backend.
 * Each hook follows the same pattern:
 *   1. Initialise with mock fixture data so the UI is never empty
 *   2. Attempt to fetch real data from our Express proxy (/api/odds/*)
 *   3. On success: replace fixtures with live data, set usingLive flag
 *   4. On failure: silently fall back to mock data -- the UI never breaks
 *   5. Poll every 60 seconds for updated odds
 */

import { useState, useEffect, useCallback } from 'react';
import {
  footballFixtures,
  championsLeagueFixtures,
  tennisFixtures,
  boxingFixtures,
  nflFixtures,
  nbaFixtures,
} from '../data/fixtures.js';

const POLL_INTERVAL_MS = 60_000;
const FETCH_TIMEOUT_MS = 8_000;

/**
 * Ensure each outcome has a decimalOdds value.
 * The server returns probability but not always decimalOdds on the
 * top-level outcomes. We derive it from the bookmakers array (best
 * available odds = lowest decimal odds for that outcome = highest
 * probability), or fall back to a simple probability inversion.
 */
function ensureDecimalOdds(fixtures) {
  return fixtures.map((fixture) => {
    if (!fixture.outcomes) return fixture;

    const outcomes = fixture.outcomes.map((outcome) => {
      if (outcome.decimalOdds != null) return outcome;

      if (fixture.bookmakers && fixture.bookmakers.length > 0) {
        const oddsKey = outcome.id === 'home' ? 'homeOdds'
          : outcome.id === 'draw' ? 'drawOdds'
          : outcome.id === 'away' ? 'awayOdds'
          : null;

        if (oddsKey) {
          const validOdds = fixture.bookmakers
            .map((b) => b[oddsKey])
            .filter((v) => v != null && v > 1);

          if (validOdds.length > 0) {
            return { ...outcome, decimalOdds: Math.min(...validOdds) };
          }
        }
      }

      const impliedOdds = outcome.probability > 0
        ? parseFloat((100 / outcome.probability).toFixed(2))
        : 1.01;

      return { ...outcome, decimalOdds: impliedOdds };
    });

    return { ...fixture, outcomes };
  });
}

/**
 * Generic odds-fetching hook. Sport-specific hooks below delegate to this.
 */
function useOddsData(endpoint, mockData) {
  const [fixtures, setFixtures] = useState(mockData);
  const [loading, setLoading] = useState(true);
  const [usingLive, setUsingLive] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOdds = useCallback(async () => {
    try {
      const res = await fetch(endpoint, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (Array.isArray(data) && data.length > 0) {
        const normalised = ensureDecimalOdds(data);
        setFixtures(normalised);
        setUsingLive(true);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      setUsingLive(false);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchOdds();
    const interval = setInterval(fetchOdds, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchOdds]);

  return { fixtures, loading, usingLive, error, lastUpdated, refresh: fetchOdds };
}

// -- Sport-specific hooks ---------------------------------------------------

export function useFootballOdds() {
  const allFootball = [...footballFixtures, ...championsLeagueFixtures];
  return useOddsData('/api/odds/football', allFootball);
}

export function useTennisOdds() {
  return useOddsData('/api/odds/tennis', tennisFixtures);
}

export function useBoxingOdds() {
  return useOddsData('/api/odds/boxing', boxingFixtures);
}

export function useNflOdds() {
  return useOddsData('/api/odds/nfl', nflFixtures);
}

export function useNbaOdds() {
  return useOddsData('/api/odds/nba', nbaFixtures);
}
