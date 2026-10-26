/**
 * HorseRacingCard.jsx
 *
 * Redesigned racecard with:
 * - Going condition colour pills (green=good, amber=soft, red=heavy)
 * - Track type badge (NH = green, AW = blue, Flat = amber)
 * - Prize money display
 * - Larger jockey silk SVGs (32x38)
 * - Form guide with per-character colour coding
 *
 * Each runner row is clickable to add to the bet slip.
 * Selected runner gets an indigo left border accent.
 *
 * PredictaMarket v3 ARIA palette — electric indigo primary.
 */

import { Clock, MapPin, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';
import { getProbabilityTextColour } from '../data/oddsUtils.js';
import { generateSilkSVG } from '../utils/generateSilk.js';
import ProbabilityBar from './ProbabilityBar.jsx';

const C = {
  card: '#0F1520',
  elevated: '#161E2E',
  border: '#1A2238',
  borderHover: '#252F45',
  primary: '#5B6EF5',
  text: '#f0f4ff',
  textSecondary: '#8A97B4',
  textMuted: '#4a5568',
  green: '#A8FF3E',
  amber: '#f59e0b',
  red: '#FF6B6B',
};

// -- Going condition styling ------------------------------------------------

/**
 * Map ground conditions to colour-coded pill styles.
 * Racing going descriptions are standardised by the BHA.
 */
function getGoingStyle(going) {
  const lower = (going || '').toLowerCase();
  if (lower.includes('heavy') || lower.includes('soft')) {
    return { bg: 'rgba(255,107,107,0.12)', text: C.red, border: 'rgba(255,107,107,0.25)' };
  }
  if (lower.includes('good to soft') || lower.includes('yielding')) {
    return { bg: 'rgba(245,158,11,0.12)', text: C.amber, border: 'rgba(245,158,11,0.25)' };
  }
  if (lower.includes('standard') || lower.includes('polytrack')) {
    return { bg: 'rgba(91,110,245,0.12)', text: '#6B8FE0', border: 'rgba(91,110,245,0.25)' };
  }
  // Good, Firm, Fast
  return { bg: 'rgba(168,255,62,0.12)', text: C.green, border: 'rgba(168,255,62,0.25)' };
}

// -- Track type badge -------------------------------------------------------

function getTrackTypeStyle(trackType) {
  const lower = (trackType || '').toLowerCase();
  if (lower.includes('national hunt') || lower.includes('nh')) {
    return { bg: 'rgba(168,255,62,0.12)', text: C.green, label: 'NH' };
  }
  if (lower.includes('all weather') || lower.includes('aw')) {
    return { bg: 'rgba(91,110,245,0.12)', text: '#6B8FE0', label: 'AW' };
  }
  return { bg: 'rgba(245,158,11,0.12)', text: C.amber, label: 'Flat' };
}

// -- Form character colour coding -------------------------------------------

function getFormCharColour(ch) {
  if (ch === '1') return C.green;
  if (ch === '2' || ch === '3') return C.amber;
  if (ch === 'F' || ch === 'P' || ch === '0') return C.red;
  return C.textMuted;
}

// -- Helpers ----------------------------------------------------------------

function formatRaceTime(raceTime) {
  return new Date(raceTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

/**
 * Inline SVG component for jockey silks at 32x38.
 * Uses dangerouslySetInnerHTML because the SVG is generated from a
 * deterministic hash -- no user input, so XSS is not a concern.
 */
function JockeySilk({ horseName }) {
  const svgString = generateSilkSVG(horseName, 32);
  return (
    <div
      className="shrink-0"
      style={{ width: 32, height: 38 }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}

export default function HorseRacingCard({ fixture, index = 0 }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();

  const goingStyle = getGoingStyle(fixture.going);
  const trackStyle = getTrackTypeStyle(fixture.trackType);

  function handleRunnerClick(runner) {
    addSelection({
      eventId: fixture.id,
      eventName: `${fixture.competition} \u2014 ${fixture.raceName}`,
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
      {/* Header: venue, race name, time, track type badge */}
      <div className="px-4 py-3" style={{ borderBottom: `1px solid rgba(26,34,56,0.5)` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" style={{ color: C.primary }} />
            <span className="text-sm font-semibold" style={{ color: C.text }}>
              {fixture.competition}
            </span>
            {/* Track type badge */}
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: trackStyle.bg, color: trackStyle.text }}
            >
              {trackStyle.label}
            </span>
          </div>
          <div className="flex items-center gap-1" style={{ color: C.textSecondary }}>
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">
              {formatDateLabel(fixture.raceTime)} {formatRaceTime(fixture.raceTime)}
            </span>
          </div>
        </div>

        {/* Race metadata row: name, distance, going pill, class, prize */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm" style={{ color: C.textSecondary }}>{fixture.raceName}</span>
          <span style={{ color: C.textMuted }}>|</span>
          <span className="text-xs" style={{ color: C.textMuted }}>{fixture.distance}</span>
          <span style={{ color: C.textMuted }}>|</span>
          {/* Going condition pill */}
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: goingStyle.bg,
              color: goingStyle.text,
              border: `1px solid ${goingStyle.border}`,
            }}
          >
            {fixture.going}
          </span>
          <span style={{ color: C.textMuted }}>|</span>
          <span className="text-xs" style={{ color: C.textMuted }}>{fixture.raceClass}</span>
          {/* Prize money */}
          {fixture.prizeMoney && (
            <>
              <span style={{ color: C.textMuted }}>|</span>
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3" style={{ color: C.primary }} />
                <span className="text-xs font-mono font-medium" style={{ color: C.primary }}>
                  {fixture.prizeMoney}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Runner table header (desktop) */}
      <div
        className="hidden sm:grid grid-cols-[2.5rem_2rem_1fr_6rem_6rem_4.5rem_8rem_3.5rem_3.5rem] gap-1 px-4 py-1.5 text-xs uppercase tracking-wider"
        style={{ borderBottom: `1px solid rgba(26,34,56,0.3)`, color: C.textMuted }}
      >
        <span></span>
        <span>#</span>
        <span>Horse</span>
        <span>Jockey</span>
        <span>Trainer</span>
        <span>Form</span>
        <span>Prob</span>
        <span className="text-right">Odds</span>
        <span className="text-right">SP</span>
      </div>

      {/* Runner rows */}
      <div className="divide-y" style={{ borderColor: 'rgba(26,34,56,0.3)' }}>
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
                      backgroundColor: 'rgba(198,255,61,0.06)',
                      borderLeft: '3px solid var(--action)',
                    }
                  : {
                      borderLeft: '3px solid transparent',
                    }
              }
              onMouseEnter={(e) => {
                if (!selected) e.currentTarget.style.backgroundColor = 'rgba(22,30,46,0.5)';
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-[2.5rem_2rem_1fr_6rem_6rem_4.5rem_8rem_3.5rem_3.5rem] gap-1 items-center px-4 py-2.5">
                <JockeySilk horseName={runner.name} />
                <span className="font-mono text-xs" style={{ color: C.textMuted }}>
                  {runner.saddleNumber}
                </span>
                <div>
                  <span className="text-sm font-medium" style={{ color: C.text }}>
                    {runner.name}
                  </span>
                </div>
                <span className="text-xs truncate" style={{ color: C.textSecondary }}>{runner.jockey}</span>
                <span className="text-xs truncate" style={{ color: C.textMuted }}>{runner.trainer}</span>
                {/* Colour-coded form */}
                <span className="font-mono text-xs tracking-wide">
                  {runner.form.split('').map((ch, ci) => (
                    <span key={ci} style={{ color: ch === '-' ? C.textMuted : getFormCharColour(ch) }}>
                      {ch}
                    </span>
                  ))}
                </span>
                <div className="px-1">
                  <ProbabilityBar probability={runner.probability} />
                </div>
                <span className={`font-mono text-sm font-bold text-right ${textColour}`}>
                  {formatOdds(runner.probability, format)}
                </span>
                <span className="font-mono text-xs text-right" style={{ color: C.textSecondary }}>
                  {runner.fractionalOdds}
                </span>
              </div>

              {/* Mobile layout */}
              <div className="sm:hidden px-4 py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <JockeySilk horseName={runner.name} />
                    <span className="font-mono text-xs w-5" style={{ color: C.textMuted }}>
                      {runner.saddleNumber}
                    </span>
                    <span className="text-sm font-medium" style={{ color: C.text }}>
                      {runner.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm font-bold ${textColour}`}>
                      {formatOdds(runner.probability, format)}
                    </span>
                    <span className="font-mono text-xs" style={{ color: C.textSecondary }}>
                      {runner.fractionalOdds}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-1.5 ml-14">
                  <span className="text-xs" style={{ color: C.textSecondary }}>{runner.jockey}</span>
                  <span className="font-mono text-xs">
                    {runner.form.split('').map((ch, ci) => (
                      <span key={ci} style={{ color: ch === '-' ? C.textMuted : getFormCharColour(ch) }}>
                        {ch}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="ml-14">
                  <ProbabilityBar probability={runner.probability} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ borderTop: `1px solid rgba(26,34,56,0.5)` }}
      >
        <span className="text-xs" style={{ color: C.textMuted }}>
          {fixture.runners.length} runners
        </span>
        {fixture.prizeMoney && (
          <span className="text-xs font-mono" style={{ color: C.textMuted }}>
            Prize: {fixture.prizeMoney}
          </span>
        )}
      </div>
    </motion.div>
  );
}
