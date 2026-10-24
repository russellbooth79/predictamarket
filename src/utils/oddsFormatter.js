/**
 * oddsFormatter.js
 *
 * Converts a probability (0-100) to the requested display format.
 * Three formats supported: probability (%), decimal, fractional (UK).
 *
 * Fractional conversion uses a lookup table of common UK bookmaker fractions
 * and finds the nearest match — this avoids ugly GCD-reduced fractions like
 * "47/53" that no punter would recognise.
 */

const FRACTIONAL_LOOKUP = [
  [1/9, '1/9'], [1/5, '1/5'], [2/9, '2/9'], [1/4, '1/4'],
  [2/7, '2/7'], [3/10, '3/10'], [1/3, '1/3'], [4/11, '4/11'],
  [4/9, '4/9'], [1/2, '1/2'], [8/15, '8/15'], [4/7, '4/7'],
  [3/5, '3/5'], [8/13, '8/13'], [2/3, '2/3'], [8/11, '8/11'],
  [4/5, '4/5'], [10/11, '10/11'], [1/1, 'EVS'],
  [5/4, '5/4'], [6/4, '6/4'], [7/4, '7/4'], [2/1, '2/1'],
  [9/4, '9/4'], [5/2, '5/2'], [11/4, '11/4'], [3/1, '3/1'],
  [100/30, '10/3'], [7/2, '7/2'], [4/1, '4/1'], [9/2, '9/2'],
  [5/1, '5/1'], [6/1, '6/1'], [7/1, '7/1'], [8/1, '8/1'],
  [10/1, '10/1'], [12/1, '12/1'], [14/1, '14/1'], [16/1, '16/1'],
  [20/1, '20/1'], [25/1, '25/1'], [33/1, '33/1'], [40/1, '40/1'],
  [50/1, '50/1'], [66/1, '66/1'], [100/1, '100/1'],
];

/**
 * Convert a probability percentage to the requested display format.
 *
 * @param {number} probability - Value between 0 and 100
 * @param {'probability' | 'decimal' | 'fractional'} format
 * @returns {string} Formatted odds string
 */
export function formatOdds(probability, format) {
  if (probability <= 0 || probability > 100) {
    return format === 'probability' ? '0%' : '--';
  }

  const decimal = parseFloat((100 / probability).toFixed(2));

  if (format === 'probability') {
    return `${Math.round(probability)}%`;
  }

  if (format === 'decimal') {
    return decimal.toFixed(2);
  }

  if (format === 'fractional') {
    const decimalMinus1 = decimal - 1;

    // Find the closest common UK fraction
    let bestLabel = FRACTIONAL_LOOKUP[0][1];
    let bestDiff = Math.abs(decimalMinus1 - FRACTIONAL_LOOKUP[0][0]);

    for (const [val, label] of FRACTIONAL_LOOKUP) {
      const diff = Math.abs(decimalMinus1 - val);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestLabel = label;
      }
    }

    return bestLabel;
  }

  // Fallback — should not reach here with valid format
  return `${Math.round(probability)}%`;
}

/**
 * Format combined decimal odds for accumulator display.
 * Shows in the active format; for fractional, uses the decimal-to-fraction path.
 *
 * @param {number} decimalOdds - Combined decimal odds value
 * @param {'probability' | 'decimal' | 'fractional'} format
 * @returns {string}
 */
export function formatDecimalOdds(decimalOdds, format) {
  if (decimalOdds <= 0) return '--';

  if (format === 'decimal') {
    return decimalOdds.toFixed(2);
  }

  // Convert to implied probability for the other formats
  const impliedProb = (1 / decimalOdds) * 100;

  if (format === 'probability') {
    return `${impliedProb.toFixed(1)}%`;
  }

  if (format === 'fractional') {
    return formatOdds(impliedProb, 'fractional');
  }

  return decimalOdds.toFixed(2);
}
