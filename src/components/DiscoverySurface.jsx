/**
 * DiscoverySurface.jsx — PredictaMarket v4
 * Live strip + popular sentiment, glassmorphism design.
 */

import { useMemo } from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import { initialBetActivity } from '../data/betActivity.js';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';

// -- LiveNowStrip -----------------------------------------------------------

function LiveNowStrip({ liveFixtures, onViewMatch }) {
  const { format } = useOddsFormat();

  if (liveFixtures.length === 0) return null;

  return (
    <div className="mb-7">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full"
            style={{ backgroundColor: '#FF3366', opacity: 0.75 }}
          />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: '#FF3366' }} />
        </span>
        <h2
          className="text-sm font-black uppercase tracking-widest"
          style={{ color: '#FF3366' }}
        >
          Live Now
        </h2>
        <span
          className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,51,102,0.12)', color: '#FF3366', border: '1px solid rgba(255,51,102,0.2)' }}
        >
          {liveFixtures.length}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {liveFixtures.map((fixture) => (
          <button
            key={fixture.id}
            onClick={() => onViewMatch?.(fixture)}
            className="shrink-0 w-64 rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer"
            style={{
              background: 'rgba(12,17,30,0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 0 0 1px rgba(255,51,102,0.08), 0 4px 20px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,51,102,0.3)';
              e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,51,102,0.15), 0 8px 30px rgba(0,0,0,0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,51,102,0.08), 0 4px 20px rgba(0,0,0,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Live bar */}
            <div
              className="h-0.5 w-full rounded-full mb-3"
              style={{ background: 'linear-gradient(90deg, #FF3366 0%, transparent 100%)' }}
            />

            <div className="flex items-center justify-between mb-2.5">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#7B8CAA' }}
              >
                {fixture.competitionShort}
              </span>
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full"
                    style={{ backgroundColor: '#FF3366', opacity: 0.75 }}
                  />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: '#FF3366' }} />
                </span>
                <span className="text-xs font-black font-mono" style={{ color: '#FF3366' }}>
                  {fixture.liveMinute}'
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold truncate flex-1 font-display" style={{ color: '#F0F6FF' }}>
                {fixture.homeTeam}
              </p>
              {fixture.liveScore && (
                <div className="flex items-center gap-1.5 mx-2 shrink-0">
                  <span
                    className="font-mono text-lg font-black"
                    style={{
                      background: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {fixture.liveScore.home}
                  </span>
                  <span style={{ color: '#3A4560', fontSize: '12px' }}>–</span>
                  <span
                    className="font-mono text-lg font-black"
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
              )}
              <p className="text-sm font-bold truncate flex-1 text-right font-display" style={{ color: '#F0F6FF' }}>
                {fixture.awayTeam}
              </p>
            </div>

            <div className="flex gap-2">
              {fixture.outcomes.slice(0, 2).map((outcome) => (
                <div
                  key={outcome.id}
                  className="flex-1 rounded-xl px-2 py-2 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-[9px] block uppercase tracking-widest mb-0.5" style={{ color: '#7B8CAA' }}>
                    {outcome.label}
                  </span>
                  <span
                    className="font-mono text-sm font-black"
                    style={{
                      background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {formatOdds(outcome.probability, format)}
                  </span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// -- PopularRightNow --------------------------------------------------------

function computeSentiment() {
  const outcomeCounts = {};
  for (const bet of initialBetActivity) {
    const key = `${bet.fixtureId}|${bet.outcomeId}|${bet.outcome}`;
    if (!outcomeCounts[key]) {
      outcomeCounts[key] = {
        label: bet.outcome,
        fixtureName: bet.fixtureName,
        count: 0,
        probability: bet.probability,
      };
    }
    outcomeCounts[key].count += 1;
  }
  const total = initialBetActivity.length;
  const sorted = Object.values(outcomeCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  return {
    totalBets: total,
    topOutcomes: sorted.map((item) => ({
      ...item,
      percentage: Math.round((item.count / total) * 100),
    })),
  };
}

function PopularRightNow() {
  const sentiment = useMemo(() => computeSentiment(), []);
  const displayBetCount = sentiment.totalBets * 12;

  return (
    <div className="mb-7">
      <div className="flex items-center gap-2.5 mb-4">
        <Flame className="w-4 h-4" style={{ color: '#FF9500' }} />
        <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#F0F6FF' }}>
          Trending
        </h2>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(12,17,30,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: '#00F5A0' }} />
          <span className="text-xs" style={{ color: '#7B8CAA' }}>
            <span
              className="font-mono font-black"
              style={{
                background: 'linear-gradient(135deg, #00F5A0 0%, #00D4FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {displayBetCount.toLocaleString()}
            </span>{' '}
            bets placed in the last 10 mins
          </span>
        </div>

        <div className="space-y-4">
          {sentiment.topOutcomes.map((outcome, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold font-display" style={{ color: '#F0F6FF' }}>
                  {outcome.label}
                </span>
                <span
                  className="font-mono text-sm font-black"
                  style={{
                    background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {outcome.percentage}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${outcome.percentage}%`,
                    background: i === 0
                      ? 'linear-gradient(90deg, #6C63FF 0%, #B06FFF 100%)'
                      : i === 1
                        ? 'linear-gradient(90deg, #00F5A0 0%, #00D4FF 100%)'
                        : 'linear-gradient(90deg, #FF6B35 0%, #FF3366 100%)',
                  }}
                />
              </div>
              <span className="text-[10px] mt-1 block" style={{ color: '#3A4560' }}>
                {outcome.fixtureName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -- Main Component ---------------------------------------------------------

export default function DiscoverySurface({ liveFixtures, onViewMatch }) {
  return (
    <div>
      <LiveNowStrip liveFixtures={liveFixtures} onViewMatch={onViewMatch} />
      <PopularRightNow />

      <div className="flex items-center gap-3 mb-5">
        <h2
          className="text-xs font-black uppercase tracking-widest shrink-0"
          style={{ color: '#3A4560' }}
        >
          All Fixtures
        </h2>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  );
}
