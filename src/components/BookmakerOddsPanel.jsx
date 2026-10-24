/**
 * BookmakerOddsPanel.jsx
 *
 * Oddschecker-style bookmaker price comparison table.
 * Renders inside MatchDetailView below the main outcome buttons.
 *
 * Layout: rows = bookmakers, columns = Home Win | Draw | Away Win.
 * Each cell shows probability (hero number) with decimal odds below.
 * Best probability per column gets a yellow highlight (#ffb800).
 * Worst probability per column is visually muted.
 *
 * A pinned "Best Price" summary row sits at the top showing the
 * maximum probability from any bookmaker for each outcome.
 */

import { useMemo } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND_CARD_BG = '#1a2332';
const BRAND_BORDER = '#2d3f52';
const BRAND_YELLOW = '#ffb800';
const BEST_CELL_BG = 'rgba(255,184,0,0.12)';
const BEST_CELL_BORDER = `3px solid ${BRAND_YELLOW}`;
const MUTED_OPACITY = 0.45;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * For each column (home/draw/away), compute the best (max) and worst (min)
 * probability across all bookmakers. Used to highlight best/worst cells.
 */
function computeColumnExtremes(bookmakers) {
  const cols = ['homeProb', 'drawProb', 'awayProb'];
  const extremes = {};

  for (const col of cols) {
    const values = bookmakers
      .map((b) => b[col])
      .filter((v) => v != null);

    if (values.length === 0) {
      extremes[col] = { best: null, worst: null };
    } else {
      extremes[col] = {
        best: Math.max(...values),
        worst: Math.min(...values),
      };
    }
  }

  return extremes;
}

/**
 * Determine cell visual state: 'best' | 'worst' | 'neutral'.
 * Only mark worst if there are 3+ bookmakers — with just 2, one is
 * best and one is worst, which looks odd.
 */
function getCellState(value, extreme, bookmakerCount) {
  if (value == null) return 'neutral';
  if (value === extreme.best) return 'best';
  if (bookmakerCount >= 3 && value === extreme.worst) return 'worst';
  return 'neutral';
}

// ── OddsCell ──────────────────────────────────────────────────────────────────

function OddsCell({ probability, decimalOdds, state }) {
  if (probability == null) {
    return (
      <td className="text-center py-3 px-2">
        <span className="text-gray-600 text-xs">--</span>
      </td>
    );
  }

  const isBest = state === 'best';
  const isWorst = state === 'worst';

  const cellStyle = {
    borderLeft: isBest ? BEST_CELL_BORDER : '3px solid transparent',
    backgroundColor: isBest ? BEST_CELL_BG : 'transparent',
    opacity: isWorst ? MUTED_OPACITY : 1,
  };

  return (
    <td className="text-center py-3 px-2" style={cellStyle}>
      <span
        className="font-mono text-base font-bold block"
        style={{ color: isBest ? BRAND_YELLOW : '#e2e8f0' }}
      >
        {Math.round(probability)}%
      </span>
      {decimalOdds != null && (
        <span className="font-mono text-[10px] text-gray-500 block mt-0.5">
          {decimalOdds.toFixed(2)}
        </span>
      )}
    </td>
  );
}

// ── BestPriceRow ──────────────────────────────────────────────────────────────

function BestPriceRow({ bookmakers, extremes }) {
  // Find best decimal odds (lowest) for each outcome
  const bestHomeOdds = bookmakers.reduce(
    (min, b) => (b.homeOdds != null && b.homeOdds < min ? b.homeOdds : min),
    Infinity
  );
  const bestDrawOdds = bookmakers
    .filter((b) => b.drawOdds != null)
    .reduce((min, b) => (b.drawOdds < min ? b.drawOdds : min), Infinity);
  const bestAwayOdds = bookmakers.reduce(
    (min, b) => (b.awayOdds != null && b.awayOdds < min ? b.awayOdds : min),
    Infinity
  );

  const hasDraw = extremes.drawProb.best != null;

  return (
    <tr style={{ borderBottom: `2px solid ${BRAND_YELLOW}` }}>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(255,184,0,0.15)', color: BRAND_YELLOW }}
          >
            Best Price
          </span>
        </div>
      </td>
      <td className="text-center py-3 px-2" style={{ borderLeft: BEST_CELL_BORDER, backgroundColor: BEST_CELL_BG }}>
        <span className="font-mono text-lg font-bold block" style={{ color: BRAND_YELLOW }}>
          {extremes.homeProb.best != null ? `${Math.round(extremes.homeProb.best)}%` : '--'}
        </span>
        {bestHomeOdds < Infinity && (
          <span className="font-mono text-[10px] block mt-0.5" style={{ color: BRAND_YELLOW, opacity: 0.7 }}>
            {bestHomeOdds.toFixed(2)}
          </span>
        )}
      </td>
      {hasDraw && (
        <td className="text-center py-3 px-2" style={{ borderLeft: BEST_CELL_BORDER, backgroundColor: BEST_CELL_BG }}>
          <span className="font-mono text-lg font-bold block" style={{ color: BRAND_YELLOW }}>
            {extremes.drawProb.best != null ? `${Math.round(extremes.drawProb.best)}%` : '--'}
          </span>
          {bestDrawOdds < Infinity && (
            <span className="font-mono text-[10px] block mt-0.5" style={{ color: BRAND_YELLOW, opacity: 0.7 }}>
              {bestDrawOdds.toFixed(2)}
            </span>
          )}
        </td>
      )}
      <td className="text-center py-3 px-2" style={{ borderLeft: BEST_CELL_BORDER, backgroundColor: BEST_CELL_BG }}>
        <span className="font-mono text-lg font-bold block" style={{ color: BRAND_YELLOW }}>
          {extremes.awayProb.best != null ? `${Math.round(extremes.awayProb.best)}%` : '--'}
        </span>
        {bestAwayOdds < Infinity && (
          <span className="font-mono text-[10px] block mt-0.5" style={{ color: BRAND_YELLOW, opacity: 0.7 }}>
            {bestAwayOdds.toFixed(2)}
          </span>
        )}
      </td>
    </tr>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BookmakerOddsPanel({ bookmakers, homeTeam, awayTeam }) {
  const extremes = useMemo(() => computeColumnExtremes(bookmakers), [bookmakers]);
  const hasDraw = extremes.drawProb.best != null;
  const bookmakerCount = bookmakers.length;

  if (bookmakerCount === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: BRAND_CARD_BG, border: `1px solid ${BRAND_BORDER}` }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${BRAND_BORDER}` }}>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Price Comparison
        </h3>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(0,182,122,0.15)', color: '#00b67a' }}
        >
          Live
        </span>
        <span className="text-[10px] text-gray-500 ml-auto">
          {bookmakerCount} bookmaker{bookmakerCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Scrollable table wrapper for mobile */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px]">
          <thead>
            <tr style={{ borderBottom: `1px solid rgba(45,63,82,0.5)` }}>
              <th className="text-left py-2.5 px-3 w-36">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                  Bookmaker
                </span>
              </th>
              <th className="text-center py-2.5 px-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                  {homeTeam}
                </span>
              </th>
              {hasDraw && (
                <th className="text-center py-2.5 px-2">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                    Draw
                  </span>
                </th>
              )}
              <th className="text-center py-2.5 px-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                  {awayTeam}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Pinned best-price summary row */}
            <BestPriceRow bookmakers={bookmakers} extremes={extremes} />

            {/* Individual bookmaker rows */}
            {bookmakers.map((bm) => {
              const homeState = getCellState(bm.homeProb, extremes.homeProb, bookmakerCount);
              const drawState = getCellState(bm.drawProb, extremes.drawProb, bookmakerCount);
              const awayState = getCellState(bm.awayProb, extremes.awayProb, bookmakerCount);

              return (
                <tr
                  key={bm.bookmakerKey}
                  style={{ borderBottom: '1px solid rgba(45,63,82,0.2)' }}
                >
                  <td className="py-3 px-3">
                    <span className="text-sm font-medium text-gray-300 truncate block max-w-[140px]">
                      {bm.bookmaker}
                    </span>
                  </td>
                  <OddsCell
                    probability={bm.homeProb}
                    decimalOdds={bm.homeOdds}
                    state={homeState}
                  />
                  {hasDraw && (
                    <OddsCell
                      probability={bm.drawProb}
                      decimalOdds={bm.drawOdds}
                      state={drawState}
                    />
                  )}
                  <OddsCell
                    probability={bm.awayProb}
                    decimalOdds={bm.awayOdds}
                    state={awayState}
                  />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
