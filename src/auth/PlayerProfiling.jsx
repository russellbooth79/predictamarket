/**
 * PlayerProfiling.jsx
 *
 * Post-signup profiling overlay (z-[120] — highest in the z-stack).
 * Shown immediately after account creation completes.
 *
 * Two steps:
 *   1. Intent — "Sports, Casino or Both?" (single choice; drives the nav,
 *      home and Discover mix)
 *   2. Picks  — multi-select grid, showing only what fits the intent:
 *      sports → sports grid, casino → casino styles, both → both grids.
 *      Optional: continuing with nothing picked is fine.
 * Skip (step 1) saves intent 'both' so the user sees everything.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AuthButton from './components/AuthButton.jsx';
import { testDetails } from './testPrefill.js';

const INTENT_OPTIONS = [
  { value: 'sports', label: 'Sports Betting', sub: 'Markets, accas, in-play',          icon: '⚽', color: '#6C63FF', glow: 'rgba(108,99,255,0.2)' },
  { value: 'casino', label: 'Casino',         sub: 'Slots, live tables, crash games',  icon: '🎰', color: '#B06FFF', glow: 'rgba(176,111,255,0.2)' },
  { value: 'both',   label: 'Both',           sub: 'The full PUNT experience',         icon: '⭐', color: '#00F5A0', glow: 'rgba(0,245,160,0.15)' },
];

const PICKS_COPY = {
  sports: { title: 'Which sports do you follow?', sub: "We'll put them first in your feed." },
  casino: { title: "What's your casino style?", sub: "We'll tune your lobby to match." },
  both:   { title: 'What are you into?',         sub: "Pick as many as you like. We'll build your home around them." },
};

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40, transition: { duration: 0.15 } }),
};

const SPORT_OPTIONS = [
  { id: 'football',    label: 'Football',     icon: '⚽' },
  { id: 'horseracing', label: 'Horse Racing', icon: '🏇' },
  { id: 'tennis',      label: 'Tennis',       icon: '🎾' },
  { id: 'boxing',      label: 'Boxing',       icon: '🥊' },
  { id: 'nfl',         label: 'NFL',          icon: '🏈' },
  { id: 'nba',         label: 'NBA',          icon: '🏀' },
];

const CASINO_OPTIONS = [
  { id: 'slots',  label: 'Slots & Games', icon: '🎰' },
  { id: 'tables', label: 'Live Tables',   icon: '🃏' },
];

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.1 } },
};
const tileVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

function Tile({ option, selected, onToggle }) {
  return (
    <motion.button
      type="button"
      variants={tileVariants}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      aria-pressed={selected}
      className="relative flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 transition-colors duration-150"
      style={selected
        ? { background: 'rgba(108,99,255,0.14)', border: '1.5px solid rgba(108,99,255,0.7)', boxShadow: '0 0 18px rgba(108,99,255,0.2)' }
        : { background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)' }
      }
    >
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: '#6C63FF' }}
          >
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
      <span className="text-3xl leading-none">{option.icon}</span>
      <span className="text-xs font-semibold text-center" style={{ color: selected ? '#F0F6FF' : '#7B8CAA' }}>
        {option.label}
      </span>
    </motion.button>
  );
}

export default function PlayerProfiling({ isOpen }) {
  const { user, savePreferences } = useAuth();
  const [step, setStep] = useState('intent');
  const [dir, setDir] = useState(1);
  const [intent, setIntent] = useState(testDetails?.intent ?? null);
  const [sports, setSports] = useState([]);
  const [casino, setCasino] = useState([]);

  const toggle = (setter) => (id) =>
    setter(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  function goTo(next, direction) {
    setDir(direction);
    setStep(next);
  }

  function handleDone() {
    // Only keep picks that fit the chosen intent
    const keepSports = intent !== 'casino' ? sports : [];
    const keepCasino = intent !== 'sports' ? casino : [];
    savePreferences({
      intent,
      favouriteSports: keepSports,
      casinoStyle: keepCasino.length === 1 ? keepCasino[0] : keepCasino.length ? 'both' : null,
    });
  }

  function handleSkip() {
    savePreferences({ intent: 'both' });
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const showSports = intent !== 'casino';
  const showCasino = intent !== 'sports';
  const pickedCount = (showSports ? sports.length : 0) + (showCasino ? casino.length : 0);
  const copy = PICKS_COPY[intent ?? 'both'];

  return (
    <AnimatePresence>
      {isOpen && <motion.div
        className="fixed inset-0 flex flex-col overflow-hidden"
        style={{ zIndex: 120, backgroundColor: '#05080F' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
      >
        {/* Background ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(108,99,255,0.08) 0%, transparent 60%)' }}
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
            {step === 'intent' ? (
              <div className="flex flex-col min-h-full shrink-0 px-6 pt-6 pb-8">
                <div className="flex justify-end mb-6">
                  <button type="button" onClick={handleSkip} className="text-sm font-medium" style={{ color: '#7B8CAA' }}>
                    Skip
                  </button>
                </div>

                <h1 className="text-2xl font-black mb-2" style={{ color: '#F0F6FF' }}>
                  Welcome to PUNT, {firstName}.
                </h1>
                <p className="text-sm mb-8" style={{ color: '#7B8CAA' }}>
                  Tell us how you like to play and we'll tailor your experience.
                </p>

                <div className="flex flex-col gap-3 mb-8" role="radiogroup" aria-label="How do you like to play?">
                  {INTENT_OPTIONS.map(option => {
                    const isSelected = intent === option.value;
                    const isDimmed = intent !== null && !isSelected;
                    return (
                      <motion.button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setIntent(option.value)}
                        whileTap={{ scale: 0.98 }}
                        animate={{ opacity: isDimmed ? 0.5 : 1 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-4 rounded-2xl px-5 transition-colors duration-150"
                        style={{
                          height: '80px',
                          background: isSelected ? `linear-gradient(135deg, ${option.glow}, rgba(15,20,35,0.9))` : 'rgba(255,255,255,0.04)',
                          border: `1.5px solid ${isSelected ? option.color : 'rgba(255,255,255,0.08)'}`,
                          boxShadow: isSelected ? `0 4px 20px ${option.glow}` : 'none',
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                          style={{
                            background: isSelected ? option.glow : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${isSelected ? option.color : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          {option.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-base font-black" style={{ color: '#F0F6FF' }}>{option.label}</p>
                          <p className="text-xs" style={{ color: '#7B8CAA' }}>{option.sub}</p>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all duration-150"
                          style={{
                            background: isSelected ? option.color : 'transparent',
                            border: `2px solid ${isSelected ? option.color : 'rgba(255,255,255,0.2)'}`,
                          }}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-auto">
                  <AuthButton variant="primary-gradient" disabled={!intent} onClick={() => goTo('picks', 1)}>
                    Continue
                  </AuthButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col min-h-full shrink-0 px-6 pt-6 pb-8">
                <div className="flex justify-start mb-6">
                  <button
                    type="button"
                    onClick={() => goTo('intent', -1)}
                    className="p-2 rounded-xl"
                    style={{ color: '#7B8CAA', background: 'rgba(255,255,255,0.05)' }}
                    aria-label="Go back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>

                <h1 className="text-2xl font-black mb-2" style={{ color: '#F0F6FF' }}>{copy.title}</h1>
                <p className="text-sm mb-6" style={{ color: '#7B8CAA' }}>{copy.sub}</p>

                <motion.div variants={gridVariants} initial="hidden" animate="visible">
                  {showSports && (
                    <>
                      {showCasino && <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#6B7894' }}>Sports</p>}
                      <div className="grid grid-cols-3 gap-2.5 mb-6">
                        {SPORT_OPTIONS.map(o => (
                          <Tile key={o.id} option={o} selected={sports.includes(o.id)} onToggle={() => toggle(setSports)(o.id)} />
                        ))}
                      </div>
                    </>
                  )}

                  {showCasino && (
                    <>
                      {showSports && <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#6B7894' }}>Casino</p>}
                      <div className="grid grid-cols-2 gap-2.5 mb-8">
                        {CASINO_OPTIONS.map(o => (
                          <Tile key={o.id} option={o} selected={casino.includes(o.id)} onToggle={() => toggle(setCasino)(o.id)} />
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>

                <div className="mt-auto">
                  <AuthButton variant="primary-gradient" onClick={handleDone}>
                    {pickedCount ? "Let's go" : 'Skip this step'}
                  </AuthButton>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
      </motion.div>}
    </AnimatePresence>
  );
}
