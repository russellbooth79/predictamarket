/**
 * InPlayMatch.jsx — the live view for one match.
 *
 *   - Score header with live clock and goal alerts toggle
 *   - Pitch tracker: ball position, pressure zone and big event banners
 *   - Momentum graph: who's been on top, minute by minute, with goals marked
 *   - Live stats
 *   - Markets: match result, next goal, next 5 minutes (all quick-bet)
 *   - Your bets on this match, with live cash out
 *   - Crowd reactions and the event timeline
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, BellRing } from 'lucide-react';
import { useLive } from '../../live/LiveContext.jsx';
import { useUser } from '../../context/UserContext.jsx';
import { simpleHash } from '../../utils/fixtureMeta.js';
import LivePrice from './LivePrice.jsx';
import CashOutButton from './CashOutButton.jsx';
import { LiveClock, Score } from './inplayShared.jsx';
import { EVENT_ICONS, momentumLabel, isSuspended, isRecentEvent, secondsUntil, livePrice } from '../../live/inplayHelpers.js';

const HOME = '#6C63FF';
const AWAY = '#FF6B35';

const BANNERS = { goal: 'GOAL!', corner: 'Corner', shot: 'Shot!', card: 'Yellow card' };

// ── Pitch tracker ────────────────────────────────────────────────────────────

function PitchTracker({ match }) {
  const fx = match.fixture;
  const recent = isRecentEvent(match, 2600) && BANNERS[match.lastEvent.type];
  const attackHome = match.momentum >= 0;
  const intensity = Math.min(0.55, Math.abs(match.momentum) * 0.6 + 0.1);

  return (
    <div className="relative rounded-2xl overflow-hidden lg:max-w-xl lg:mx-auto" style={{ background: '#0B1A14', border: '1px solid rgba(255,255,255,0.08)' }}>
      <svg viewBox="0 0 100 64" className="w-full block" role="img" aria-label={`Ball in the ${match.ball.x > 50 ? (match.ball.x > 75 ? `${fx.awayTeam} box area` : `${fx.awayTeam} half`) : (match.ball.x < 25 ? `${fx.homeTeam} box area` : `${fx.homeTeam} half`)}`}>
        <defs>
          <linearGradient id="pressure-home" x1="0" x2="1">
            <stop offset="0" stopColor={HOME} stopOpacity="0" />
            <stop offset="1" stopColor={HOME} stopOpacity="1" />
          </linearGradient>
          <linearGradient id="pressure-away" x1="1" x2="0">
            <stop offset="0" stopColor={AWAY} stopOpacity="0" />
            <stop offset="1" stopColor={AWAY} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Stripes */}
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={i * 10} y="0" width="10" height="64" fill={i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent'} />
        ))}
        {/* Pressure zone towards the end being attacked */}
        <motion.rect
          y="0" height="64" width="45"
          animate={{ x: attackHome ? 55 : 0, opacity: intensity }}
          transition={{ duration: 0.8 }}
          fill={`url(#pressure-${attackHome ? 'home' : 'away'})`}
        />
        {/* Lines */}
        <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.35">
          <rect x="1" y="1" width="98" height="62" />
          <line x1="50" y1="1" x2="50" y2="63" />
          <circle cx="50" cy="32" r="7" />
          <rect x="1" y="16" width="14" height="32" />
          <rect x="85" y="16" width="14" height="32" />
          <rect x="1" y="25" width="5" height="14" />
          <rect x="94" y="25" width="5" height="14" />
        </g>
        {/* Ball with trail */}
        <motion.circle r="2.6" fill="rgba(198,255,61,0.25)" animate={{ cx: match.ball.x, cy: (match.ball.y / 100) * 64 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
        <motion.circle r="1.3" fill="#C6FF3D" animate={{ cx: match.ball.x, cy: (match.ball.y / 100) * 64 }} transition={{ duration: 0.6, ease: 'easeOut' }} />
      </svg>

      <div className="absolute top-2 left-3 text-[10px] font-bold" style={{ color: HOME }}>{fx.homeTeam} →</div>
      <div className="absolute top-2 right-3 text-[10px] font-bold" style={{ color: AWAY }}>← {fx.awayTeam}</div>

      <AnimatePresence>
        {recent && (
          <motion.div
            key={match.lastEvent.at}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ type: 'spring', damping: 14, stiffness: 260 }}
          >
            <span
              className={`font-display font-black ${match.lastEvent.type === 'goal' ? 'text-5xl' : 'text-2xl'}`}
              style={{ color: match.lastEvent.type === 'goal' ? '#C6FF3D' : '#F0F6FF', textShadow: '0 4px 24px rgba(0,0,0,0.8)' }}
            >
              {BANNERS[match.lastEvent.type]}
            </span>
            <span className="text-xs font-bold mt-1" style={{ color: '#F0F6FF', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
              {match.lastEvent.side === 'home' ? fx.homeTeam : match.lastEvent.side === 'away' ? fx.awayTeam : ''}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Momentum graph ───────────────────────────────────────────────────────────

function MomentumGraph({ match }) {
  const history = match.momentumHistory;
  const goals = match.events.filter(e => e.type === 'goal');
  return (
    <div>
      <div className="relative h-20 flex items-center gap-px" aria-label="Momentum by minute">
        <span className="absolute left-0 right-0 top-1/2 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
        {Array.from({ length: 90 }, (_, i) => {
          const v = history[i];
          if (v == null) return <span key={i} className="flex-1" />;
          const h = Math.max(2, Math.abs(v) * 50);
          return (
            <span key={i} className="flex-1 relative h-full">
              <motion.span
                className="absolute left-0 right-0 rounded-sm"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                style={v >= 0 ? { bottom: '50%', background: HOME } : { top: '50%', background: AWAY }}
              />
            </span>
          );
        })}
        {goals.map((g, i) => (
          <span
            key={i}
            className="absolute text-[10px] -translate-x-1/2"
            style={{ left: `${(g.minute / 90) * 100}%`, [g.side === 'home' ? 'top' : 'bottom']: -2 }}
          >
            ⚽
          </span>
        ))}
      </div>
      <div className="flex justify-between text-[9px] mt-1" style={{ color: '#6B7894' }}>
        <span>0'</span><span>45'</span><span>90'</span>
      </div>
    </div>
  );
}

// ── Stats ────────────────────────────────────────────────────────────────────

function StatRow({ label, home, away, suffix = '' }) {
  const total = home + away || 1;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-mono font-bold" style={{ color: '#F0F6FF' }}>{home}{suffix}</span>
        <span style={{ color: '#9AA6C0' }}>{label}</span>
        <span className="font-mono font-bold" style={{ color: '#F0F6FF' }}>{away}{suffix}</span>
      </div>
      <div className="flex h-1 gap-0.5 rounded-full overflow-hidden">
        <motion.span animate={{ width: `${(home / total) * 100}%` }} style={{ background: HOME }} />
        <motion.span animate={{ width: `${(away / total) * 100}%` }} style={{ background: AWAY }} />
      </div>
    </div>
  );
}

// ── Reactions ────────────────────────────────────────────────────────────────

const REACTIONS = ['🔥', '😱', '⚽', '👏', '😤'];

function Reactions({ match }) {
  const [floating, setFloating] = useState([]);
  const idRef = useRef(0);
  const lastGoalRef = useRef(match.lastEvent?.type === 'goal' ? match.lastEvent.at : null);

  function spawn(emoji, mine = false) {
    const id = idRef.current++;
    setFloating(f => [...f.slice(-14), { id, emoji, x: 10 + Math.random() * 80, mine }]);
    setTimeout(() => setFloating(f => f.filter(r => r.id !== id)), 2200);
  }

  // Other fans react now and then, and all at once after a goal
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() < 0.35) spawn(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
    }, 1400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const e = match.lastEvent;
    if (e?.type === 'goal' && e.at !== lastGoalRef.current) {
      lastGoalRef.current = e.at;
      for (let i = 0; i < 8; i++) setTimeout(() => spawn(i % 2 ? '🔥' : '⚽'), i * 90);
    }
  }, [match.lastEvent]);

  const watching = 200 + (simpleHash(match.id) % 900);

  return (
    <div className="relative rounded-2xl px-4 py-3" style={{ background: 'rgb(12,17,30)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="absolute inset-x-0 bottom-full h-32 pointer-events-none overflow-hidden" aria-hidden="true">
        <AnimatePresence>
          {floating.map(r => (
            <motion.span
              key={r.id}
              className="absolute bottom-0 text-2xl"
              style={{ left: `${r.x}%` }}
              initial={{ y: 0, opacity: 0, scale: 0.6 }}
              animate={{ y: -110, opacity: [0, 1, 1, 0], scale: r.mine ? 1.3 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
            >
              {r.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: '#9AA6C0' }}>{watching.toLocaleString()} watching on PUNT</span>
        <div className="flex gap-1">
          {REACTIONS.map(e => (
            <motion.button key={e} type="button" whileTap={{ scale: 1.4 }} onClick={() => spawn(e, true)} className="text-xl w-9 h-9 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} aria-label={`React ${e}`}>
              {e}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Markets ──────────────────────────────────────────────────────────────────

function Section({ title, right, children }) {
  return (
    <section className="rounded-2xl p-4" style={{ background: 'rgb(12,17,30)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black" style={{ color: '#F0F6FF' }}>{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function MicroMarket({ match, bet }) {
  const micro = match.micro;
  if (!micro || micro.status === 'void' || match.status === 'ft') {
    return <p className="text-xs" style={{ color: '#9AA6C0' }}>No 5-minute market right now.</p>;
  }
  const progress = micro.status === 'running' ? (match.minute - micro.from) / (micro.to - micro.from) : micro.status === 'settled' ? 1 : 0;
  return (
    <div>
      <p className="text-base font-black mb-1" style={{ color: '#F0F6FF' }}>{micro.question}</p>
      <p className="text-xs mb-3" style={{ color: micro.status === 'open' ? 'var(--action)' : '#9AA6C0' }}>
        {micro.status === 'open' && `Covers ${micro.from}'–${micro.to}' · betting closes in ${secondsUntil(match, micro.from)}s`}
        {micro.status === 'running' && `In progress · ${micro.from}'–${micro.to}'`}
        {micro.status === 'settled' && `Settled: ${micro.result === 'yes' ? 'Yes ✓' : 'No'} · next market soon`}
      </p>
      {micro.status !== 'open' && (
        <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div className="h-full" animate={{ width: `${progress * 100}%` }} style={{ background: micro.happened ? 'var(--action)' : '#9AA6C0' }} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <LivePrice size="lg" label="Yes" probability={micro.probYes} suspended={micro.status !== 'open'} onClick={() => bet('micro', 'yes', `Yes — ${micro.question}`, micro.id)} />
        <LivePrice size="lg" label="No" probability={100 - micro.probYes} suspended={micro.status !== 'open'} onClick={() => bet('micro', 'no', `No — ${micro.question}`, micro.id)} />
      </div>
    </div>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function InPlayMatch({ fixtureId, onBack }) {
  const { getMatch, openQuickBet, followed, toggleFollow } = useLive();
  const { bets } = useUser();
  const match = getMatch(fixtureId);

  if (!match) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm mb-4" style={{ color: '#9AA6C0' }}>This match has finished.</p>
        <button type="button" onClick={onBack} className="text-sm font-bold" style={{ color: '#9B8FFF' }}>Back to In-Play</button>
      </div>
    );
  }

  const fx = match.fixture;
  const suspended = isSuspended(match);
  const following = followed.has(match.id);
  const goalNo = match.score.home + match.score.away + 1;
  const myBets = bets.filter(b => b.selections.some(s => s.eventId === match.id));
  const bet = (market, outcomeId, label, microId = null) => openQuickBet({ fixtureId: match.id, market, outcomeId, label, microId });

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#9B8FFF' }}>
          <ArrowLeft className="w-4 h-4" /> In-Play
        </button>
        <button
          type="button"
          onClick={() => toggleFollow(match.id)}
          aria-pressed={following}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)', color: following ? 'var(--action)' : '#9AA6C0' }}
        >
          {following ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          {following ? 'Alerts on' : 'Goal alerts'}
        </button>
      </div>

      <div className="text-center pt-1">
        <div className="flex items-center justify-center gap-2 mb-2">
          <LiveClock match={match} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6B7894' }}>{fx.competition}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex-1 text-right text-lg font-black font-display leading-tight" style={{ color: '#F0F6FF' }}>{fx.homeTeam}</span>
          <span className="flex items-center gap-2 shrink-0">
            <Score value={match.score.home} size="text-4xl" />
            <span className="text-2xl" style={{ color: '#6B7894' }}>–</span>
            <Score value={match.score.away} size="text-4xl" />
          </span>
          <span className="flex-1 text-left text-lg font-black font-display leading-tight" style={{ color: '#F0F6FF' }}>{fx.awayTeam}</span>
        </div>
        <p className="text-xs mt-2" style={{ color: '#C9D3E8' }}>{momentumLabel(match)}</p>
      </div>

      <PitchTracker match={match} />

      <Section title="Momentum" right={<span className="text-[10px]" style={{ color: '#6B7894' }}><span style={{ color: HOME }}>■</span> {fx.homeTeam.split(' ')[0]} · <span style={{ color: AWAY }}>■</span> {fx.awayTeam.split(' ')[0]}</span>}>
        <MomentumGraph match={match} />
      </Section>

      <Section title="Match result" right={suspended && <span className="text-[11px] font-bold" style={{ color: '#FFB547' }}>Suspended</span>}>
        <div className="grid grid-cols-3 gap-2">
          {[['home', fx.homeTeam], ['draw', 'Draw'], ['away', fx.awayTeam]].map(([id, label]) => (
            <LivePrice key={id} size="lg" label={label} probability={livePrice(match, 'result', id)} suspended={suspended}
              onClick={() => bet('result', id, id === 'draw' ? 'Draw' : `${label} to win`)} />
          ))}
        </div>
      </Section>

      <Section title={`Next goal (goal ${goalNo})`}>
        <div className="grid grid-cols-3 gap-2">
          {[['home', fx.homeTeam], ['none', 'No goal'], ['away', fx.awayTeam]].map(([id, label]) => (
            <LivePrice key={id} size="lg" label={label} probability={livePrice(match, 'nextGoal', id)} suspended={suspended}
              onClick={() => bet('nextGoal', id, id === 'none' ? `No goal ${goalNo}` : `${label} to score goal ${goalNo}`)} />
          ))}
        </div>
      </Section>

      <Section title="Next 5 minutes" right={<span className="text-[10px]" style={{ color: '#6B7894' }}>Max stake £10</span>}>
        <MicroMarket match={match} bet={bet} />
      </Section>

      {myBets.length > 0 && (
        <Section title="Your bets on this match">
          <div className="space-y-3">
            {myBets.map(b => (
              <div key={b.id}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold truncate" style={{ color: '#F0F6FF' }}>{b.selections.map(s => s.outcomeName).join(' + ')}</span>
                  <span className="font-mono shrink-0 ml-2" style={{ color: '#9AA6C0' }}>£{b.stake.toFixed(2)} → £{b.potentialReturn.toFixed(2)}</span>
                </div>
                {b.status === 'open'
                  ? <CashOutButton bet={b} />
                  : <p className="text-xs font-bold" style={{ color: b.status === 'won' ? 'var(--action)' : '#9AA6C0' }}>
                      {b.status === 'won' ? `Won £${b.potentialReturn.toFixed(2)}` : b.status === 'cashed out' ? `Cashed out £${b.cashOutAmount.toFixed(2)}` : 'Lost'}
                    </p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Stats">
        <div className="space-y-3">
          <StatRow label="Possession" home={Math.round(match.stats.possession)} away={100 - Math.round(match.stats.possession)} suffix="%" />
          <StatRow label="Shots" home={match.stats.shots.home} away={match.stats.shots.away} />
          <StatRow label="On target" home={match.stats.onTarget.home} away={match.stats.onTarget.away} />
          <StatRow label="Corners" home={match.stats.corners.home} away={match.stats.corners.away} />
          <StatRow label="Cards" home={match.stats.cards.home} away={match.stats.cards.away} />
        </div>
      </Section>

      <div className="pt-24">
        <Reactions match={match} />
      </div>

      <Section title="Timeline">
        <ol className="space-y-2">
          {match.events.slice(0, 15).map((e, i) => (
            <motion.li
              key={`${e.minute}-${e.type}-${e.at ?? i}`}
              initial={i === 0 ? { opacity: 0, x: -8 } : false}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 text-xs"
            >
              <span className="font-mono w-7 shrink-0" style={{ color: '#6B7894' }}>{e.minute}'</span>
              <span>{EVENT_ICONS[e.type]}</span>
              <span style={{ color: e.type === 'goal' ? 'var(--action)' : '#C9D3E8', fontWeight: e.type === 'goal' ? 800 : 400 }}>{e.text}</span>
            </motion.li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
