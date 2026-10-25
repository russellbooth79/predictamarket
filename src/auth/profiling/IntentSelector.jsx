/**
 * IntentSelector.jsx — Player Profiling Step 1
 *
 * User declares their primary intent: Sports / Casino / Both.
 * This drives which subsequent profiling steps are shown:
 *   Sports → SportsSelector
 *   Casino → StyleSignal
 *   Both   → SportsSelector → StyleSignal
 *
 * Unselected cards dim to opacity-50 when another is active — this makes
 * the single-select constraint visually clear without needing radio buttons.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import AuthButton from '../components/AuthButton.jsx';

const INTENT_OPTIONS = [
  {
    value: 'sports',
    label: 'Sports Betting',
    sub: 'Markets, accas, in-play',
    icon: '⚽',
    color: '#6C63FF',
    glow: 'rgba(108,99,255,0.2)',
  },
  {
    value: 'casino',
    label: 'Casino',
    sub: 'Slots, live tables, crash games',
    icon: '🎰',
    color: '#B06FFF',
    glow: 'rgba(176,111,255,0.2)',
  },
  {
    value: 'both',
    label: 'Both',
    sub: 'The full PUNT experience',
    icon: '⭐',
    color: '#00F5A0',
    glow: 'rgba(0,245,160,0.15)',
  },
];

export default function IntentSelector({ firstName, onNext, onSkip }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col h-full px-6 pt-8 pb-8">
      {/* Header with skip */}
      <div className="flex items-center justify-end mb-8">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm font-medium"
          style={{ color: '#7B8CAA' }}
        >
          Skip
        </button>
      </div>

      <h1 className="text-2xl font-black mb-2" style={{ color: '#F0F6FF' }}>
        Welcome to PUNT, {firstName}.
      </h1>
      <p className="text-sm mb-8" style={{ color: '#7B8CAA' }}>
        Tell us how you like to play and we'll tailor your experience.
      </p>

      {/* Intent cards */}
      <div className="flex flex-col gap-3 mb-auto">
        {INTENT_OPTIONS.map(option => {
          const isSelected = selected === option.value;
          const isDimmed = selected !== null && !isSelected;

          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              animate={{ opacity: isDimmed ? 0.5 : 1 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-4 rounded-2xl px-5 transition-all duration-150"
              style={{
                height: '80px',
                background: isSelected
                  ? `linear-gradient(135deg, ${option.glow}, rgba(15,20,35,0.9))`
                  : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isSelected ? option.color : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isSelected ? `0 4px 20px ${option.glow}` : 'none',
              }}
            >
              {/* Icon zone */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{
                  background: isSelected ? `${option.glow}` : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isSelected ? option.color : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {option.icon}
              </div>

              {/* Text */}
              <div className="flex-1 text-left">
                <p className="text-base font-black" style={{ color: '#F0F6FF' }}>{option.label}</p>
                <p className="text-xs" style={{ color: '#7B8CAA' }}>{option.sub}</p>
              </div>

              {/* Selection indicator */}
              <div
                className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all duration-150"
                style={{
                  background: isSelected ? option.color : 'transparent',
                  border: `2px solid ${isSelected ? option.color : 'rgba(255,255,255,0.2)'}`,
                }}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* CTA */}
      <AuthButton
        variant="primary-gradient"
        disabled={!selected}
        onClick={() => onNext(selected)}
        className="mt-8"
      >
        Let's go
      </AuthButton>
    </div>
  );
}
