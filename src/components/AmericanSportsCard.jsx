/**
 * AmericanSportsCard.jsx — PredictaMarket v4
 * NFL / NBA glassmorphism card with team color accents.
 */

import { Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';
import ProbabilityBar from './ProbabilityBar.jsx';

const TEAM_COLORS = {
  'Dallas Cowboys': '#003594', 'Philadelphia Eagles': '#004C54',
  'Kansas City Chiefs': '#E31837', 'Baltimore Ravens': '#241773',
  'San Francisco 49ers': '#AA0000', 'Green Bay Packers': '#203731',
  'Buffalo Bills': '#00338D', 'Miami Dolphins': '#008E97',
  'Detroit Lions': '#0076B6', 'New York Giants': '#0B2265',
  'Chicago Bears': '#0B1C3E', 'Seattle Seahawks': '#002244',
  'Los Angeles Lakers': '#552583', 'Golden State Warriors': '#1D428A',
  'Boston Celtics': '#007A33', 'Milwaukee Bucks': '#00471B',
  'Denver Nuggets': '#0E2240', 'Oklahoma City Thunder': '#007AC1',
  'Phoenix Suns': '#1D1160', 'Miami Heat': '#98002E',
  'New York Knicks': '#006BB6', 'Chicago Bulls': '#CE1141',
};

function getTeamColor(name) {
  return TEAM_COLORS[name] || '#2A3654';
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
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function AmericanSportsCard({ fixture, index = 0 }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();

  const isNfl = fixture.sport === 'nfl' || fixture.sport === 'americanfootball';
  const sportLabel = isNfl ? 'NFL' : 'NBA';
  const timeStr = fixture.gameTime || fixture.kickoff;
  const homeColor = getTeamColor(fixture.homeTeam);
  const awayColor = getTeamColor(fixture.awayTeam);

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
            {sportLabel}
          </span>
          {fixture.conference && (
            <span className="text-xs" style={{ color: '#3A4560' }}>{fixture.conference}</span>
          )}
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
            <span className="text-xs font-bold" style={{ color: '#FF3366' }}>
              {fixture.quarter ? `Q${fixture.quarter}` : 'LIVE'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1" style={{ color: '#7B8CAA' }}>
            <Clock className="w-3 h-3" />
            <span className="text-xs">{formatDateLabel(timeStr)} {formatTime(timeStr)}</span>
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="px-4 py-5">
        <div className="flex items-center justify-between">
          {/* Home team */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
              style={{
                background: `linear-gradient(135deg, ${homeColor} 0%, ${homeColor}99 100%)`,
                boxShadow: `0 4px 12px ${homeColor}40`,
              }}
            >
              {fixture.homeTeam.split(' ').pop().slice(0, 3).toUpperCase()}
            </div>
            <div>
              <span className="text-base font-bold block font-display" style={{ color: '#F0F6FF' }}>
                {fixture.homeTeam}
              </span>
              {fixture.spread && (
                <span className="font-mono text-xs" style={{ color: '#3A4560' }}>{fixture.spread.home}</span>
              )}
            </div>
          </div>

          {/* Score / VS */}
          {fixture.isLive && fixture.liveScore ? (
            <div className="flex items-center gap-3 mx-3">
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
              <span style={{ color: '#3A4560' }}>–</span>
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
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mx-3"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#3A4560', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              vs
            </div>
          )}

          {/* Away team */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="text-right">
              <span className="text-base font-bold block font-display" style={{ color: '#F0F6FF' }}>
                {fixture.awayTeam}
              </span>
              {fixture.spread && (
                <span className="font-mono text-xs" style={{ color: '#3A4560' }}>{fixture.spread.away}</span>
              )}
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
              style={{
                background: `linear-gradient(135deg, ${awayColor} 0%, ${awayColor}99 100%)`,
                boxShadow: `0 4px 12px ${awayColor}40`,
              }}
            >
              {fixture.awayTeam.split(' ').pop().slice(0, 3).toUpperCase()}
            </div>
          </div>
        </div>

        {fixture.overUnder && (
          <div className="flex items-center justify-center mt-3 gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#7B8CAA', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              O/U {fixture.overUnder}
            </span>
          </div>
        )}
      </div>

      {/* Outcomes */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {fixture.outcomes.map((outcome) => {
          const selected = isSelected(fixture.id, outcome.id);
          return (
            <button
              key={outcome.id}
              onClick={() => handleOutcomeClick(outcome)}
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
              <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: '#7B8CAA' }}>
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

      {fixture.venue && (
        <div
          className="flex items-center justify-center gap-1.5 px-4 py-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <MapPin className="w-3 h-3" style={{ color: '#3A4560' }} />
          <span className="text-xs" style={{ color: '#3A4560' }}>{fixture.venue}</span>
        </div>
      )}
    </motion.div>
  );
}
