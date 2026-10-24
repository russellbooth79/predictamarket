/**
 * OddsFormatContext.jsx
 *
 * Provides a global odds display format preference across the app.
 * Three modes: 'probability' | 'decimal' | 'fractional'
 *
 * Persisted to localStorage so the preference survives page refresh.
 * Default: 'probability' (percentage display — PredictaMarket's native format).
 */

import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'punt_odds_format';
const VALID_FORMATS = ['probability', 'decimal', 'fractional'];
const DEFAULT_FORMAT = 'probability';

function loadFormat() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_FORMATS.includes(stored)) return stored;
  } catch {
    // localStorage not available (SSR, privacy mode) — fall through
  }
  return DEFAULT_FORMAT;
}

const OddsFormatContext = createContext(null);

export function OddsFormatProvider({ children }) {
  const [format, setFormatState] = useState(loadFormat);

  const setFormat = useCallback((newFormat) => {
    if (!VALID_FORMATS.includes(newFormat)) return;
    setFormatState(newFormat);
    try {
      localStorage.setItem(STORAGE_KEY, newFormat);
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, []);

  return (
    <OddsFormatContext.Provider value={{ format, setFormat }}>
      {children}
    </OddsFormatContext.Provider>
  );
}

export function useOddsFormat() {
  const context = useContext(OddsFormatContext);
  if (!context) {
    throw new Error('useOddsFormat must be used within an OddsFormatProvider');
  }
  return context;
}
