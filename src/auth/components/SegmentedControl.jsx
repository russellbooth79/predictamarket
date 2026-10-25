/**
 * SegmentedControl.jsx
 *
 * Three-option tab switcher with a sliding active indicator.
 * The indicator is a layoutId-animated motion.div — Framer Motion handles
 * the shared layout transition between options without manual coordinate math.
 */

import { motion } from 'framer-motion';

export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div
      className="flex rounded-xl p-1 relative"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {options.map(option => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="flex-1 relative z-10 py-2 text-sm font-semibold rounded-lg transition-colors duration-150"
            style={{
              color: isActive ? '#F0F6FF' : '#7B8CAA',
            }}
          >
            {/* Sliding background indicator — shared layout key */}
            {isActive && (
              <motion.div
                layoutId="segmented-indicator"
                className="absolute inset-0 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #B06FFF)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
