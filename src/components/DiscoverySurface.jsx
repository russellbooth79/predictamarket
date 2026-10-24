/**
 * DiscoverySurface.jsx
 *
 * Top-of-feed discovery module for the Football tab.
 *
 * 1. LIVE NOW -- Horizontal scroll strip of live event mini-cards
 * 2. POPULAR RIGHT NOW -- Betting sentiment bars
 * 3. ALL FIXTURES header below (content rendered by parent)
 *
 * PredictaMarket v3 palette: electric indigo primary, deep navy surfaces.
 */

import { useMemo } from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import { initialBetActivity } from '../data/betActivity.js';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';

const C = {
  bg: '#080C14',
  card: '#0F1520',
  elevated: '#161E2E',
  border: '#1A2238',
  borderHover: '#252F45',
  primary: '#5B6EF5',
  primaryGlow: 'rgba(91,110,245,0.15)',
  liveRed: '#FF6B6B',
  green: '#A8FF3E',
  text: '#f0f4ff',
  textSecondary: '#8A97B4',
  textMuted: '#4a5568',
};

// -- LiveNowStrip -----------------------------------------------------------

function LiveNowStrip({ liveFixtures, onViewMatch }) {
  const { format } = useOddsFormat();

  if (liveFixtures.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: C.liveRed }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: C.liveRed }} />
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: C.liveRed }}>
          Live Now
        </h2>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(255,107,107,0.12)', color: C.liveRed }}
        >
          {liveFixtures.length}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {liveFixtures.map((fixture) => (
          <button
            key={fixture.id}
            onClick={() => onViewMatch?.(fixture)}
            className="shrink-0 w-64 rounded-2xl p-4 transition-all duration-200 cursor-pointer text-left"
            style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.borderHover;
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textSecondary }}>
                {fixture.competitionShort}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: C.liveRed }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: C.liveRed }} />
                </span>
                <span className="text-xs font-bold font-mono" style={{ color: C.liveRed }}>
                  {fixture.liveMinute}'
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{fixture.homeTeam}</p>
              </div>
              {fixture.liveScore && (
                <div className="flex items-center gap-1.5 mx-3">
                  <span className="font-mono text-lg font-bold" style={{ color: C.primary }}>{fixture.liveScore.home}</span>
                  <span style={{ color: C.textMuted }}>-</span>
                  <span className="font-mono text-lg font-bold" style={{ color: C.primary }}>{fixture.liveScore.away}</span>
                </div>
              )}
              <div className="flex-1 text-right">
                <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{fixture.awayTeam}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {fixture.outcomes.slice(0, 2).map((outcome) => (
                <div
                  key={outcome.id}
                  className="flex-1 rounded-lg px-2 py-1.5 text-center"
                  style={{ backgroundColor: C.elevated }}
                >
                  <span className="text-[10px] block truncate" style={{ color: C.textSecondary }}>{outcome.label}</span>
                  <span className="font-mono text-sm font-bold" style={{ color: C.primary }}>
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
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4" style={{ color: C.primary }} />
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: C.text }}>
          Popular Right Now
        </h2>
      </div>

      <div className="rounded-2xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: C.green }} />
          <span className="text-sm" style={{ color: C.textSecondary }}>
            <span className="font-mono font-bold" style={{ color: C.text }}>
              {displayBetCount.toLocaleString()}
            </span>{' '}
            bets placed in last 10 mins
          </span>
        </div>

        <div className="space-y-3">
          {sentiment.topOutcomes.map((outcome, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: C.text }}>{outcome.label}</span>
                <span className="font-mono text-sm font-bold" style={{ color: C.primary }}>{outcome.percentage}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.elevated }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${outcome.percentage}%`,
                    background: `linear-gradient(90deg, ${C.primary} 0%, #7082F8 100%)`,
                  }}
                />
              </div>
              <span className="text-[10px] mt-0.5 block" style={{ color: C.textMuted }}>{outcome.fixtureName}</span>
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

      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: C.textSecondary }}>
          All Fixtures
        </h2>
        <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
      </div>
    </div>
  );
}
