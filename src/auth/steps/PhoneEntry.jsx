/**
 * PhoneEntry.jsx — Signup Step 1
 *
 * Phone number input with UK mobile validation and SSO options.
 * Country code is fixed to +44 (UK only) for this prototype.
 *
 * Validation: UK mobile numbers start with 07 (local format) or +447 (E.164).
 * We strip the leading 0 and prepend +44 before passing to sendOTP.
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import AuthButton from '../components/AuthButton.jsx';
import { ssoSignIn } from '../mockAuthService.js';

// UK mobile: 07xxx xxxxxx — 11 digits starting with 07
const UK_MOBILE_REGEX = /^07\d{9}$/;

function normaliseToE164(raw) {
  const digits = raw.replace(/\s/g, '');
  if (digits.startsWith('07')) {
    return '+44' + digits.slice(1);
  }
  return digits;
}

export default function PhoneEntry({ onNext, onClose, onSkip, sendOTP, onSSOPrefill }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(null);
  const [error, setError] = useState('');

  const rawDigits = phone.replace(/\s/g, '');
  const isValid = UK_MOBILE_REGEX.test(rawDigits);

  async function handleSendCode() {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const e164 = normaliseToE164(rawDigits);
      await sendOTP(e164);
      onNext({ phone: e164 });
    } catch {
      setError('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSSO(provider) {
    setSsoLoading(provider);
    try {
      const data = await ssoSignIn(provider);
      onSSOPrefill(data);
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setSsoLoading(null);
    }
  }

  function handlePhoneInput(e) {
    // Allow digits and spaces only
    const val = e.target.value.replace(/[^\d\s]/g, '');
    setPhone(val);
    setError('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && isValid) handleSendCode();
  }

  return (
    <div className="flex flex-col min-h-full shrink-0 px-6 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm font-medium px-2 py-2 transition-opacity active:opacity-70"
          style={{ color: '#7B8CAA' }}
        >
          Skip for now
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-xl transition-colors"
          style={{ color: '#7B8CAA', background: 'rgba(255,255,255,0.05)' }}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-black mb-2" style={{ color: '#F0F6FF' }}>
        What's your mobile number?
      </h1>
      <p className="text-sm mb-8" style={{ color: '#7B8CAA' }}>
        We'll send you a 6-digit code to verify.
      </p>

      {/* Phone input */}
      <div
        className="flex items-center rounded-xl mb-2 overflow-hidden"
        style={{
          border: `1.5px solid ${error ? '#FF3366' : 'rgba(255,255,255,0.1)'}`,
          background: 'rgba(255,255,255,0.04)',
          height: '56px',
        }}
      >
        {/* Country flag + code — fixed for this prototype */}
        <div
          className="flex items-center gap-2 px-4 shrink-0 font-mono text-sm font-semibold"
          style={{
            color: '#F0F6FF',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            height: '100%',
          }}
        >
          <span>🇬🇧</span>
          <span>+44</span>
        </div>

        <input
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={handlePhoneInput}
          onKeyDown={handleKeyDown}
          placeholder="07700 900000"
          className="flex-1 min-w-0 bg-transparent outline-none px-4 font-mono text-lg"
          style={{ color: '#F0F6FF', caretColor: '#6C63FF' }}
          autoFocus
          autoComplete="tel-national"
        />
      </div>

      {error && (
        <p className="text-xs mb-4" style={{ color: '#FF3366' }}>{error}</p>
      )}

      {/* Send code CTA */}
      <AuthButton
        variant="primary-gradient"
        loading={loading}
        disabled={!isValid}
        onClick={handleSendCode}
        className="mt-2 mb-6"
      >
        Send code
      </AuthButton>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <span className="text-xs" style={{ color: '#7B8CAA' }}>or use</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* SSO buttons */}
      <div className="flex flex-col gap-3">
        <AuthButton
          variant="social-apple"
          loading={ssoLoading === 'apple'}
          onClick={() => handleSSO('apple')}
        >
          <span className="text-lg leading-none">🍎</span>
          <span className="font-semibold">Continue with Apple</span>
        </AuthButton>

        <AuthButton
          variant="social-google"
          loading={ssoLoading === 'google'}
          onClick={() => handleSSO('google')}
        >
          {/* Google G SVG inline — lucide-react has no Google icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </AuthButton>
      </div>
    </div>
  );
}
