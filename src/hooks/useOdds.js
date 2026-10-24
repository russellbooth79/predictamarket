/**
 * useOdds.js
 *
 * Custom hooks for fetching live odds from the PredictaMarket backend.
 * Each hook follows the same pattern:
 *   1. Initialise with mock fixture data so the UI is never empty
 *   2. Attempt to fetch real data from our Express proxy (/api/odds/*)
 *   3. On success: replace fixtures with live data, set usingLive flag
 *   4. On failure: silently fall back to mock data — the UI never breaks
 *   5. Poll every 60 seconds for updated odds
 *
 * The backend (server.js) transforms The Odds API response into our
 * normalised fixture shape, but omits decimalOdds on the top-level
 * outcomes. We compute those here from the best bookmaker price to
 * keep the fixture shape consistent with what EventCard expects.
 */

import { useState, useEffect, useCallback } from 'react';
import { footballFixtures, tennisFixtures } from '../data/fixtures.js';

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
      // If decimalOdds already present, keep it
      if (outcome.decimalOdds != null) return outcome;

      // Derive from bookmakers array if available
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
            // Best price for the punter = lowest decimal odds = highest probability
            return { ...outcome, decimalOdds: Math.min(...validOdds) };
          }
        }
      }

      // Last resort: convert probability back to implied odds
      // prob = (1/odds)*100 => odds = 100/prob
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
 *
 * @param {string} endpoint - API path, e.g. '/api/odds/football'
 * @param {Array} mockData - Fallback fixture array from fixtures.js
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
      // Silently degrade to mock data — never break the UI for an API hiccup
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

// ── Sport-specific hooks ──────────────────────────────────────────────────────

export function useFootballOdds() {
  return useOddsData('/api/odds/football', footballFixtures);
}

export function useTennisOdds() {
  return useOddsData('/api/odds/tennis', tennisFixtures);
}
