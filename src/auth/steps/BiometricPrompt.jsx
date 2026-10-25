/**
 * BiometricPrompt.jsx
 *
 * Bottom sheet shown after first successful login, offering biometric
 * enrolment for faster future logins. "Not now" skips without penalty.
 *
 * In production: WebAuthn for web (navigator.credentials.create),
 * react-native-biometrics for mobile.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint } from 'lucide-react';
import AuthButton from '../components/AuthButton.jsx';
import { biometricAuth } from '../mockAuthService.js';
import { useState } from 'react';

export default function BiometricPrompt({ isOpen, onDismiss }) {
  const [loading, setLoading] = useState(false);

  async function handleEnrol() {
    setLoading(true);
    try {
      await biometricAuth();
      onDismiss(true); // enrolled
    } catch {
      onDismiss(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 115 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onDismiss(false)}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 rounded-t-3xl px-6 pt-6 pb-10"
            style={{
              zIndex: 116,
              background: 'rgba(15,20,35,0.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
          >
            {/* Drag handle */}
            <div
              className="w-10 h-1 rounded-full mx-auto mb-6"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            />

            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #B06FFF)', boxShadow: '0 8px 24px rgba(108,99,255,0.4)' }}
            >
              <Fingerprint className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-xl font-black text-center mb-2" style={{ color: '#F0F6FF' }}>
              Log in faster next time
            </h2>
            <p className="text-sm text-center mb-8" style={{ color: '#7B8CAA' }}>
              Use Face ID or your fingerprint to sign in instantly on this device.
            </p>

            <AuthButton
              variant="primary-gradient"
              loading={loading}
              onClick={handleEnrol}
              className="mb-3"
            >
              Set up biometric login
            </AuthButton>

            <button
              type="button"
              onClick={() => onDismiss(false)}
              className="w-full py-2 text-sm text-center"
              style={{ color: '#7B8CAA' }}
            >
              Not now
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
