/**
 * oddsUtils.js
 *
 * Pure utility functions for odds conversion and probability normalisation.
 *
 * All probability values throughout the app are expressed as integers (0–100).
 * Rounding is applied at the display layer, not here — callers receive floats
 * so normalisation arithmetic stays accurate before rounding is committed.
 *
 * Colour helpers return Tailwind class strings. These are co-located with the
 * probability domain rather than a UI file so the thresholds stay canonical
 * and are not duplicated across components.
 */

/**
 * Convert fractional odds string (e.g. "9/4", "5/1", "11/10") to implied
 * probability as a percentage float.
 *
 * Implied probability = denominator / (numerator + denominator) * 100
 *
 * This is the raw bookmaker-margined probability. Pass through normaliseProbs
 * before displaying to users.
 *
 * @param {string} fractional - Fractional odds in "numerator/denominator" format
 * @returns {number} Implied probability as a percentage (e.g. 30.77)
 */
export function fractionalToProb(fractional) {
  const parts = fractional.split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid fractional odds format: "${fractional}". Expected "n/d".`);
  }

  const numerator = parseFloat(parts[0]);
  const denominator = parseFloat(parts[1]);

  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
    throw new Error(`Invalid fractional odds values: "${fractional}".`);
  }

  return (denominator / (numerator + denominator)) * 100;
}

/**
 * Convert decimal odds (e.g. 3.25, 1.85, 1.10) to implied probability as a
 * percentage float.
 *
 * Implied probability = (1 / decimal) * 100
 *
 * Decimal odds include the stake in the return, so 1.0 would be a certainty.
 * Valid decimal odds must be > 1.0 in practice.
 *
 * @param {number} decimal - Decimal odds value
 * @returns {number} Implied probability as a percentage (e.g. 30.77)
 */
export function decimalToProb(decimal) {
  if (typeof decimal !== 'number' || decimal <= 1) {
    throw new Error(`Invalid decimal odds: ${decimal}. Must be a number greater than 1.`);
  }

  return (1 / decimal) * 100;
}

/**
 * Normalise an array of raw implied probabilities so they sum to exactly 100.
 *
 * Raw bookmaker odds always sum to more than 100% — the overround (margin) is
 * the bookmaker's edge. Removing it gives the "true" market-implied probability,
 * which is what PredictaMarket displays.
 *
 * Method: divide each probability by the sum of all probabilities, then
 * multiply by 100.
 *
 * @param {number[]} probs - Array of raw implied probabilities (need not sum to 100)
 * @returns {number[]} Normalised probabilities that sum to 100, same order as input
 */
export function normaliseProbs(probs) {
  if (!Array.isArray(probs) || probs.length === 0) {
    throw new Error('normaliseProbs expects a non-empty array of numbers.');
  }

  const total = probs.reduce((sum, p) => sum + p, 0);

  if (total === 0) {
    throw new Error('Cannot normalise probabilities that sum to zero.');
  }

  return probs.map((p) => (p / total) * 100);
}

/**
 * Round a normalised probability to a whole number for display.
 * Kept as a separate function so callers can choose when to round —
 * rounding mid-calculation corrupts normalisation.
 *
 * @param {number} prob - Float probability
 * @returns {number} Integer probability
 */
export function roundProb(prob) {
  return Math.round(prob);
}

/**
 * Get the Tailwind background colour class appropriate for a given probability.
 *
 * Thresholds represent the semantic meaning of confidence levels:
 *   >= 70%  Strong favourite   — emerald (green)
 *   >= 50%  Moderate favourite — indigo (blue-purple)
 *   >= 35%  Competitive        — amber (yellow)
 *   <  35%  Outsider           — slate (grey)
 *
 * @param {number} pct - Probability percentage (0–100)
 * @returns {string} Tailwind bg class
 */
export function getProbabilityColour(pct) {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-indigo-500';
  if (pct >= 35) return 'bg-amber-400';
  return 'bg-slate-500';
}

/**
 * Get the Tailwind text colour class appropriate for a given probability.
 * Mirrors getProbabilityColour thresholds for consistent semantic colouring
 * across background and text contexts.
 *
 * @param {number} pct - Probability percentage (0–100)
 * @returns {string} Tailwind text class
 */
export function getProbabilityTextColour(pct) {
  if (pct >= 70) return 'text-emerald-400';
  if (pct >= 50) return 'text-indigo-400';
  if (pct >= 35) return 'text-amber-400';
  return 'text-slate-400';
}

/**
 * Format a probability percentage for display.
 * Always returns an integer string with % suffix.
 *
 * @param {number} pct - Probability (0–100, float or int)
 * @returns {string} e.g. "52%"
 */
export function formatProb(pct) {
  return `${Math.round(pct)}%`;
}

/**
 * Convert decimal odds to a display-friendly fractional string.
 * Used when showing odds alongside probabilities for context.
 * Approximation only — uses common fractions table for recognisable values,
 * falls back to decimal string for unusual odds.
 *
 * @param {number} decimal - Decimal odds
 * @returns {string} Fractional representation or decimal string
 */
export function decimalToFractionalDisplay(decimal) {
  // Common bookmaker odds mappings — these are the values that appear on
  // price boards and are immediately recognisable to UK bettors.
  const COMMON_FRACTIONS = {
    1.1: '1/10',
    1.125: '1/8',
    1.2: '1/5',
    1.25: '1/4',
    1.33: '1/3',
    1.4: '2/5',
    1.5: '1/2',
    1.57: '4/7',
    1.6: '8/13',
    1.67: '4/6',
    1.72: '8/11',
    1.8: '4/5',
    1.9: '9/10',
    2.0: 'Evs',
    2.1: '11/10',
    2.2: '6/5',
    2.25: '5/4',
    2.4: '7/5',
    2.5: '6/4',
    2.6: '8/5',
    2.75: '7/4',
    3.0: '2/1',
    3.25: '9/4',
    3.5: '5/2',
    4.0: '3/1',
    4.5: '7/2',
    5.0: '4/1',
    5.5: '9/2',
    6.0: '5/1',
    7.0: '6/1',
    8.0: '7/1',
    9.0: '8/1',
    10.0: '9/1',
    11.0: '10/1',
    13.0: '12/1',
    17.0: '16/1',
    21.0: '20/1',
    26.0: '25/1',
    34.0: '33/1',
    51.0: '50/1',
    101.0: '100/1',
  };

  // Find nearest match within a small tolerance for float comparison
  const match = Object.keys(COMMON_FRACTIONS).find(
    (key) => Math.abs(parseFloat(key) - decimal) < 0.02
  );

  return match ? COMMON_FRACTIONS[match] : decimal.toFixed(2);
}
