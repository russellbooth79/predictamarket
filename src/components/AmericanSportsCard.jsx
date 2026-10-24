/**
 * AmericanSportsCard.jsx
 *
 * Card component for NFL and NBA fixtures. Two-way market (no draw),
 * with spread and over/under markets. Team colour accent badges.
 *
 * Handles sport identifiers: 'nfl', 'nba', 'americanfootball'.
 * Uses gameTime or kickoff for display (whichever is present).
 *
 * PredictaMarket v3 ARIA palette — electric indigo primary.
 */

import { Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';
import { getProbabilityTextColour } from '../data/oddsUtils.js';
import ProbabilityBar from './ProbabilityBar.jsx';

const C = {
  bg: '#080C14',
  card: '#0F1520',
  elevated: '#161E2E',
  border: '#1A2238',
  borderHover: '#252F45',
  primary: '#5B6EF5',
  primaryGlow: 'rgba(91,110,245,0.15)',
  liveRed: '#FF6B6B',
  text: '#f0f4ff',
  textSecondary: '#8A97B4',
  textMuted: '#4a5568',
};

const TEAM_COLORS = {
  'Dallas Cowboys': '#003594', 'Philadelphia Eagles': '#004C54',
  'Kansas City Chiefs': '#E31837', 'Baltimore Ravens': '#241773',
  'San Francisco 49ers': '#AA0000', 'Green Bay Packers': '#203731',
  'Buffalo Bills': '#00338D', 'Miami Dolphins': '#008E97',
  'Detroit Lions': '#0076B6', 'Los Angeles Lakers': '#552583',
  'Golden State Warriors': '#1D428A', 'Boston Celtics': '#007A33',
  'Milwaukee Bucks': '#00471B', 'Denver Nuggets': '#0E2240',
  'Oklahoma City Thunder': '#007AC1',
};

function getTeamColor(name) {
  return TEAM_COLORS[name] || '#2f3d5c';
}

function formatTime(t) {
  return new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(t) {
  const d = new Date(t);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

export default function AmericanSportsCard({ fixture, index = 0 }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();

  const isNfl = fixture.sport === 'nfl' || fixture.sport === 'americanfootball';
  const sportLabel = isNfl ? 'NFL' : 'NBA';
  const timeStr = fixture.gameTime || fixture.kickoff;

  function handleOutcomeClick(outcome) {
    addSelection({
      eventId: fixture.id,
      eventName: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
      outcomeId: outcome.id,
      outcomeName: outcome.label,
      probability: outcome.probability,
      decimalOdds: outcome.decimalOdds,
      sport: fixture.sport,
    });
  }

  const homeColor = getTeamColor(fixture.homeTeam);
  const awayColor = getTeamColor(fixture.awayTeam);

  return (
    <motion.div
      custom={index} variants={cardVariants}
      initial={index < 3 ? 'hidden' : 'visible'} animate="visible"
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: C.primaryGlow, color: C.primary }}>
            {sportLabel}
          </span>
          {fixture.conference && <span className="text-xs" style={{ color: C.textMuted }}>{fixture.conference}</span>}
        </div>
        <div className="flex items-center gap-1" style={{ color: C.textSecondary }}>
          {fixture.isLive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: C.liveRed }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: C.liveRed }} />
              </span>
              <span className="text-xs font-semibold" style={{ color: C.liveRed }}>
                {fixture.quarter ? `Q${fixture.quarter}` : 'LIVE'}
              </span>
            </div>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{formatDateLabel(timeStr)} {formatTime(timeStr)}</span>
            </>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: homeColor, color: '#fff' }}>
              {fixture.homeTeam.split(' ').pop().slice(0, 3).toUpperCase()}
            </div>
            <div>
              <span className="text-base font-semibold block" style={{ color: C.text }}>{fixture.homeTeam}</span>
              {fixture.spread && <span className="font-mono text-xs" style={{ color: C.textMuted }}>{fixture.spread.home}</span>}
            </div>
          </div>

          {fixture.isLive && fixture.liveScore ? (
            <div className="flex items-center gap-3 mx-4">
              <span className="font-mono text-2xl font-bold" style={{ color: C.primary }}>{fixture.liveScore.home}</span>
              <span style={{ color: C.textMuted }}>-</span>
              <span className="font-mono text-2xl font-bold" style={{ color: C.primary }}>{fixture.liveScore.away}</span>
            </div>
          ) : (
            <span className="text-sm mx-4" style={{ color: C.textMuted }}>vs</span>
          )}

          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="text-right">
              <span className="text-base font-semibold block" style={{ color: C.text }}>{fixture.awayTeam}</span>
              {fixture.spread && <span className="font-mono text-xs" style={{ color: C.textMuted }}>{fixture.spread.away}</span>}
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: awayColor, color: '#fff' }}>
              {fixture.awayTeam.split(' ').pop().slice(0, 3).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* O/U */}
      {fixture.overUnder && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: C.textMuted }}>O/U</span>
            <span className="font-mono text-xs font-medium" style={{ color: C.textSecondary }}>{fixture.overUnder}</span>
          </div>
        </div>
      )}

      {/* Outcomes */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {fixture.outcomes.map((outcome) => {
          const selected = isSelected(fixture.id, outcome.id);
          const textColour = getProbabilityTextColour(outcome.probability);
          return (
            <button key={outcome.id} onClick={() => handleOutcomeClick(outcome)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 cursor-pointer"
              style={selected
                ? { border: `1px solid ${C.primary}`, backgroundColor: 'rgba(91,110,245,0.08)' }
                : { border: `1px solid ${C.border}`, backgroundColor: C.elevated }}
              onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = 'rgba(91,110,245,0.4)'; }}
              onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = C.border; }}>
              <span className="text-xs uppercase tracking-wider" style={{ color: C.textSecondary }}>{outcome.label}</span>
              <span className={`font-mono text-2xl font-bold ${textColour}`}>{formatOdds(outcome.probability, format)}</span>
              <div className="w-full"><ProbabilityBar probability={outcome.probability} /></div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3" style={{ color: C.textMuted }} />
          <span className="text-xs" style={{ color: C.textMuted }}>{fixture.venue || ''}</span>
        </div>
      </div>
    </motion.div>
  );
}
