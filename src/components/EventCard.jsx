/**
 * EventCard.jsx
 *
 * Redesigned football match card with three-way outcome selection.
 * Premium dark styling, form guide dots, social proof,
 * and competition logo placeholder.
 *
 * Each outcome button displays:
 * - Label (small, uppercase)
 * - Probability as the hero number (big, font-mono)
 * - Thin probability bar (3px)
 * - Selected state with indigo border and glow
 *
 * Form guide: last 5 results as coloured dots (W=green, D=gold, L=red)
 * derived deterministically from team name hash.
 *
 * PredictaMarket v3 ARIA palette — electric indigo primary.
 */

import { Heart, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';
import { getProbabilityTextColour } from '../data/oddsUtils.js';
import ProbabilityBar from './ProbabilityBar.jsx';

// -- ARIA palette constants -------------------------------------------------

const C = {
  card: '#0F1520',
  elevated: '#161E2E',
  border: '#1A2238',
  borderHover: '#252F45',
  primary: '#5B6EF5',
  primaryGlow: 'rgba(91,110,245,0.15)',
  liveRed: '#FF6B6B',
  green: '#A8FF3E',
  text: '#f0f4ff',
  textSecondary: '#8A97B4',
  textMuted: '#4a5568',
};

// -- Deterministic form guide -----------------------------------------------

/**
 * Generate a form string (e.g. "WWDLW") from a team name hash.
 * Same team name always produces the same form for visual consistency.
 */
function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

function generateForm(teamName) {
  const weighted = ['W', 'W', 'W', 'D', 'D', 'L'];
  const hash = simpleHash(teamName);
  return Array.from({ length: 5 }, (_, i) => {
    const idx = (hash * (i + 1) * 7 + i * 13) % weighted.length;
    return weighted[idx];
  });
}

function FormDot({ result }) {
  // Draw dots use functional colours, not brand primary
  const colors = { W: C.green, D: '#FFD700', L: C.liveRed };
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ backgroundColor: colors[result] || C.textMuted }}
    />
  );
}

// -- Competition logo placeholder -------------------------------------------

function CompetitionBadge({ competitionShort }) {
  const hash = simpleHash(competitionShort);
  const hue = hash % 360;
  const bg = `hsl(${hue}, 50%, 30%)`;

  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
      style={{ backgroundColor: bg, color: '#fff' }}
    >
      {competitionShort.slice(0, 2)}
    </div>
  );
}

// -- Social proof: mock bet count from fixture ID hash ----------------------

function getBetCount(fixtureId) {
  const hash = simpleHash(fixtureId);
  return 1200 + (hash % 7300);
}

// -- Format helpers ---------------------------------------------------------

function formatKickoff(kickoff, isLive, liveMinute) {
  if (isLive) return `${liveMinute}'`;
  const date = new Date(kickoff);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(kickoff) {
  const date = new Date(kickoff);
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

export default function EventCard({ fixture, index = 0, onViewMatch }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();

  const homeForm = generateForm(fixture.homeTeam);
  const awayForm = generateForm(fixture.awayTeam);
  const betCount = getBetCount(fixture.id);

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
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.borderHover;
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header: competition badge, name, time, live badge, favourite */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: `1px solid rgba(26,34,56,0.5)` }}
      >
        <div className="flex items-center gap-2">
          <CompetitionBadge competitionShort={fixture.competitionShort} />
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: C.textMuted }}
          >
            {fixture.competitionShort}
          </span>
          <span style={{ color: C.textMuted }}>|</span>
          <span className="text-xs" style={{ color: C.textSecondary }}>
            {formatDateLabel(fixture.kickoff)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {fixture.isLive ? (
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(255,107,107,0.1)',
                border: '1px solid rgba(255,107,107,0.2)',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: C.liveRed }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: C.liveRed }}
                />
              </span>
              <span className="text-xs font-semibold" style={{ color: C.liveRed }}>
                {formatKickoff(fixture.kickoff, true, fixture.liveMinute)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1" style={{ color: C.textSecondary }}>
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{formatKickoff(fixture.kickoff, false, null)}</span>
            </div>
          )}

          <button className="p-1 transition-colors" style={{ color: C.textMuted }}>
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Teams row with form guide */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Home team */}
          <div className="flex-1">
            <span className="text-xl font-bold block" style={{ color: C.text }}>
              {fixture.homeTeam}
            </span>
            <div className="flex items-center gap-1 mt-1">
              {homeForm.map((r, i) => (
                <FormDot key={i} result={r} />
              ))}
            </div>
          </div>

          {/* Score or VS */}
          {fixture.isLive && fixture.liveScore ? (
            <div className="flex items-center gap-2 mx-4">
              <span className="font-mono text-2xl font-bold" style={{ color: C.primary }}>
                {fixture.liveScore.home}
              </span>
              <span style={{ color: C.textMuted }}>-</span>
              <span className="font-mono text-2xl font-bold" style={{ color: C.primary }}>
                {fixture.liveScore.away}
              </span>
            </div>
          ) : (
            <span className="text-sm mx-4" style={{ color: C.textMuted }}>vs</span>
          )}

          {/* Away team */}
          <div className="flex-1 text-right">
            <span className="text-xl font-bold block" style={{ color: C.text }}>
              {fixture.awayTeam}
            </span>
            <div className="flex items-center gap-1 mt-1 justify-end">
              {awayForm.map((r, i) => (
                <FormDot key={i} result={r} />
              ))}
            </div>
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
              className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 cursor-pointer"
              style={
                selected
                  ? {
                      border: `1px solid ${C.primary}`,
                      backgroundColor: 'rgba(91,110,245,0.08)',
                    }
                  : {
                      border: `1px solid ${C.border}`,
                      backgroundColor: C.elevated,
                    }
              }
              onMouseEnter={(e) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = 'rgba(91,110,245,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = selected ? C.primary : C.border;
                }
              }}
            >
              {/* Outcome label */}
              <span
                className="text-xs uppercase tracking-wider truncate w-full text-center"
                style={{ color: C.textSecondary }}
              >
                {outcome.label}
              </span>

              {/* HERO probability */}
              <span className={`font-mono text-2xl font-bold ${textColour}`}>
                {formatOdds(outcome.probability, format)}
              </span>

              {/* Thin probability bar */}
              <div className="w-full">
                <ProbabilityBar probability={outcome.probability} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderTop: `1px solid rgba(26,34,56,0.5)` }}
      >
        <div className="flex items-center gap-3">
          {/* Bet count social proof */}
          <span className="text-xs" style={{ color: C.textMuted }}>
            {betCount.toLocaleString()} bets
          </span>

          {/* View Match link */}
          {onViewMatch && (
            <button
              onClick={() => onViewMatch(fixture)}
              className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: C.primary }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#7082F8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.primary; }}
            >
              View Match
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
