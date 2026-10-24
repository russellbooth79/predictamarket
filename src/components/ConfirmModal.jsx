/**
 * ConfirmModal.jsx
 *
 * Confirmation modal triggered when stake >= 20.
 * Shows full selection details with a clear summary of the position
 * before final confirmation.
 *
 * Uses Framer Motion for scale-in/out animation on the modal card
 * and a backdrop blur overlay behind it.
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
  // Guard: if selections is empty or stake is falsy, bail early
  if (!selections || selections.length === 0) return null;

  const parsedStake = parseFloat(stake) || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
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
            className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Warning header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">
                Confirm Position
              </h3>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              You are placing a position of <span className="font-mono text-white font-medium">£{parsedStake.toFixed(2)}</span>. Please review your selection{selections.length > 1 ? 's' : ''} below.
            </p>

            {/* Selection details */}
            <div className="space-y-2 mb-5">
              {selections.map((sel) => {
                const textColour = getProbabilityTextColour(sel.probability);
                return (
                  <div
                    key={`${sel.eventId}-${sel.outcomeId}`}
                    className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                  >
                    <p className="text-xs text-slate-400 mb-0.5">{sel.eventName}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-200">
                        {sel.outcomeName}
                      </span>
                      <span className={`font-mono text-sm font-bold ${textColour}`}>
                        {Math.round(sel.probability)}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs text-slate-500">
                        @ {sel.decimalOdds.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary line */}
            <div className="flex items-center justify-between py-3 border-t border-slate-700/50 mb-5">
              <div>
                <p className="text-xs text-slate-400">Stake</p>
                <p className="font-mono text-base font-bold text-white">
                  £{parsedStake.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Potential Return</p>
                <p className="font-mono text-base font-bold text-emerald-400">
                  £{potentialReturn.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/25"
              >
                Confirm Position
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
