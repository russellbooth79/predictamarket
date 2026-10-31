/**
 * AuthContext.jsx
 *
 * Central auth state for the PUNT prototype. Owns:
 *   - Session lifecycle: boot hydration → unauthenticated → signup/login → authenticated
 *   - Modal orchestration: which auth overlay is open (none | login | signup)
 *   - Player profiling: whether the post-signup profiling flow is open
 *   - User profile: assembled from signup form data and saved to localStorage
 *
 * Architecture notes:
 *   - useReducer over useState because the state transitions are complex and
 *     interdependent (e.g. completing signup triggers profiling open, which
 *     gates on isAuthenticated). A reducer makes the state machine explicit.
 *   - UserContext is a separate concern (balance, bets, bet placement). AuthContext
 *     owns identity; UserContext owns the session's transactional data.
 *     They're bridged via registerUserSync so UserContext can stay in sync when
 *     auth state changes (e.g. logout resets UserContext).
 *   - localStorage is the persistence layer for this prototype. Production would
 *     use httpOnly cookies for the session token and a server-side session store.
 */

import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { sendOTP, verifyOTP } from '../auth/mockAuthService.js';
import { trackSignupComplete, trackLogin, trackProfilingComplete } from '../utils/analytics.js';

// ── Storage key ────────────────────────────────────────────────────────────────

const SESSION_KEY = 'punt_session';

// ── State shape ────────────────────────────────────────────────────────────────

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,          // true on first mount while we check localStorage
  authError: null,
  authModal: 'none',      // 'none' | 'login' | 'signup'
  profilingOpen: false,
};

// ── Reducer ────────────────────────────────────────────────────────────────────

function authReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_SESSION':
      // Called on mount. user may be null (no stored session) or a UserProfile.
      return {
        ...state,
        loading: false,
        isAuthenticated: action.payload.user !== null,
        user: action.payload.user,
      };

    case 'OPEN_SIGNUP':
      return { ...state, authModal: 'signup', authError: null };

    case 'OPEN_LOGIN':
      return { ...state, authModal: 'login', authError: null };

    case 'CLOSE_AUTH_MODAL':
      return { ...state, authModal: 'none', authError: null };

    case 'SET_AUTH_ERROR':
      return { ...state, authError: action.payload.error };

    case 'COMPLETE_SIGNUP':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        authModal: 'none',
        authError: null,
        // Open profiling immediately after signup — sequenced in action creator
        profilingOpen: true,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        authModal: 'none',
        authError: null,
        profilingOpen: false,
      };

    case 'SAVE_PREFERENCES':
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            ...action.payload.preferences,
          },
        },
        profilingOpen: false,
      };

    case 'CLOSE_PROFILING':
      return { ...state, profilingOpen: false };

    case 'LOGOUT':
      return {
        ...initialState,
        loading: false,
      };

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ── UserProfile factory ────────────────────────────────────────────────────────

/**
 * Assembles a UserProfile from signup form data.
 * Kept here (not in the service) because it's pure data transformation
 * that depends on the form shape — a concern of the auth domain.
 */
function buildUserProfile(formData) {
  const { firstName, lastName, email, phone, dob, postcode, selectedAddress, depositLimit } = formData;

  const name = `${firstName} ${lastName}`.trim();
  // Initials: first char of first name + first char of last name
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return {
    id: `user-${Date.now()}`,
    name,
    initials,
    phone,
    email,
    dob,                                              // YYYY-MM-DD
    postcode: postcode.toUpperCase(),
    addressLine1: selectedAddress?.line1 ?? '',
    addressLine2: selectedAddress?.line2 ?? null,
    city: selectedAddress?.city ?? '',
    balance: 0.00,
    currency: 'GBP',
    memberSince: new Date().toISOString(),
    totalBets: 0,
    totalWins: 0,
    winRate: 0,
    verified: false,
    kycTier: 0,
    depositLimit: depositLimit ?? { daily: 150, weekly: 500, monthly: 1500 },
    preferences: {
      oddsFormat: 'probability',
      defaultStake: 5.00,
      notificationsEnabled: true,
      favouriteTeams: [],
      favouriteSports: [],
      intent: null,
      styleSignal: null,
      profilingCompletedAt: null,
    },
    activePromotions: [],
  };
}

/**
 * Minimal profile for users who haven't completed signup — returning users
 * with no stored session, and visitors who skip signup to browse.
 */
function buildGuestProfile({ name, initials, phone = '' }) {
  return {
    id: `user-${Date.now()}`,
    name,
    initials,
    phone,
    email: '',
    dob: '',
    postcode: '',
    addressLine1: '',
    addressLine2: null,
    city: '',
    balance: 0.00,
    currency: 'GBP',
    memberSince: new Date().toISOString(),
    totalBets: 0,
    totalWins: 0,
    winRate: 0,
    verified: false,
    kycTier: 0,
    depositLimit: { daily: 150, weekly: 500, monthly: 1500 },
    preferences: {
      oddsFormat: 'probability',
      defaultStake: 5.00,
      notificationsEnabled: true,
      favouriteTeams: [],
      favouriteSports: [],
      intent: null,
      styleSignal: null,
      profilingCompletedAt: null,
    },
    activePromotions: [],
  };
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Ref to an optional sync function registered by UserContext.
  // This lets UserContext react to auth changes (e.g. reset on logout)
  // without creating a circular dependency between the two contexts.
  const userSyncRef = useRef(null);

  // ── Session hydration on mount ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const user = raw ? JSON.parse(raw) : null;
      dispatch({ type: 'HYDRATE_SESSION', payload: { user } });
    } catch {
      // Corrupted localStorage — start fresh
      localStorage.removeItem(SESSION_KEY);
      dispatch({ type: 'HYDRATE_SESSION', payload: { user: null } });
    }
  }, []);

  // ── Persist user to localStorage whenever it changes ──────────────────────
  useEffect(() => {
    if (state.user) {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(state.user));
      } catch {
        // Storage quota exceeded or private browsing — silently skip
      }
    }
  }, [state.user]);

  // ── Notify UserContext when auth state changes ─────────────────────────────
  useEffect(() => {
    if (userSyncRef.current) {
      userSyncRef.current(state.user);
    }
  }, [state.user]);

  // ── Action creators ────────────────────────────────────────────────────────

  const openSignup = useCallback(() => {
    dispatch({ type: 'OPEN_SIGNUP' });
  }, []);

  const openLogin = useCallback(() => {
    dispatch({ type: 'OPEN_LOGIN' });
  }, []);

  const closeAuthModal = useCallback(() => {
    dispatch({ type: 'CLOSE_AUTH_MODAL' });
  }, []);

  /**
   * sendOTPAction — triggers the mock OTP service.
   * Kept as an action on context so components don't import the service directly.
   */
  const sendOTPAction = useCallback(async (phone) => {
    dispatch({ type: 'SET_AUTH_ERROR', payload: { error: null } });
    try {
      await sendOTP(phone);
    } catch (err) {
      dispatch({ type: 'SET_AUTH_ERROR', payload: { error: err.message } });
      throw err;
    }
  }, []);

  /**
   * verifyOTPAction — validates the code. Any 6 digits succeeds in mock.
   */
  const verifyOTPAction = useCallback(async (phone, code) => {
    dispatch({ type: 'SET_AUTH_ERROR', payload: { error: null } });
    try {
      await verifyOTP(phone, code);
    } catch (err) {
      dispatch({ type: 'SET_AUTH_ERROR', payload: { error: 'Incorrect code. Try again.' } });
      throw err;
    }
  }, []);

  /**
   * completeSignup — assembles UserProfile from formData, authenticates,
   * and opens the profiling flow.
   */
  const completeSignup = useCallback((formData) => {
    const user = buildUserProfile(formData);
    dispatch({ type: 'COMPLETE_SIGNUP', payload: { user } });
    trackSignupComplete();
  }, []);

  /**
   * loginWithPhone — for the login flow. In mock, any verified OTP logs in.
   * If no stored session exists, creates a minimal returning-user profile
   * so the app has something to render.
   */
  const loginWithPhone = useCallback((phone) => {
    // Try to load existing user from localStorage first
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const user = JSON.parse(raw);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
        trackLogin('phone');
        return;
      }
    } catch {
      // Fall through to minimal profile
    }

    // No stored session — create a guest returning-user profile
    const user = buildGuestProfile({ name: 'Returning User', initials: 'RU', phone });
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
    trackLogin('phone');
  }, []);

  /**
   * skipSignup — lets a visitor bypass the signup wizard and browse the app
   * with a guest profile. Profiling is skipped too, since there's no account.
   */
  const skipSignup = useCallback(() => {
    const user = buildGuestProfile({ name: 'Guest', initials: 'G' });
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
  }, []);

  /**
   * savePreferences — merges profiling selections into user.preferences,
   * persists, and closes the profiling overlay.
   */
  const savePreferences = useCallback((prefs) => {
    dispatch({
      type: 'SAVE_PREFERENCES',
      payload: {
        preferences: {
          ...prefs,
          profilingCompletedAt: new Date().toISOString(),
        },
      },
    });
    trackProfilingComplete(prefs.intent);
  }, []);

  const closeProfiling = useCallback(() => {
    dispatch({ type: 'CLOSE_PROFILING' });
  }, []);

  /**
   * logout — clears auth state and localStorage session.
   * Also notifies UserContext via the sync ref.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    dispatch({ type: 'LOGOUT' });
  }, []);

  /**
   * registerUserSync — called by UserContext on mount to register a callback.
   * When auth user changes (login, logout, preferences saved), UserContext
   * receives the updated user and can sync its own state.
   *
   * This avoids prop drilling user down through the provider tree while
   * keeping the two contexts decoupled at the module level.
   */
  const registerUserSync = useCallback((fn) => {
    userSyncRef.current = fn;
  }, []);

  const value = {
    // State
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    loading: state.loading,
    authError: state.authError,
    authModal: state.authModal,
    profilingOpen: state.profilingOpen,
    // Actions
    openSignup,
    openLogin,
    closeAuthModal,
    sendOTP: sendOTPAction,
    verifyOTP: verifyOTPAction,
    completeSignup,
    loginWithPhone,
    skipSignup,
    savePreferences,
    closeProfiling,
    logout,
    registerUserSync,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
