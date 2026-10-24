/**
 * MyBets.jsx
 *
 * Slide-in panel showing the user's bet history.
 * Tabs for Open and Settled bets.
 * In this prototype, all bets are "open" since there's no settlement engine.
 * Settled tab shows an empty state.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Clock, TrendingUp } from 'lucide-react';
import { useUser } from '../context/UserContext.jsx';
import { getProbabilityTextColour } from '../data/oddsUtils.js';

const TABS = [
  { id: 'open', label: 'Open' },
  { id: 'settled', label: 'Settled' },
];

/**
 * Format the placed-at timestamp into a human-readable relative or absolute time.
 */
function formatPlacedAt(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function MyBets({ isOpen, onClose }) {
  const { bets } = useUser();
  const [activeTab, setActiveTab] = useState('open');

  const openBets = bets.filter((b) => b.status === 'open');
  const settledBets = bets.filter((b) => b.status !== 'open');

  const displayBets = activeTab === 'open' ? openBets : settledBets;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={onClose}
          />

          {/* Slide-in panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-slate-100">My Bets</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-indigo-400 border-b-2 border-indigo-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'open' && openBets.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600/20 text-[10px] font-bold text-indigo-400">
                      {openBets.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Bet list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {displayBets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    {activeTab === 'open' ? (
                      <Clock className="w-7 h-7 text-slate-600" />
                    ) : (
                      <TrendingUp className="w-7 h-7 text-slate-600" />
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-slate-400 mb-1">
                    {activeTab === 'open' ? 'No open positions' : 'No settled positions'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[220px]">
                    {activeTab === 'open'
                      ? 'Place a position to see it here.'
                      : 'Settled positions will appear here once events complete.'}
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {displayBets.map((bet) => (
                    <div
                      key={bet.id}
                      className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
                    >
                      {/* Selections */}
                      {bet.selections.map((sel, i) => {
                        const textColour = getProbabilityTextColour(sel.probability);
                        return (
                          <div key={`${bet.id}-sel-${i}`} className="mb-2">
                            <p className="text-xs text-slate-400 mb-0.5">
                              {sel.eventName}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-200">
                                {sel.outcomeName}
                              </span>
                              <span className={`font-mono text-sm font-bold ${textColour}`}>
                                {Math.round(sel.probability)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Stake, return, status */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase">Stake</p>
                            <p className="font-mono text-sm text-white">
                              £{bet.stake.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase">Return</p>
                            <p className="font-mono text-sm text-emerald-400">
                              £{bet.potentialReturn.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            bet.status === 'open'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : bet.status === 'won'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatPlacedAt(bet.placedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
