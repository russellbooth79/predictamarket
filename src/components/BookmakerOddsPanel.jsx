/**
 * BookmakerOddsPanel.jsx
 *
 * Oddschecker-style bookmaker price comparison table.
 * Renders inside MatchDetailView below the main outcome buttons.
 *
 * Layout: rows = bookmakers, columns = Home Win | Draw | Away Win.
 * Each cell shows odds in the user's chosen format with decimal odds below.
 * Best probability per column gets an indigo highlight (#5B6EF5).
 * Worst probability per column is visually muted.
 *
 * A pinned "Best Price" summary row sits at the top showing the
 * maximum probability from any bookmaker for each outcome.
 */

import { useMemo } from 'react';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';

// -- Constants ----------------------------------------------------------------

const BRAND_CARD_BG = '#0F1520';
const BRAND_BORDER = '#1A2238';
const BRAND_PRIMARY = '#5B6EF5';
const BEST_CELL_BG = 'rgba(91,110,245,0.12)';
const BEST_CELL_BORDER = `3px solid ${BRAND_PRIMARY}`;
const MUTED_OPACITY = 0.45;

// -- Helpers ------------------------------------------------------------------

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

function getCellState(value, extreme, bookmakerCount) {
  if (value == null) return 'neutral';
  if (value === extreme.best) return 'best';
  if (bookmakerCount >= 3 && value === extreme.worst) return 'worst';
  return 'neutral';
}

// -- OddsCell -----------------------------------------------------------------

function OddsCell({ probability, decimalOdds, state, format }) {
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
        style={{ color: isBest ? BRAND_PRIMARY : '#e2e8f0' }}
      >
        {formatOdds(probability, format)}
      </span>
      {decimalOdds != null && format !== 'decimal' && (
        <span className="font-mono text-[10px] text-gray-500 block mt-0.5">
          {decimalOdds.toFixed(2)}
        </span>
      )}
    </td>
  );
}

// -- BestPriceRow -------------------------------------------------------------

function BestPriceRow({ bookmakers, extremes, format }) {
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
    <tr style={{ borderBottom: `2px solid ${BRAND_PRIMARY}` }}>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(91,110,245,0.15)', color: BRAND_PRIMARY }}
          >
            Best Price
          </span>
        </div>
      </td>
      <td className="text-center py-3 px-2" style={{ borderLeft: BEST_CELL_BORDER, backgroundColor: BEST_CELL_BG }}>
        <span className="font-mono text-lg font-bold block" style={{ color: BRAND_PRIMARY }}>
          {extremes.homeProb.best != null ? formatOdds(extremes.homeProb.best, format) : '--'}
        </span>
        {bestHomeOdds < Infinity && format !== 'decimal' && (
          <span className="font-mono text-[10px] block mt-0.5" style={{ color: BRAND_PRIMARY, opacity: 0.7 }}>
            {bestHomeOdds.toFixed(2)}
          </span>
        )}
      </td>
      {hasDraw && (
        <td className="text-center py-3 px-2" style={{ borderLeft: BEST_CELL_BORDER, backgroundColor: BEST_CELL_BG }}>
          <span className="font-mono text-lg font-bold block" style={{ color: BRAND_PRIMARY }}>
            {extremes.drawProb.best != null ? formatOdds(extremes.drawProb.best, format) : '--'}
          </span>
          {bestDrawOdds < Infinity && format !== 'decimal' && (
            <span className="font-mono text-[10px] block mt-0.5" style={{ color: BRAND_PRIMARY, opacity: 0.7 }}>
              {bestDrawOdds.toFixed(2)}
            </span>
          )}
        </td>
      )}
      <td className="text-center py-3 px-2" style={{ borderLeft: BEST_CELL_BORDER, backgroundColor: BEST_CELL_BG }}>
        <span className="font-mono text-lg font-bold block" style={{ color: BRAND_PRIMARY }}>
          {extremes.awayProb.best != null ? formatOdds(extremes.awayProb.best, format) : '--'}
        </span>
        {bestAwayOdds < Infinity && format !== 'decimal' && (
          <span className="font-mono text-[10px] block mt-0.5" style={{ color: BRAND_PRIMARY, opacity: 0.7 }}>
            {bestAwayOdds.toFixed(2)}
          </span>
        )}
      </td>
    </tr>
  );
}

// -- Main Component -----------------------------------------------------------

export default function BookmakerOddsPanel({ bookmakers, homeTeam, awayTeam }) {
  const extremes = useMemo(() => computeColumnExtremes(bookmakers), [bookmakers]);
  const hasDraw = extremes.drawProb.best != null;
  const bookmakerCount = bookmakers.length;
  const { format } = useOddsFormat();

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
            <tr style={{ borderBottom: '1px solid rgba(26,34,56,0.5)' }}>
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
            <BestPriceRow bookmakers={bookmakers} extremes={extremes} format={format} />

            {/* Individual bookmaker rows */}
            {bookmakers.map((bm) => {
              const homeState = getCellState(bm.homeProb, extremes.homeProb, bookmakerCount);
              const drawState = getCellState(bm.drawProb, extremes.drawProb, bookmakerCount);
              const awayState = getCellState(bm.awayProb, extremes.awayProb, bookmakerCount);

              return (
                <tr
                  key={bm.bookmakerKey}
                  style={{ borderBottom: '1px solid rgba(26,34,56,0.2)' }}
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
                    format={format}
                  />
                  {hasDraw && (
                    <OddsCell
                      probability={bm.drawProb}
                      decimalOdds={bm.drawOdds}
                      state={drawState}
                      format={format}
                    />
                  )}
                  <OddsCell
                    probability={bm.awayProb}
                    decimalOdds={bm.awayOdds}
                    state={awayState}
                    format={format}
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
