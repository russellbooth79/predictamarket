/**
 * UserContext.jsx
 *
 * Manages user state: profile data, balance, and bet history.
 *
 * placeBet simulates a 500ms API round-trip before deducting balance
 * and recording the bet. Returns a promise so the caller (PositionBuilder)
 * can drive the submission state machine.
 *
 * In production, balance would be a separate real-time subscription
 * (WebSocket or polling) and bet placement would go through an
 * idempotent POST with server-side balance validation.
 *
 * Changes from v1:
 *   - Accepts `initialUser` prop — passed from AuthContext via AuthGate
 *     so the authenticated user profile seeds this context.
 *   - SYNC_USER reducer case — allows AuthContext to push preference
 *     updates (e.g. after profiling) into UserContext without unmounting.
 *   - Falls back to testUser if no initialUser is provided (dev convenience).
 *   - registerUserSync registration moved to useEffect so AuthContext
 *     can push user changes to this context over time.
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { testUser } from '../data/user.js';
import { trackBetPlaced } from '../utils/analytics.js';
import { useAuth } from './AuthContext.jsx';

const UserContext = createContext(null);

function buildInitialState(initialUser) {
  return {
    // initialUser takes precedence (authenticated flow);
    // testUser is the fallback for local dev without going through signup.
    user: initialUser ?? testUser,
    bets: [],
  };
}

function userReducer(state, action) {
  switch (action.type) {
    case 'PLACE_BET': {
      const { bet, stakeAmount } = action.payload;
      return {
        ...state,
        user: {
          ...state.user,
          balance: parseFloat((state.user.balance - stakeAmount).toFixed(2)),
          totalBets: state.user.totalBets + 1,
        },
        bets: [bet, ...state.bets],
      };
    }

    // Cash out an open bet early for its current value
    case 'CASH_OUT': {
      const { betId, amount } = action.payload;
      const bet = state.bets.find(b => b.id === betId);
      if (!bet || bet.status !== 'open') return state;
      return {
        ...state,
        user: { ...state.user, balance: parseFloat((state.user.balance + amount).toFixed(2)) },
        bets: state.bets.map(b => (b.id === betId ? { ...b, status: 'cashed out', cashOutAmount: amount, settledAt: new Date().toISOString() } : b)),
      };
    }

    // Settle an open bet as won (payout credited) or lost
    case 'SETTLE_BET': {
      const { betId, status } = action.payload;
      const bet = state.bets.find(b => b.id === betId);
      if (!bet || bet.status !== 'open') return state;
      const payout = status === 'won' ? bet.potentialReturn : 0;
      return {
        ...state,
        user: { ...state.user, balance: parseFloat((state.user.balance + payout).toFixed(2)) },
        bets: state.bets.map(b => (b.id === betId ? { ...b, status, settledAt: new Date().toISOString() } : b)),
      };
    }

    case 'ADD_FUNDS': {
      return {
        ...state,
        user: {
          ...state.user,
          balance: parseFloat((state.user.balance + action.payload.amount).toFixed(2)),
        },
      };
    }

    // SYNC_USER — called by AuthContext's registerUserSync callback when
    // the auth user changes (preferences saved, profile updated, logout).
    // Replaces the user wholesale; callers should pass null on logout so
    // consumers can handle the unauthenticated state.
    case 'SYNC_USER': {
      return {
        ...state,
        user: action.payload.user ?? testUser,
        // Reset bets on logout (user change to null)
        bets: action.payload.user ? state.bets : [],
      };
    }

    default:
      return state;
  }
}

export function UserProvider({ children, initialUser }) {
  const [state, dispatch] = useReducer(userReducer, buildInitialState(initialUser));

  // Register a sync function with AuthContext so it can push user updates here.
  // This avoids prop drilling while keeping the contexts decoupled.
  const { registerUserSync } = useAuth();

  useEffect(() => {
    registerUserSync((user) => {
      dispatch({ type: 'SYNC_USER', payload: { user } });
    });
    // Clean up on unmount — unregister by passing null
    return () => registerUserSync(null);
  }, [registerUserSync]);

  /**
   * Simulate bet placement with a mock API delay.
   * Returns a promise that resolves on success or rejects on insufficient funds.
   * The 500ms delay gives realistic feedback timing for loading spinners.
   */
  const placeBet = useCallback(
    (selections, stakeAmount, { inPlay = false } = {}) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (stakeAmount > state.user.balance) {
            reject(new Error('Insufficient funds'));
            return;
          }

          const bet = {
            id: `bet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            selections: selections.map((s) => ({
              eventId: s.eventId,
              eventName: s.eventName,
              outcomeId: s.outcomeId,
              outcomeName: s.outcomeName,
              probability: s.probability,
              decimalOdds: s.decimalOdds,
              // Live markets: 'result' (default), 'nextGoal' or 'micro'
              market: s.market ?? 'result',
              microId: s.microId ?? null,
              goalsAtPlacement: s.goalsAtPlacement ?? null,
            })),
            stake: stakeAmount,
            // Potential return from the true price of every leg:
            // stake / (combined probability), so accas multiply up
            potentialReturn: parseFloat(
              (stakeAmount / selections.reduce((acc, s) => acc * (s.probability / 100), 1)).toFixed(2)
            ),
            inPlay,
            status: 'open',
            placedAt: new Date().toISOString(),
          };

          dispatch({
            type: 'PLACE_BET',
            payload: { bet, stakeAmount },
          });

          trackBetPlaced(stakeAmount, selections.length);
          resolve(bet);
        }, 500);
      });
    },
    [state.user.balance]
  );

  const addFunds = useCallback((amount) => {
    dispatch({ type: 'ADD_FUNDS', payload: { amount } });
  }, []);

  const cashOut = useCallback((betId, amount) => {
    dispatch({ type: 'CASH_OUT', payload: { betId, amount } });
  }, []);

  const settleBet = useCallback((betId, status) => {
    dispatch({ type: 'SETTLE_BET', payload: { betId, status } });
  }, []);

  const value = {
    user: state.user,
    bets: state.bets,
    placeBet,
    addFunds,
    cashOut,
    settleBet,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
