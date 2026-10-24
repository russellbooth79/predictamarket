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
 */

import { createContext, useContext, useReducer, useCallback } from 'react';
import { testUser } from '../data/user.js';

const UserContext = createContext(null);

const initialState = {
  user: testUser,
  bets: [],
};

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

    case 'ADD_FUNDS': {
      return {
        ...state,
        user: {
          ...state.user,
          balance: parseFloat((state.user.balance + action.payload.amount).toFixed(2)),
        },
      };
    }

    default:
      return state;
  }
}

export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  /**
   * Simulate bet placement with a mock API delay.
   * Returns a promise that resolves on success or rejects on insufficient funds.
   * The 500ms delay gives realistic feedback timing for loading spinners.
   */
  const placeBet = useCallback(
    (selections, stakeAmount) => {
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
              outcomeName: s.outcomeName,
              probability: s.probability,
              decimalOdds: s.decimalOdds,
            })),
            stake: stakeAmount,
            // Potential return based on probability: stake / (probability / 100)
            // For singles, use the first selection's probability
            potentialReturn: parseFloat(
              (stakeAmount / (selections[0].probability / 100)).toFixed(2)
            ),
            status: 'open',
            placedAt: new Date().toISOString(),
          };

          dispatch({
            type: 'PLACE_BET',
            payload: { bet, stakeAmount },
          });

          resolve(bet);
        }, 500);
      });
    },
    [state.user.balance]
  );

  const addFunds = useCallback((amount) => {
    dispatch({ type: 'ADD_FUNDS', payload: { amount } });
  }, []);

  const value = {
    user: state.user,
    bets: state.bets,
    placeBet,
    addFunds,
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
