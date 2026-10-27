/**
 * testPrefill.js
 *
 * Pre-fills the signup flow with test details so the onboarding journey can
 * be clicked through with "Next" alone. Testing aid only.
 *
 * On when:
 *   - running the dev server (npm run dev), or
 *   - the page was opened with ?prefill=1 (remembered in this browser until
 *     ?prefill=0 turns it off) — use this on the deployed site.
 */

const STORAGE_KEY = 'punt_prefill';

function readFlag() {
  try {
    const param = new URLSearchParams(window.location.search).get('prefill');
    if (param === '1') localStorage.setItem(STORAGE_KEY, '1');
    if (param === '0') localStorage.removeItem(STORAGE_KEY);
    if (param === '0') return false;
    return import.meta.env.DEV || localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // Storage blocked (private mode etc.) — fall back to the dev-server default
    return import.meta.env.DEV;
  }
}

export const PREFILL_ENABLED = readFlag();

const TEST_DETAILS = {
  phone: '07700 900123',          // Ofcom-reserved drama number, never a real line
  otp: '123456',                  // mock OTP service accepts any 6 digits
  firstName: 'Alex',
  lastName: 'Tester',
  email: 'alex.tester@example.com',
  dob: { day: '14', month: '03', year: '1998' },
  postcode: 'SW1A 1AA',
  // Matches an entry the mock address lookup returns for SW1A
  address: { id: 'addr-sw1-3', line1: '12 Whitehall', line2: null, city: 'London', postcode: 'SW1A 1AA' },
  acceptTerms: true,
};

/** Test details when pre-fill is on, otherwise null */
export const testDetails = PREFILL_ENABLED ? TEST_DETAILS : null;
