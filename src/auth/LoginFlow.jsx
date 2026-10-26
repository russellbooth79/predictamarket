/**
 * LoginFlow.jsx
 *
 * Two-step login overlay (z-[110]):
 *   Step 1 — PhoneEntry with "Welcome back" heading
 *   Step 2 — OTPVerification (login variant)
 *   Post-success — BiometricPrompt bottom sheet offer
 *
 * For the mock: any registered phone is accepted (always-registered).
 * On OTP verify success, calls loginWithPhone() from AuthContext.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import OTPVerification from './steps/OTPVerification.jsx';
import BiometricPrompt from './steps/BiometricPrompt.jsx';
import AuthButton from './components/AuthButton.jsx';
import { ssoSignIn } from './mockAuthService.js';

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40, transition: { duration: 0.15 } }),
};

const UK_MOBILE_REGEX = /^07\d{9}$/;

function normaliseToE164(raw) {
  const digits = raw.replace(/\s/g, '');
  return digits.startsWith('07') ? '+44' + digits.slice(1) : digits;
}

export default function LoginFlow({ isOpen }) {
  const { closeAuthModal, sendOTP, verifyOTP, loginWithPhone, openSignup } = useAuth();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [phone, setPhone] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [ssoLoading, setSsoLoading] = useState(null);
  const [showBiometric, setShowBiometric] = useState(false);

  const rawDigits = phone.replace(/\s/g, '');
  const isValidPhone = UK_MOBILE_REGEX.test(rawDigits);

  function handleClose() {
    setStep(1);
    setPhone('');
    setPhoneError('');
    setSsoLoading(null);
    closeAuthModal();
  }

  async function handlePhoneContinue() {
    if (!isValidPhone) return;
    setPhoneLoading(true);
    setPhoneError('');
    try {
      const e164 = normaliseToE164(rawDigits);
      await sendOTP(e164);
      setPhone(e164);
      setDir(1);
      setStep(2);
    } catch {
      setPhoneError('Failed to send code. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  }

  const handleOTPSuccess = useCallback(() => {
    loginWithPhone(phone);
    // Offer biometric enrolment after login
    setShowBiometric(true);
  }, [phone, loginWithPhone]);

  async function handleSSO(provider) {
    setSsoLoading(provider);
    try {
      const result = await ssoSignIn(provider);
      // SSO login: use phone from result, or fall back to a provider-scoped placeholder
      // that won't collide with a real registered number
      const ssoPhone = result?.phone ?? `+44sso_${provider}`;
      loginWithPhone(ssoPhone);
    } catch {
      setPhoneError('Sign-in failed. Please try again.');
    } finally {
      setSsoLoading(null);
    }
  }

  function handleBiometricDismiss() {
    setShowBiometric(false);
    handleClose();
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 flex flex-col overflow-hidden"
            style={{
              zIndex: 110,
              backgroundColor: '#05080F',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />

            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 pt-6 pb-8"
                style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}
              >
                {step === 1 && (
                  <LoginPhoneStep
                    phone={phone}
                    onPhoneChange={(val) => {
                      setPhone(val.replace(/[^\d\s]/g, ''));
                      setPhoneError('');
                    }}
                    onContinue={handlePhoneContinue}
                    onClose={handleClose}
                    loading={phoneLoading}
                    error={phoneError}
                    isValid={isValidPhone}
                    ssoLoading={ssoLoading}
                    onSSO={handleSSO}
                    onOpenSignup={() => { handleClose(); openSignup(); }}
                  />
                )}

                {step === 2 && (
                  <OTPVerification
                    phone={phone}
                    onNext={handleOTPSuccess}
                    onBack={() => { setDir(-1); setStep(1); }}
                    verifyOTP={verifyOTP}
                    sendOTP={sendOTP}
                    totalSteps={2}
                    currentStep={1}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Biometric prompt — shown after successful login, outside the login overlay */}
      <BiometricPrompt
        isOpen={showBiometric}
        onDismiss={handleBiometricDismiss}
      />
    </>
  );
}

// ── Login phone entry step ────────────────────────────────────────────────────
// Separated to a local component to keep LoginFlow's render clean.

function LoginPhoneStep({
  phone, onPhoneChange, onContinue, onClose,
  loading, error, isValid,
  ssoLoading, onSSO, onOpenSignup,
}) {
  function handleKeyDown(e) {
    if (e.key === 'Enter' && isValid) onContinue();
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-end mb-10">
        <button
          onClick={onClose}
          className="p-2 rounded-xl"
          style={{ color: '#7B8CAA', background: 'rgba(255,255,255,0.05)' }}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <h1 className="text-2xl font-black mb-2" style={{ color: '#F0F6FF' }}>
        Welcome back.
      </h1>
      <p className="text-sm mb-8" style={{ color: '#7B8CAA' }}>
        Enter your mobile number to sign in.
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
          onChange={e => onPhoneChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="07700 900000"
          className="flex-1 min-w-0 bg-transparent outline-none px-4 font-mono text-lg"
          style={{ color: '#F0F6FF', caretColor: '#6C63FF' }}
          autoFocus
          autoComplete="tel-national"
        />
      </div>

      {error && <p className="text-xs mb-3" style={{ color: '#FF3366' }}>{error}</p>}

      <AuthButton
        variant="primary-gradient"
        loading={loading}
        disabled={!isValid}
        onClick={onContinue}
        className="mt-2 mb-6"
      >
        Continue
      </AuthButton>

      {/* SSO */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <span className="text-xs" style={{ color: '#7B8CAA' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>

      <div className="flex flex-col gap-3 mb-10">
        <AuthButton
          variant="social-apple"
          loading={ssoLoading === 'apple'}
          onClick={() => onSSO('apple')}
        >
          <span className="text-lg leading-none">🍎</span>
          <span>Sign in with Apple</span>
        </AuthButton>
        <AuthButton
          variant="social-google"
          loading={ssoLoading === 'google'}
          onClick={() => onSSO('google')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          <span>Sign in with Google</span>
        </AuthButton>
      </div>

      <p className="text-sm text-center" style={{ color: '#7B8CAA' }}>
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onOpenSignup}
          className="font-semibold"
          style={{ color: '#6C63FF' }}
        >
          Sign up
        </button>
      </p>
    </>
  );
}
