/**
 * PlayerProfiling.jsx
 *
 * Post-signup profiling overlay (z-[120] — highest in the z-stack).
 * Shown immediately after account creation completes.
 *
 * Step routing based on intent selection:
 *   Sports → P2 (SportsSelector) → save
 *   Casino → P3 (StyleSignal)    → save
 *   Both   → P2 (SportsSelector) → P3 (StyleSignal) → save
 *   Skip at any point → savePreferences with partial data, close
 *
 * Accumulated preferences travel through the steps and are merged at save.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import IntentSelector from './profiling/IntentSelector.jsx';
import SportsSelector from './profiling/SportsSelector.jsx';
import StyleSignal from './profiling/StyleSignal.jsx';

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40, transition: { duration: 0.15 } }),
};

// Profiling step identifiers
const STEPS = {
  INTENT: 'intent',
  SPORTS: 'sports',
  STYLE:  'style',
};

export default function PlayerProfiling({ isOpen }) {
  const { user, savePreferences, closeProfiling } = useAuth();

  const [step, setStep] = useState(STEPS.INTENT);
  const [dir, setDir] = useState(1);

  // Accumulated preferences — merged incrementally as steps complete
  const [collectedPrefs, setCollectedPrefs] = useState({});

  // Intent determines the step routing
  const [intent, setIntent] = useState(null);

  function handleSkip() {
    // Save whatever was collected plus a null profilingCompletedAt
    // (savePreferences in AuthContext sets profilingCompletedAt automatically)
    savePreferences({ ...collectedPrefs, intent });
  }

  function handleIntentNext(selectedIntent) {
    setIntent(selectedIntent);
    setCollectedPrefs(p => ({ ...p, intent: selectedIntent }));
    setDir(1);
    if (selectedIntent === 'sports') {
      setStep(STEPS.SPORTS);
    } else if (selectedIntent === 'casino') {
      setStep(STEPS.STYLE);
    } else {
      // Both → sports first
      setStep(STEPS.SPORTS);
    }
  }

  function handleSportsNext(sportsData) {
    const merged = { ...collectedPrefs, ...sportsData };
    setCollectedPrefs(merged);
    setDir(1);
    if (intent === 'both') {
      // Continue to casino style
      setStep(STEPS.STYLE);
    } else {
      // Sports only — done
      savePreferences(merged);
    }
  }

  const handleStyleNext = useCallback((styleData) => {
    const merged = { ...collectedPrefs, ...styleData };
    savePreferences(merged);
  }, [collectedPrefs, savePreferences]);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <AnimatePresence>
      {isOpen && <motion.div
        className="fixed inset-0 flex flex-col overflow-hidden"
        style={{
          zIndex: 120,
          backgroundColor: '#05080F',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
      >
        {/* Background ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(108,99,255,0.08) 0%, transparent 60%)',
          }}
        />

        <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative"
            style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}
          >
            {step === STEPS.INTENT && (
              <IntentSelector
                firstName={firstName}
                onNext={handleIntentNext}
                onSkip={handleSkip}
              />
            )}

            {step === STEPS.SPORTS && (
              <SportsSelector
                onNext={handleSportsNext}
                onBack={() => { setDir(-1); setStep(STEPS.INTENT); }}
                onSkip={handleSkip}
                isFinalStep={intent === 'sports'}
              />
            )}

            {step === STEPS.STYLE && (
              <StyleSignal
                onNext={handleStyleNext}
                onBack={intent === 'both' ? () => { setDir(-1); setStep(STEPS.SPORTS); } : null}
                collectedPrefs={collectedPrefs}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
      </motion.div>}
    </AnimatePresence>
  );
}
