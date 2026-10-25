/**
 * mockAuthService.js
 *
 * All async operations are simulated with artificial delays to make the
 * prototype behave like a real auth service. In production these would be
 * HTTP calls to an auth API (OTP via SMS gateway, address via postcode lookup
 * API, biometrics via device WebAuthn/FaceID).
 *
 * OTP: any 6-digit code succeeds — log the "sent" code to console so
 * prototype testers can copy-paste it without having a real SMS.
 */

// ── Fake address data — deterministic by postcode for repeatable demos ────────

const FAKE_ADDRESSES = {
  default: [
    { id: 'addr-1', line1: '14 Canary Wharf', line2: 'Suite 4B', city: 'London', postcode: '' },
    { id: 'addr-2', line1: '28 Shoreditch High Street', line2: null, city: 'London', postcode: '' },
    { id: 'addr-3', line1: '7 Brick Lane', line2: 'Flat 2', city: 'London', postcode: '' },
  ],
  'SW1A': [
    { id: 'addr-sw1-1', line1: '10 Downing Street', line2: null, city: 'London', postcode: '' },
    { id: 'addr-sw1-2', line1: '11 Downing Street', line2: null, city: 'London', postcode: '' },
    { id: 'addr-sw1-3', line1: '12 Whitehall', line2: null, city: 'London', postcode: '' },
  ],
  'M1': [
    { id: 'addr-m1-1', line1: '1 Piccadilly Gardens', line2: null, city: 'Manchester', postcode: '' },
    { id: 'addr-m1-2', line1: '42 Market Street', line2: 'Flat 3', city: 'Manchester', postcode: '' },
    { id: 'addr-m1-3', line1: '15 Northern Quarter', line2: null, city: 'Manchester', postcode: '' },
  ],
  'E1': [
    { id: 'addr-e1-1', line1: '8 Spitalfields Market', line2: null, city: 'London', postcode: '' },
    { id: 'addr-e1-2', line1: '22 Commercial Street', line2: 'Floor 2', city: 'London', postcode: '' },
    { id: 'addr-e1-3', line1: '5 Whitechapel Road', line2: null, city: 'London', postcode: '' },
  ],
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * sendOTP — simulates dispatching a 6-digit OTP via SMS.
 * The generated code is logged to the console so testers can use it.
 * In production: POST /auth/otp/send with phone in E.164 format.
 */
export async function sendOTP(phone) {
  await delay(800);
  // Generate a deterministic-looking but random 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  // Intentionally visible in console for prototype testing
  console.log(`[PUNT Mock OTP] Code for ${phone}: ${code}`);
  return { success: true };
}

/**
 * verifyOTP — any well-formed 6-digit code succeeds.
 * In production: POST /auth/otp/verify — server validates against issued code with TTL.
 */
export async function verifyOTP(phone, code) {
  await delay(800);
  if (!/^\d{6}$/.test(code)) {
    throw new Error('Invalid code format');
  }
  // Mock: all 6-digit codes pass
  return { success: true, verified: true };
}

/**
 * lookupAddress — deterministic fake results based on postcode prefix.
 * Returns 3 address options as would come from a Royal Mail PAF lookup API.
 * In production: GET /address-lookup?postcode={postcode} → Ideal Postcodes / Loqate.
 */
export async function lookupAddress(postcode) {
  await delay(600);
  const prefix = postcode.toUpperCase().replace(/\s/g, '').slice(0, 2);
  const addresses = (FAKE_ADDRESSES[prefix] || FAKE_ADDRESSES.default).map(addr => ({
    ...addr,
    postcode: postcode.toUpperCase(),
  }));
  return addresses;
}

/**
 * biometricAuth — simulates device biometric prompt (FaceID / fingerprint).
 * In production: navigator.credentials.get() with WebAuthn, or native biometrics
 * on mobile via react-native-biometrics.
 */
export async function biometricAuth() {
  await delay(1200);
  return { success: true, credentialId: `cred-${Date.now()}` };
}

/**
 * ssoSignIn — simulates Apple/Google OAuth sign-in returning pre-filled profile data.
 * In production: OAuth 2.0 code flow → token exchange → profile fetch.
 */
export async function ssoSignIn(provider) {
  await delay(1000);
  const profiles = {
    apple: {
      firstName: 'Jamie',
      lastName: 'Clarke',
      email: 'jamie.clarke@icloud.com',
    },
    google: {
      firstName: 'Sam',
      lastName: 'Morgan',
      email: 'sam.morgan@gmail.com',
    },
  };
  return profiles[provider] || profiles.google;
}
