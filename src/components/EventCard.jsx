/**
 * EventCard.jsx — PredictaMarket v5
 *
 * Full match card used in the "Big games" carousel. Tap an outcome to add it
 * to the bet slip (tap again to remove). Each outcome shows its chance plus an
 * example payout, and the crowd bar shows where PUNT users are betting.
 * For scanning many matches, MatchRow is the compact equivalent.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, ChevronRight, Users } from 'lucide-react';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';
import {
  simpleHash, generateForm, getBetCount, getLiveBettors, getCrowdSplit,
  outcomeShortName, payoutFor, formatKickoff, formatDateLabel,
} from '../utils/fixtureMeta.js';
import ProbabilityBar from './ProbabilityBar.jsx';

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  border: 'rgba(255,255,255,0.07)',
  liveRed: '#FF3366',
  text: '#F0F6FF',
  textSecondary: '#7B8CAA',
  textMuted: '#6B7894',
};

// Seven team accent colours — one assigned per fixture via hash
const TEAM_ACCENTS = [
  '#6C63FF', '#FF3366', '#00F5A0',
  '#00D4FF', '#FF9500', '#9B5DE5', '#FF6B35',
];

// Crowd bar segment colours, in outcome order (home, draw, away)
const CROWD_COLOURS = ['#6C63FF', '#6B7894', '#FF6B35'];

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Particle burst on selection ───────────────────────────────────────────────

const BURST_ANGLES = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

function ParticleBurst({ active }) {
  return (
    <AnimatePresence>
      {active && BURST_ANGLES.map((angle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 7, height: 7,
            background: 'linear-gradient(135deg, #6C63FF, #B06FFF)',
            left: '50%', top: '50%',
            marginLeft: -3.5, marginTop: -3.5,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos(angle) * 26, y: Math.sin(angle) * 26, opacity: 0, scale: 0 }}
          transition={{ duration: 0.34, ease: 'easeOut' }}
        />
      ))}
    </AnimatePresence>
  );
}

// ── Outcome button ────────────────────────────────────────────────────────────
// Primary figure follows the user's odds format. The secondary line always
// translates it: "£10 → £13.89" for percentages, "72% chance" otherwise.

function OutcomeButton({ outcome, selected, format, onSelect }) {
  const secondary = format === 'probability'
    ? `£10 → £${payoutFor(outcome.probability).toFixed(2)}`
    : `${Math.round(outcome.probability)}% chance`;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.95 }}
      aria-pressed={selected}
      className="relative flex flex-col items-center gap-1 px-2 py-3 w-full rounded-xl transition-colors duration-200"
      style={selected
        ? { background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.6)', boxShadow: '0 0 20px rgba(108,99,255,0.2)' }
        : { background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }
      }
    >
      {/* Team name without "Win", wrapping to two lines rather than truncating */}
      <span className="text-[10px] uppercase tracking-wide font-semibold leading-tight text-center line-clamp-2 min-h-[2lh]" style={{ color: C.textSecondary }}>
        {outcome.label === 'Draw' ? 'Draw' : outcomeShortName(outcome.label)}
      </span>
      <span
        className="font-mono text-[26px] font-black leading-none"
        style={selected
          ? { background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
          : { color: '#E8F0FF' }
        }
      >
        {formatOdds(outcome.probability, format)}
      </span>
      <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: selected ? '#B0A5FF' : C.textMuted }}>
        {secondary}
      </span>
      <div className="w-full mt-0.5">
        <ProbabilityBar probability={outcome.probability} selected={selected} />
      </div>
    </motion.button>
  );
}

// ── Form — letters instead of unexplained dots ────────────────────────────────

const FORM_COLOURS = { W: '#00F5A0', D: '#FFD700', L: '#FF3366' };

export function FormStrip({ form, align = 'left' }) {
  return (
    <div
      className={`flex items-center gap-0.5 mt-1.5 ${align === 'right' ? 'justify-end' : ''}`}
      aria-label={`Last 5: ${form.join(' ')}`}
    >
      {form.map((r, i) => (
        <span
          key={i}
          className="w-4 h-4 rounded text-[9px] font-black flex items-center justify-center"
          style={{ background: `${FORM_COLOURS[r]}1F`, color: FORM_COLOURS[r] }}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

// ── Crowd split ───────────────────────────────────────────────────────────────

export function CrowdBar({ fixture }) {
  const split = getCrowdSplit(fixture);
  const top = split.reduce((a, b) => (b.share > a.share ? b : a));
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.textMuted }}>
          Where PUNT is betting
        </span>
        <span className="text-[11px] font-bold" style={{ color: C.text }}>
          {top.share}% on {outcomeShortName(top.label)}
        </span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        {split.map((s, i) => (
          <motion.div
            key={s.outcomeId}
            initial={{ width: 0 }}
            animate={{ width: `${s.share}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            style={{ background: CROWD_COLOURS[i % CROWD_COLOURS.length] }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export default function EventCard({ fixture, index = 0, onViewMatch }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();
  const [burstId, setBurstId] = useState(null);

  const homeForm = generateForm(fixture.homeTeam);
  const awayForm = generateForm(fixture.awayTeam);
  const betCount = getBetCount(fixture.id);
  const liveBettors = getLiveBettors(fixture.id);
  const accent = TEAM_ACCENTS[simpleHash(fixture.id) % TEAM_ACCENTS.length];
  const anySelected = fixture.outcomes.some(o => isSelected(fixture.id, o.id));

  function handleOutcomeClick(outcome) {
    setBurstId(outcome.id);
    setTimeout(() => setBurstId(null), 400);
    // addSelection toggles: tapping a selected outcome removes it
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
      initial={index < 4 ? 'hidden' : 'visible'}
      animate="visible"
      className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{
        background: `radial-gradient(ellipse 70% 50% at 10% 0%, ${accent}1A 0%, transparent 60%),
                     radial-gradient(ellipse 70% 50% at 90% 0%, ${accent}14 0%, transparent 60%),
                     rgb(12,17,30)`,
        border: anySelected ? '1px solid rgba(108,99,255,0.5)' : `1px solid ${C.border}`,
        boxShadow: anySelected ? '0 0 0 1px rgba(108,99,255,0.2), 0 8px 32px rgba(108,99,255,0.12)' : '0 4px 24px rgba(0,0,0,0.3)',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      {fixture.isLive && (
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #FF3366 0%, #FF6B35 50%, transparent 100%)' }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,99,255,0.12)', color: '#9B8FFF', border: '1px solid rgba(108,99,255,0.2)' }}>
            {fixture.competitionShort}
          </span>
          <span className="text-xs" style={{ color: C.textSecondary }}>{formatDateLabel(fixture.kickoff)}</span>
        </div>
        {fixture.isLive ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,51,102,0.12)', border: '1px solid rgba(255,51,102,0.25)' }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: C.liveRed, opacity: 0.75 }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: C.liveRed }} />
            </span>
            <span className="text-xs font-bold tracking-wider" style={{ color: C.liveRed }}>{formatKickoff(fixture.kickoff, true, fixture.liveMinute)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1" style={{ color: C.textSecondary }}>
            <Clock className="w-3 h-3" />
            <span className="text-xs">{formatKickoff(fixture.kickoff, false, null)}</span>
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <span className="text-lg font-bold block leading-tight font-display" style={{ color: C.text }}>{fixture.homeTeam}</span>
            <FormStrip form={homeForm} />
          </div>
          {fixture.isLive && fixture.liveScore ? (
            <div className="flex items-center gap-3 mx-3">
              <span className="font-mono text-3xl font-black" style={{ color: '#B0A5FF' }}>{fixture.liveScore.home}</span>
              <span className="text-sm" style={{ color: C.textMuted }}>–</span>
              <span className="font-mono text-3xl font-black" style={{ color: '#B0A5FF' }}>{fixture.liveScore.away}</span>
            </div>
          ) : (
            <div className="mx-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.04)', color: C.textMuted, border: `1px solid ${C.border}` }}>vs</div>
          )}
          <div className="flex-1 min-w-0 text-right">
            <span className="text-lg font-bold block leading-tight font-display" style={{ color: C.text }}>{fixture.awayTeam}</span>
            <FormStrip form={awayForm} align="right" />
          </div>
        </div>
      </div>

      {/* Outcome buttons */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        {fixture.outcomes.map((outcome) => (
          <div key={outcome.id} className="relative">
            <ParticleBurst active={burstId === outcome.id} />
            <OutcomeButton
              outcome={outcome}
              selected={isSelected(fixture.id, outcome.id)}
              format={format}
              onSelect={() => handleOutcomeClick(outcome)}
            />
          </div>
        ))}
      </div>

      <CrowdBar fixture={fixture} />

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3" style={{ color: C.textMuted }} />
            <span className="text-xs" style={{ color: C.textMuted }}>{betCount.toLocaleString()} bets</span>
          </div>
          {fixture.isLive && (
            <span className="text-[10px] font-bold" style={{ color: '#FF7096' }}>{liveBettors} watching</span>
          )}
        </div>
        {onViewMatch && (
          <button
            type="button"
            onClick={() => onViewMatch(fixture)}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: '#9B8FFF' }}
          >
            Match Centre <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
