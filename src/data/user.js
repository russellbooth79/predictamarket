/**
 * user.js
 *
 * Mock user data for PredictaMarket prototype.
 *
 * In production this would be fetched from the auth/profile API endpoint
 * and hydrated into a UserContext or Zustand store after session validation.
 * The shape here matches the expected API response — components should be
 * typed against this shape, not against this file directly.
 *
 * SENSITIVE FIELDS NOTE:
 * Balance, verification status, and KYC tier are security-sensitive in
 * production. They would be served from a separate /me/balance endpoint
 * with short cache TTL, not bundled in the user profile response.
 */

export const testUser = {
  id: 'user-001',
  name: 'Alex Thompson',
  initials: 'AT',
  email: 'alex.thompson@demo.com',

  // Balance in minor units would be safer for production (24750 pence)
  // but using decimal here to keep prototype readable at the UI layer.
  balance: 247.50,
  currency: 'GBP',

  memberSince: '2024-03-15',

  // Lifetime stats — in production these come from a separate analytics endpoint.
  totalBets: 47,
  totalWins: 29,
  winRate: 61.7, // percentage

  // KYC / compliance — drives UI gating for deposit limits and withdrawals.
  // Tier 1: email verified. Tier 2: identity verified. Tier 3: source of funds.
  verified: true,
  kycTier: 2,

  // Responsible gambling — daily deposit and session limits set by the user.
  // These gate the deposit flow and trigger warnings in the betslip.
  depositLimit: {
    daily: 100.00,
    weekly: 500.00,
    monthly: 1500.00,
  },

  // Preferences — persisted server-side, synced on login.
  preferences: {
    oddsFormat: 'probability', // 'probability' | 'decimal' | 'fractional'
    defaultStake: 5.00,
    notificationsEnabled: true,
    // Favourite teams drive the personalised feed ordering.
    favouriteTeams: ['Manchester City', 'Liverpool'],
    favouriteSports: ['football', 'tennis'],
  },

  // Active promotions — in production this would be a separate /me/bonuses endpoint.
  // Included here to support the bonus display prototype without a second mock file.
  activePromotions: [
    {
      id: 'promo-001',
      label: 'Weekend Accumulator Boost',
      type: 'acca_boost',
      // Expiry ISO string — components should format this with Intl.DateTimeFormat
      expiresAt: '2026-10-27T23:59:59Z',
      // Wagering requirement: how much must be staked before bonus can be withdrawn.
      wageringRequirement: 3,
      wageringProgress: 1,
      bonusAmount: 10.00,
      status: 'active', // 'active' | 'expiring' | 'complete' | 'expired'
    },
  ],
};
