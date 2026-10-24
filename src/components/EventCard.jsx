/**
 * EventCard.jsx — PredictaMarket v4
 *
 * Two render modes:
 *   hero=false (default) — standard glassmorphism card in a vertical list
 *   hero=true            — full-height TikTok card inside SwipeFeed, with
 *                          team colour fill zone and 40px "financial brutalism" odds
 *
 * Mobile: swipe-right on odds button to add to bet slip.
 * Desktop: hover/scale, no drag overhead.
 * Both modes: particle burst on selection (TikTok heart equivalent).
 */

import { useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Heart, Clock, ChevronRight, Users } from 'lucide-react';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';
import { useIsMobile } from '../hooks/useIsMobile.js';
import ProbabilityBar from './ProbabilityBar.jsx';

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  card: 'rgba(12,17,30,0.82)',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.14)',
  liveRed: '#FF3366',
  green: '#00F5A0',
  text: '#F0F6FF',
  textSecondary: '#7B8CAA',
  textMuted: '#3A4560',
};

// Seven team accent colours — one assigned per fixture via hash
const TEAM_ACCENTS = [
  '#6C63FF', '#FF3366', '#00F5A0',
  '#00D4FF', '#FF9500', '#9B5DE5', '#FF6B35',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) & 0x7fffffff;
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

function getBetCount(id)       { return 1200 + (simpleHash(id) % 7300); }
function getLiveBettors(id)    { return 47   + (simpleHash(id + 'live') % 430); }

function formatKickoff(kickoff, isLive, liveMinute) {
  if (isLive) return `${liveMinute}'`;
  return new Date(kickoff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Particle burst — TikTok heart equivalent ──────────────────────────────────

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
          animate={{
            x: Math.cos(angle) * 26,
            y: Math.sin(angle) * 26,
            opacity: 0, scale: 0,
          }}
          transition={{ duration: 0.34, ease: 'easeOut' }}
        />
      ))}
    </AnimatePresence>
  );
}

// ── Swipeable outcome button (mobile) ─────────────────────────────────────────

const SWIPE_THRESHOLD = 40;

function SwipeableOutcomeButton({ outcome, selected, formattedOdds, onSelect, hero }) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const confirmOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);

  async function handleDragEnd(_, info) {
    if (info.offset.x > SWIPE_THRESHOLD && !selected) {
      await controls.start({ x: 10, transition: { duration: 0.08 } });
      onSelect();
    }
    controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 35 } });
  }

  const buttonStyle = selected
    ? { background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.6)', boxShadow: '0 0 20px rgba(108,99,255,0.2)' }
    : { background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` };

  const oddsSize = hero ? 'text-[40px]' : 'text-[28px]';

  return (
    <div className="relative overflow-hidden rounded-xl">
      <motion.div
        className="absolute inset-0 rounded-xl flex items-center justify-center pointer-events-none"
        style={{ opacity: confirmOpacity, background: 'rgba(0,245,160,0.1)', border: '1px solid rgba(0,245,160,0.3)' }}
      >
        <span className="text-sm font-black" style={{ color: '#00F5A0' }}>+ Add</span>
      </motion.div>
      <motion.button
        drag="x"
        dragConstraints={{ left: 0, right: 70 }}
        dragElastic={0.05}
        animate={controls}
        style={{ x, ...buttonStyle }}
        onDragEnd={handleDragEnd}
        onClick={() => !selected && onSelect()}
        className={`relative flex flex-col items-center gap-1 p-3 w-full rounded-xl touch-pan-y ${hero ? 'py-4' : ''}`}
      >
        <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: C.textSecondary }}>
          {outcome.label}
        </span>
        <span
          className={`font-mono ${oddsSize} font-black leading-none`}
          style={selected
            ? { background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
            : { color: '#E8F0FF' }
          }
        >
          {formattedOdds}
        </span>
        <div className="w-full mt-1">
          <ProbabilityBar probability={outcome.probability} selected={selected} />
        </div>
      </motion.button>
    </div>
  );
}

// ── Desktop outcome button ────────────────────────────────────────────────────

function DesktopOutcomeButton({ outcome, selected, formattedOdds, onSelect, hero }) {
  const buttonStyle = selected
    ? { background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.6)', boxShadow: '0 0 20px rgba(108,99,255,0.2)' }
    : { background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` };

  const oddsSize = hero ? 'text-[40px]' : 'text-[28px]';

  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${hero ? 'py-4' : ''}`}
      style={buttonStyle}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.background = 'rgba(108,99,255,0.06)';
          e.currentTarget.style.borderColor = 'rgba(108,99,255,0.35)';
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: C.textSecondary }}>
        {outcome.label}
      </span>
      <span
        className={`font-mono ${oddsSize} font-black leading-none`}
        style={selected
          ? { background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
          : { color: '#E8F0FF' }
        }
      >
        {formattedOdds}
      </span>
      <div className="w-full mt-1">
        <ProbabilityBar probability={outcome.probability} selected={selected} />
      </div>
    </button>
  );
}

// ── FormDot ───────────────────────────────────────────────────────────────────

function FormDot({ result }) {
  const colors = { W: '#00F5A0', D: '#FFD700', L: '#FF3366' };
  return <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colors[result] || C.textMuted }} />;
}

// ── Main card ─────────────────────────────────────────────────────────────────

export default function EventCard({ fixture, index = 0, onViewMatch, hero = false }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();
  const isMobile = useIsMobile();
  const [burstId, setBurstId] = useState(null);

  const homeForm = generateForm(fixture.homeTeam);
  const awayForm = generateForm(fixture.awayTeam);
  const betCount = getBetCount(fixture.id);
  const liveBettors = getLiveBettors(fixture.id);

  // Unique accent per fixture
  const accent     = TEAM_ACCENTS[simpleHash(fixture.id) % TEAM_ACCENTS.length];
  const homeAccent = TEAM_ACCENTS[simpleHash(fixture.homeTeam) % TEAM_ACCENTS.length];
  const awayAccent = TEAM_ACCENTS[simpleHash(fixture.awayTeam) % TEAM_ACCENTS.length];

  // Hero mode: full team colour fill zone. List mode: subtle bleed.
  const cardBackground = hero
    ? `linear-gradient(160deg, ${homeAccent}28 0%, transparent 45%),
       linear-gradient(200deg, ${awayAccent}22 0%, transparent 45%),
       rgba(10,14,24,0.95)`
    : `radial-gradient(ellipse 70% 50% at 10% 0%, ${accent}1A 0%, transparent 60%),
       radial-gradient(ellipse 70% 50% at 90% 0%, ${accent}14 0%, transparent 60%),
       rgba(12,17,30,0.82)`;

  function handleOutcomeClick(outcome) {
    // Particle burst
    setBurstId(outcome.id);
    setTimeout(() => setBurstId(null), 400);
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

  const anySelected = fixture.outcomes.some(o => isSelected(fixture.id, o.id));

  // ── Hero layout (full-height TikTok card) ───────────────────────────────────
  if (hero) {
    return (
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{
          background: cardBackground,
          border: anySelected ? '1px solid rgba(108,99,255,0.5)' : `1px solid ${C.border}`,
        }}
      >
        {/* Live accent bar */}
        {fixture.isLive && (
          <div className="h-0.5 w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg, #FF3366 0%, #FF6B35 50%, transparent 100%)' }} />
        )}

        {/* Header strip */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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
              <span className="text-xs font-bold" style={{ color: C.liveRed }}>{formatKickoff(fixture.kickoff, true, fixture.liveMinute)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1" style={{ color: C.textSecondary }}>
              <Clock className="w-3 h-3" />
              <span className="text-xs">{formatKickoff(fixture.kickoff, false, null)}</span>
            </div>
          )}
        </div>

        {/* Team colour zone — flex-1 so it fills the middle */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 min-h-0">
          <div className="w-full flex items-center justify-between gap-4">
            {/* Home */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
                style={{ background: `${homeAccent}22`, border: `2px solid ${homeAccent}44`, color: homeAccent }}
              >
                {fixture.homeTeam.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              <span className="text-lg font-black font-display text-center leading-tight" style={{ color: C.text }}>
                {fixture.homeTeam}
              </span>
              <div className="flex items-center gap-1">
                {homeForm.map((r, i) => <FormDot key={i} result={r} />)}
              </div>
            </div>

            {/* Score or VS */}
            {fixture.isLive && fixture.liveScore ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-5xl font-black" style={{ background: 'linear-gradient(135deg, #6C63FF, #9B5DE5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {fixture.liveScore.home}
                  </span>
                  <span className="text-2xl" style={{ color: C.textMuted }}>–</span>
                  <span className="font-mono text-5xl font-black" style={{ background: 'linear-gradient(135deg, #6C63FF, #9B5DE5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {fixture.liveScore.away}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: C.liveRed }}>{fixture.liveMinute}'</span>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black" style={{ background: 'rgba(255,255,255,0.05)', color: C.textMuted, border: `1px solid ${C.border}` }}>
                VS
              </div>
            )}

            {/* Away */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
                style={{ background: `${awayAccent}22`, border: `2px solid ${awayAccent}44`, color: awayAccent }}
              >
                {fixture.awayTeam.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              <span className="text-lg font-black font-display text-center leading-tight" style={{ color: C.text }}>
                {fixture.awayTeam}
              </span>
              <div className="flex items-center gap-1">
                {awayForm.map((r, i) => <FormDot key={i} result={r} />)}
              </div>
            </div>
          </div>
        </div>

        {/* Outcome buttons */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-3 flex-shrink-0">
          {fixture.outcomes.map((outcome) => {
            const selected = isSelected(fixture.id, outcome.id);
            const formattedOdds = formatOdds(outcome.probability, format);
            return (
              <div key={outcome.id} className="relative">
                <ParticleBurst active={burstId === outcome.id} />
                {isMobile
                  ? <SwipeableOutcomeButton outcome={outcome} selected={selected} formattedOdds={formattedOdds} onSelect={() => handleOutcomeClick(outcome)} hero />
                  : <DesktopOutcomeButton outcome={outcome} selected={selected} formattedOdds={formattedOdds} onSelect={() => handleOutcomeClick(outcome)} hero />
                }
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3" style={{ color: C.textMuted }} />
              <span className="text-xs" style={{ color: C.textMuted }}>{betCount.toLocaleString()} bets</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.15)' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: '#FF3366', opacity: 0.6 }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: '#FF3366' }} />
              </span>
              <span className="text-[10px] font-bold" style={{ color: '#FF7096' }}>{liveBettors} now</span>
            </div>
          </div>
          {onViewMatch && (
            <button onClick={() => onViewMatch(fixture)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#9B8FFF' }}>
              Match Centre <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Standard list card ──────────────────────────────────────────────────────
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial={index < 4 ? 'hidden' : 'visible'}
      animate="visible"
      className="rounded-2xl overflow-hidden"
      style={{
        background: cardBackground,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: anySelected ? '1px solid rgba(108,99,255,0.5)' : `1px solid ${C.border}`,
        boxShadow: anySelected ? '0 0 0 1px rgba(108,99,255,0.2), 0 8px 32px rgba(108,99,255,0.12)' : '0 4px 24px rgba(0,0,0,0.3)',
        transition: 'all 0.25s ease',
      }}
      onMouseEnter={e => {
        if (!anySelected && !isMobile) {
          e.currentTarget.style.borderColor = C.borderHover;
          e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        if (!anySelected && !isMobile) {
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
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
        <div className="flex items-center gap-2">
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
          <button style={{ color: C.textMuted }}><Heart className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Teams */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="text-lg font-bold block leading-tight font-display" style={{ color: C.text }}>{fixture.homeTeam}</span>
            <div className="flex items-center gap-1 mt-1.5">{homeForm.map((r, i) => <FormDot key={i} result={r} />)}</div>
          </div>
          {fixture.isLive && fixture.liveScore ? (
            <div className="flex items-center gap-3 mx-4">
              <span className="font-mono text-3xl font-black" style={{ background: 'linear-gradient(135deg, #6C63FF, #9B5DE5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{fixture.liveScore.home}</span>
              <span className="text-sm" style={{ color: C.textMuted }}>–</span>
              <span className="font-mono text-3xl font-black" style={{ background: 'linear-gradient(135deg, #6C63FF, #9B5DE5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{fixture.liveScore.away}</span>
            </div>
          ) : (
            <div className="mx-4 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.04)', color: C.textMuted, border: `1px solid ${C.border}` }}>vs</div>
          )}
          <div className="flex-1 text-right">
            <span className="text-lg font-bold block leading-tight font-display" style={{ color: C.text }}>{fixture.awayTeam}</span>
            <div className="flex items-center gap-1 mt-1.5 justify-end">{awayForm.map((r, i) => <FormDot key={i} result={r} />)}</div>
          </div>
        </div>
      </div>

      {/* Swipe hint — mobile only */}
      {isMobile && (
        <div className="px-4 pb-1">
          <p className="text-[9px] text-center" style={{ color: C.textMuted }}>Swipe right on odds to add · tap to select</p>
        </div>
      )}

      {/* Outcome buttons */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        {fixture.outcomes.map((outcome) => {
          const selected = isSelected(fixture.id, outcome.id);
          const formattedOdds = formatOdds(outcome.probability, format);
          return (
            <div key={outcome.id} className="relative">
              <ParticleBurst active={burstId === outcome.id} />
              {isMobile
                ? <SwipeableOutcomeButton outcome={outcome} selected={selected} formattedOdds={formattedOdds} onSelect={() => handleOutcomeClick(outcome)} hero={false} />
                : <DesktopOutcomeButton outcome={outcome} selected={selected} formattedOdds={formattedOdds} onSelect={() => handleOutcomeClick(outcome)} hero={false} />
              }
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3" style={{ color: C.textMuted }} />
            <span className="text-xs" style={{ color: C.textMuted }}>{betCount.toLocaleString()} bets</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.15)' }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: '#FF3366', opacity: 0.6 }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: '#FF3366' }} />
            </span>
            <span className="text-[10px] font-bold" style={{ color: '#FF7096' }}>{liveBettors} now</span>
          </div>
        </div>
        {onViewMatch && (
          <button
            onClick={() => onViewMatch(fixture)}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: '#9B8FFF' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#B0A5FF'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9B8FFF'; }}
          >
            Match Centre <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
