/**
 * MyBets.jsx
 *
 * Slide-in panel showing the user's bet history.
 * Tabs for Open and Settled bets.
 * bet365 colour scheme: yellow accents, dark navy panel.
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
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[70] flex flex-col"
            style={{
              backgroundColor: '#1a2332',
              borderLeft: '1px solid #2d3f52',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid #2d3f52' }}>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" style={{ color: '#ffb800' }} />
                <h2 className="text-lg font-semibold text-white">My Bets</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex" style={{ borderBottom: '1px solid #2d3f52' }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 py-2.5 text-sm font-medium transition-colors"
                  style={
                    activeTab === tab.id
                      ? { color: '#ffb800', borderBottom: '2px solid #ffb800' }
                      : { color: '#94a3b8' }
                  }
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) e.currentTarget.style.color = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  {tab.label}
                  {tab.id === 'open' && openBets.length > 0 && (
                    <span
                      className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: 'rgba(255,184,0,0.2)', color: '#ffb800' }}
                    >
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
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: '#243040' }}
                  >
                    {activeTab === 'open' ? (
                      <Clock className="w-7 h-7 text-gray-600" />
                    ) : (
                      <TrendingUp className="w-7 h-7 text-gray-600" />
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    {activeTab === 'open' ? 'No open positions' : 'No settled positions'}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-[220px]">
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
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: 'rgba(36,48,64,0.5)',
                        border: '1px solid rgba(45,63,82,0.5)',
                      }}
                    >
                      {/* Selections */}
                      {bet.selections.map((sel, i) => {
                        const textColour = getProbabilityTextColour(sel.probability);
                        return (
                          <div key={`${bet.id}-sel-${i}`} className="mb-2">
                            <p className="text-xs text-gray-400 mb-0.5">
                              {sel.eventName}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-200">
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
                      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(45,63,82,0.3)' }}>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase">Stake</p>
                            <p className="font-mono text-sm text-white">
                              £{bet.stake.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase">Return</p>
                            <p className="font-mono text-sm" style={{ color: '#00b67a' }}>
                              £{bet.potentialReturn.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={
                              bet.status === 'open'
                                ? { backgroundColor: 'rgba(255,184,0,0.1)', color: '#ffb800', border: '1px solid rgba(255,184,0,0.2)' }
                                : bet.status === 'won'
                                  ? { backgroundColor: 'rgba(0,182,122,0.1)', color: '#00b67a', border: '1px solid rgba(0,182,122,0.2)' }
                                  : { backgroundColor: 'rgba(229,48,47,0.1)', color: '#e5302f', border: '1px solid rgba(229,48,47,0.2)' }
                            }
                          >
                            {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                          </span>
                          <span className="text-[10px] text-gray-500">
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
