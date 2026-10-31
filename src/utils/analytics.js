/**
 * analytics.js — thin wrapper around GA4's gtag.
 *
 * All calls are no-ops when gtag isn't loaded (e.g. local dev with no internet,
 * or an ad-blocker). Import and call freely — nothing will throw.
 *
 * Standard GA4 events used:
 *   page_view       — SPA route changes (fired manually since URL doesn't change)
 *   sign_up         — account creation complete
 *   login           — user authenticated (OTP or SSO)
 *   select_content  — user taps into a sport / match
 *
 * Custom events (prefixed with punt_):
 *   punt_bet_placed         — user confirmed a bet (with stake + selections count)
 *   punt_profiling_complete — post-signup profiling saved (intent captured)
 *   punt_intent_changed     — user changed their product intent in Account settings
 *   punt_add_to_slip        — selection added to bet slip
 *   punt_otp_sent           — OTP requested (funnel step)
 *   punt_otp_verified       — OTP verified successfully
 *   punt_signup_step        — step number completed in signup wizard
 */

function gtag(...args) {
  if (typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

// ── Page views ────────────────────────────────────────────────────────────────

/**
 * Call when the user navigates to a new view in the SPA.
 * Maps internal view IDs to human-readable titles for GA reports.
 */
const VIEW_TITLES = {
  home:          'Home — Sports',
  live:          'In-Play Hub',
  'inplay-match': 'In-Play Match',
  discover:      'Discover',
  mybets:        'My Bets',
  casino:        'Casino Lobby',
  account:       'Account',
  markets:       'All Markets',
  explore:       'Prediction Feed',
};

export function trackPageView(viewId, extra = {}) {
  gtag('event', 'page_view', {
    page_title: VIEW_TITLES[viewId] ?? viewId,
    page_location: window.location.href,
    ...extra,
  });
}

// ── Auth events ───────────────────────────────────────────────────────────────

export function trackSignupStep(step) {
  gtag('event', 'punt_signup_step', { step });
}

export function trackOtpSent() {
  gtag('event', 'punt_otp_sent');
}

export function trackOtpVerified() {
  gtag('event', 'punt_otp_verified');
}

export function trackSignupComplete() {
  // GA4 standard recommended event
  gtag('event', 'sign_up', { method: 'phone' });
}

export function trackLogin(method = 'phone') {
  // GA4 standard recommended event
  gtag('event', 'login', { method });
}

// ── Profiling events ──────────────────────────────────────────────────────────

export function trackProfilingComplete(intent) {
  gtag('event', 'punt_profiling_complete', { intent });
}

export function trackIntentChanged(from, to) {
  gtag('event', 'punt_intent_changed', { from_intent: from ?? 'none', to_intent: to });
}

// ── Betting events ────────────────────────────────────────────────────────────

export function trackAddToSlip(sport, marketName) {
  gtag('event', 'punt_add_to_slip', { sport, market: marketName });
}

export function trackBetPlaced(stakeAmount, selectionsCount) {
  gtag('event', 'punt_bet_placed', {
    currency: 'GBP',
    value: stakeAmount,
    selections: selectionsCount,
  });
}

// ── Content selection ─────────────────────────────────────────────────────────

export function trackSelectSport(sport) {
  gtag('event', 'select_content', { content_type: 'sport', content_id: sport });
}

export function trackSelectMatch(matchId, sport) {
  gtag('event', 'select_content', { content_type: 'match', content_id: matchId, sport });
}
