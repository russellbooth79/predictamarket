/**
 * TennisCard.jsx
 *
 * Card for a tennis match with two-way outcome selection.
 * Shows tournament info, surface pill, head-to-head record,
 * and two outcome buttons with probabilities.
 *
 * Live matches display the current set scores with a live badge.
 * Source labels removed -- PredictaMarket branding only.
 * bet365 colour scheme applied throughout.
 */

import { Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { getProbabilityTextColour } from '../data/oddsUtils.js';
import ProbabilityBar from './ProbabilityBar.jsx';

/** Surface type to colour styling */
const SURFACE_COLOURS = {
  'Hard (Indoor)': { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
  'Hard (Outdoor)': { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
  'Clay': { bg: 'rgba(249,115,22,0.1)', text: '#fb923c', border: 'rgba(249,115,22,0.2)' },
  'Grass': { bg: 'rgba(0,182,122,0.1)', text: '#00b67a', border: 'rgba(0,182,122,0.2)' },
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
      sport: 'tennis',
    });
  }

  const surfaceStyle = SURFACE_COLOURS[fixture.surface] || SURFACE_COLOURS['Hard (Indoor)'];
  const p1Outcome = fixture.outcomes[0];
  const p2Outcome = fixture.outcomes[1];

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
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(45,63,82,0.5)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {fixture.competition}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: surfaceStyle.bg,
                color: surfaceStyle.text,
                border: `1px solid ${surfaceStyle.border}`,
              }}
            >
              {fixture.surface}
            </span>
          </div>

          {fixture.isLive ? (
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(229,48,47,0.1)',
                border: '1px solid rgba(229,48,47,0.2)',
              }}
            >
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
              <span className="text-xs font-semibold" style={{ color: '#e5302f' }}>LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">
                {formatDateLabel(fixture.matchTime)} {formatMatchTime(fixture.matchTime)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          <span>{fixture.venue}</span>
          <span className="text-gray-600">|</span>
          <span>{fixture.round}</span>
        </div>
      </div>

      {/* Live score display */}
      {fixture.isLive && fixture.liveScore && (
        <div className="px-4 py-2" style={{ borderBottom: '1px solid rgba(45,63,82,0.5)', backgroundColor: 'rgba(36,48,64,0.3)' }}>
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm font-medium text-gray-200 w-24 text-right truncate">
              {fixture.player1.name}
            </span>
            <div className="flex items-center gap-1.5">
              {fixture.liveScore.sets.map((set, i) => (
                <div key={i} className="flex items-center gap-0.5">
                  <span className={`font-mono text-sm font-bold ${
                    set.p1 > set.p2 ? 'text-white' : 'text-gray-500'
                  }`}>
                    {set.p1}
                  </span>
                  <span className="text-gray-600 text-xs">-</span>
                  <span className={`font-mono text-sm font-bold ${
                    set.p2 > set.p1 ? 'text-white' : 'text-gray-500'
                  }`}>
                    {set.p2}
                  </span>
                  {i < fixture.liveScore.sets.length - 1 && (
                    <span className="text-gray-600 mx-1">|</span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-200 w-24 truncate">
              {fixture.player2.name}
            </span>
          </div>
        </div>
      )}

      {/* Head-to-head */}
      {fixture.headToHead && (
        <div className="px-4 py-2" style={{ borderBottom: '1px solid rgba(45,63,82,0.5)' }}>
          <div className="flex items-center justify-center gap-3 text-xs">
            <span className="text-gray-400">
              <span className="text-gray-500 uppercase tracking-wide">H2H:</span>{' '}
              <span className="font-mono text-gray-300">{fixture.headToHead.player1Wins}</span>
              <span className="text-gray-600"> - </span>
              <span className="font-mono text-gray-300">{fixture.headToHead.player2Wins}</span>
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
              className="relative flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 cursor-pointer"
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
              {/* Country code */}
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                {player.nationality}
              </span>

              {/* Player name */}
              <span className="text-sm font-medium text-gray-200 text-center">
                {player.name}
              </span>

              {/* Ranking */}
              <span className="text-[10px] text-gray-500">
                WR #{player.ranking}
              </span>

              {/* Probability */}
              <span className={`font-mono text-2xl font-bold ${textColour}`}>
                {Math.round(outcome.probability)}%
              </span>

              {/* Probability bar */}
              <div className="w-full">
                <ProbabilityBar probability={outcome.probability} />
              </div>

              {/* Decimal odds */}
              <span className="font-mono text-xs text-gray-500">
                {outcome.decimalOdds.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
