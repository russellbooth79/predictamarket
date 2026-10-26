/**
 * ConfirmModal.jsx
 *
 * Confirmation modal triggered when stake >= 20.
 * Shows full selection details with a clear summary of the bet
 * before final confirmation.
 *
 * PredictaMarket v3 palette: indigo confirm button, deep navy card.
 *
 * z-index changed from z-[100] to z-[90] to sit below the auth overlays
 * (LandingScreen z-[100], SignupFlow/LoginFlow z-[110], PlayerProfiling z-[120]).
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { getProbabilityTextColour } from '../data/oddsUtils.js';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } },
};

export default function ConfirmModal({ isOpen, selections, stake, potentialReturn, onConfirm, onCancel }) {
  if (!selections || selections.length === 0) return null;

  const parsedStake = parseFloat(stake) || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal card */}
          <motion.div
            className="relative rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            style={{
              backgroundColor: '#0F1520',
              border: '1px solid #1A2238',
            }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Warning header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Confirm bet
              </h3>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              You are placing a bet of <span className="font-mono text-white font-medium">{'\u00A3'}{parsedStake.toFixed(2)}</span>. Please review your selection{selections.length > 1 ? 's' : ''} below.
            </p>

            {/* Selection details */}
            <div className="space-y-2 mb-5">
              {selections.map((sel) => {
                const textColour = getProbabilityTextColour(sel.probability);
                return (
                  <div
                    key={`${sel.eventId}-${sel.outcomeId}`}
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: 'rgba(22,30,46,0.5)',
                      border: '1px solid rgba(26,34,56,0.5)',
                    }}
                  >
                    <p className="text-xs text-gray-400 mb-0.5">{sel.eventName}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-200">
                        {sel.outcomeName}
                      </span>
                      <span className={`font-mono text-sm font-bold ${textColour}`}>
                        {Math.round(sel.probability)}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs text-gray-500">
                        @ {sel.decimalOdds.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary line */}
            <div className="flex items-center justify-between py-3 mb-5" style={{ borderTop: '1px solid rgba(26,34,56,0.5)' }}>
              <div>
                <p className="text-xs text-gray-400">Stake</p>
                <p className="font-mono text-base font-bold text-white">
                  {'\u00A3'}{parsedStake.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Potential Return</p>
                <p className="font-mono text-base font-bold" style={{ color: '#00b67a' }}>
                  {'\u00A3'}{potentialReturn.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-colors"
                style={{ border: '1px solid #1A2238' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#161E2E'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-white"
                style={{
                  background: 'linear-gradient(135deg, #5B6EF5, #7082F8)',
                  boxShadow: '0 4px 15px rgba(91,110,245,0.25)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #7082F8, #8B9AF9)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #5B6EF5, #7082F8)'}
              >
                Confirm bet
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
