/**
 * TennisCard.jsx
 *
 * Card for a tennis match with two-way outcome selection.
 * Shows tournament info, surface pill, head-to-head record,
 * and two outcome buttons with probabilities.
 *
 * Live matches display the current set scores with a live badge.
 */

import { Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { getProbabilityTextColour } from '../data/oddsUtils.js';
import ProbabilityBar from './ProbabilityBar.jsx';

/** Surface type to Tailwind pill colour mapping */
const SURFACE_COLOURS = {
  'Hard (Indoor)': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Hard (Outdoor)': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Clay': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Grass': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function formatMatchTime(matchTime) {
  const date = new Date(matchTime);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(matchTime) {
  const date = new Date(matchTime);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

export default function TennisCard({ fixture, index = 0 }) {
  const { addSelection, isSelected } = useBetSlip();

  function handleOutcomeClick(outcome, playerName) {
    addSelection({
      eventId: fixture.id,
      eventName: `${fixture.player1.name} vs ${fixture.player2.name}`,
      outcomeId: outcome.id,
      outcomeName: playerName,
      probability: outcome.probability,
      decimalOdds: outcome.decimalOdds,
      source: fixture.source,
      sport: 'tennis',
    });
  }

  const surfaceColour = SURFACE_COLOURS[fixture.surface] || SURFACE_COLOURS['Hard (Indoor)'];
  const p1Outcome = fixture.outcomes[0];
  const p2Outcome = fixture.outcomes[1];

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial={index < 3 ? 'hidden' : 'visible'}
      animate="visible"
      className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">
              {fixture.competition}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${surfaceColour}`}>
              {fixture.surface}
            </span>
          </div>

          {fixture.isLive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-xs font-semibold text-red-400">LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">
                {formatDateLabel(fixture.matchTime)} {formatMatchTime(fixture.matchTime)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="w-3 h-3" />
          <span>{fixture.venue}</span>
          <span className="text-slate-700">|</span>
          <span>{fixture.round}</span>
        </div>
      </div>

      {/* Live score display */}
      {fixture.isLive && fixture.liveScore && (
        <div className="px-4 py-2 border-b border-slate-800/50 bg-slate-800/30">
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm font-medium text-slate-200 w-24 text-right truncate">
              {fixture.player1.name}
            </span>
            <div className="flex items-center gap-1.5">
              {fixture.liveScore.sets.map((set, i) => (
                <div key={i} className="flex items-center gap-0.5">
                  <span className={`font-mono text-sm font-bold ${
                    set.p1 > set.p2 ? 'text-white' : 'text-slate-500'
                  }`}>
                    {set.p1}
                  </span>
                  <span className="text-slate-600 text-xs">-</span>
                  <span className={`font-mono text-sm font-bold ${
                    set.p2 > set.p1 ? 'text-white' : 'text-slate-500'
                  }`}>
                    {set.p2}
                  </span>
                  {i < fixture.liveScore.sets.length - 1 && (
                    <span className="text-slate-700 mx-1">|</span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-sm font-medium text-slate-200 w-24 truncate">
              {fixture.player2.name}
            </span>
          </div>
        </div>
      )}

      {/* Head-to-head */}
      {fixture.headToHead && (
        <div className="px-4 py-2 border-b border-slate-800/50">
          <div className="flex items-center justify-center gap-3 text-xs">
            <span className="text-slate-400">
              <span className="text-slate-500 uppercase tracking-wide">H2H:</span>{' '}
              <span className="font-mono text-slate-300">{fixture.headToHead.player1Wins}</span>
              <span className="text-slate-600"> - </span>
              <span className="font-mono text-slate-300">{fixture.headToHead.player2Wins}</span>
            </span>
          </div>
        </div>
      )}

      {/* Outcome buttons -- two-way for tennis */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {[
          { outcome: p1Outcome, player: fixture.player1 },
          { outcome: p2Outcome, player: fixture.player2 },
        ].map(({ outcome, player }) => {
          const selected = isSelected(fixture.id, outcome.id);
          const textColour = getProbabilityTextColour(outcome.probability);

          return (
            <button
              key={outcome.id}
              onClick={() => handleOutcomeClick(outcome, player.name)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                selected
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {/* Country code */}
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                {player.nationality}
              </span>

              {/* Player name */}
              <span className="text-sm font-medium text-slate-200 text-center">
                {player.name}
              </span>

              {/* Ranking */}
              <span className="text-[10px] text-slate-500">
                WR #{player.ranking}
              </span>

              {/* Probability -- Math.round ensures integer display */}
              <span className={`font-mono text-2xl font-bold ${textColour}`}>
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
            </button>
          );
        })}
      </div>

      {/* Source footer */}
      <div className="px-4 py-2 border-t border-slate-800/50 text-center">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider">
          Prices from {fixture.source}
        </span>
      </div>
    </motion.div>
  );
}
