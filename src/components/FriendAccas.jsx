/**
 * FriendAccas.jsx
 *
 * "Your mates' accas" — a horizontal carousel of friends' accumulators.
 * "Copy" replaces the bet slip with that acca's legs so the user can stake
 * it themselves (or tweak it first).
 */

import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds } from '../utils/oddsFormatter.js';
import { toSelection } from '../data/friends.js';
import { outcomeShortName } from '../utils/fixtureMeta.js';
import FriendAvatars from './FriendAvatars.jsx';

const LEG_NAMES = { 2: 'Double', 3: 'Treble', 4: 'Four-fold' };

export default function FriendAccas({ accas, onCopied }) {
  const { selections, loadSelections } = useBetSlip();
  const { format } = useOddsFormat();

  // An acca counts as copied when the slip holds exactly its legs
  function isCopied(acca) {
    return selections.length === acca.legs.length &&
      acca.legs.every(l => selections.some(s => s.eventId === l.fixture.id && s.outcomeId === l.outcome.id));
  }

  function handleCopy(acca) {
    loadSelections(acca.legs.map(l => toSelection(l.fixture, l.outcome)));
    onCopied?.();
  }

  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 pb-1">
      {accas.map(acca => {
        const copied = isCopied(acca);
        return (
          <div
            key={acca.friend.id}
            className="snap-start shrink-0 w-[78%] sm:w-[300px] rounded-2xl p-4 flex flex-col"
            style={{ background: 'rgb(12,17,30)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <FriendAvatars friends={[acca.friend]} size={30} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#F0F6FF' }}>{acca.friend.name}'s {LEG_NAMES[acca.legs.length] ?? 'acca'}</p>
                <p className="text-[11px]" style={{ color: '#7B8CAA' }}>{acca.legs.length} picks · {Math.max(1, Math.round(acca.combinedProbability))}% chance</p>
              </div>
            </div>

            <ul className="space-y-1.5 mb-4">
              {acca.legs.map(l => (
                <li key={l.fixture.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate" style={{ color: '#C9D3E8' }}>
                    <span className="font-semibold" style={{ color: '#F0F6FF' }}>{l.outcome.label === 'Draw' ? 'Draw' : outcomeShortName(l.outcome.label)}</span>
                    <span style={{ color: '#6B7894' }}> · {l.fixture.homeTeam} v {l.fixture.awayTeam}</span>
                  </span>
                  <span className="font-mono font-bold shrink-0" style={{ color: '#B0A5FF' }}>{formatOdds(l.outcome.probability, format)}</span>
                </li>
              ))}
            </ul>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => handleCopy(acca)}
              disabled={copied}
              className="mt-auto w-full h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors"
              style={copied
                ? { background: 'rgba(198,255,61,0.12)', color: 'var(--action)', border: '1px solid rgba(198,255,61,0.3)' }
                : { background: 'rgba(255,255,255,0.06)', color: '#F0F6FF', border: '1px solid rgba(255,255,255,0.1)' }
              }
            >
              {copied ? <><Check className="w-4 h-4" /> In your slip</> : <><Copy className="w-4 h-4" /> Copy acca</>}
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}
