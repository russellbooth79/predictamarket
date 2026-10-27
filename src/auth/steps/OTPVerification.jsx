/**
 * OTPVerification.jsx — Signup Step 2 / Login Step 2
 *
 * Six individual digit boxes with:
 *   - Auto-advance on digit entry
 *   - Backspace navigates to previous box
 *   - Paste fills all 6 boxes and auto-submits
 *   - Auto-submits when 6th box filled
 *   - Shake animation on wrong code (Framer Motion x keyframe)
 *   - 60-second resend countdown
 *
 * The individual-box approach (vs a single masked input) gives much better
 * mobile UX — the iOS/Android numeric keyboard opens, each digit is clearly
 * confirmed as it lands, and paste-from-SMS works natively.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import ProgressDots from '../components/ProgressDots.jsx';
import AuthButton from '../components/AuthButton.jsx';
import { testDetails } from '../testPrefill.js';

const SHAKE_KEYFRAMES = {
  x: [0, -10, 10, -10, 10, -6, 6, -3, 3, 0],
  transition: { duration: 0.5, ease: 'easeInOut' },
};

export default function OTPVerification({
  phone,
  onNext,
  onBack,
  verifyOTP,
  sendOTP,
  totalSteps = 4,
  currentStep = 0,
}) {
  const [digits, setDigits] = useState(() => testDetails?.otp.split('') ?? ['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef([]);
  const countdownRef = useRef(null);

  // Focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // 60s resend countdown
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setResendCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  }, []);

  const handleVerify = useCallback(async (codeOverride) => {
    const code = codeOverride ?? digits.join('');
    if (code.length !== 6) return;

    setLoading(true);
    setError('');
    try {
      await verifyOTP(phone, code);
      onNext({ code });
    } catch {
      setError('Incorrect code. Try again.');
      triggerShake();
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }, [digits, phone, verifyOTP, onNext, triggerShake]);

  function handleDigitChange(index, e) {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;

    const char = val.slice(-1); // take last digit if user types fast
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError('');

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else {
      // Last box filled — auto-submit
      inputRefs.current[index]?.blur();
      const code = newDigits.join('');
      if (code.length === 6) handleVerify(code);
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // Clear current box
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        // Move to previous box
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] ?? '';
    }
    setDigits(newDigits);

    // Focus last filled box
    const lastIndex = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      await sendOTP(phone);
      setResendCountdown(60);
      setDigits(['', '', '', '', '', '']);
      setError('');
      // Restart countdown
      clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setResendCountdown(c => {
          if (c <= 1) { clearInterval(countdownRef.current); return 0; }
          return c - 1;
        });
      }, 1000);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  // Mask phone: show last 4 digits
  const maskedPhone = phone.replace(/(\+44)(\d+)(\d{4})/, '$1•••••$3');

  return (
    <div className="flex flex-col min-h-full shrink-0 px-6 pt-6 pb-8">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-xl transition-colors"
          style={{ color: '#7B8CAA', background: 'rgba(255,255,255,0.05)' }}
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <ProgressDots total={totalSteps} current={currentStep} />
        <div className="w-9" /> {/* spacer to centre dots */}
      </div>

      <h1 className="text-2xl font-black mb-2" style={{ color: '#F0F6FF' }}>
        Enter your code
      </h1>
      <p className="text-sm mb-8" style={{ color: '#7B8CAA' }}>
        Sent to {maskedPhone}
      </p>

      {/* OTP boxes */}
      <motion.div
        animate={shaking ? SHAKE_KEYFRAMES : {}}
        className="flex gap-2 mb-4"
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            onChange={e => handleDigitChange(i, e)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            // Select-all on focus so re-entering a digit replaces cleanly
            onFocus={e => e.target.select()}
            className="flex-1 text-center font-mono text-2xl font-black rounded-xl outline-none transition-all duration-150"
            style={{
              height: '64px',
              maxWidth: '44px',
              background: digit
                ? 'rgba(108,99,255,0.12)'
                : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${
                error ? '#FF3366'
                : digit ? '#6C63FF'
                : 'rgba(255,255,255,0.1)'
              }`,
              color: '#F0F6FF',
              caretColor: 'transparent', // hide caret in single-char boxes
            }}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs mb-4"
            style={{ color: '#FF3366' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Verify button — shown when loading or when user hasn't auto-submitted */}
      <AuthButton
        variant="primary-gradient"
        loading={loading}
        disabled={digits.join('').length !== 6 || loading}
        onClick={() => handleVerify()}
        className="mb-6"
      >
        Verify code
      </AuthButton>

      {/* Resend */}
      <div className="text-center">
        {resendCountdown > 0 ? (
          <p className="text-sm" style={{ color: '#7B8CAA' }}>
            Resend code in <span style={{ color: '#F0F6FF' }}>{resendCountdown}s</span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm font-semibold transition-opacity"
            style={{
              color: '#6C63FF',
              opacity: resendLoading ? 0.5 : 1,
            }}
          >
            {resendLoading ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </div>
    </div>
  );
}
