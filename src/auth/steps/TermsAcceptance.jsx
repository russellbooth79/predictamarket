/**
 * TermsAcceptance.jsx — Signup Step 5
 *
 * T&C acceptance (required) and marketing consent (optional).
 * CTA is disabled until tcAccepted is true.
 *
 * In production, the exact T&C and marketing consent wording must be reviewed
 * by legal and compliance. GDPR Article 7 requires consent to be unambiguous,
 * informed, and freely given — marketing must be opt-in (unchecked by default).
 */

import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import ProgressDots from '../components/ProgressDots.jsx';
import AuthButton from '../components/AuthButton.jsx';

function Checkbox({ checked, onChange, children, id }) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 cursor-pointer select-none"
    >
      {/* Visually-hidden native checkbox for accessibility and correct click handling */}
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {/* Custom visual indicator — aria-hidden because the real input handles a11y */}
      <span
        aria-hidden="true"
        className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 mt-0.5"
        style={{
          background: checked ? 'linear-gradient(135deg, #6C63FF, #B06FFF)' : 'rgba(255,255,255,0.05)',
          border: `1.5px solid ${checked ? '#6C63FF' : 'rgba(255,255,255,0.15)'}`,
          boxShadow: checked ? '0 2px 8px rgba(108,99,255,0.3)' : 'none',
        }}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </span>
      <span className="text-sm leading-relaxed" style={{ color: '#7B8CAA' }}>
        {children}
      </span>
    </label>
  );
}

export default function TermsAcceptance({ onNext, onBack, loading = false, totalSteps = 4, currentStep = 3 }) {
  const [tcAccepted, setTcAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  function handleSubmit() {
    if (!tcAccepted) return;
    onNext({ tcAccepted, marketingAccepted });
  }

  return (
    <div className="flex flex-col min-h-full shrink-0 px-6 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-xl"
          style={{ color: '#7B8CAA', background: 'rgba(255,255,255,0.05)' }}
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <ProgressDots total={totalSteps} current={currentStep} />
        <div className="w-9" />
      </div>

      <h1 className="text-2xl font-black mb-2" style={{ color: '#F0F6FF' }}>
        Almost done
      </h1>
      <p className="text-sm mb-8" style={{ color: '#7B8CAA' }}>
        Just confirm a couple of things before we create your account.
      </p>

      {/* Checkboxes */}
      <div className="flex flex-col gap-6 mb-auto">
        <Checkbox
          id="tc"
          checked={tcAccepted}
          onChange={() => setTcAccepted(v => !v)}
        >
          I am 18 or over and I agree to the{' '}
          <span style={{ color: '#6C63FF' }}>Terms & Conditions</span>
          {' '}and{' '}
          <span style={{ color: '#6C63FF' }}>Privacy Policy</span>.
          I confirm I have read and understood the{' '}
          <span style={{ color: '#6C63FF' }}>Responsible Gambling policy</span>.
        </Checkbox>

        <Checkbox
          id="marketing"
          checked={marketingAccepted}
          onChange={() => setMarketingAccepted(v => !v)}
        >
          I'd like to receive personalised offers, promotions, and betting insights from PUNT.
          You can opt out at any time in Settings. (Optional)
        </Checkbox>
      </div>

      {/* Legal micro-copy */}
      <p className="text-xs mb-6 mt-8 leading-relaxed" style={{ color: '#6B7894' }}>
        PUNT is operated under a UK Gambling Commission licence. Gambling is for entertainment only.
        Never chase losses. BeGambleAware.org · GamStop.co.uk · 18+
      </p>

      <AuthButton
        variant="primary-gradient"
        disabled={!tcAccepted}
        loading={loading}
        onClick={handleSubmit}
      >
        Create account
      </AuthButton>
    </div>
  );
}
