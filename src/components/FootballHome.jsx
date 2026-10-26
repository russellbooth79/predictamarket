/**
 * FootballHome.jsx
 *
 * Football home feed, replacing the full-screen swipe feed:
 *   1. Big games — a horizontal carousel of full EventCards (live first,
 *      then the most-bet matches)
 *   2. Live now — compact MatchRows
 *   3. Daily challenge
 *   4. Coming up — compact MatchRows
 *   5. Casino link (users who chose casino at signup only; never time-based)
 */

import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import EventCard from './EventCard.jsx';
import MatchRow from './MatchRow.jsx';
import DailyChallengeCard from './DailyChallengeCard.jsx';
import { getBetCount } from '../utils/fixtureMeta.js';

const BIG_GAMES_COUNT = 3;

function SectionHeader({ title, subtitle, live = false, count }) {
  return (
    <div className="flex items-end justify-between mb-3 mt-7 first:mt-0">
      <div>
        <h2 className="text-lg font-black font-display flex items-center gap-2" style={{ color: '#F0F6FF' }}>
          {live && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FF3366' }} />}
          {title}
          {count != null && (
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#7B8CAA' }}>
              {count}
            </span>
          )}
        </h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#7B8CAA' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export default function FootballHome({ fixtures, intent, onViewMatch, onOpenCasino }) {
  // Big games: live matches first, then by how many bets they've drawn
  const { bigGames, live, upcoming } = useMemo(() => {
    const ranked = [...fixtures].sort((a, b) =>
      (b.isLive - a.isLive) || (getBetCount(b.id) - getBetCount(a.id))
    );
    const big = ranked.slice(0, BIG_GAMES_COUNT);
    const bigIds = new Set(big.map(f => f.id));
    const rest = fixtures.filter(f => !bigIds.has(f.id));
    return {
      bigGames: big,
      live: rest.filter(f => f.isLive),
      upcoming: rest
        .filter(f => !f.isLive)
        .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff)),
    };
  }, [fixtures]);

  return (
    <div>
      <SectionHeader title="Big games" subtitle="The ones everyone's betting on" />
      {/* Bleeds to the screen edge on mobile so the next card peeks in */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 pb-1">
        {bigGames.map((fixture, i) => (
          <div key={fixture.id} className="snap-start shrink-0 w-[86%] sm:w-[340px]">
            <EventCard fixture={fixture} index={i} onViewMatch={onViewMatch} />
          </div>
        ))}
      </div>

      {live.length > 0 && (
        <>
          <SectionHeader title="Live now" live count={live.length} />
          <div className="space-y-2">
            {live.map((f, i) => <MatchRow key={f.id} fixture={f} index={i} onViewMatch={onViewMatch} />)}
          </div>
        </>
      )}

      <div className="mt-7">
        <DailyChallengeCard index={0} />
      </div>

      {upcoming.length > 0 && (
        <>
          <SectionHeader title="Coming up" subtitle="Tap a price to add it to your slip" />
          <div className="space-y-2">
            {upcoming.map((f, i) => <MatchRow key={f.id} fixture={f} index={i} onViewMatch={onViewMatch} />)}
          </div>
        </>
      )}

      {intent !== 'sports' && (
        <button
          type="button"
          onClick={onOpenCasino}
          className="mt-7 w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left"
          style={{ background: 'rgb(12,17,30)', border: '1px solid rgba(108,99,255,0.25)' }}
        >
          <span className="text-2xl">🎲</span>
          <div className="flex-1">
            <p className="text-sm font-black font-display" style={{ color: '#F0F6FF' }}>Casino</p>
            <p className="text-xs" style={{ color: '#9B8FFF' }}>Live tables · Slots · Crash games</p>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: '#9B8FFF' }} />
        </button>
      )}
    </div>
  );
}
