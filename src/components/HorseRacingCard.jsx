/**
 * HorseRacingCard.jsx
 *
 * Card for a horse race with a table-style runner list.
 * Each runner row shows saddle number, horse name, jockey, trainer,
 * recent form, probability bar, percentage, and SP (fractional) odds.
 *
 * Clicking a runner row adds it to the bet slip. The selected runner
 * gets a highlighted row background.
 *
 * Source labels removed -- PredictaMarket branding only.
 * bet365 colour scheme applied throughout.
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
      sport: 'horseracing',
    });
  }

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial={index < 3 ? 'hidden' : 'visible'}
      animate="visible"
      className="rounded-xl overflow-hidden transition-colors"
      style={{
        backgroundColor: '#1a2332',
        border: '1px solid #2d3f52',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3d5068'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2d3f52'}
    >
      {/* Header: venue, race name, time, metadata */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(45,63,82,0.5)' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" style={{ color: '#ffb800' }} />
            <span className="text-sm font-semibold text-white">
              {fixture.competition}
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">
              {formatDateLabel(fixture.raceTime)} {formatRaceTime(fixture.raceTime)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">{fixture.raceName}</span>
          <span className="text-gray-600">|</span>
          <span className="text-xs text-gray-500">{fixture.distance}</span>
          <span className="text-gray-600">|</span>
          <span className="text-xs text-gray-500">{fixture.going}</span>
          <span className="text-gray-600">|</span>
          <span className="text-xs text-gray-500">{fixture.raceClass}</span>
        </div>
      </div>

      {/* Runner table header */}
      <div
        className="hidden sm:grid grid-cols-[2rem_1fr_6rem_6rem_4rem_8rem_3.5rem_3.5rem] gap-1 px-4 py-1.5 text-xs text-gray-500 uppercase tracking-wider"
        style={{ borderBottom: '1px solid rgba(45,63,82,0.3)' }}
      >
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
      <div className="divide-y" style={{ borderColor: 'rgba(45,63,82,0.3)' }}>
        {fixture.runners.map((runner) => {
          const selected = isSelected(fixture.id, runner.id);
          const textColour = getProbabilityTextColour(runner.probability);

          return (
            <button
              key={runner.id}
              onClick={() => handleRunnerClick(runner)}
              className="w-full text-left transition-colors cursor-pointer"
              style={
                selected
                  ? {
                      backgroundColor: 'rgba(255,184,0,0.1)',
                      borderLeft: '2px solid #ffb800',
                    }
                  : {
                      borderLeft: '2px solid transparent',
                    }
              }
              onMouseEnter={(e) => {
                if (!selected) e.currentTarget.style.backgroundColor = 'rgba(36,48,64,0.5)';
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-[2rem_1fr_6rem_6rem_4rem_8rem_3.5rem_3.5rem] gap-1 items-center px-4 py-2.5">
                <span className="font-mono text-xs text-gray-500">
                  {runner.saddleNumber}
                </span>
                <div>
                  <span className="text-sm font-medium text-gray-200">
                    {runner.name}
                  </span>
                </div>
                <span className="text-xs text-gray-400 truncate">{runner.jockey}</span>
                <span className="text-xs text-gray-500 truncate">{runner.trainer}</span>
                <span className="font-mono text-xs text-gray-400">{runner.form}</span>
                <div className="px-1">
                  <ProbabilityBar probability={runner.probability} />
                </div>
                <span className={`font-mono text-sm font-bold text-right ${textColour}`}>
                  {Math.round(runner.probability)}%
                </span>
                <span className="font-mono text-xs text-gray-400 text-right">
                  {runner.fractionalOdds}
                </span>
              </div>

              {/* Mobile layout -- stacked */}
              <div className="sm:hidden px-4 py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500 w-5">
                      {runner.saddleNumber}
                    </span>
                    <span className="text-sm font-medium text-gray-200">
                      {runner.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm font-bold ${textColour}`}>
                      {Math.round(runner.probability)}%
                    </span>
                    <span className="font-mono text-xs text-gray-400">
                      {runner.fractionalOdds}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-1.5 ml-7">
                  <span className="text-xs text-gray-400">{runner.jockey}</span>
                  <span className="text-xs text-gray-500">{runner.form}</span>
                </div>
                <div className="ml-7">
                  <ProbabilityBar probability={runner.probability} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer -- source removed */}
      <div
        className="px-4 py-2 flex items-center justify-end"
        style={{ borderTop: '1px solid rgba(45,63,82,0.5)' }}
      >
        <span className="text-xs text-gray-500">
          {fixture.runners.length} runners
        </span>
      </div>
    </motion.div>
  );
}
