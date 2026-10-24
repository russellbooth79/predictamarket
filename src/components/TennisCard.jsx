/**
 * TennisCard.jsx — PredictaMarket v4
 * Glassmorphism tennis card with surface-tinted player panels.
 */

import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';
import ProbabilityBar from './ProbabilityBar.jsx';

const SURFACE_STYLES = {
  'Hard (Indoor)': { bg: 'rgba(59,130,246,0.1)', text: '#60C0FF', border: 'rgba(59,130,246,0.25)' },
  'Hard (Outdoor)': { bg: 'rgba(59,130,246,0.1)', text: '#60C0FF', border: 'rgba(59,130,246,0.25)' },
  'Clay':           { bg: 'rgba(249,115,22,0.1)', text: '#FF9B50', border: 'rgba(249,115,22,0.25)' },
  'Grass':          { bg: 'rgba(0,245,160,0.08)', text: '#00F5A0', border: 'rgba(0,245,160,0.2)' },
};

function formatMatchTime(t) {
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

function PlayerAvatar({ name }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const colors = [
    ['#6C63FF', '#9B5DE5'], ['#00F5A0', '#00D4FF'],
    ['#FF3366', '#FF6B35'], ['#FFD700', '#FF9500'],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xFFFFFF;
  const [from, to] = colors[hash % colors.length];
  return (
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white mx-auto mb-2"
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      {initials}
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function TennisCard({ fixture, index = 0 }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();

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

  const surfaceStyle = SURFACE_STYLES[fixture.surface] || SURFACE_STYLES['Hard (Indoor)'];
  const p1Outcome = fixture.outcomes[0];
  const p2Outcome = fixture.outcomes[1];

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial={index < 4 ? 'hidden' : 'visible'}
      animate="visible"
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(12,17,30,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        transition: 'all 0.25s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
        e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.5)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(108,99,255,0.12)', color: '#9B8FFF', border: '1px solid rgba(108,99,255,0.2)' }}
          >
            Tennis
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: surfaceStyle.bg, color: surfaceStyle.text, border: `1px solid ${surfaceStyle.border}` }}
          >
            {fixture.surface}
          </span>
        </div>

        {fixture.isLive ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,51,102,0.12)', border: '1px solid rgba(255,51,102,0.25)' }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full"
                style={{ backgroundColor: '#FF3366', opacity: 0.75 }}
              />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: '#FF3366' }} />
            </span>
            <span className="text-xs font-bold" style={{ color: '#FF3366' }}>LIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1" style={{ color: '#7B8CAA' }}>
            <Clock className="w-3 h-3" />
            <span className="text-xs">{formatDateLabel(fixture.matchTime)} {formatMatchTime(fixture.matchTime)}</span>
          </div>
        )}
      </div>

      {/* Competition + round */}
      <div className="px-4 pt-2 pb-1 flex items-center gap-2">
        <span className="text-xs font-semibold font-display" style={{ color: '#F0F6FF' }}>
          {fixture.competition}
        </span>
        {fixture.round && (
          <span className="text-xs" style={{ color: '#3A4560' }}>· {fixture.round}</span>
        )}
      </div>

      {/* Live set scores */}
      {fixture.isLive && fixture.liveScore && (
        <div
          className="mx-4 mb-3 rounded-xl px-4 py-2.5 flex items-center justify-center gap-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="text-xs font-medium truncate max-w-[80px] text-right" style={{ color: '#F0F6FF' }}>
            {fixture.player1.name.split(' ').pop()}
          </span>
          <div className="flex items-center gap-2">
            {fixture.liveScore.sets.map((set, i) => (
              <div key={i} className="flex items-center gap-0.5">
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: set.p1 > set.p2 ? '#F0F6FF' : '#3A4560' }}
                >
                  {set.p1}
                </span>
                <span style={{ color: '#3A4560', fontSize: '10px' }}>-</span>
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: set.p2 > set.p1 ? '#F0F6FF' : '#3A4560' }}
                >
                  {set.p2}
                </span>
                {i < fixture.liveScore.sets.length - 1 && (
                  <span style={{ color: '#3A4560', margin: '0 4px' }}>|</span>
                )}
              </div>
            ))}
          </div>
          <span className="text-xs font-medium truncate max-w-[80px]" style={{ color: '#F0F6FF' }}>
            {fixture.player2.name.split(' ').pop()}
          </span>
        </div>
      )}

      {/* H2H */}
      {fixture.headToHead && (
        <div className="flex items-center justify-center gap-2 px-4 pb-1">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#7B8CAA', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            H2H: {fixture.headToHead.player1Wins} – {fixture.headToHead.player2Wins}
          </span>
        </div>
      )}

      {/* Outcome buttons */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        {[
          { outcome: p1Outcome, player: fixture.player1 },
          { outcome: p2Outcome, player: fixture.player2 },
        ].map(({ outcome, player }) => {
          const selected = isSelected(fixture.id, outcome.id);
          return (
            <button
              key={outcome.id}
              onClick={() => handleOutcomeClick(outcome, player.name)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 cursor-pointer"
              style={
                selected
                  ? {
                      background: 'rgba(108,99,255,0.15)',
                      border: '1px solid rgba(108,99,255,0.6)',
                      boxShadow: '0 0 20px rgba(108,99,255,0.2)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
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
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <PlayerAvatar name={player.name} />
              {player.nationality && (
                <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: '#7B8CAA' }}>
                  {player.nationality}
                </span>
              )}
              <span className="text-sm font-bold text-center leading-tight font-display" style={{ color: '#F0F6FF' }}>
                {player.name}
              </span>
              {player.ranking && (
                <span className="text-[10px]" style={{ color: '#3A4560' }}>WR #{player.ranking}</span>
              )}
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

      {fixture.venue && (
        <div
          className="flex items-center justify-center gap-1.5 px-4 py-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <span className="text-xs" style={{ color: '#3A4560' }}>{fixture.venue}</span>
        </div>
      )}
    </motion.div>
  );
}
