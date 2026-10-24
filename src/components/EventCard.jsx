/**
 * EventCard.jsx
 *
 * Football match card with three-way outcome selection (Home/Draw/Away).
 *
 * Each outcome button displays:
 * - Probability percentage (font-mono, coloured by threshold)
 * - ProbabilityBar (thin animated bar)
 * - Decimal odds (small secondary text)
 *
 * Clicking an outcome toggles it in the bet slip. Selected state shows
 * a yellow border + tinted background (bet365 brand).
 *
 * "View Match" link at footer navigates to MatchDetailView for football.
 * When the fixture has a bookmakers array (live API data), a subtle
 * green "Live odds" indicator appears in the footer.
 */

import { Heart, Clock, ChevronRight } from 'lucide-react';
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

export default function EventCard({ fixture, index = 0, onViewMatch }) {
  const { addSelection, isSelected } = useBetSlip();

  // Live API data includes a bookmakers array; mock data does not
  const hasLiveOdds = Array.isArray(fixture.bookmakers) && fixture.bookmakers.length > 0;

  function handleOutcomeClick(outcome) {
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
      {/* Header: competition, time, live badge */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(45,63,82,0.5)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {fixture.competitionShort}
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-xs text-gray-400">
            {formatDateLabel(fixture.kickoff)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {fixture.isLive ? (
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(229,48,47,0.1)',
                border: '1px solid rgba(229,48,47,0.2)',
              }}
            >
              {/* Pulsing dot for live indicator */}
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: '#e5302f' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: '#e5302f' }}
                />
              </span>
              <span className="text-xs font-semibold" style={{ color: '#e5302f' }}>
                {formatKickoff(fixture.kickoff, true, fixture.liveMinute)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
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
            <span className="text-base font-semibold text-white">
              {fixture.homeTeam}
            </span>
          </div>
          {fixture.isLive && fixture.liveScore ? (
            <div className="flex items-center gap-2 mx-4">
              <span className="font-mono text-lg font-bold text-white">
                {fixture.liveScore.home}
              </span>
              <span className="text-gray-600 text-sm">-</span>
              <span className="font-mono text-lg font-bold text-white">
                {fixture.liveScore.away}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-600 mx-4">vs</span>
          )}
          <div className="flex-1 text-right">
            <span className="text-base font-semibold text-white">
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
              className="relative flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all duration-200 cursor-pointer"
              style={
                selected
                  ? {
                      border: '1px solid #ffb800',
                      backgroundColor: 'rgba(255,184,0,0.1)',
                    }
                  : {
                      border: '1px solid rgba(45,63,82,0.5)',
                      backgroundColor: 'rgba(36,48,64,0.5)',
                    }
              }
              onMouseEnter={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = '#243040';
                  e.currentTarget.style.borderColor = '#3d5068';
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = 'rgba(36,48,64,0.5)';
                  e.currentTarget.style.borderColor = 'rgba(45,63,82,0.5)';
                }
              }}
            >
              {/* Outcome label */}
              <span className="text-xs text-gray-400 truncate w-full text-center">
                {outcome.label}
              </span>

              {/* Probability */}
              <span className={`font-mono text-xl font-bold ${textColour}`}>
                {Math.round(outcome.probability)}%
              </span>

              {/* Probability bar */}
              <div className="w-full">
                <ProbabilityBar probability={outcome.probability} />
              </div>

              {/* Decimal odds */}
              {outcome.decimalOdds != null && (
                <span className="font-mono text-xs text-gray-500">
                  {outcome.decimalOdds.toFixed(2)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderTop: '1px solid rgba(45,63,82,0.5)' }}
      >
        <div className="flex items-center gap-3">
          {/* View Match -- navigates to MatchDetailView */}
          {onViewMatch ? (
            <button
              onClick={() => onViewMatch(fixture)}
              className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: '#ffb800' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffc933'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#ffb800'}
            >
              View Match
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              className="text-xs transition-colors"
              style={{ color: '#ffb800' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffc933'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#ffb800'}
            >
              More markets
            </button>
          )}

          {/* Live odds indicator — subtle signal that this card uses real API data */}
          {hasLiveOdds && (
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#00b67a' }}
              />
              <span className="text-[10px] text-gray-500">
                Live odds
              </span>
            </div>
          )}
        </div>

        <button className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
          <Heart className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
