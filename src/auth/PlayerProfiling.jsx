/**
 * PlayerProfiling.jsx
 *
 * Post-signup profiling overlay (z-[120] — highest in the z-stack).
 * Shown immediately after account creation completes.
 *
 * One screen: "What are you into?" — a multi-select grid of sports and
 * casino styles. Intent is derived from the picks rather than asked for:
 *   only sports picked  → 'sports'
 *   only casino picked  → 'casino'
 *   both, or nothing    → 'both'  (show everything)
 * Skip saves nothing beyond marking profiling complete.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AuthButton from './components/AuthButton.jsx';

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
  const [sports, setSports] = useState([]);
  const [casino, setCasino] = useState([]);

  const toggle = (setter) => (id) =>
    setter(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  function handleDone() {
    const intent = sports.length && !casino.length ? 'sports'
      : casino.length && !sports.length ? 'casino'
      : 'both';
    savePreferences({
      intent,
      favouriteSports: sports,
      casinoStyle: casino.length === 1 ? casino[0] : casino.length ? 'both' : null,
    });
  }

  function handleSkip() {
    savePreferences({ intent: 'both' });
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const pickedCount = sports.length + casino.length;

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

        <div
          className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative"
          style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}
        >
          <div className="flex flex-col min-h-full shrink-0 px-6 pt-6 pb-8">
            <div className="flex justify-end mb-6">
              <button type="button" onClick={handleSkip} className="text-sm font-medium" style={{ color: '#7B8CAA' }}>
                Skip
              </button>
            </div>

            <h1 className="text-2xl font-black mb-2" style={{ color: '#F0F6FF' }}>
              What are you into, {firstName}?
            </h1>
            <p className="text-sm mb-6" style={{ color: '#7B8CAA' }}>
              Pick as many as you like. We'll build your home around them.
            </p>

            <motion.div variants={gridVariants} initial="hidden" animate="visible">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#6B7894' }}>Sports</p>
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {SPORT_OPTIONS.map(o => (
                  <Tile key={o.id} option={o} selected={sports.includes(o.id)} onToggle={() => toggle(setSports)(o.id)} />
                ))}
              </div>

              <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#6B7894' }}>Casino</p>
              <div className="grid grid-cols-2 gap-2.5 mb-8">
                {CASINO_OPTIONS.map(o => (
                  <Tile key={o.id} option={o} selected={casino.includes(o.id)} onToggle={() => toggle(setCasino)(o.id)} />
                ))}
              </div>
            </motion.div>

            <div className="mt-auto">
              <AuthButton variant="primary-gradient" onClick={handleDone}>
                {pickedCount ? "Let's go" : 'Show me everything'}
              </AuthButton>
            </div>
          </div>
        </div>

        <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
      </motion.div>}
    </AnimatePresence>
  );
}
