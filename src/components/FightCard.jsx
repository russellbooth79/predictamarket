/**
 * FightCard.jsx
 *
 * Card component for boxing and MMA bouts. Features dramatic versus
 * styling with fighters facing off, weight class info, and two-way
 * outcome buttons.
 *
 * Supports both rich fighter objects (fighter1/fighter2) and flat
 * homeTeam/awayTeam strings for backward compatibility.
 *
 * PredictaMarket v3 ARIA palette — electric indigo primary.
 */

import { Zap, Award } from 'lucide-react';
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

function formatEventDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

const FLAG_MAP = {
  GBR: '\uD83C\uDDEC\uD83C\uDDE7', UKR: '\uD83C\uDDFA\uD83C\uDDE6',
  USA: '\uD83C\uDDFA\uD83C\uDDF8', MEX: '\uD83C\uDDF2\uD83C\uDDFD',
  RUS: '\uD83C\uDDF7\uD83C\uDDFA', BRA: '\uD83C\uDDE7\uD83C\uDDF7',
  CHN: '\uD83C\uDDE8\uD83C\uDDF3', JPN: '\uD83C\uDDEF\uD83C\uDDF5',
};

function getFlagEmoji(code) {
  return FLAG_MAP[code] || '';
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

export default function FightCard({ fixture, index = 0 }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();

  // Gracefully handle both data shapes
  const f1 = fixture.fighter1 || { name: fixture.homeTeam, nationality: '', record: '', weightClass: '' };
  const f2 = fixture.fighter2 || { name: fixture.awayTeam, nationality: '', record: '', weightClass: '' };
  const o1 = fixture.outcomes[0];
  const o2 = fixture.outcomes[1];

  function handleOutcomeClick(outcome, fighterName) {
    addSelection({
      eventId: fixture.id,
      eventName: `${f1.name} vs ${f2.name}`,
      outcomeId: outcome.id,
      outcomeName: fighterName,
      probability: outcome.probability,
      decimalOdds: outcome.decimalOdds,
      sport: 'boxing',
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
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textSecondary }}>
            {fixture.competitionShort}
          </span>
          {f1.weightClass && (
            <>
              <span style={{ color: C.textMuted }}>|</span>
              <span className="text-xs" style={{ color: C.textSecondary }}>{f1.weightClass}</span>
            </>
          )}
        </div>
        {fixture.isTitleFight && (
          <div className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5" style={{ color: C.primary }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.primary }}>
              Title Fight
            </span>
          </div>
        )}
      </div>

      {/* Belt info */}
      {fixture.isTitleFight && fixture.beltInfo && (
        <div
          className="px-4 py-2 text-center"
          style={{ backgroundColor: C.primaryGlow, borderBottom: `1px solid ${C.border}` }}
        >
          <span className="text-xs font-semibold" style={{ color: C.primary }}>{fixture.beltInfo}</span>
        </div>
      )}

      {/* VS Display */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            {f1.nationality && <span className="text-lg mb-1 block">{getFlagEmoji(f1.nationality)}</span>}
            <h3 className="text-lg font-bold mb-1" style={{ color: C.text }}>{f1.name}</h3>
            {f1.record && <span className="font-mono text-xs" style={{ color: C.textSecondary }}>{f1.record}</span>}
          </div>

          <div className="flex items-center justify-center mx-4">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" style={{ color: C.primary }} />
              <span className="text-sm font-black uppercase tracking-widest" style={{ color: C.textMuted }}>VS</span>
              <Zap className="w-4 h-4" style={{ color: C.primary }} />
            </div>
          </div>

          <div className="flex-1 text-center">
            {f2.nationality && <span className="text-lg mb-1 block">{getFlagEmoji(f2.nationality)}</span>}
            <h3 className="text-lg font-bold mb-1" style={{ color: C.text }}>{f2.name}</h3>
            {f2.record && <span className="font-mono text-xs" style={{ color: C.textSecondary }}>{f2.record}</span>}
          </div>
        </div>
      </div>

      {/* Outcome buttons */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {[
          { outcome: o1, fighter: f1 },
          { outcome: o2, fighter: f2 },
        ].map(({ outcome, fighter }) => {
          const selected = isSelected(fixture.id, outcome.id);
          const textColour = getProbabilityTextColour(outcome.probability);

          return (
            <button
              key={outcome.id}
              onClick={() => handleOutcomeClick(outcome, fighter.name)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 cursor-pointer"
              style={
                selected
                  ? { border: `1px solid ${C.primary}`, backgroundColor: 'rgba(91,110,245,0.08)' }
                  : { border: `1px solid ${C.border}`, backgroundColor: C.elevated }
              }
              onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = 'rgba(91,110,245,0.4)'; }}
              onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = C.border; }}
            >
              <span className="text-xs uppercase tracking-wider" style={{ color: C.textSecondary }}>
                {fighter.name.split(' ').pop()} Win
              </span>
              <span className={`font-mono text-2xl font-bold ${textColour}`}>
                {formatOdds(outcome.probability, format)}
              </span>
              <div className="w-full">
                <ProbabilityBar probability={outcome.probability} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <span className="text-xs" style={{ color: C.textMuted }}>{fixture.venue || ''}</span>
        <span className="text-xs font-mono" style={{ color: C.textSecondary }}>
          {fixture.eventDate ? formatEventDate(fixture.eventDate) : ''}
        </span>
      </div>
    </motion.div>
  );
}
