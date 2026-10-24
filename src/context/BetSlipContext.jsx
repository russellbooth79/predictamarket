/**
 * BetSlipContext.jsx
 *
 * Manages the bet slip (Position Builder) state via useReducer.
 *
 * State machine: idle -> confirming -> submitting -> success -> idle
 *                                  \-> error -> idle
 *                                  \-> insufficientFunds -> idle
 *                   confirming -> idle (via CANCEL — preserves selections)
 *
 * Key constraint: max one selection per event (eventId). Adding a second
 * outcome for the same event replaces the previous selection — standard
 * sportsbook UX where toggling between Home/Draw/Away swaps the pick.
 */

import { createContext, useContext, useReducer, useCallback } from 'react';

const BetSlipContext = createContext(null);

const initialState = {
  selections: [],
  stake: '',
  status: 'idle', // 'idle' | 'confirming' | 'submitting' | 'success' | 'error' | 'insufficientFunds'
};

function betSlipReducer(state, action) {
  switch (action.type) {
    case 'ADD_SELECTION': {
      const { selection } = action.payload;
      // Check if this exact outcome is already selected — if so, remove it (toggle off)
      const exactMatch = state.selections.find(
        (s) => s.eventId === selection.eventId && s.outcomeId === selection.outcomeId
      );
      if (exactMatch) {
        return {
          ...state,
          selections: state.selections.filter(
            (s) => !(s.eventId === selection.eventId && s.outcomeId === selection.outcomeId)
          ),
        };
      }
      // Replace any existing selection for the same event (one outcome per event)
      const filtered = state.selections.filter((s) => s.eventId !== selection.eventId);
      return {
        ...state,
        selections: [...filtered, selection],
      };
    }

    case 'REMOVE_SELECTION':
      return {
        ...state,
        selections: state.selections.filter((s) => s.eventId !== action.payload.eventId),
      };

    case 'CLEAR_ALL':
      return { ...initialState };

    case 'SET_STAKE':
      return { ...state, stake: action.payload.stake };

    case 'CONFIRM':
      return { ...state, status: 'confirming' };

    case 'SUBMIT':
      return { ...state, status: 'submitting' };

    case 'SUCCESS':
      return { ...state, status: 'success' };

    case 'ERROR':
      return { ...state, status: 'error' };

    case 'INSUFFICIENT_FUNDS':
      return { ...state, status: 'insufficientFunds' };

    // CANCEL preserves selections and stake but returns to idle.
    // Used when the user dismisses the confirmation modal without proceeding.
    case 'CANCEL':
      return { ...state, status: 'idle' };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

export function BetSlipProvider({ children }) {
  const [state, dispatch] = useReducer(betSlipReducer, initialState);

  const addSelection = useCallback((selection) => {
    dispatch({ type: 'ADD_SELECTION', payload: { selection } });
  }, []);

  const removeSelection = useCallback((eventId) => {
    dispatch({ type: 'REMOVE_SELECTION', payload: { eventId } });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const setStake = useCallback((stake) => {
    dispatch({ type: 'SET_STAKE', payload: { stake } });
  }, []);

  const confirm = useCallback(() => {
    dispatch({ type: 'CONFIRM' });
  }, []);

  const submit = useCallback(() => {
    dispatch({ type: 'SUBMIT' });
  }, []);

  const success = useCallback(() => {
    dispatch({ type: 'SUCCESS' });
  }, []);

  const error = useCallback(() => {
    dispatch({ type: 'ERROR' });
  }, []);

  const insufficientFunds = useCallback(() => {
    dispatch({ type: 'INSUFFICIENT_FUNDS' });
  }, []);

  const cancel = useCallback(() => {
    dispatch({ type: 'CANCEL' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  /**
   * Check if a specific outcome is currently selected.
   * Used by EventCard/TennisCard/HorseRacingCard to show selected state.
   */
  const isSelected = useCallback(
    (eventId, outcomeId) => {
      return state.selections.some(
        (s) => s.eventId === eventId && s.outcomeId === outcomeId
      );
    },
    [state.selections]
  );

  const value = {
    ...state,
    addSelection,
    removeSelection,
    clearAll,
    setStake,
    confirm,
    submit,
    success,
    error,
    insufficientFunds,
    cancel,
    reset,
    isSelected,
  };

  return (
    <BetSlipContext.Provider value={value}>
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
}
