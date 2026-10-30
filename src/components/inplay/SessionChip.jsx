/**
 * SessionChip.jsx — in-play session timer with a built-in reality check.
 *
 * The chip shows how long the in-play session has run and how much has been
 * staked in it. Tapping it opens the reality check; it also opens on its own
 * every REALITY_CHECK_MIN minutes, with options to keep going or take a break.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useLive } from '../../live/LiveContext.jsx';
import { useUser } from '../../context/UserContext.jsx';

const REALITY_CHECK_MIN = 20;

function RealityCheck({ minutes, staked, returned, onContinue, onBreak }) {
  const net = returned - staked;
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Reality check"
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'rgb(14,19,34)', border: '1px solid rgba(255,255,255,0.1)' }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      >
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#9AA6C0' }}>Reality check</p>
        <h2 className="text-2xl font-black font-display mb-5" style={{ color: '#F0F6FF' }}>
          You've been in-play for {minutes} min
        </h2>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[['Staked', `£${staked.toFixed(2)}`, '#F0F6FF'], ['Returned', `£${returned.toFixed(2)}`, '#F0F6FF'], ['Net', `${net < 0 ? '−' : '+'}£${Math.abs(net).toFixed(2)}`, net < 0 ? '#FF6B9A' : '#00F5A0']].map(([k, v, c]) => (
            <div key={k} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#9AA6C0' }}>{k}</p>
              <p className="font-mono text-base font-black" style={{ color: c }}>{v}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="w-full h-12 rounded-2xl text-sm font-black mb-2"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#F0F6FF' }}
        >
          Keep watching
        </button>
        <button
          type="button"
          onClick={onBreak}
          className="w-full h-12 rounded-2xl text-sm font-bold"
          style={{ color: '#9AA6C0' }}
        >
          Take a break
        </button>
        <p className="text-[11px] text-center mt-3" style={{ color: '#6B7894' }}>18+ · BeGambleAware.org · GamStop.co.uk</p>
      </motion.div>
    </motion.div>
  );
}

export default function SessionChip({ onBreak }) {
  const { sessionStart } = useLive();
  const { bets } = useUser();
  const [now, setNow] = useState(() => Date.now());
  const [manualOpen, setManualOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(0); // minutes mark of the last check dismissed

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const minutes = sessionStart ? Math.max(0, Math.floor((now - sessionStart) / 60000)) : 0;

  // Automatic check every REALITY_CHECK_MIN minutes until dismissed
  const mark = Math.floor(minutes / REALITY_CHECK_MIN) * REALITY_CHECK_MIN;
  const open = manualOpen || (mark > 0 && mark > acknowledged);
  function close() {
    setManualOpen(false);
    setAcknowledged(mark);
  }

  const sessionBets = sessionStart ? bets.filter(b => new Date(b.placedAt).getTime() >= sessionStart) : [];
  const staked = sessionBets.reduce((s, b) => s + b.stake, 0);
  const returned = sessionBets.reduce((s, b) => s + (b.status === 'won' ? b.potentialReturn : b.status === 'cashed out' ? b.cashOutAmount : 0), 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setManualOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
        style={{ background: 'rgba(255,255,255,0.06)', color: '#C9D3E8' }}
        aria-label={`In-play session: ${minutes} minutes, £${staked.toFixed(2)} staked. Open reality check`}
      >
        <Clock className="w-3 h-3" />
        {minutes}m · £{staked.toFixed(0)} staked
      </button>
      <AnimatePresence>
        {open && (
          <RealityCheck
            minutes={Math.max(1, minutes)}
            staked={staked}
            returned={returned}
            onContinue={close}
            onBreak={() => { close(); onBreak?.(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
