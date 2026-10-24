/**
 * EventCard.jsx
 *
 * Football match card with three-way outcome selection (Home/Draw/Away).
 *
 * Each outcome button displays:
 * - Probability percentage (font-mono, coloured by threshold)
 * - ProbabilityBar (thin animated bar)
 * - Decimal odds (small secondary text)
 * - Source badge (bookmaker origin)
 *
 * Clicking an outcome toggles it in the bet slip. Selected state shows
 * an indigo border + tinted background. Only one outcome per event
 * can be selected -- the BetSlipContext enforces this constraint.
 */

import { Heart, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { getProbabilityTextColour } from '../data/oddsUtils.js';
import ProbabilityBar from './ProbabilityBar.jsx';

/**
 * Format kickoff time for display.
 * Live matches show the minute. Upcoming matches show time (HH:MM).
 */
function formatKickoff(kickoff, isLive, liveMinute) {
  if (isLive) return `${liveMinute}'`;
  const date = new Date(kickoff);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format kickoff date label (Today, Tomorrow, or the date).
 */
function formatDateLabel(kickoff) {
  const date = new Date(kickoff);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Stagger animation for the first few cards in the list
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

export default function EventCard({ fixture, index = 0 }) {
  const { addSelection, isSelected } = useBetSlip();

  function handleOutcomeClick(outcome) {
    addSelection({
      eventId: fixture.id,
      eventName: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
      outcomeId: outcome.id,
      outcomeName: outcome.label,
      probability: outcome.probability,
      decimalOdds: outcome.decimalOdds,
      source: fixture.source,
      sport: 'football',
    });
  }

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial={index < 3 ? 'hidden' : 'visible'}
      animate="visible"
      className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors"
    >
      {/* Header: competition, time, live badge */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {fixture.competitionShort}
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-xs text-slate-400">
            {formatDateLabel(fixture.kickoff)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {fixture.isLive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
              {/* Pulsing dot for live indicator */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-xs font-semibold text-red-400">
                {formatKickoff(fixture.kickoff, true, fixture.liveMinute)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{formatKickoff(fixture.kickoff, false, null)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Teams row */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="text-base font-semibold text-slate-100">
              {fixture.homeTeam}
            </span>
          </div>
          {fixture.isLive && fixture.liveScore ? (
            <div className="flex items-center gap-2 mx-4">
              <span className="font-mono text-lg font-bold text-white">
                {fixture.liveScore.home}
              </span>
              <span className="text-slate-600 text-sm">-</span>
              <span className="font-mono text-lg font-bold text-white">
                {fixture.liveScore.away}
              </span>
            </div>
          ) : (
            <span className="text-sm text-slate-600 mx-4">vs</span>
          )}
          <div className="flex-1 text-right">
            <span className="text-base font-semibold text-slate-100">
              {fixture.awayTeam}
            </span>
          </div>
        </div>
      </div>

      {/* Outcome buttons */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        {fixture.outcomes.map((outcome) => {
          const selected = isSelected(fixture.id, outcome.id);
          const textColour = getProbabilityTextColour(outcome.probability);

          return (
            <button
              key={outcome.id}
              onClick={() => handleOutcomeClick(outcome)}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                selected
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {/* Outcome label */}
              <span className="text-xs text-slate-400 truncate w-full text-center">
                {outcome.label}
              </span>

              {/* Probability -- Math.round ensures integer display */}
              <span className={`font-mono text-xl font-bold ${textColour}`}>
                {Math.round(outcome.probability)}%
              </span>

              {/* Probability bar */}
              <div className="w-full">
                <ProbabilityBar probability={outcome.probability} />
              </div>

              {/* Decimal odds */}
              <span className="font-mono text-xs text-slate-500">
                {outcome.decimalOdds.toFixed(2)}
              </span>

              {/* Source badge */}
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                {fixture.source}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800/50">
        <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          More markets
        </button>
        <button className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
          <Heart className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
