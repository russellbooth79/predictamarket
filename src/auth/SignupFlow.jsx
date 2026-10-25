/**
 * SignupFlow.jsx
 *
 * Five-step signup wizard in a full-screen overlay (z-[110]).
 * Manages the step machine, accumulated form data, and slide direction
 * for Framer Motion's AnimatePresence transitions.
 *
 * Step machine:
 *   1  PhoneEntry      → sends OTP, advances to step 2
 *   2  OTPVerification → validates code, advances to step 3
 *   3  PersonalDetails → name/DOB/address, advances to step 4
 *   4  DepositLimits   → responsible gambling limits, advances to step 5
 *   5  TermsAcceptance → T&C acceptance, calls completeSignup
 *
 * Direction state drives the slide animation:
 *   +1 = forward (slide in from right)
 *   -1 = back (slide in from left)
 *
 * formData is accumulated across steps. Each step calls onNext(stepData)
 * which merges its data into the shared formData object before advancing.
 * This keeps step components stateless with respect to cross-step data.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import PhoneEntry from './steps/PhoneEntry.jsx';
import OTPVerification from './steps/OTPVerification.jsx';
import PersonalDetails from './steps/PersonalDetails.jsx';
import DepositLimits from './steps/DepositLimits.jsx';
import TermsAcceptance from './steps/TermsAcceptance.jsx';

// ── Framer Motion slide variants ──────────────────────────────────────────────
// dir > 0 = forward (new step slides in from right)
// dir < 0 = backward (new step slides in from left)

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40, transition: { duration: 0.15 } }),
};

const TOTAL_DOTS = 4; // Steps 2–5 show progress dots (step 1 has no dots per spec)

export default function SignupFlow({ isOpen }) {
  const { closeAuthModal, sendOTP, verifyOTP, completeSignup } = useAuth();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // SSO prefill data from Apple/Google flows
  const [ssoPrefill, setSsoPrefill] = useState(null);

  function advance(stepData = {}) {
    setFormData(prev => ({ ...prev, ...stepData }));
    setDir(1);
    setStep(s => s + 1);
  }

  function goBack() {
    setDir(-1);
    setStep(s => Math.max(1, s - 1));
  }

  function handleClose() {
    // Reset wizard state on close so reopening starts fresh
    setStep(1);
    setDir(1);
    setFormData({});
    setSsoPrefill(null);
    closeAuthModal();
  }

  const handleCompleteSignup = useCallback(async (stepData) => {
    const allData = { ...formData, ...stepData };
    setSubmitting(true);
    try {
      // completeSignup is synchronous in this prototype — assembles profile and dispatches
      completeSignup(allData);
      // Reset wizard state after completion
      setStep(1);
      setFormData({});
    } finally {
      setSubmitting(false);
    }
  }, [formData, completeSignup]);

  // Map step number to dot index (steps 2-5 → dots 0-3)
  const dotIndex = step - 2; // step 2 → dot 0, etc.

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex flex-col"
          style={{
            zIndex: 110,
            backgroundColor: '#05080F',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          {/* Safe area top spacer */}
          <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />

          {/* Step content — AnimatePresence drives slide transitions between steps */}
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col flex-1 min-h-0"
              style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}
            >
              {step === 1 && (
                <PhoneEntry
                  onNext={(data) => advance(data)}
                  onClose={handleClose}
                  sendOTP={sendOTP}
                  onSSOPrefill={(data) => {
                    setSsoPrefill(data);
                    // SSO skips phone/OTP — jump straight to personal details (step 3)
                    // but we need a placeholder phone for the profile
                    setFormData(prev => ({
                      ...prev,
                      phone: '+447700000000', // placeholder for SSO path
                    }));
                    setDir(1);
                    setStep(3);
                  }}
                />
              )}

              {step === 2 && (
                <OTPVerification
                  phone={formData.phone ?? ''}
                  onNext={(data) => advance(data)}
                  onBack={goBack}
                  verifyOTP={verifyOTP}
                  sendOTP={sendOTP}
                  totalSteps={TOTAL_DOTS}
                  currentStep={0}
                />
              )}

              {step === 3 && (
                <PersonalDetails
                  onNext={(data) => advance(data)}
                  onBack={goBack}
                  prefill={ssoPrefill ?? {}}
                  totalSteps={TOTAL_DOTS}
                  currentStep={1}
                />
              )}

              {step === 4 && (
                <DepositLimits
                  onNext={(data) => advance(data)}
                  onBack={goBack}
                  totalSteps={TOTAL_DOTS}
                  currentStep={2}
                />
              )}

              {step === 5 && (
                <TermsAcceptance
                  onNext={handleCompleteSignup}
                  onBack={goBack}
                  loading={submitting}
                  totalSteps={TOTAL_DOTS}
                  currentStep={3}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Safe area bottom spacer */}
          <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
