/**
 * fixtureMeta.js
 *
 * Deterministic display metadata for fixtures, shared by EventCard and
 * MatchRow: recent form, bet counts, the crowd split ("where PUNT is
 * betting"), example payouts and kickoff labels.
 *
 * Form, counts and crowd split are mocked from a hash of the fixture so they
 * stay stable across renders. Production would read these from the API.
 */

export function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) & 0x7fffffff;
  return h;
}

export function generateForm(teamName) {
  const weighted = ['W', 'W', 'W', 'D', 'D', 'L'];
  const hash = simpleHash(teamName);
  return Array.from({ length: 5 }, (_, i) => {
    const idx = (hash * (i + 1) * 7 + i * 13) % weighted.length;
    return weighted[idx];
  });
}

export function getBetCount(id)    { return 1200 + (simpleHash(id) % 7300); }
export function getLiveBettors(id) { return 47   + (simpleHash(id + 'live') % 430); }

/**
 * Share of PUNT bets on each outcome (whole percentages summing to 100).
 * The crowd leans towards favourites but not exactly in line with the
 * probabilities, so the split is worth looking at.
 */
export function getCrowdSplit(fixture) {
  const weights = fixture.outcomes.map(o => {
    const wobble = 0.75 + (simpleHash(fixture.id + o.id) % 50) / 100; // 0.75–1.24
    return Math.pow(Math.max(o.probability, 1), 1.15) * wobble;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const shares = weights.map(w => Math.round((w / total) * 100));
  // Fix rounding drift on the largest share so the split totals 100
  const drift = 100 - shares.reduce((a, b) => a + b, 0);
  const maxIdx = shares.indexOf(Math.max(...shares));
  shares[maxIdx] += drift;
  return fixture.outcomes.map((o, i) => ({ outcomeId: o.id, label: o.label, share: shares[i] }));
}

/** Short name for an outcome: "Man City Win" → "Man City", "Draw" → "the draw" */
export function outcomeShortName(label) {
  if (label === 'Draw') return 'the draw';
  return label.replace(/ Win$/, '');
}

/** The crowd's favourite pick, e.g. "68% backing Man City" */
export function crowdHeadline(fixture) {
  const split = getCrowdSplit(fixture);
  const top = split.reduce((a, b) => (b.share > a.share ? b : a));
  return `${top.share}% backing ${outcomeShortName(top.label)}`;
}

/** Example return for a stake, e.g. payoutFor(72, 10) → 13.89 */
export function payoutFor(probability, stake = 10) {
  return (stake * 100) / probability;
}

export function formatKickoff(kickoff, isLive, liveMinute) {
  if (isLive) return `${liveMinute}'`;
  return new Date(kickoff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateLabel(kickoff) {
  const date = new Date(kickoff);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
