/**
 * QuickBetSheet.jsx — one-tap in-play betting.
 *
 * Opens from any live price. Pick a preset stake and place, with no slip.
 * Like real in-play:
 *   - the price is live; if it moves before you place, you're asked to
 *     accept the new one (unless "Accept price changes" is on)
 *   - bets wait a short delay before being accepted, and are rejected if a
 *     goal goes in during it
 *   - markets suspend briefly after goals
 *   - 5-minute markets have a lower maximum stake
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle } from 'lucide-react';
import { useLive } from '../../live/LiveContext.jsx';
import { useUser } from '../../context/UserContext.jsx';
import { useOddsFormat } from '../../context/OddsFormatContext.jsx';
import { formatOdds } from '../../utils/oddsFormatter.js';
import { isSuspended, livePrice } from '../../live/inplayHelpers.js';

const STAKES = [2, 5, 10, 20];
const MICRO_MAX_STAKE = 10;
const BET_DELAY_MS = 3000;
const DEMO_TOP_UP = 50;

export default function QuickBetSheet() {
  const { quickBet, closeQuickBet, getMatch } = useLive();
  const { user, placeBet, addFunds } = useUser();
  const { format } = useOddsFormat();

  const [stake, setStake] = useState(5);
  const [acceptChanges, setAcceptChanges] = useState(false);
  const [lockedProb, setLockedProb] = useState(null); // the price the user agreed to
  const [phase, setPhase] = useState('idle');          // idle | placing | done | rejected
  const [message, setMessage] = useState('');
  const delayRef = useRef(null);

  const match = quickBet ? getMatch(quickBet.fixtureId) : null;
  const prob = quickBet && match ? livePrice(match, quickBet.market, quickBet.outcomeId) : null;
  const isMicro = quickBet?.market === 'micro';
  const microClosed = isMicro && (match?.micro?.id !== quickBet?.microId || match?.micro?.status !== 'open');
  const suspended = !match || isSuspended(match) || microClosed;

  // Reset whenever a new price is opened
  useEffect(() => {
    if (!quickBet) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase('idle');
    setMessage('');
    setStake(s => (quickBet.market === 'micro' ? Math.min(s, MICRO_MAX_STAKE) : s));
    setLockedProb(match ? livePrice(match, quickBet.market, quickBet.outcomeId) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickBet]);

  useEffect(() => () => clearTimeout(delayRef.current), []);

  if (!quickBet) return null;

  const shownNow = prob != null ? formatOdds(Math.max(0.5, prob), format) : '–';
  const shownLocked = lockedProb != null ? formatOdds(Math.max(0.5, lockedProb), format) : '–';
  const priceMoved = phase === 'idle' && !acceptChanges && shownNow !== shownLocked;
  const usedProb = acceptChanges ? prob : lockedProb;
  const returns = usedProb ? (stake * 100) / usedProb : 0;
  const short = stake > user.balance;
  const fx = match?.fixture;

  function handlePlace() {
    if (suspended || short || !usedProb) return;
    setPhase('placing');
    const goalsBefore = match.score.home + match.score.away;
    delayRef.current = setTimeout(async () => {
      const m = getMatch(quickBet.fixtureId);
      const goalsNow = m ? m.score.home + m.score.away : goalsBefore;
      if (!m || goalsNow !== goalsBefore || isSuspended(m)) {
        setPhase('rejected');
        setMessage('A goal went in while your bet was pending, so it wasn’t accepted. Check the new price and try again.');
        setLockedProb(m ? livePrice(m, quickBet.market, quickBet.outcomeId) : null);
        return;
      }
      const finalProb = acceptChanges ? livePrice(m, quickBet.market, quickBet.outcomeId) : usedProb;
      try {
        await placeBet([{
          eventId: quickBet.fixtureId,
          eventName: `${fx.homeTeam} vs ${fx.awayTeam}`,
          outcomeId: quickBet.outcomeId,
          outcomeName: quickBet.label,
          probability: finalProb,
          decimalOdds: Math.round((100 / finalProb) * 100) / 100,
          market: quickBet.market,
          microId: quickBet.microId ?? null,
          goalsAtPlacement: goalsBefore,
        }], stake, { inPlay: true });
        setPhase('done');
        setTimeout(closeQuickBet, 1400);
      } catch {
        setPhase('rejected');
        setMessage('Not enough balance for this stake.');
      }
    }, BET_DELAY_MS);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="qb-backdrop"
        className="fixed inset-0 z-[85]"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={phase === 'placing' ? undefined : closeQuickBet}
      />
      <motion.div
        key="qb-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Quick bet"
        className="fixed left-0 right-0 bottom-0 z-[86] rounded-t-3xl px-5 pt-4 lg:left-1/2 lg:right-auto lg:w-[420px] lg:-translate-x-1/2"
        style={{
          background: 'rgb(14,19,34)',
          borderTop: '1px solid rgba(198,255,61,0.3)',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--action)' }}>⚡ Quick bet · In-play</p>
            <p className="text-lg font-black font-display leading-tight" style={{ color: '#F0F6FF' }}>{quickBet.label}</p>
            {fx && <p className="text-xs mt-0.5" style={{ color: '#9AA6C0' }}>{fx.homeTeam} {match.score.home}–{match.score.away} {fx.awayTeam} · {Math.floor(match.minute)}'</p>}
          </div>
          <button type="button" onClick={closeQuickBet} disabled={phase === 'placing'} aria-label="Close" className="p-1.5 rounded-lg" style={{ color: '#9AA6C0' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live price */}
        <div className="flex items-center justify-between rounded-2xl px-4 py-3 mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="text-sm" style={{ color: '#9AA6C0' }}>{suspended ? 'Market' : 'Live price'}</span>
          <span className="font-mono text-2xl font-black" style={{ color: suspended ? '#FFB547' : '#F0F6FF' }}>
            {suspended ? (microClosed ? 'Closed' : 'Suspended') : shownNow}
          </span>
        </div>

        <AnimatePresence>
          {priceMoved && !suspended && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 mb-3 overflow-hidden"
              style={{ background: 'rgba(255,181,71,0.1)', border: '1px solid rgba(255,181,71,0.3)' }}
            >
              <span className="text-xs" style={{ color: '#FFB547' }}>Price moved {shownLocked} → {shownNow}</span>
              <button type="button" onClick={() => setLockedProb(prob)} className="text-xs font-black px-2.5 py-1 rounded-lg" style={{ background: '#FFB547', color: '#1A1000' }}>
                Accept
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stakes */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {STAKES.map(s => {
            const disabled = isMicro && s > MICRO_MAX_STAKE;
            const active = stake === s;
            return (
              <button
                key={s}
                type="button"
                disabled={disabled || phase === 'placing'}
                onClick={() => setStake(s)}
                aria-pressed={active}
                className="h-11 rounded-xl text-sm font-black transition-colors"
                style={active
                  ? { background: 'rgba(198,255,61,0.12)', border: '1px solid var(--action)', color: 'var(--action)' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: disabled ? '#3F4A63' : '#F0F6FF' }}
              >
                £{s}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-3 text-sm">
          <label className="flex items-center gap-2 cursor-pointer" style={{ color: '#9AA6C0' }}>
            <input type="checkbox" checked={acceptChanges} onChange={e => setAcceptChanges(e.target.checked)} className="accent-[#C6FF3D] w-4 h-4" />
            Accept price changes
          </label>
          <span style={{ color: '#9AA6C0' }}>
            Returns <span className="font-mono font-black" style={{ color: 'var(--action)' }}>£{returns.toFixed(2)}</span>
          </span>
        </div>

        {isMicro && <p className="text-[11px] mb-3" style={{ color: '#6B7894' }}>5-minute markets: max stake £{MICRO_MAX_STAKE}.</p>}

        {phase === 'rejected' && (
          <div className="flex gap-2 rounded-xl px-3 py-2 mb-3 text-xs" style={{ background: 'rgba(255,51,102,0.1)', color: '#FF8FAB' }}>
            <AlertTriangle className="w-4 h-4 shrink-0" /> {message}
          </div>
        )}

        {/* Action */}
        {short && phase !== 'done' ? (
          <button
            type="button"
            onClick={() => addFunds(DEMO_TOP_UP)}
            className="w-full h-13 py-3.5 rounded-2xl text-sm font-black"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#F0F6FF' }}
          >
            Balance £{user.balance.toFixed(2)} · Add £{DEMO_TOP_UP} demo funds
          </button>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handlePlace}
            disabled={suspended || priceMoved || phase === 'placing' || phase === 'done'}
            className="relative w-full py-3.5 rounded-2xl text-sm font-black overflow-hidden"
            style={{
              background: suspended || priceMoved ? 'rgba(255,255,255,0.06)' : 'var(--action)',
              color: suspended || priceMoved ? '#6B7894' : 'var(--action-ink)',
            }}
          >
            {phase === 'placing' && (
              <motion.span
                className="absolute inset-y-0 left-0"
                style={{ background: 'rgba(0,0,0,0.15)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: BET_DELAY_MS / 1000, ease: 'linear' }}
              />
            )}
            <span className="relative flex items-center justify-center gap-2">
              {phase === 'placing' && 'Waiting for acceptance…'}
              {phase === 'done' && <><Check className="w-4 h-4" /> Bet accepted</>}
              {(phase === 'idle' || phase === 'rejected') && (suspended ? 'Market suspended' : `Place £${stake} · returns £${returns.toFixed(2)}`)}
            </span>
          </motion.button>
        )}
        <p className="text-[10px] text-center mt-2" style={{ color: '#6B7894' }}>
          In-play bets are accepted after a {BET_DELAY_MS / 1000}-second delay · 18+
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
