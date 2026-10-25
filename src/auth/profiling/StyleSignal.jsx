/**
 * StyleSignal.jsx — Player Profiling P3
 *
 * Casino style preference: Slots & Games vs Live Tables.
 * Final step of the profiling flow — calls savePreferences on completion.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import AuthButton from '../components/AuthButton.jsx';

const CASINO_STYLES = [
  {
    value: 'slots',
    label: 'Slots & Games',
    sub: 'Thousands of slots, crash games, instant wins',
    icon: '🎰',
    color: '#B06FFF',
    glow: 'rgba(176,111,255,0.2)',
  },
  {
    value: 'tables',
    label: 'Live Tables',
    sub: 'Roulette, blackjack, baccarat with real dealers',
    icon: '🃏',
    color: '#6C63FF',
    glow: 'rgba(108,99,255,0.2)',
  },
];

export default function StyleSignal({ onNext, onBack, collectedPrefs = {} }) {
  const [selected, setSelected] = useState(null);

  function handleFinish() {
    onNext({
      ...collectedPrefs,
      casinoStyle: selected,
    });
  }

  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl"
            style={{ color: '#7B8CAA', background: 'rgba(255,255,255,0.05)' }}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9" />
        )}
        <div className="w-9" />
      </div>

      <h1 className="text-2xl font-black mb-2" style={{ color: '#F0F6FF' }}>
        What's your casino style?
      </h1>
      <p className="text-sm mb-8" style={{ color: '#7B8CAA' }}>
        We'll personalise your casino lobby based on what you enjoy most.
      </p>

      {/* Style cards */}
      <div className="flex flex-col gap-4 mb-auto">
        {CASINO_STYLES.map(style => {
          const isSelected = selected === style.value;
          const isDimmed = selected !== null && !isSelected;

          return (
            <motion.button
              key={style.value}
              type="button"
              onClick={() => setSelected(style.value)}
              animate={{ opacity: isDimmed ? 0.5 : 1 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-4 rounded-2xl px-5 transition-all duration-150"
              style={{
                height: '80px',
                background: isSelected
                  ? `linear-gradient(135deg, ${style.glow}, rgba(15,20,35,0.9))`
                  : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isSelected ? style.color : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isSelected ? `0 4px 20px ${style.glow}` : 'none',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{
                  background: isSelected ? style.glow : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isSelected ? style.color : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {style.icon}
              </div>

              <div className="flex-1 text-left">
                <p className="text-base font-black" style={{ color: '#F0F6FF' }}>{style.label}</p>
                <p className="text-xs" style={{ color: '#7B8CAA' }}>{style.sub}</p>
              </div>

              <div
                className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all duration-150"
                style={{
                  background: isSelected ? style.color : 'transparent',
                  border: `2px solid ${isSelected ? style.color : 'rgba(255,255,255,0.2)'}`,
                }}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      <AuthButton
        variant="primary-gradient"
        onClick={handleFinish}
        className="mt-8"
      >
        Let's go
      </AuthButton>
    </div>
  );
}
