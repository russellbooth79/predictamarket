/**
 * LiveContext.jsx
 *
 * Runs the in-play simulation for every live football match and shares it
 * with the app:
 *   - fixtures:     football fixtures with live minute, score and prices
 *                   merged in, so every screen shows the same live state
 *   - matches:      full sim state for live (and just-finished) matches
 *   - quick bet:    which in-play price the Quick Bet sheet is open for
 *   - toasts:       goal alerts (matches you've bet on or follow) and bet results
 *   - followed:     matches with goal alerts switched on
 *   - session:      in-play session start (for the reality check)
 *
 * When a match reaches full time it stays on screen briefly, then the next
 * upcoming fixture kicks off, so there is always football in play.
 *
 * Settlement: open bets on simulated markets are settled as results land —
 * match result at full time, next goal at the next goal (or full time),
 * 5-minute markets when their window closes.
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useFootballOdds } from '../hooks/useOdds.js';
import { useUser } from '../context/UserContext.jsx';
import { createMatch, tick, TICK_MS } from './liveEngine.js';

const LiveContext = createContext(null);

const FT_DISPLAY_MS = 25000; // how long a finished match stays before the next kick-off
const TARGET_LIVE = 3;       // keep about this many matches in play
const TOAST_MS = 4500;

export function LiveProvider({ children }) {
  const odds = useFootballOdds();
  const { bets, settleBet } = useUser();

  const [matches, setMatches] = useState({});
  const [quickBet, setQuickBet] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [sessionStart, setSessionStart] = useState(null);
  const [version, setVersion] = useState(0);
  const [followed, setFollowed] = useState(() => new Set());

  // Latest values for the clock's interval callback
  const alertIdsRef = useRef(new Set());
  alertIdsRef.current = new Set([
    ...followed,
    ...bets.filter(b => b.status === 'open').flatMap(b => b.selections.map(s => s.eventId)),
  ]);

  const fixturesRef = useRef(odds.fixtures);
  fixturesRef.current = odds.fixtures;
  const usedRef = useRef(new Set());     // fixtures already simulated (live or done)
  const finishedRef = useRef(new Set()); // fixtures finished and removed
  // Settled outcomes: result[eventId], nextGoal[`${eventId}:${goalIndex}`], micro[microId]
  const resultsRef = useRef({ result: {}, nextGoal: {}, micro: {} });

  const pushToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev.slice(-2), { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_MS);
  }, []);

  // Start the matches that are live in the data when fixtures first arrive
  useEffect(() => {
    if (Object.keys(matches).length || !odds.fixtures.length) return;
    const initial = {};
    odds.fixtures.filter(f => f.isLive && f.outcomes?.length === 3).forEach(f => {
      initial[f.id] = createMatch(f);
      usedRef.current.add(f.id);
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatches(initial);
  }, [odds.fixtures, matches]);

  // The clock
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(prev => {
        const next = {};
        const now = Date.now();
        for (const [id, m] of Object.entries(prev)) {
          // Finished long enough: drop it so the next game can kick off
          if (m.status === 'ft' && now - m.finishedAt > FT_DISPLAY_MS) {
            finishedRef.current.add(id);
            continue;
          }
          const { match, events } = tick(m);
          next[id] = match;
          for (const e of events) {
            const fx = match.fixture;
            if (e.type === 'goal') {
              const goalIndex = e.score.home + e.score.away - 1;
              resultsRef.current.nextGoal[`${id}:${goalIndex}`] = e.side;
              if (alertIdsRef.current.has(id)) pushToast({ kind: 'goal', fixtureId: id, title: `⚽ GOAL — ${e.side === 'home' ? fx.homeTeam : fx.awayTeam}`, body: `${fx.homeTeam} ${e.score.home}–${e.score.away} ${fx.awayTeam} · ${e.minute}'` });
            }
            if (e.type === 'ft') {
              resultsRef.current.result[id] = e.result;
              // No more goals: every next-goal market from here settles 'none'
              resultsRef.current.nextGoal[`${id}:${e.score.home + e.score.away}`] = 'none';
            }
            if (e.type === 'micro-settled') {
              resultsRef.current.micro[e.micro.id] = e.micro.result;
            }
          }
        }
        // Keep football in play: kick off the next upcoming fixtures
        const liveCount = Object.values(next).filter(m => m.status === 'live').length;
        if (liveCount < TARGET_LIVE) {
          const upcoming = fixturesRef.current
            .filter(f => !f.isLive && !usedRef.current.has(f.id) && f.outcomes?.length === 3)
            .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
          upcoming.slice(0, TARGET_LIVE - liveCount).forEach(f => {
            next[f.id] = createMatch(f, { kickOff: true });
            usedRef.current.add(f.id);
          });
        }
        return next;
      });
      setVersion(v => v + 1);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [pushToast]);

  // Settle open bets as results land
  useEffect(() => {
    const res = resultsRef.current;
    for (const bet of bets) {
      if (bet.status !== 'open') continue;
      const legs = bet.selections.map(leg => {
        if (leg.market === 'micro') {
          const r = res.micro[leg.microId];
          return r == null ? 'pending' : r === leg.outcomeId ? 'won' : 'lost';
        }
        if (leg.market === 'nextGoal') {
          const r = res.nextGoal[`${leg.eventId}:${leg.goalsAtPlacement}`];
          return r == null ? 'pending' : r === leg.outcomeId ? 'won' : 'lost';
        }
        const r = res.result[leg.eventId];
        return r == null ? 'pending' : r === leg.outcomeId ? 'won' : 'lost';
      });
      if (legs.includes('lost')) {
        settleBet(bet.id, 'lost');
      } else if (legs.every(l => l === 'won')) {
        settleBet(bet.id, 'won');
        pushToast({ kind: 'won', title: '🎉 Bet won', body: `£${bet.potentialReturn.toFixed(2)} added to your balance` });
      }
    }
  }, [version, bets, settleBet, pushToast]);

  // Football fixtures with live state merged in; finished games drop out
  const fixtures = useMemo(() => odds.fixtures
    .filter(f => !finishedRef.current.has(f.id))
    .map(f => {
      const m = matches[f.id];
      if (!m) return f.isLive && usedRef.current.has(f.id) ? null : f;
      return {
        ...f,
        isLive: true,
        liveMinute: Math.max(1, Math.floor(m.minute)),
        liveScore: { ...m.score },
        isFinished: m.status === 'ft',
        outcomes: f.outcomes.map(o => {
          const p = Math.max(0.5, m.prices.result[o.id]);
          return { ...o, probability: Math.round(p * 10) / 10, decimalOdds: Math.round((100 / p) * 100) / 100 };
        }),
      };
    })
    .filter(Boolean),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [odds.fixtures, matches]);

  const value = {
    fixtures,
    usingLive: odds.usingLive,
    lastUpdated: odds.lastUpdated,
    matches,
    getMatch: id => matches[id] ?? null,
    quickBet,
    openQuickBet: setQuickBet,
    closeQuickBet: () => setQuickBet(null),
    toasts,
    dismissToast: id => setToasts(prev => prev.filter(t => t.id !== id)),
    pushToast,
    followed,
    toggleFollow: id => setFollowed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    }),
    sessionStart,
    startSession: () => setSessionStart(s => s ?? Date.now()),
  };

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error('useLive must be used within a LiveProvider');
  return ctx;
}
