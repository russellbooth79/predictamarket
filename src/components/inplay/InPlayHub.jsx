/**
 * InPlayHub.jsx — the Live tab.
 *
 * Every simulated football match as a live card: ticking clock, score that
 * pops on goals, momentum, the latest event, live match-result prices and
 * the current "next 5 minutes" market. Other sports that are live in the
 * data follow underneath. The header carries the in-play session timer.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Timer, Bell, BellRing } from 'lucide-react';
import { useLive } from '../../live/LiveContext.jsx';
import { getLiveBettors } from '../../utils/fixtureMeta.js';
import { getFriendPicks } from '../../data/friends.js';
import FriendAvatars from '../FriendAvatars.jsx';
import LivePrice from './LivePrice.jsx';
import SessionChip from './SessionChip.jsx';
import { LiveClock, Score, MomentumBar } from './inplayShared.jsx';
import { EVENT_ICONS, momentumLabel, isSuspended, secondsUntil, livePrice } from '../../live/inplayHelpers.js';

const RESULT_LABELS = (fx) => ({ home: fx.homeTeam.split(' ')[0], draw: 'Draw', away: fx.awayTeam.split(' ')[0] });

function MicroChip({ match, onBet }) {
  const micro = match.micro;
  if (!micro || micro.status === 'void' || match.status === 'ft') return null;

  let state;
  if (micro.status === 'open') state = `Closes in ${secondsUntil(match, micro.from)}s`;
  else if (micro.status === 'running') state = `Live · ${micro.from}'–${micro.to}'`;
  else state = micro.result === 'yes' ? 'Settled: Yes ✓' : 'Settled: No';

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(198,255,61,0.06)', border: '1px solid rgba(198,255,61,0.2)' }}
    >
      <span className="text-sm">⏱</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate" style={{ color: '#F0F6FF' }}>{micro.question}</p>
        <p className="text-[10px]" style={{ color: micro.status === 'open' ? 'var(--action)' : '#9AA6C0' }}>{state}</p>
      </div>
      {micro.status === 'open' && (
        <div className="flex gap-1.5 w-[124px] shrink-0">
          <LivePrice label="Yes" probability={micro.probYes} onClick={() => onBet('micro', 'yes', `Yes — ${micro.question}`, micro.id)} />
          <LivePrice label="No" probability={100 - micro.probYes} onClick={() => onBet('micro', 'no', `No — ${micro.question}`, micro.id)} />
        </div>
      )}
    </div>
  );
}

function InPlayCard({ match, onOpenMatch, index }) {
  const { openQuickBet, followed, toggleFollow } = useLive();
  const following = followed.has(match.id);
  const fx = match.fixture;
  const labels = RESULT_LABELS(fx);
  const suspended = isSuspended(match);
  const friends = getFriendPicks(fx).map(p => p.friend);

  function bet(market, outcomeId, label, microId = null) {
    openQuickBet({ fixtureId: match.id, market, outcomeId, label, microId });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: match.status === 'ft' ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgb(12,17,30)', border: '1px solid rgba(255,51,102,0.18)' }}
    >
      <button type="button" onClick={() => onOpenMatch(match.id)} className="w-full text-left px-4 pt-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <LiveClock match={match} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6B7894' }}>{fx.competitionShort}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {friends.length > 0 && <FriendAvatars friends={friends} size={16} />}
            <span className="text-[11px]" style={{ color: '#9AA6C0' }}>{getLiveBettors(fx.id)} watching</span>
          </div>
        </div>

        {[['homeTeam', 'home'], ['awayTeam', 'away']].map(([teamKey, side]) => (
          <div key={side} className="flex items-center justify-between py-0.5">
            <span className="text-base font-bold font-display truncate" style={{ color: '#F0F6FF' }}>{fx[teamKey]}</span>
            <Score value={match.score[side]} />
          </div>
        ))}

        <div className="mt-3 mb-1 flex items-center justify-between text-[11px]">
          <span style={{ color: '#C9D3E8' }}>{momentumLabel(match)}</span>
          <span className="flex items-center gap-0.5 font-semibold" style={{ color: '#9B8FFF' }}>Live view <ChevronRight className="w-3 h-3" /></span>
        </div>
        <MomentumBar momentum={match.momentum} />

        <div className="h-6 mt-2 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {match.lastEvent && (
              <motion.p
                key={match.lastEvent.at}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-xs truncate"
                style={{ color: match.lastEvent.type === 'goal' ? 'var(--action)' : '#9AA6C0' }}
              >
                {EVENT_ICONS[match.lastEvent.type]} {match.lastEvent.minute}' · {match.lastEvent.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </button>

      <div className="px-4 pb-3.5 space-y-2.5">
        <button
          type="button"
          onClick={() => toggleFollow(match.id)}
          aria-pressed={following}
          className="flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: following ? 'var(--action)' : '#9AA6C0' }}
        >
          {following ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          {following ? 'Goal alerts on' : 'Goal alerts'}
        </button>
        <div className="grid grid-cols-3 gap-2">
          {['home', 'draw', 'away'].map(id => (
            <LivePrice
              key={id}
              label={labels[id]}
              probability={livePrice(match, 'result', id)}
              suspended={suspended}
              onClick={() => bet('result', id, id === 'draw' ? 'Draw' : `${id === 'home' ? fx.homeTeam : fx.awayTeam} to win`)}
            />
          ))}
        </div>
        <MicroChip match={match} onBet={bet} />
      </div>
    </motion.div>
  );
}

export default function InPlayHub({ onOpenMatch, otherLive, onTakeBreak }) {
  const { matches, startSession } = useLive();
  // Entering In-Play starts the session timer used by the reality check
  useEffect(() => { startSession(); }, [startSession]);

  const list = Object.values(matches).sort((a, b) => (a.status === 'ft') - (b.status === 'ft') || b.minute - a.minute);
  const liveCount = list.filter(m => m.status === 'live').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black font-display flex items-center gap-2" style={{ color: '#F0F6FF' }}>
          In-Play
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,51,102,0.12)', color: '#FF3366' }}>
            {liveCount} live
          </span>
        </h1>
        <SessionChip onBreak={onTakeBreak} />
      </div>
      <p className="text-sm mb-5" style={{ color: '#9AA6C0' }}>Prices move with the game. Tap one for a quick bet.</p>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {list.map((m, i) => <InPlayCard key={m.id} match={m} index={i} onOpenMatch={onOpenMatch} />)}
        </AnimatePresence>
      </div>

      {otherLive}

      <p className="text-[11px] text-center mt-8 flex items-center justify-center gap-1" style={{ color: '#6B7894' }}>
        <Timer className="w-3 h-3" /> In-play bets are accepted after a short delay. 18+ · BeGambleAware.org
      </p>
    </div>
  );
}
