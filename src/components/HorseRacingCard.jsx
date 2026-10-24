/**
 * HorseRacingCard.jsx
 *
 * Card for a horse race with a table-style runner list.
 * Each runner row shows saddle number, horse name, jockey, trainer,
 * recent form, probability bar, percentage, and SP (fractional) odds.
 *
 * Clicking a runner row adds it to the bet slip. The selected runner
 * gets a highlighted row background.
 */

import { Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { getProbabilityTextColour } from '../data/oddsUtils.js';
import ProbabilityBar from './ProbabilityBar.jsx';

function formatRaceTime(raceTime) {
  const date = new Date(raceTime);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(raceTime) {
  const date = new Date(raceTime);
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

export default function HorseRacingCard({ fixture, index = 0 }) {
  const { addSelection, isSelected } = useBetSlip();

  function handleRunnerClick(runner) {
    addSelection({
      eventId: fixture.id,
      eventName: `${fixture.competition} — ${fixture.raceName}`,
      outcomeId: runner.id,
      outcomeName: runner.name,
      probability: runner.probability,
      decimalOdds: runner.decimalOdds,
      source: fixture.source,
      sport: 'horseracing',
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
      {/* Header: venue, race name, time, metadata */}
      <div className="px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-100">
              {fixture.competition}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">
              {formatDateLabel(fixture.raceTime)} {formatRaceTime(fixture.raceTime)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">{fixture.raceName}</span>
          <span className="text-slate-700">|</span>
          <span className="text-xs text-slate-500">{fixture.distance}</span>
          <span className="text-slate-700">|</span>
          <span className="text-xs text-slate-500">{fixture.going}</span>
          <span className="text-slate-700">|</span>
          <span className="text-xs text-slate-500">{fixture.raceClass}</span>
        </div>
      </div>

      {/* Runner table header */}
      <div className="hidden sm:grid grid-cols-[2rem_1fr_6rem_6rem_4rem_8rem_3.5rem_3.5rem] gap-1 px-4 py-1.5 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800/30">
        <span>#</span>
        <span>Horse</span>
        <span>Jockey</span>
        <span>Trainer</span>
        <span>Form</span>
        <span>Prob</span>
        <span className="text-right">%</span>
        <span className="text-right">SP</span>
      </div>

      {/* Runner rows */}
      <div className="divide-y divide-slate-800/30">
        {fixture.runners.map((runner) => {
          const selected = isSelected(fixture.id, runner.id);
          const textColour = getProbabilityTextColour(runner.probability);

          return (
            <button
              key={runner.id}
              onClick={() => handleRunnerClick(runner)}
              className={`w-full text-left transition-colors cursor-pointer ${
                selected
                  ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500'
                  : 'hover:bg-slate-800/50 border-l-2 border-l-transparent'
              }`}
            >
              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-[2rem_1fr_6rem_6rem_4rem_8rem_3.5rem_3.5rem] gap-1 items-center px-4 py-2.5">
                <span className="font-mono text-xs text-slate-500">
                  {runner.saddleNumber}
                </span>
                <div>
                  <span className="text-sm font-medium text-slate-200">
                    {runner.name}
                  </span>
                </div>
                <span className="text-xs text-slate-400 truncate">{runner.jockey}</span>
                <span className="text-xs text-slate-500 truncate">{runner.trainer}</span>
                <span className="font-mono text-xs text-slate-400">{runner.form}</span>
                <div className="px-1">
                  <ProbabilityBar probability={runner.probability} />
                </div>
                <span className={`font-mono text-sm font-bold text-right ${textColour}`}>
                  {Math.round(runner.probability)}%
                </span>
                <span className="font-mono text-xs text-slate-400 text-right">
                  {runner.fractionalOdds}
                </span>
              </div>

              {/* Mobile layout -- stacked */}
              <div className="sm:hidden px-4 py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500 w-5">
                      {runner.saddleNumber}
                    </span>
                    <span className="text-sm font-medium text-slate-200">
                      {runner.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm font-bold ${textColour}`}>
                      {Math.round(runner.probability)}%
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {runner.fractionalOdds}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-1.5 ml-7">
                  <span className="text-xs text-slate-400">{runner.jockey}</span>
                  <span className="text-xs text-slate-500">{runner.form}</span>
                </div>
                <div className="ml-7">
                  <ProbabilityBar probability={runner.probability} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer with source */}
      <div className="px-4 py-2 border-t border-slate-800/50 flex items-center justify-between">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider">
          Prices from {fixture.source}
        </span>
        <span className="text-xs text-slate-500">
          {fixture.runners.length} runners
        </span>
      </div>
    </motion.div>
  );
}
