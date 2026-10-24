/**
 * GamificationContext.jsx — PredictaMarket v4
 * Streak counter, prediction score, and 5-tier progression system.
 * All state persisted in localStorage so it survives sessions.
 */

import { createContext, useContext, useState } from 'react';

export const TIERS = [
  { name: 'Casual',  minBets: 0,   colour: '#4A5568', gradient: null,                                    emoji: '🎯' },
  { name: 'Punter',  minBets: 5,   colour: '#6C63FF', gradient: null,                                    emoji: '🎲' },
  { name: 'Analyst', minBets: 20,  colour: '#9B5DE5', gradient: null,                                    emoji: '📊' },
  { name: 'Expert',  minBets: 50,  colour: '#00F5A0', gradient: null,                                    emoji: '⚡' },
  { name: 'Oracle',  minBets: 100, colour: null,       gradient: 'linear-gradient(135deg, #FFD700, #FF9500)', emoji: '🔮' },
];

export function getTier(totalBets) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (totalBets >= TIERS[i].minBets) return TIERS[i];
  }
  return TIERS[0];
}

export function getNextTier(totalBets) {
  for (let i = 1; i < TIERS.length; i++) {
    if (totalBets < TIERS[i].minBets) return TIERS[i];
  }
  return null;
}

function safeGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
  const [streakDays, setStreakDays]       = useState(() => safeGet('pm_streak', 0));
  const [totalBets, setTotalBets]         = useState(() => safeGet('pm_total_bets', 0));
  const [predictionScore, setPredScore]   = useState(() => safeGet('pm_score', 0));

  const tier     = getTier(totalBets);
  const nextTier = getNextTier(totalBets);

  // Call this when a bet is successfully placed
  function recordBet() {
    const newTotal = totalBets + 1;
    const newScore = predictionScore + 50;
    setTotalBets(newTotal);
    setPredScore(newScore);
    safeSet('pm_total_bets', newTotal);
    safeSet('pm_score', newScore);

    // Streak logic — one bet per calendar day extends streak
    const today    = new Date().toDateString();
    const lastDay  = safeGet('pm_last_bet_day', null);
    if (lastDay !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = lastDay === yesterday ? streakDays + 1 : 1;
      setStreakDays(newStreak);
      safeSet('pm_streak', newStreak);
      safeSet('pm_last_bet_day', today);
    }
  }

  return (
    <GamificationContext.Provider value={{
      streakDays, totalBets, predictionScore,
      tier, nextTier, recordBet, TIERS,
    }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}
