/**
 * MatchRow.jsx
 *
 * Compact, scannable match row for the home list: kickoff or live minute,
 * both teams (with score when live), the crowd's favourite pick, and three
 * tappable odds pills. Tapping a pill adds/removes that outcome on the bet
 * slip; tapping the teams opens the Match Centre.
 */

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';
import { crowdHeadline, formatKickoff, formatDateLabel } from '../utils/fixtureMeta.js';
import { getFriendPicks, friendPicksHeadline } from '../data/friends.js';
import FriendAvatars from './FriendAvatars.jsx';

const C = {
  border: 'rgba(255,255,255,0.07)',
  liveRed: '#FF3366',
  text: '#F0F6FF',
  textSecondary: '#7B8CAA',
  textMuted: '#6B7894',
};

const PILL_LABELS = { home: 'Home', draw: 'Draw', away: 'Away' };

export default function MatchRow({ fixture, onViewMatch, index = 0 }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();

  function handlePick(outcome) {
    addSelection({
      eventId: fixture.id,
      eventName: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
      outcomeId: outcome.id,
      outcomeName: outcome.label,
      probability: outcome.probability,
      decimalOdds: outcome.decimalOdds,
      sport: 'football',
    });
  }

  const score = fixture.isLive && fixture.liveScore;
  // Mates' picks beat the crowd stat when there are any
  const friendPicks = getFriendPicks(fixture);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-stretch gap-2 min-[360px]:gap-3 px-3 py-3 rounded-2xl"
      style={{ background: 'rgb(12,17,30)', border: `1px solid ${C.border}` }}
    >
      {/* Teams — opens Match Centre */}
      <button
        type="button"
        onClick={() => onViewMatch?.(fixture)}
        className="flex-1 min-w-0 text-left"
        aria-label={`${fixture.homeTeam} vs ${fixture.awayTeam} — open Match Centre`}
      >
        <div className="flex items-center gap-1.5 mb-1 min-w-0">
          {fixture.isLive ? (
            <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: C.liveRed }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.liveRed }} />
              LIVE {formatKickoff(fixture.kickoff, true, fixture.liveMinute)}
            </span>
          ) : (
            <span className="text-[11px] font-medium whitespace-nowrap truncate" style={{ color: C.textSecondary }}>
              {formatDateLabel(fixture.kickoff)} · {formatKickoff(fixture.kickoff, false, null)}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ color: C.textMuted }}>
            {fixture.competitionShort}
          </span>
        </div>
        {[['homeTeam', 'home'], ['awayTeam', 'away']].map(([teamKey, scoreKey]) => (
          <div key={teamKey} className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold truncate font-display" style={{ color: C.text }}>{fixture[teamKey]}</span>
            {score && (
              <span className="font-mono text-sm font-black" style={{ color: '#B0A5FF' }}>{fixture.liveScore[scoreKey]}</span>
            )}
          </div>
        ))}
        <div className="flex items-center gap-1 mt-1">
          {friendPicks.length > 0 && <FriendAvatars friends={friendPicks.map(p => p.friend)} size={15} />}
          <span className="text-[11px] truncate" style={{ color: friendPicks.length ? '#C9D3E8' : C.textSecondary }}>
            {friendPicks.length ? friendPicksHeadline(friendPicks) : crowdHeadline(fixture)}
          </span>
          <ChevronRight className="w-3 h-3 shrink-0" style={{ color: C.textMuted }} />
        </div>
      </button>

      {/* Odds pills */}
      <div className="flex items-center gap-1 min-[360px]:gap-1.5 shrink-0">
        {fixture.outcomes.map(outcome => {
          const selected = isSelected(fixture.id, outcome.id);
          return (
            <motion.button
              key={outcome.id}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => handlePick(outcome)}
              aria-pressed={selected}
              aria-label={`${outcome.label} ${formatOdds(outcome.probability, format)}`}
              className="w-[46px] min-[360px]:w-[54px] h-[54px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors duration-150"
              style={selected
                ? { background: 'rgba(198,255,61,0.10)', border: '1px solid var(--action)', boxShadow: '0 0 14px rgba(198,255,61,0.15)' }
                : { background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }
              }
            >
              <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: selected ? 'var(--action)' : C.textMuted }}>
                {PILL_LABELS[outcome.id] ?? outcome.label}
              </span>
              <span className="font-mono text-sm font-black" style={{ color: selected ? 'var(--action)' : C.text }}>
                {formatOdds(outcome.probability, format)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
