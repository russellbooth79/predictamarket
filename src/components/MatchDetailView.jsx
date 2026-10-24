/**
 * MatchDetailView.jsx
 *
 * Full-page match detail view for football fixtures. Replaces the event
 * card feed when a user clicks "View Match" on an EventCard.
 *
 * Sections (top to bottom):
 * 1. Back navigation + match header (competition, teams, score, live badge)
 * 2. Match Odds (3-col) + Live Bet Feed (side by side on desktop)
 * 3. Bookmaker Price Comparison (Oddschecker-style table) — live data only
 * 4. Odds Probability Graph (full width SVG)
 * 5. Match Stats (horizontal bars -- live/completed only)
 * 6. Match Timeline (chronological events -- live/completed only)
 * 7. More Markets (collapsible sections)
 *
 * Props:
 *   fixture  - from fixtures.js or live API (required)
 *   detail   - from matchDetails.js (may be null for fixtures without detail data)
 *   onBack   - callback to return to the event feed
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { getProbabilityTextColour, getProbabilityHex } from '../data/oddsUtils.js';
import { generateBetActivity, initialBetActivity, FEED_POLL_INTERVAL_MS, HIGH_ROLLER_STAKE_THRESHOLD } from '../data/betActivity.js';
import ProbabilityBar from './ProbabilityBar.jsx';
import BookmakerOddsPanel from './BookmakerOddsPanel.jsx';

// ─── Helper: format date for the match header ───────────────────────────────

function formatMatchDate(kickoff) {
  const date = new Date(kickoff);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── Helper: relative time display for bet feed ─────────────────────────────

function timeAgo(timestamp) {
  const now = Date.now();
  const ts = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
  const diffSec = Math.floor((now - ts) / 1000);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

// ─── Bookmaker colour palette for graph secondary lines ─────────────────────
// Muted, distinguishable tones that won't compete with the main best-price line
const BOOKMAKER_LINE_COLOURS = [
  '#6b7280', // gray-500
  '#7c8594', // lighter gray
  '#5b6370', // darker gray
  '#8b95a3', // slate tone
];

// ─── OddsGraph ──────────────────────────────────────────────────────────────
// Pure SVG line chart. No external charting library.
// Main line: best probability (thick, #ffb800)
// Secondary lines: individual bookmaker probabilities (thin, gray, low opacity)

function OddsGraph({ history, isLive, homeTeam, awayTeam, bookmakers }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!history || history.length < 2) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
        No probability history available
      </div>
    );
  }

  const W = 800;
  const H = 220;
  const PAD_TOP = 20;
  const PAD_BOTTOM = 30;
  const PAD_LEFT = 40;
  const PAD_RIGHT = 20;
  const CHART_W = W - PAD_LEFT - PAD_RIGHT;
  const CHART_H = H - PAD_TOP - PAD_BOTTOM;

  // Determine x-axis mode: live uses `minute`, prematch uses `hoursAgo`
  const usesMinute = history[0].minute !== undefined;
  const getX = (point) => usesMinute ? point.minute : (24 - (point.hoursAgo || 0));
  const xValues = history.map(getX);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const xRange = xMax - xMin || 1;

  function toSvgX(val) {
    return PAD_LEFT + ((val - xMin) / xRange) * CHART_W;
  }
  function toSvgY(prob) {
    return PAD_TOP + CHART_H - (prob / 100) * CHART_H;
  }

  // Build SVG path data using smooth cubic bezier (catmull-rom to bezier conversion)
  function buildPath(key) {
    const points = history.map((p) => ({ x: toSvgX(getX(p)), y: toSvgY(p[key]) }));
    if (points.length < 2) return '';

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Simple smooth bezier: control points at 1/3 horizontal distance
      const cpx = (curr.x - prev.x) / 3;
      d += ` C ${prev.x + cpx} ${prev.y}, ${curr.x - cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }

  const homePath = buildPath('home');
  const drawPath = buildPath('draw');
  const awayPath = buildPath('away');

  // X-axis labels
  const xLabels = usesMinute
    ? [0, 15, 30, 45, 60, 75, 90].filter((m) => m >= xMin && m <= xMax + 5)
    : [0, 4, 8, 12, 16, 20, 24];

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100];

  // Hover interaction: find nearest point index
  function handleMouseMove(e) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    const chartX = mouseX - PAD_LEFT;
    const fraction = chartX / CHART_W;
    const idx = Math.round(fraction * (history.length - 1));
    setHoverIndex(Math.max(0, Math.min(history.length - 1, idx)));
  }

  const hoverPoint = hoverIndex !== null ? history[hoverIndex] : null;

  // Render thin bookmaker-specific probability lines on the graph
  // We overlay horizontal lines at each bookmaker's current home probability
  // to show spread across books (only when bookmakers data present)
  const bookmakerLines = bookmakers && bookmakers.length > 0
    ? bookmakers.slice(0, 4) // Cap at 4 to avoid clutter
    : [];

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center gap-6 mb-3 px-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#ffb800' }} />
          <span className="text-xs text-gray-400">{homeTeam}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#94a3b8' }} />
          <span className="text-xs text-gray-400">Draw</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#e5302f' }} />
          <span className="text-xs text-gray-400">{awayTeam}</span>
        </div>
        {bookmakerLines.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#6b7280', opacity: 0.4 }} />
            <span className="text-xs text-gray-500">Bookmakers</span>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxHeight: '240px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Grid lines */}
        {yLabels.map((val) => (
          <g key={`grid-${val}`}>
            <line
              x1={PAD_LEFT} y1={toSvgY(val)}
              x2={W - PAD_RIGHT} y2={toSvgY(val)}
              stroke="#2d3f52" strokeWidth="0.5" strokeDasharray="4 4"
            />
            <text
              x={PAD_LEFT - 6} y={toSvgY(val) + 4}
              fill="#64748b" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono, monospace"
            >
              {val}%
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((val) => {
          const svgX = toSvgX(val);
          const label = usesMinute ? `${val}'` : `${24 - val}h`;
          return (
            <text
              key={`x-${val}`}
              x={svgX} y={H - 6}
              fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono, monospace"
            >
              {label}
            </text>
          );
        })}

        {/* Bookmaker-specific horizontal reference lines (home prob only, to show spread) */}
        {bookmakerLines.map((bm, i) => (
          <line
            key={`bm-line-${bm.bookmakerKey}`}
            x1={PAD_LEFT}
            y1={toSvgY(bm.homeProb)}
            x2={W - PAD_RIGHT}
            y2={toSvgY(bm.homeProb)}
            stroke={BOOKMAKER_LINE_COLOURS[i % BOOKMAKER_LINE_COLOURS.length]}
            strokeWidth="1"
            strokeDasharray="6 4"
            opacity="0.3"
          />
        ))}

        {/* Main best-price lines — these are the dominant visual */}
        <path d={homePath} fill="none" stroke="#ffb800" strokeWidth="2.5" strokeLinejoin="round" />
        <path d={drawPath} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" opacity="0.7" />
        <path d={awayPath} fill="none" stroke="#e5302f" strokeWidth="2" strokeLinejoin="round" />

        {/* Current moment marker for live */}
        {isLive && history.length > 0 && (() => {
          const last = history[history.length - 1];
          const cx = toSvgX(getX(last));
          return (
            <line
              x1={cx} y1={PAD_TOP}
              x2={cx} y2={PAD_TOP + CHART_H}
              stroke="#ffb800" strokeWidth="1" strokeDasharray="4 2" opacity="0.5"
            />
          );
        })()}

        {/* Hover vertical line + tooltip */}
        {hoverPoint && (() => {
          const hx = toSvgX(getX(hoverPoint));
          return (
            <g>
              <line
                x1={hx} y1={PAD_TOP}
                x2={hx} y2={PAD_TOP + CHART_H}
                stroke="#ffffff" strokeWidth="0.5" opacity="0.3"
              />
              {/* Data points */}
              <circle cx={hx} cy={toSvgY(hoverPoint.home)} r="4" fill="#ffb800" />
              <circle cx={hx} cy={toSvgY(hoverPoint.draw)} r="3" fill="#94a3b8" />
              <circle cx={hx} cy={toSvgY(hoverPoint.away)} r="3.5" fill="#e5302f" />

              {/* Tooltip background */}
              <rect
                x={hx + 10} y={PAD_TOP}
                width="90" height="54" rx="4"
                fill="#1a2332" stroke="#2d3f52" strokeWidth="0.5"
              />
              <text x={hx + 18} y={PAD_TOP + 15} fill="#ffb800" fontSize="11" fontFamily="JetBrains Mono, monospace">
                H: {hoverPoint.home}%
              </text>
              <text x={hx + 18} y={PAD_TOP + 30} fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono, monospace">
                D: {hoverPoint.draw}%
              </text>
              <text x={hx + 18} y={PAD_TOP + 45} fill="#e5302f" fontSize="11" fontFamily="JetBrains Mono, monospace">
                A: {hoverPoint.away}%
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ─── LiveBetFeed ────────────────────────────────────────────────────────────
// Real-time simulated bet activity feed. Generates new items every 3s.

function LiveBetFeed({ fixture }) {
  const [items, setItems] = useState(() => {
    // Filter initial activity to this fixture, pad with cross-fixture items
    const forFixture = initialBetActivity.filter((b) => b.fixtureId === fixture.id);
    const others = initialBetActivity.filter((b) => b.fixtureId !== fixture.id).slice(0, 15 - forFixture.length);
    return [...forFixture, ...others].slice(0, 15);
  });

  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (paused) return;

    intervalRef.current = setInterval(() => {
      const newItem = generateBetActivity(fixture);
      setItems((prev) => [newItem, ...prev].slice(0, 15));
    }, FEED_POLL_INTERVAL_MS + Math.random() * 2000); // 3-5s jitter

    return () => clearInterval(intervalRef.current);
  }, [fixture, paused]);

  return (
    <div
      className="rounded-xl overflow-hidden h-full"
      style={{ backgroundColor: '#1a2332', border: '1px solid #2d3f52' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #2d3f52' }}>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Live Bet Feed</h3>
      </div>
      <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '340px' }}>
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="px-4 py-2.5 transition-all duration-300"
            style={{
              borderBottom: '1px solid rgba(45,63,82,0.3)',
              animation: idx === 0 ? 'slide-in-top 0.3s ease-out' : undefined,
            }}
          >
            <div className="flex items-start gap-2.5">
              {/* Avatar initials */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ backgroundColor: '#243040', color: '#94a3b8' }}
              >
                {item.user.split(' ').map((w) => w[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 leading-relaxed">
                  <span className="font-medium text-white">{item.user}</span>{' '}
                  placed{' '}
                  <span className="font-mono font-medium" style={{ color: '#ffb800' }}>
                    £{item.stake}
                  </span>{' '}
                  on{' '}
                  <span className="font-medium text-gray-200">{item.outcome}</span>{' '}
                  <span className="text-gray-500">
                    ({item.probability}%)
                  </span>
                  {item.stake >= HIGH_ROLLER_STAKE_THRESHOLD && (
                    <span
                      className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: 'rgba(255,184,0,0.15)', color: '#ffb800' }}
                    >
                      HIGH ROLLER
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {timeAgo(item.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MatchStats ─────────────────────────────────────────────────────────────
// Horizontal stat bars for possession, shots, corners, etc.

function MatchStats({ stats, homeTeam, awayTeam }) {
  if (!stats) return null;

  // Possession split bar
  function PossessionBar({ home, away }) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-sm font-bold text-white">{home}%</span>
          <span className="text-xs text-gray-400 uppercase tracking-wider">Possession</span>
          <span className="font-mono text-sm font-bold text-white">{away}%</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          <div
            className="h-full rounded-l-full transition-all duration-700"
            style={{ width: `${home}%`, backgroundColor: '#ffb800' }}
          />
          <div
            className="h-full rounded-r-full transition-all duration-700"
            style={{ width: `${away}%`, backgroundColor: '#e5302f' }}
          />
        </div>
      </div>
    );
  }

  // Single stat row: value | label | value
  function StatRow({ label, home, away }) {
    const total = home + away || 1;
    return (
      <div className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid rgba(45,63,82,0.3)' }}>
        <span className="font-mono text-sm text-white w-8 text-right">{home}</span>
        <div className="flex-1">
          <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5 mb-1">
            <div
              className="h-full rounded-l-full"
              style={{ width: `${(home / total) * 100}%`, backgroundColor: '#ffb800' }}
            />
            <div
              className="h-full rounded-r-full"
              style={{ width: `${(away / total) * 100}%`, backgroundColor: '#e5302f' }}
            />
          </div>
          <p className="text-[10px] text-gray-500 text-center uppercase tracking-wider">{label}</p>
        </div>
        <span className="font-mono text-sm text-white w-8">{away}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#1a2332', border: '1px solid #2d3f52' }}>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Match Stats</h3>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-300">{homeTeam}</span>
        <span className="text-xs font-medium text-gray-300">{awayTeam}</span>
      </div>

      <PossessionBar home={stats.possession.home} away={stats.possession.away} />

      <StatRow label="Shots" home={stats.shots.home} away={stats.shots.away} />
      <StatRow label="On Target" home={stats.shotsOnTarget.home} away={stats.shotsOnTarget.away} />
      <StatRow label="Corners" home={stats.corners.home} away={stats.corners.away} />
      <StatRow label="Fouls" home={stats.fouls.home} away={stats.fouls.away} />
      <StatRow label="Yellow Cards" home={stats.yellowCards.home} away={stats.yellowCards.away} />
      <StatRow label="Red Cards" home={stats.redCards.home} away={stats.redCards.away} />

      {/* xG if available */}
      {stats.xG && (
        <StatRow label="xG" home={stats.xG.home} away={stats.xG.away} />
      )}
    </div>
  );
}

// ─── MatchTimeline ──────────────────────────────────────────────────────────
// Chronological list of match events (goals, cards, whistles).

function MatchTimeline({ events, homeTeam, awayTeam }) {
  if (!events || events.length === 0) return null;

  function getEventIcon(type) {
    switch (type) {
      case 'goal': return '\u26BD';       // football
      case 'yellow_card': return '\uD83D\uDFE8'; // yellow square
      case 'red_card': return '\uD83D\uDFE5';    // red square
      case 'whistle': return '\uD83D\uDD14';     // bell (whistle substitute)
      case 'chance': return '\uD83C\uDFAF';      // target
      default: return '\u26AA';
    }
  }

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#1a2332', border: '1px solid #2d3f52' }}>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Match Timeline</h3>

      <div className="space-y-0">
        {events.map((event, i) => {
          const isHome = event.team === 'home';
          const isAway = event.team === 'away';
          const isNeutral = !event.team;

          return (
            <div
              key={`${event.minute}-${event.type}-${i}`}
              className="flex items-start gap-3 py-2.5"
              style={{ borderBottom: i < events.length - 1 ? '1px solid rgba(45,63,82,0.3)' : 'none' }}
            >
              {/* Home side */}
              <div className="flex-1 text-right">
                {isHome && (
                  <div>
                    <span className="text-sm font-medium text-white">{event.player}</span>
                    {event.assist && (
                      <span className="text-xs text-gray-500 block">Assist: {event.assist}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Centre: minute + icon */}
              <div className="flex flex-col items-center shrink-0 w-14">
                <span className="font-mono text-xs font-bold" style={{ color: isNeutral ? '#94a3b8' : '#ffb800' }}>
                  {event.minute}'
                </span>
                <span className="text-base leading-none mt-0.5">
                  {getEventIcon(event.type)}
                </span>
              </div>

              {/* Away side */}
              <div className="flex-1">
                {isAway && (
                  <div>
                    <span className="text-sm font-medium text-white">{event.player}</span>
                    {event.assist && (
                      <span className="text-xs text-gray-500 block">Assist: {event.assist}</span>
                    )}
                  </div>
                )}
                {isNeutral && (
                  <span className="text-xs text-gray-500 italic">{event.description}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MoreMarkets ────────────────────────────────────────────────────────────
// Collapsible market sections with outcome buttons.

function MoreMarkets({ markets, fixture }) {
  const [expandedMarkets, setExpandedMarkets] = useState({});
  const { addSelection, isSelected } = useBetSlip();

  function toggleMarket(marketId) {
    setExpandedMarkets((prev) => ({
      ...prev,
      [marketId]: !prev[marketId],
    }));
  }

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
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1a2332', border: '1px solid #2d3f52' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #2d3f52' }}>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">More Markets</h3>
      </div>

      {markets.map((market) => {
        const expanded = expandedMarkets[market.id] ?? false;
        const isSettled = market.settled === true;

        return (
          <div key={market.id} style={{ borderBottom: '1px solid rgba(45,63,82,0.3)' }}>
            <button
              onClick={() => toggleMarket(market.id)}
              className="w-full flex items-center justify-between px-4 py-3 transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(36,48,64,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-200">{market.name}</span>
                {isSettled && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                    style={{ backgroundColor: 'rgba(0,182,122,0.15)', color: '#00b67a' }}
                  >
                    Settled
                  </span>
                )}
              </div>
              {expanded
                ? <ChevronUp className="w-4 h-4 text-gray-500" />
                : <ChevronDown className="w-4 h-4 text-gray-500" />
              }
            </button>

            {expanded && (
              <div className="px-4 pb-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {market.outcomes.map((outcome) => {
                    const compositeId = `${market.id}-${outcome.id}`;
                    const selected = isSelected(fixture.id, compositeId);
                    const textColour = getProbabilityTextColour(outcome.probability);
                    // Don't allow selection on settled outcomes or those with null odds
                    const disabled = isSettled || outcome.decimalOdds === null;

                    return (
                      <button
                        key={outcome.id}
                        onClick={() => !disabled && handleOutcomeClick(market, outcome)}
                        disabled={disabled}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200"
                        style={
                          disabled
                            ? {
                                border: '1px solid rgba(45,63,82,0.3)',
                                backgroundColor: 'rgba(17,24,39,0.5)',
                                opacity: 0.5,
                                cursor: 'not-allowed',
                              }
                            : selected
                              ? {
                                  border: '1px solid #ffb800',
                                  backgroundColor: 'rgba(255,184,0,0.1)',
                                  cursor: 'pointer',
                                }
                              : {
                                  border: '1px solid rgba(45,63,82,0.5)',
                                  backgroundColor: 'rgba(36,48,64,0.5)',
                                  cursor: 'pointer',
                                }
                        }
                        onMouseEnter={(e) => {
                          if (!disabled && !selected) {
                            e.currentTarget.style.backgroundColor = '#243040';
                            e.currentTarget.style.borderColor = '#3d5068';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!disabled && !selected) {
                            e.currentTarget.style.backgroundColor = 'rgba(36,48,64,0.5)';
                            e.currentTarget.style.borderColor = 'rgba(45,63,82,0.5)';
                          }
                        }}
                      >
                        <span className="text-xs text-gray-400 text-center">{outcome.label}</span>
                        <span className={`font-mono text-lg font-bold ${textColour}`}>
                          {Math.round(outcome.probability)}%
                        </span>
                        {outcome.decimalOdds !== null && (
                          <span className="font-mono text-[10px] text-gray-500">
                            {outcome.decimalOdds.toFixed(2)}
                          </span>
                        )}
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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MatchDetailView({ fixture, detail, onBack }) {
  // Fallback: if detail is null we still render what we can from fixture
  const stats = detail?.stats || null;
  const events = detail?.events || [];
  const probabilityHistory = detail?.probabilityHistory || null;
  const markets = detail?.markets || [];

  // Bookmakers array comes from live API data on the fixture itself
  const bookmakers = fixture.bookmakers || [];

  return (
    <div className="animate-fade-in">
      {/* Back navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-4 text-sm font-medium transition-colors"
        style={{ color: '#ffb800' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#ffc933'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#ffb800'}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Football
      </button>

      {/* Match header card */}
      <div
        className="rounded-xl overflow-hidden mb-6"
        style={{ backgroundColor: '#1a2332', border: '1px solid #2d3f52' }}
      >
        {/* Competition + date + live badge */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(45,63,82,0.5)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {fixture.competition}
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-xs text-gray-500">
              {formatMatchDate(fixture.kickoff)}
            </span>
          </div>

          {fixture.isLive && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: 'rgba(229,48,47,0.1)',
                border: '1px solid rgba(229,48,47,0.2)',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: '#e5302f' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: '#e5302f' }}
                />
              </span>
              <span className="text-xs font-bold" style={{ color: '#e5302f' }}>
                LIVE {fixture.liveMinute}'
              </span>
            </div>
          )}
        </div>

        {/* Score / teams display */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-center gap-6">
            <div className="flex-1 text-right">
              <h2 className="text-xl font-bold text-white">{fixture.homeTeam}</h2>
            </div>

            {fixture.isLive && fixture.liveScore ? (
              <div className="flex items-center gap-3">
                <span className="font-mono text-3xl font-bold text-white">
                  {fixture.liveScore.home}
                </span>
                <span className="text-gray-600 text-xl">-</span>
                <span className="font-mono text-3xl font-bold text-white">
                  {fixture.liveScore.away}
                </span>
              </div>
            ) : (
              <span className="text-gray-600 text-lg">vs</span>
            )}

            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{fixture.awayTeam}</h2>
            </div>
          </div>

          {/* Venue */}
          {detail && (
            <p className="text-center text-xs text-gray-500 mt-2">
              {detail.venue || ''}
              {detail.referee && ` · Referee: ${detail.referee}`}
            </p>
          )}
        </div>
      </div>

      {/* Match Odds + Live Bet Feed (side by side on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Match Odds (3 cols on desktop) */}
        <div className="lg:col-span-3">
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: '#1a2332', border: '1px solid #2d3f52' }}
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Match Odds</h3>
            <div className="grid grid-cols-3 gap-3">
              {fixture.outcomes.map((outcome) => {
                const textColour = getProbabilityTextColour(outcome.probability);
                return (
                  <div
                    key={outcome.id}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(36,48,64,0.5)',
                      border: '1px solid rgba(45,63,82,0.5)',
                    }}
                  >
                    <span className="text-xs text-gray-400">{outcome.label}</span>
                    <span className={`font-mono text-2xl font-bold ${textColour}`}>
                      {Math.round(outcome.probability)}%
                    </span>
                    <div className="w-full">
                      <ProbabilityBar probability={outcome.probability} />
                    </div>
                    {outcome.decimalOdds != null && (
                      <span className="font-mono text-xs text-gray-500">
                        {outcome.decimalOdds.toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Bet Feed (2 cols on desktop) */}
        <div className="lg:col-span-2">
          <LiveBetFeed fixture={fixture} />
        </div>
      </div>

      {/* Bookmaker Price Comparison — only shown when live API data has bookmaker breakdown */}
      {bookmakers.length > 0 && (
        <div className="mb-6">
          <BookmakerOddsPanel
            bookmakers={bookmakers}
            homeTeam={fixture.homeTeam}
            awayTeam={fixture.awayTeam}
          />
        </div>
      )}

      {/* Odds Probability Graph */}
      <div
        className="rounded-xl p-4 mb-6"
        style={{ backgroundColor: '#1a2332', border: '1px solid #2d3f52' }}
      >
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Probability Movement
        </h3>
        <OddsGraph
          history={probabilityHistory}
          isLive={fixture.isLive}
          homeTeam={fixture.homeTeam}
          awayTeam={fixture.awayTeam}
          bookmakers={bookmakers}
        />
      </div>

      {/* Match Stats (live only) */}
      {stats && (
        <div className="mb-6">
          <MatchStats stats={stats} homeTeam={fixture.homeTeam} awayTeam={fixture.awayTeam} />
        </div>
      )}

      {/* Match Timeline (live only) */}
      {events.length > 0 && (
        <div className="mb-6">
          <MatchTimeline events={events} homeTeam={fixture.homeTeam} awayTeam={fixture.awayTeam} />
        </div>
      )}

      {/* More Markets */}
      {markets.length > 0 && (
        <div className="mb-6">
          <MoreMarkets markets={markets} fixture={fixture} />
        </div>
      )}
    </div>
  );
}
