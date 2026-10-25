/**
 * LandingScreen.jsx
 *
 * Full-screen unauthenticated landing page. Shown when isAuthenticated is false.
 * z-[100] per the z-index stack spec — sits above the app content but below
 * the auth flow overlays.
 *
 * Layout: centred single column, vertically balanced.
 * All CTA buttons dispatch to AuthContext (openSignup / openLogin).
 */

import { useAuth } from '../context/AuthContext.jsx';

export default function LandingScreen() {
  const { openSignup, openLogin } = useAuth();

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{
        zIndex: 100,
        backgroundColor: '#05080F',
      }}
    >
      {/* Background ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(108,99,255,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm flex flex-col items-center">

        {/* PUNT wordmark */}
        <div className="mb-3 text-center">
          <h1
            className="font-black tracking-tight"
            style={{ fontSize: '42px', color: '#F0F6FF', lineHeight: 1 }}
          >
            PUNT
          </h1>
          {/* Gradient underline */}
          <div
            className="h-1 rounded-full mt-2 mx-auto"
            style={{
              width: '56px',
              background: 'linear-gradient(90deg, #6C63FF, #B06FFF)',
            }}
          />
        </div>

        {/* Sub-headline */}
        <p className="text-base mb-12 text-center" style={{ color: '#7B8CAA', fontSize: '16px' }}>
          Join in under 90 seconds
        </p>

        {/* SSO buttons */}
        <div className="w-full flex flex-col gap-3 mb-5">
          <button
            type="button"
            onClick={openSignup}
            className="w-full flex items-center justify-center gap-3 rounded-xl font-semibold text-base transition-opacity active:opacity-70"
            style={{
              height: '56px',
              background: '#FFFFFF',
              color: '#000000',
            }}
          >
            <span className="text-lg leading-none">🍎</span>
            <span>Continue with Apple</span>
          </button>

          <button
            type="button"
            onClick={openSignup}
            className="w-full flex items-center justify-center gap-3 rounded-xl font-semibold text-base transition-opacity active:opacity-70"
            style={{
              height: '56px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#F0F6FF',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full mb-5">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-xs" style={{ color: '#7B8CAA' }}>or use your mobile number</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Phone CTA */}
        <button
          type="button"
          onClick={openSignup}
          className="w-full flex items-center justify-center rounded-xl font-semibold text-base transition-opacity active:opacity-80 mb-8"
          style={{
            height: '56px',
            background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)',
            color: '#F0F6FF',
            boxShadow: '0 4px 20px rgba(108,99,255,0.35)',
          }}
        >
          Continue with phone
        </button>

        {/* Legal micro-copy */}
        <p className="text-xs text-center leading-relaxed mb-8" style={{ color: '#7B8CAA', fontSize: '12px' }}>
          18+ only. By continuing you agree to our Terms & Conditions and Privacy Policy.
          Please gamble responsibly. BeGambleAware.org
        </p>

        {/* Login link */}
        <p className="text-sm text-center" style={{ color: '#7B8CAA' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={openLogin}
            className="font-semibold transition-opacity active:opacity-70"
            style={{ color: '#6C63FF' }}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
