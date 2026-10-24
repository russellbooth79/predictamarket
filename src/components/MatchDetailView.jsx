/**
 * MatchDetailView.jsx — PredictaMarket v4
 *
 * Tabbed match centre: Overview | Markets | Live Feed | Timeline
 * Full v4 dark sport-futurism palette — no legacy v3 greys.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp, TrendingUp, Users, BarChart3, Clock } from 'lucide-react';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';
import { getProbabilityTextColour } from '../data/oddsUtils.js';
import { generateBetActivity, initialBetActivity, FEED_POLL_INTERVAL_MS, HIGH_ROLLER_STAKE_THRESHOLD } from '../data/betActivity.js';
import NarrativePrompts from './NarrativePrompts.jsx';
import BookmakerOddsPanel from './BookmakerOddsPanel.jsx';

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  bg: 'rgba(10,14,28,0.9)',
  border: 'rgba(108,99,255,0.18)',
  borderFaint: 'rgba(255,255,255,0.06)',
  primary: '#6C63FF',
  text: '#F0F6FF',
  textSub: '#7B8CAA',
  textMuted: '#3A4560',
  live: '#FF3366',
  green: '#00F5A0',
  home: '#6C63FF',
  away: '#FF3366',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMatchDate(kickoff) {
  const date = new Date(kickoff);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
  return h;
}

const TEAM_ACCENTS = ['#6C63FF', '#FF3366', '#00F5A0', '#00D4FF', '#FF9500', '#9B5DE5', '#FF6B35'];

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: 'Overview',  Icon: BarChart3 },
  { id: 'markets',   label: 'Markets',   Icon: TrendingUp },
  { id: 'feed',      label: 'Live Feed', Icon: Users },
  { id: 'timeline',  label: 'Timeline',  Icon: Clock },
];

// ── Match header ──────────────────────────────────────────────────────────────

function MatchHeader({ fixture, detail }) {
  const homeAccent = TEAM_ACCENTS[simpleHash(fixture.homeTeam) % TEAM_ACCENTS.length];
  const awayAccent = TEAM_ACCENTS[simpleHash(fixture.awayTeam) % TEAM_ACCENTS.length];
  const homeInitials = fixture.homeTeam.split(' ').map(w => w[0]).join('').slice(0, 3);
  const awayInitials = fixture.awayTeam.split(' ').map(w => w[0]).join('').slice(0, 3);

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: C.bg, border: `1px solid ${C.border}` }}
    >
      {/* Top accent bar */}
      <div
        className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, ${homeAccent}, ${awayAccent})` }}
      />

      {/* Competition + live badge */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.borderFaint}` }}>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(108,99,255,0.12)', color: '#9B8FFF', border: `1px solid ${C.border}` }}
          >
            {fixture.competitionShort || fixture.competition}
          </span>
          <span className="text-xs" style={{ color: C.textSub }}>
            {formatMatchDate(fixture.kickoff)}
          </span>
          {detail?.venue && (
            <span className="text-xs hidden sm:inline" style={{ color: C.textMuted }}>· {detail.venue}</span>
          )}
        </div>

        {fixture.isLive && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: C.live }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: C.live }} />
            </span>
            <span className="text-xs font-black" style={{ color: C.live }}>LIVE {fixture.liveMinute}'</span>
          </div>
        )}
      </div>

      {/* Teams + score */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-4">
          {/* Home */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black text-white"
              style={{ background: `linear-gradient(135deg, ${homeAccent}, rgba(0,0,0,0.4))`, boxShadow: `0 4px 16px ${homeAccent}44` }}
            >
              {homeInitials}
            </div>
            <p className="text-sm font-black font-display text-center leading-tight" style={{ color: C.text }}>{fixture.homeTeam}</p>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            {fixture.isLive && fixture.liveScore ? (
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-4xl font-black"
                  style={{
                    background: `linear-gradient(135deg, ${homeAccent}, ${awayAccent})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {fixture.liveScore.home}
                </span>
                <span className="text-xl font-bold" style={{ color: C.textMuted }}>–</span>
                <span
                  className="font-mono text-4xl font-black"
                  style={{
                    background: `linear-gradient(135deg, ${homeAccent}, ${awayAccent})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {fixture.liveScore.away}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black font-display" style={{ color: C.textMuted }}>vs</span>
                <span className="text-xs" style={{ color: C.textMuted }}>
                  {new Date(fixture.kickoff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black text-white"
              style={{ background: `linear-gradient(135deg, ${awayAccent}, rgba(0,0,0,0.4))`, boxShadow: `0 4px 16px ${awayAccent}44` }}
            >
              {awayInitials}
            </div>
            <p className="text-sm font-black font-display text-center leading-tight" style={{ color: C.text }}>{fixture.awayTeam}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ fixture, detail }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();

  function handleOutcome(outcome) {
    addSelection({
      eventId: fixture.id,
      eventName: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
      outcomeId: outcome.id,
      outcomeName: outcome.label,
      probability: outcome.probability,
      decimalOdds: 1 / (outcome.probability / 100),
      sport: 'football',
    });
  }

  return (
    <div className="space-y-4">
      <NarrativePrompts fixture={fixture} detail={detail} />

      {/* Match odds */}
      <div
        className="rounded-2xl p-4"
        style={{ background: C.bg, border: `1px solid ${C.border}` }}
      >
        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#9B8FFF' }}>Match Result</p>
        <div className="grid grid-cols-3 gap-2">
          {fixture.outcomes.map(outcome => {
            const selected = isSelected(fixture.id, outcome.id);
            return (
              <button
                key={outcome.id}
                onClick={() => handleOutcome(outcome)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200"
                style={{
                  background: selected ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.03)',
                  border: selected ? '1px solid rgba(108,99,255,0.5)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: selected ? '0 0 16px rgba(108,99,255,0.2)' : 'none',
                }}
              >
                <span className="text-xs font-semibold" style={{ color: C.textSub }}>{outcome.label}</span>
                <span
                  className="font-mono text-xl font-black"
                  style={{
                    background: selected ? 'linear-gradient(135deg, #6C63FF, #B06FFF)' : 'none',
                    WebkitBackgroundClip: selected ? 'text' : 'unset',
                    WebkitTextFillColor: selected ? 'transparent' : C.text,
                    backgroundClip: selected ? 'text' : 'unset',
                    color: selected ? 'transparent' : C.text,
                  }}
                >
                  {formatOdds(outcome.probability, format)}
                </span>
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${outcome.probability}%`,
                      background: `linear-gradient(90deg, ${C.primary}, #B06FFF)`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{outcome.probability}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Probability graph */}
      {detail?.probabilityHistory && detail.probabilityHistory.length >= 2 && (
        <OddsGraph
          history={detail.probabilityHistory}
          isLive={fixture.isLive}
          homeTeam={fixture.homeTeam}
          awayTeam={fixture.awayTeam}
        />
      )}

      {/* Stats summary */}
      {detail?.stats && (
        <MatchStats stats={detail.stats} homeTeam={fixture.homeTeam} awayTeam={fixture.awayTeam} />
      )}
    </div>
  );
}

// ── Markets Tab ───────────────────────────────────────────────────────────────

function MarketsTab({ fixture, detail }) {
  const bookmakers = fixture.bookmakers || [];
  const markets = detail?.markets || [];

  return (
    <div className="space-y-4">
      {bookmakers.length > 0 && (
        <BookmakerOddsPanel
          bookmakers={bookmakers}
          homeTeam={fixture.homeTeam}
          awayTeam={fixture.awayTeam}
        />
      )}
      {markets.length > 0 && (
        <MoreMarkets markets={markets} fixture={fixture} />
      )}
      {bookmakers.length === 0 && markets.length === 0 && (
        <div
          className="rounded-2xl p-8 flex flex-col items-center text-center"
          style={{ background: C.bg, border: `1px solid ${C.border}` }}
        >
          <TrendingUp className="w-8 h-8 mb-3" style={{ color: C.textMuted }} />
          <p className="text-sm font-bold" style={{ color: C.textSub }}>No extra markets for this fixture</p>
        </div>
      )}
    </div>
  );
}

// ── Live Bet Feed Tab ─────────────────────────────────────────────────────────

function FeedTab({ fixture }) {
  const [items, setItems] = useState(() => {
    const forFixture = initialBetActivity.filter(b => b.fixtureId === fixture.id);
    const others = initialBetActivity.filter(b => b.fixtureId !== fixture.id).slice(0, 15 - forFixture.length);
    return [...forFixture, ...others].slice(0, 15);
  });
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setItems(prev => [generateBetActivity(fixture), ...prev].slice(0, 15));
    }, FEED_POLL_INTERVAL_MS + Math.random() * 2000);
    return () => clearInterval(intervalRef.current);
  }, [fixture, paused]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: C.bg, border: `1px solid ${C.border}` }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${C.borderFaint}` }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: C.live }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: C.live }} />
        </span>
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9B8FFF' }}>Live Bet Feed</p>
      </div>

      <div className="divide-y" style={{ '--tw-divide-color': C.borderFaint }}>
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="px-4 py-3 transition-all duration-300"
            style={{ animation: idx === 0 ? 'slide-in-top 0.3s ease-out' : undefined }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0"
                style={{ background: 'rgba(108,99,255,0.12)', color: '#9B8FFF', border: `1px solid ${C.border}` }}
              >
                {item.user.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed" style={{ color: C.textSub }}>
                  <span className="font-bold" style={{ color: C.text }}>{item.user}</span>
                  {' placed '}
                  <span className="font-mono font-black" style={{ color: '#9B8FFF' }}>£{item.stake}</span>
                  {' on '}
                  <span className="font-semibold" style={{ color: C.text }}>{item.outcome}</span>
                  {' '}
                  <span style={{ color: C.textMuted }}>({item.probability}%)</span>
                  {item.stake >= HIGH_ROLLER_STAKE_THRESHOLD && (
                    <span
                      className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-black"
                      style={{ background: 'rgba(108,99,255,0.15)', color: '#9B8FFF', border: `1px solid ${C.border}` }}
                    >
                      HIGH ROLLER
                    </span>
                  )}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>{timeAgo(item.timestamp)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Timeline Tab ──────────────────────────────────────────────────────────────

function TimelineTab({ events, homeTeam, awayTeam }) {
  if (!events || events.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center text-center"
        style={{ background: C.bg, border: `1px solid ${C.border}` }}
      >
        <Clock className="w-8 h-8 mb-3" style={{ color: C.textMuted }} />
        <p className="text-sm font-bold" style={{ color: C.textSub }}>No timeline events yet</p>
        <p className="text-xs mt-1" style={{ color: C.textMuted }}>Events appear here during live play</p>
      </div>
    );
  }

  function getEventIcon(type) {
    switch (type) {
      case 'goal': return '⚽';
      case 'yellow_card': return '🟨';
      case 'red_card': return '🟥';
      case 'whistle': return '🔔';
      case 'chance': return '🎯';
      default: return '⚪';
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: C.bg, border: `1px solid ${C.border}` }}
    >
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.borderFaint}` }}>
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9B8FFF' }}>Match Timeline</p>
      </div>
      <div>
        {events.map((event, i) => {
          const isHome = event.team === 'home';
          const isAway = event.team === 'away';
          const isNeutral = !event.team;
          return (
            <div
              key={`${event.minute}-${event.type}-${i}`}
              className="flex items-start gap-3 px-4 py-3"
              style={{ borderBottom: i < events.length - 1 ? `1px solid ${C.borderFaint}` : 'none' }}
            >
              <div className="flex-1 text-right">
                {isHome && (
                  <div>
                    <span className="text-sm font-bold" style={{ color: C.text }}>{event.player}</span>
                    {event.assist && (
                      <span className="text-xs block" style={{ color: C.textSub }}>Assist: {event.assist}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center shrink-0 w-12">
                <span className="font-mono text-xs font-black" style={{ color: isNeutral ? C.textSub : C.primary }}>
                  {event.minute}'
                </span>
                <span className="text-base leading-none mt-0.5">{getEventIcon(event.type)}</span>
              </div>
              <div className="flex-1">
                {isAway && (
                  <div>
                    <span className="text-sm font-bold" style={{ color: C.text }}>{event.player}</span>
                    {event.assist && (
                      <span className="text-xs block" style={{ color: C.textSub }}>Assist: {event.assist}</span>
                    )}
                  </div>
                )}
                {isNeutral && (
                  <span className="text-xs italic" style={{ color: C.textSub }}>{event.description}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Odds Graph ────────────────────────────────────────────────────────────────

function OddsGraph({ history, isLive, homeTeam, awayTeam }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!history || history.length < 2) return null;

  const W = 800, H = 200, PAD = { top: 16, bottom: 28, left: 36, right: 16 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  const usesMinute = history[0].minute !== undefined;
  const getX = p => usesMinute ? p.minute : (24 - (p.hoursAgo || 0));
  const xVals = history.map(getX);
  const xMin = Math.min(...xVals), xMax = Math.max(...xVals), xRange = xMax - xMin || 1;

  const toSvgX = v => PAD.left + ((v - xMin) / xRange) * CW;
  const toSvgY = p => PAD.top + CH - (p / 100) * CH;

  function buildPath(key) {
    const pts = history.map(p => ({ x: toSvgX(getX(p)), y: toSvgY(p[key]) }));
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1], curr = pts[i];
      const cpx = (curr.x - prev.x) / 3;
      d += ` C ${prev.x + cpx} ${prev.y}, ${curr.x - cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }

  const hoverPoint = hoverIdx !== null ? history[hoverIdx] : null;

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: C.bg, border: `1px solid ${C.border}` }}
    >
      <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#9B8FFF' }}>Probability Movement</p>

      <div className="flex items-center gap-5 mb-3 flex-wrap">
        {[
          { label: homeTeam, color: '#6C63FF' },
          { label: 'Draw', color: '#7B8CAA' },
          { label: awayTeam, color: '#FF3366' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ background: l.color }} />
            <span className="text-xs" style={{ color: C.textSub }}>{l.label}</span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxHeight: '200px' }}
        onMouseMove={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const fraction = ((e.clientX - rect.left) / rect.width * W - PAD.left) / CW;
          const idx = Math.round(fraction * (history.length - 1));
          setHoverIdx(Math.max(0, Math.min(history.length - 1, idx)));
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {[0, 25, 50, 75, 100].map(val => (
          <g key={val}>
            <line x1={PAD.left} y1={toSvgY(val)} x2={W - PAD.right} y2={toSvgY(val)}
              stroke="rgba(108,99,255,0.08)" strokeWidth="0.5" strokeDasharray="4 4" />
            <text x={PAD.left - 5} y={toSvgY(val) + 4} fill="#3A4560" fontSize="9" textAnchor="end" fontFamily="monospace">
              {val}%
            </text>
          </g>
        ))}

        <path d={buildPath('home')} fill="none" stroke="#6C63FF" strokeWidth="2.5" strokeLinejoin="round" />
        <path d={buildPath('draw')} fill="none" stroke="#7B8CAA" strokeWidth="1.5" strokeLinejoin="round" opacity="0.7" />
        <path d={buildPath('away')} fill="none" stroke="#FF3366" strokeWidth="2" strokeLinejoin="round" />

        {hoverPoint && (() => {
          const hx = toSvgX(getX(hoverPoint));
          return (
            <g>
              <line x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + CH}
                stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <circle cx={hx} cy={toSvgY(hoverPoint.home)} r="4" fill="#6C63FF" />
              <circle cx={hx} cy={toSvgY(hoverPoint.draw)} r="3" fill="#7B8CAA" />
              <circle cx={hx} cy={toSvgY(hoverPoint.away)} r="3.5" fill="#FF3366" />
              <rect x={hx + 8} y={PAD.top} width="82" height="52" rx="6"
                fill="rgba(10,14,28,0.95)" stroke="rgba(108,99,255,0.3)" strokeWidth="1" />
              <text x={hx + 15} y={PAD.top + 16} fill="#6C63FF" fontSize="10" fontFamily="monospace">H: {hoverPoint.home}%</text>
              <text x={hx + 15} y={PAD.top + 30} fill="#7B8CAA" fontSize="10" fontFamily="monospace">D: {hoverPoint.draw}%</text>
              <text x={hx + 15} y={PAD.top + 44} fill="#FF3366" fontSize="10" fontFamily="monospace">A: {hoverPoint.away}%</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ── Match Stats ───────────────────────────────────────────────────────────────

function MatchStats({ stats, homeTeam, awayTeam }) {
  if (!stats) return null;

  function StatRow({ label, home, away }) {
    const total = home + away || 1;
    return (
      <div className="py-2.5" style={{ borderBottom: `1px solid ${C.borderFaint}` }}>
        <div className="flex items-center gap-3 mb-1.5">
          <span className="font-mono text-sm font-black w-8 text-right" style={{ color: C.text }}>{home}</span>
          <span className="flex-1 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: C.textMuted }}>{label}</span>
          <span className="font-mono text-sm font-black w-8" style={{ color: C.text }}>{away}</span>
        </div>
        <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5 mx-8">
          <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${(home / total) * 100}%`, background: 'linear-gradient(90deg, #6C63FF, #9B5DE5)' }} />
          <div className="h-full rounded-r-full transition-all duration-700" style={{ width: `${(away / total) * 100}%`, background: 'linear-gradient(90deg, #FF6B35, #FF3366)' }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: C.bg, border: `1px solid ${C.border}` }}
    >
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.borderFaint}` }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9B8FFF' }}>Match Stats</p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-semibold" style={{ color: C.textSub }}>{homeTeam}</span>
          <span className="text-xs font-semibold" style={{ color: C.textSub }}>{awayTeam}</span>
        </div>
      </div>

      {/* Possession bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-sm font-black" style={{ color: C.text }}>{stats.possession.home}%</span>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textMuted }}>Possession</span>
          <span className="font-mono text-sm font-black" style={{ color: C.text }}>{stats.possession.away}%</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${stats.possession.home}%`, background: 'linear-gradient(90deg, #6C63FF, #9B5DE5)' }} />
          <div className="h-full rounded-r-full transition-all duration-700" style={{ width: `${stats.possession.away}%`, background: 'linear-gradient(90deg, #FF6B35, #FF3366)' }} />
        </div>
      </div>

      <div className="px-4 pb-2">
        <StatRow label="Shots" home={stats.shots.home} away={stats.shots.away} />
        <StatRow label="On Target" home={stats.shotsOnTarget.home} away={stats.shotsOnTarget.away} />
        <StatRow label="Corners" home={stats.corners.home} away={stats.corners.away} />
        <StatRow label="Fouls" home={stats.fouls.home} away={stats.fouls.away} />
        <StatRow label="Yellows" home={stats.yellowCards.home} away={stats.yellowCards.away} />
        <StatRow label="Reds" home={stats.redCards.home} away={stats.redCards.away} />
        {stats.xG && <StatRow label="xG" home={stats.xG.home} away={stats.xG.away} />}
      </div>
    </div>
  );
}

// ── More Markets ──────────────────────────────────────────────────────────────

function MoreMarkets({ markets, fixture }) {
  const [expanded, setExpanded] = useState({});
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();

  function handleOutcomeClick(market, outcome) {
    addSelection({
      eventId: fixture.id,
      eventName: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
      outcomeId: `${market.id}-${outcome.id}`,
      outcomeName: `${outcome.label} (${market.name})`,
      probability: outcome.probability,
      decimalOdds: outcome.decimalOdds,
      sport: 'football',
    });
  }

  if (!markets || markets.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: C.bg, border: `1px solid ${C.border}` }}
    >
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.borderFaint}` }}>
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9B8FFF' }}>More Markets</p>
      </div>

      {markets.map(market => {
        const isExpanded = expanded[market.id] ?? false;
        const isSettled = market.settled === true;

        return (
          <div key={market.id} style={{ borderBottom: `1px solid ${C.borderFaint}` }}>
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [market.id]: !prev[market.id] }))}
              className="w-full flex items-center justify-between px-4 py-3 transition-colors"
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: C.text }}>{market.name}</span>
                {isSettled && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase"
                    style={{ background: 'rgba(0,245,160,0.12)', color: '#00F5A0', border: '1px solid rgba(0,245,160,0.2)' }}
                  >
                    Settled
                  </span>
                )}
              </div>
              {isExpanded
                ? <ChevronUp className="w-4 h-4" style={{ color: C.textMuted }} />
                : <ChevronDown className="w-4 h-4" style={{ color: C.textMuted }} />
              }
            </button>

            {isExpanded && (
              <div className="px-4 pb-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {market.outcomes.map(outcome => {
                    const compositeId = `${market.id}-${outcome.id}`;
                    const sel = isSelected(fixture.id, compositeId);
                    const disabled = isSettled || outcome.decimalOdds === null;

                    return (
                      <button
                        key={outcome.id}
                        onClick={() => !disabled && handleOutcomeClick(market, outcome)}
                        disabled={disabled}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200"
                        style={
                          disabled ? { border: `1px solid ${C.borderFaint}`, opacity: 0.5, cursor: 'not-allowed' }
                          : sel ? { border: '1px solid rgba(108,99,255,0.5)', background: 'rgba(108,99,255,0.12)', cursor: 'pointer' }
                          : { border: `1px solid ${C.borderFaint}`, background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }
                        }
                      >
                        <span className="text-xs text-center" style={{ color: C.textSub }}>{outcome.label}</span>
                        <span className="font-mono text-lg font-black" style={{ color: sel ? '#9B8FFF' : C.text }}>
                          {formatOdds(outcome.probability, format)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MatchDetailView({ fixture, detail, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const events = detail?.events || [];

  const visibleTabs = TABS.filter(t => {
    if (t.id === 'timeline') return events.length > 0;
    return true;
  });

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-4 text-sm font-semibold transition-colors"
        style={{ color: '#9B8FFF' }}
        onMouseEnter={e => e.currentTarget.style.color = '#B06FFF'}
        onMouseLeave={e => e.currentTarget.style.color = '#9B8FFF'}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Football
      </button>

      {/* Match header */}
      <MatchHeader fixture={fixture} detail={detail} />

      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-2xl mb-4"
        style={{ background: 'rgba(10,14,28,0.9)', border: `1px solid ${C.borderFaint}` }}
      >
        {visibleTabs.map(tab => {
          const { Icon } = tab;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all duration-200"
              style={{
                background: isActive ? 'linear-gradient(135deg, #6C63FF, #9B5DE5)' : 'transparent',
                color: isActive ? '#F0F6FF' : C.textMuted,
                boxShadow: isActive ? '0 4px 12px rgba(108,99,255,0.3)' : 'none',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <OverviewTab fixture={fixture} detail={detail} />}
          {activeTab === 'markets' && <MarketsTab fixture={fixture} detail={detail} />}
          {activeTab === 'feed' && <FeedTab fixture={fixture} />}
          {activeTab === 'timeline' && <TimelineTab events={events} homeTeam={fixture.homeTeam} awayTeam={fixture.awayTeam} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
