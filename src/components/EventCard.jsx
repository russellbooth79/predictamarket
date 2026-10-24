/**
 * EventCard.jsx — PredictaMarket v4
 * Glassmorphism football match card. Glowing selection states,
 * gradient odds, vibrant live badge.
 */

import { Heart, Clock, ChevronRight, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';
import ProbabilityBar from './ProbabilityBar.jsx';

const C = {
  card: 'rgba(12,17,30,0.75)',
  elevated: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.14)',
  primary: '#6C63FF',
  primaryGrad: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)',
  liveRed: '#FF3366',
  green: '#00F5A0',
  text: '#F0F6FF',
  textSecondary: '#7B8CAA',
  textMuted: '#3A4560',
};

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

function FormDot({ result }) {
  const colors = { W: '#00F5A0', D: '#FFD700', L: '#FF3366' };
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ backgroundColor: colors[result] || C.textMuted }}
    />
  );
}

function getBetCount(id) {
  return 1200 + (simpleHash(id) % 7300);
}

function getLiveBettorCount(id) {
  return 47 + (simpleHash(id + 'live') % 430);
}

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

export default function EventCard({ fixture, index = 0, onViewMatch }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();

  const homeForm = generateForm(fixture.homeTeam);
  const awayForm = generateForm(fixture.awayTeam);
  const betCount = getBetCount(fixture.id);
  const liveBettors = getLiveBettorCount(fixture.id);

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

  const anySelected = fixture.outcomes.some(o => isSelected(fixture.id, o.id));

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial={index < 4 ? 'hidden' : 'visible'}
      animate="visible"
      className="rounded-2xl overflow-hidden"
      style={{
        background: C.card,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: anySelected
          ? '1px solid rgba(108,99,255,0.5)'
          : `1px solid ${C.border}`,
        boxShadow: anySelected
          ? '0 0 0 1px rgba(108,99,255,0.2), 0 8px 32px rgba(108,99,255,0.12)'
          : '0 4px 24px rgba(0,0,0,0.3)',
        transition: 'all 0.25s ease',
      }}
      onMouseEnter={e => {
        if (!anySelected) {
          e.currentTarget.style.borderColor = C.borderHover;
          e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        if (!anySelected) {
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Live progress bar — full-width accent when live */}
      {fixture.isLive && (
        <div
          className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, #FF3366 0%, #FF6B35 50%, transparent 100%)' }}
        />
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(108,99,255,0.12)',
              color: '#9B8FFF',
              border: '1px solid rgba(108,99,255,0.2)',
            }}
          >
            {fixture.competitionShort}
          </span>
          <span className="text-xs" style={{ color: C.textSecondary }}>
            {formatDateLabel(fixture.kickoff)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {fixture.isLive ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(255,51,102,0.12)',
                border: '1px solid rgba(255,51,102,0.25)',
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full"
                  style={{ backgroundColor: C.liveRed, opacity: 0.75 }}
                />
                <span
                  className="relative inline-flex rounded-full h-1.5 w-1.5"
                  style={{ backgroundColor: C.liveRed }}
                />
              </span>
              <span
                className="text-xs font-bold tracking-wider"
                style={{ color: C.liveRed }}
              >
                {formatKickoff(fixture.kickoff, true, fixture.liveMinute)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1" style={{ color: C.textSecondary }}>
              <Clock className="w-3 h-3" />
              <span className="text-xs">{formatKickoff(fixture.kickoff, false, null)}</span>
            </div>
          )}
          <button style={{ color: C.textMuted }}>
            <Heart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Teams */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span
              className="text-lg font-bold block leading-tight font-display"
              style={{ color: C.text }}
            >
              {fixture.homeTeam}
            </span>
            <div className="flex items-center gap-1 mt-1.5">
              {homeForm.map((r, i) => <FormDot key={i} result={r} />)}
            </div>
          </div>

          {fixture.isLive && fixture.liveScore ? (
            <div className="flex items-center gap-3 mx-4">
              <span
                className="font-mono text-3xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {fixture.liveScore.home}
              </span>
              <span className="text-sm font-light" style={{ color: C.textMuted }}>–</span>
              <span
                className="font-mono text-3xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {fixture.liveScore.away}
              </span>
            </div>
          ) : (
            <div
              className="mx-4 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.04)', color: C.textMuted, border: `1px solid ${C.border}` }}
            >
              vs
            </div>
          )}

          <div className="flex-1 text-right">
            <span
              className="text-lg font-bold block leading-tight font-display"
              style={{ color: C.text }}
            >
              {fixture.awayTeam}
            </span>
            <div className="flex items-center gap-1 mt-1.5 justify-end">
              {awayForm.map((r, i) => <FormDot key={i} result={r} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Outcome buttons */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        {fixture.outcomes.map((outcome) => {
          const selected = isSelected(fixture.id, outcome.id);
          return (
            <button
              key={outcome.id}
              onClick={() => handleOutcomeClick(outcome)}
              className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden"
              style={
                selected
                  ? {
                      background: 'rgba(108,99,255,0.15)',
                      border: '1px solid rgba(108,99,255,0.6)',
                      boxShadow: '0 0 20px rgba(108,99,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${C.border}`,
                    }
              }
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
              <span
                className="text-[10px] uppercase tracking-widest font-medium"
                style={{ color: C.textSecondary }}
              >
                {outcome.label}
              </span>

              <span
                className="font-mono text-2xl font-black"
                style={
                  selected
                    ? {
                        background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }
                    : { color: '#E8F0FF' }
                }
              >
                {formatOdds(outcome.probability, format)}
              </span>

              <div className="w-full">
                <ProbabilityBar probability={outcome.probability} selected={selected} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderTop: `1px solid rgba(255,255,255,0.04)` }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3" style={{ color: C.textMuted }} />
            <span className="text-xs" style={{ color: C.textMuted }}>
              {betCount.toLocaleString()} bets
            </span>
          </div>
          {/* Live bettors pill */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.15)' }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full"
                style={{ backgroundColor: '#FF3366', opacity: 0.6 }}
              />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: '#FF3366' }} />
            </span>
            <span className="text-[10px] font-bold" style={{ color: '#FF7096' }}>
              {liveBettors} now
            </span>
          </div>
        </div>
        {onViewMatch && (
          <button
            onClick={() => onViewMatch(fixture)}
            className="flex items-center gap-1 text-xs font-semibold transition-all"
            style={{ color: '#9B8FFF' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#B0A5FF'; e.currentTarget.style.gap = '6px'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9B8FFF'; e.currentTarget.style.gap = '4px'; }}
          >
            Match Centre
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
