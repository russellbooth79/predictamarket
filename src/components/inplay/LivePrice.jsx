/**
 * LivePrice.jsx — an in-play price button.
 *
 * Shows the live price in the user's odds format and flashes green/red with
 * an arrow whenever the displayed figure moves. Tapping opens Quick Bet.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useOddsFormat } from '../../context/OddsFormatContext.jsx';
import { formatOdds } from '../../utils/oddsFormatter.js';

const FLASH_MS = 1400;

export default function LivePrice({ label, probability, onClick, suspended = false, size = 'md' }) {
  const { format } = useOddsFormat();
  const shown = formatOdds(Math.max(0.5, probability ?? 0), format);
  const prevRef = useRef({ shown, probability });
  const [flash, setFlash] = useState(null); // 'up' | 'down' | null

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.shown !== shown) {
      // The number itself went up or down (percent and payout move opposite ways)
      const numberUp = format === 'probability' ? probability > prev.probability : probability < prev.probability;
      setFlash(numberUp ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), FLASH_MS);
      prevRef.current = { shown, probability };
      return () => clearTimeout(t);
    }
    prevRef.current = { shown, probability };
  }, [shown, probability, format]);

  const flashColour = flash === 'up' ? '#00F5A0' : flash === 'down' ? '#FF3366' : null;
  const big = size === 'lg';

  return (
    <motion.button
      type="button"
      whileTap={suspended ? undefined : { scale: 0.95 }}
      onClick={suspended ? undefined : onClick}
      disabled={suspended}
      aria-label={`${label} ${suspended ? 'suspended' : shown}`}
      className={`relative w-full flex flex-col items-center justify-center rounded-xl transition-colors duration-300 ${big ? 'py-3 gap-1' : 'py-2 gap-0.5'}`}
      style={{
        background: flashColour ? `${flashColour}1A` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${flashColour ? `${flashColour}80` : 'rgba(255,255,255,0.08)'}`,
        opacity: suspended ? 0.45 : 1,
      }}
    >
      <span className={`uppercase tracking-wide font-semibold truncate max-w-full px-1 ${big ? 'text-[10px]' : 'text-[9px]'}`} style={{ color: '#9AA6C0' }}>
        {label}
      </span>
      <span className={`font-mono font-black flex items-center gap-0.5 ${big ? 'text-xl' : 'text-sm'}`} style={{ color: flashColour ?? '#F0F6FF' }}>
        {suspended ? '🔒' : shown}
        {flash && !suspended && <span className="text-[10px]">{flash === 'up' ? '▲' : '▼'}</span>}
      </span>
    </motion.button>
  );
}
