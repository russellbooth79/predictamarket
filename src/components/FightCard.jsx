/**
 * FightCard.jsx — PredictaMarket v4
 * Fight poster aesthetic. Dramatic gradients, fighter vs fighter layout.
 */

import { Zap, Award, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';
import ProbabilityBar from './ProbabilityBar.jsx';

const FLAG_MAP = {
  GBR: '🇬🇧', UKR: '🇺🇦', USA: '🇺🇸', MEX: '🇲🇽',
  RUS: '🇷🇺', BRA: '🇧🇷', CHN: '🇨🇳', JPN: '🇯🇵',
  IRL: '🇮🇪', AUS: '🇦🇺', CAN: '🇨🇦', NIG: '🇳🇬',
};

function formatEventDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

function FighterAvatar({ name, nationality }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const colors = [
    ['#6C63FF', '#9B5DE5'],
    ['#FF3366', '#FF6B35'],
    ['#00F5A0', '#00D4FF'],
    ['#FFD700', '#FF9500'],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xFFFFFF;
  const [from, to] = colors[hash % colors.length];
  return (
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white mx-auto mb-2"
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      {initials}
    </div>
  );
}

export default function FightCard({ fixture, index = 0 }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();

  const f1 = fixture.fighter1 || { name: fixture.homeTeam, nationality: '', record: '', weightClass: '' };
  const f2 = fixture.fighter2 || { name: fixture.awayTeam, nationality: '', record: '', weightClass: '' };
  const o1 = fixture.outcomes[0];
  const o2 = fixture.outcomes[1];

  function handleClick(outcome, fighterName) {
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
            style={{ background: 'rgba(255,51,102,0.12)', color: '#FF7096', border: '1px solid rgba(255,51,102,0.2)' }}
          >
            {fixture.competitionShort}
          </span>
          {f1.weightClass && (
            <span className="text-xs" style={{ color: '#7B8CAA' }}>{f1.weightClass}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {fixture.isTitleFight && (
            <div className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" style={{ color: '#FFD700' }} />
              <span className="text-[10px] font-bold uppercase tracking-wider gradient-text-gold">
                Title Fight
              </span>
            </div>
          )}
          {fixture.eventDate && (
            <div className="flex items-center gap-1" style={{ color: '#7B8CAA' }}>
              <Clock className="w-3 h-3" />
              <span className="text-xs">{formatEventDate(fixture.eventDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Title fight belt info */}
      {fixture.isTitleFight && fixture.beltInfo && (
        <div
          className="px-4 py-2 text-center"
          style={{
            background: 'linear-gradient(90deg, rgba(255,215,0,0.06) 0%, rgba(255,149,0,0.06) 100%)',
            borderBottom: '1px solid rgba(255,215,0,0.1)',
          }}
        >
          <span className="text-xs font-semibold gradient-text-gold">{fixture.beltInfo}</span>
        </div>
      )}

      {/* Fighters */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <FighterAvatar name={f1.name} nationality={f1.nationality} />
            {f1.nationality && (
              <span className="text-base mb-0.5 block">{FLAG_MAP[f1.nationality] || ''}</span>
            )}
            <h3
              className="text-base font-bold leading-tight font-display"
              style={{ color: '#F0F6FF' }}
            >
              {f1.name}
            </h3>
            {f1.record && (
              <span
                className="font-mono text-xs mt-0.5 block"
                style={{ color: '#7B8CAA' }}
              >
                {f1.record}
              </span>
            )}
          </div>

          {/* VS badge */}
          <div className="flex flex-col items-center mx-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Zap className="w-4 h-4" style={{ color: '#6C63FF' }} />
            </div>
            <span
              className="text-[10px] font-black uppercase tracking-widest mt-1.5"
              style={{ color: '#6B7894' }}
            >
              VS
            </span>
          </div>

          <div className="flex-1 text-center">
            <FighterAvatar name={f2.name} nationality={f2.nationality} />
            {f2.nationality && (
              <span className="text-base mb-0.5 block">{FLAG_MAP[f2.nationality] || ''}</span>
            )}
            <h3
              className="text-base font-bold leading-tight font-display"
              style={{ color: '#F0F6FF' }}
            >
              {f2.name}
            </h3>
            {f2.record && (
              <span
                className="font-mono text-xs mt-0.5 block"
                style={{ color: '#7B8CAA' }}
              >
                {f2.record}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Outcome buttons */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {[{ outcome: o1, fighter: f1 }, { outcome: o2, fighter: f2 }].map(({ outcome, fighter }) => {
          const selected = isSelected(fixture.id, outcome.id);
          return (
            <button
              key={outcome.id}
              onClick={() => handleClick(outcome, fighter.name)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 cursor-pointer"
              style={
                selected
                  ? {
                      background: 'rgba(198,255,61,0.10)',
                      border: '1px solid var(--action)',
                      boxShadow: '0 0 20px rgba(198,255,61,0.15)',
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
              <span
                className="text-[10px] uppercase tracking-widest font-medium"
                style={{ color: '#7B8CAA' }}
              >
                {fighter.name.split(' ').pop()} Win
              </span>
              <span
                className="font-mono text-2xl font-black"
                style={
                  selected
                    ? {
                        color: 'var(--action)',
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
          className="px-4 py-2 text-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <span className="text-xs" style={{ color: '#6B7894' }}>{fixture.venue}</span>
        </div>
      )}
    </motion.div>
  );
}
