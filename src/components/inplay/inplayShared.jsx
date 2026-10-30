/**
 * inplayShared.jsx — small components shared by the In-Play hub and match screen.
 */

import { motion } from 'framer-motion';
import { clockLabel } from '../../live/liveEngine.js';

export function LiveClock({ match }) {
  const ft = match.status === 'ft';
  return (
    <span className="flex items-center gap-1.5 text-xs font-black" style={{ color: ft ? '#9AA6C0' : '#FF3366' }}>
      {!ft && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ background: '#FF3366', opacity: 0.7 }} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#FF3366' }} />
        </span>
      )}
      {clockLabel(match)}
    </span>
  );
}

/** Score digit that pops when it changes (the key re-mounts it on each goal) */
export function Score({ value, size = 'text-xl' }) {
  return (
    <motion.span
      key={value}
      initial={{ scale: 1.8, color: '#C6FF3D' }}
      animate={{ scale: 1, color: '#F0F6FF' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`font-mono font-black inline-block ${size}`}
    >
      {value}
    </motion.span>
  );
}

/**
 * Momentum bar: centre line, fills towards the team on top.
 * Home pushes left (home colour), away pushes right (away colour).
 */
export function MomentumBar({ momentum, homeColour = '#6C63FF', awayColour = '#FF6B35' }) {
  const pct = Math.min(100, Math.abs(momentum) * 100);
  const home = momentum > 0;
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <span className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.25)' }} />
      <motion.span
        className="absolute top-0 bottom-0 rounded-full"
        animate={{ width: `${pct / 2}%`, left: home ? `${50 - pct / 2}%` : '50%' }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        style={{ background: home ? homeColour : awayColour }}
      />
    </div>
  );
}
