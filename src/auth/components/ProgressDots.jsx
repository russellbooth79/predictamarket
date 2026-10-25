/**
 * ProgressDots.jsx
 *
 * Step progress indicator for the signup wizard.
 * The active dot animates to a pill shape (24px wide) using a Framer Motion
 * layout animation — the width transition uses spring physics to feel natural.
 */

import { motion } from 'framer-motion';

export default function ProgressDots({ total, current }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current;
        const isComplete = i < current;

        return (
          <motion.div
            key={i}
            layout
            animate={{
              width: isActive ? 24 : 8,
              opacity: isComplete ? 1 : isActive ? 1 : 0.3,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              height: '8px',
              borderRadius: '4px',
              background: isActive
                ? 'linear-gradient(90deg, #6C63FF, #B06FFF)'
                : isComplete
                  ? '#6C63FF'
                  : 'rgba(255,255,255,0.2)',
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}
