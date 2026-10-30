/**
 * CashOutButton.jsx — live cash-out for one bet.
 *
 * The offer updates with the game. First tap asks to confirm (and reverts
 * after a few seconds); the second tap cashes out at the offer then on screen.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLive } from '../../live/LiveContext.jsx';
import { useUser } from '../../context/UserContext.jsx';
import { cashOutValue } from '../../live/cashOut.js';

const CONFIRM_MS = 4000;

export default function CashOutButton({ bet }) {
  const { getMatch, fixtures, pushToast } = useLive();
  const { cashOut } = useUser();
  const [confirming, setConfirming] = useState(false);
  const value = cashOutValue(bet, getMatch, fixtures);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), CONFIRM_MS);
    return () => clearTimeout(t);
  }, [confirming]);

  if (value == null) {
    return bet.status === 'open'
      ? <span className="text-[11px]" style={{ color: '#6B7894' }}>Cash out unavailable for this market</span>
      : null;
  }

  const up = value > bet.stake;

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    cashOut(bet.id, Math.round(value * 100) / 100);
    pushToast({ kind: 'cashout', title: `💸 Cashed out £${value.toFixed(2)}`, body: `Added to your balance` });
    setConfirming(false);
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className="w-full h-10 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-colors"
      style={confirming
        ? { background: 'var(--action)', color: 'var(--action-ink)' }
        : { background: 'rgba(198,255,61,0.1)', color: 'var(--action)', border: '1px solid rgba(198,255,61,0.35)' }}
    >
      {confirming ? `Confirm cash out £${value.toFixed(2)}` : `Cash out £${value.toFixed(2)}`}
      {!confirming && (
        <span className="text-[10px] font-bold" style={{ color: up ? '#00F5A0' : '#FF8FAB' }}>
          {up ? '▲' : '▼'} {Math.abs(((value - bet.stake) / bet.stake) * 100).toFixed(0)}%
        </span>
      )}
    </motion.button>
  );
}
