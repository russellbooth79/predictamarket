/**
 * PositionBuilder.jsx
 *
 * Right-panel bet slip (desktop) / bottom sheet (mobile).
 *
 * Orchestrates the full betting flow:
 * 1. User adds selections from event cards
 * 2. User enters stake via quick buttons or manual input
 * 3. Stake < 20: direct submission (500ms mock delay) -> success
 * 4. Stake >= 20: ConfirmModal gates the submission
 * 5. On success: balance deducts, bet recorded, success state shown 2.5s, then reset
 *
 * Potential return calculation: stake / (probability / 100)
 * This converts the probability into implied decimal odds for the return.
 * For a 50% probability with 10 stake: 10 / 0.5 = 20 return.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, LayoutGrid, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useUser } from '../context/UserContext.jsx';
import { getProbabilityTextColour } from '../data/oddsUtils.js';
import ConfirmModal from './ConfirmModal.jsx';

const QUICK_STAKES = [5, 10, 25, 50];
const HIGH_STAKE_THRESHOLD = 20;
const SUCCESS_DISPLAY_MS = 2500;

export default function PositionBuilder() {
  const {
    selections,
    stake,
    status,
    setStake,
    removeSelection,
    clearAll,
    confirm,
    submit,
    success,
    error,
    insufficientFunds,
    cancel,
    reset,
  } = useBetSlip();

  const { user, placeBet } = useUser();

  // Mobile bottom sheet toggle
  const [mobileOpen, setMobileOpen] = useState(false);

  const stakeNum = parseFloat(stake) || 0;

  // Potential return: for singles, use the first selection's probability.
  // In a multi-selection accumulator you'd multiply probabilities --
  // this prototype supports singles only (one outcome per placement).
  const potentialReturn =
    selections.length > 0 && stakeNum > 0
      ? parseFloat((stakeNum / (selections[0].probability / 100)).toFixed(2))
      : 0;

  /**
   * Handle the confirm/place flow.
   * Stakes >= 20 show the confirmation modal first.
   */
  function handlePlacePosition() {
    if (stakeNum <= 0 || selections.length === 0) return;

    if (stakeNum > user.balance) {
      insufficientFunds();
      return;
    }

    if (stakeNum >= HIGH_STAKE_THRESHOLD) {
      confirm();
    } else {
      executeSubmission();
    }
  }

  /** Run the actual submission after optional confirmation. */
  const executeSubmission = useCallback(async () => {
    submit();
    try {
      await placeBet(selections, stakeNum);
      success();
    } catch {
      error();
    }
  }, [selections, stakeNum, placeBet, submit, success, error]);

  // Auto-reset after success display
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        reset();
        setMobileOpen(false);
      }, SUCCESS_DISPLAY_MS);
      return () => clearTimeout(timer);
    }
  }, [status, reset]);

  // Validate stake input -- allow only numeric values with up to 2 decimal places
  function handleStakeChange(value) {
    if (value === '') {
      setStake('');
      return;
    }
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setStake(value);
    }
  }

  const hasSelections = selections.length > 0;

  // Desktop panel content (also used in mobile sheet)
  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-100">Position Builder</h2>
          {hasSelections && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              {selections.length}
            </span>
          )}
        </div>
        {hasSelections && status === 'idle' && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Content area -- scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Success state */}
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 px-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
            >
              <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
            </motion.div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">
              Position Placed!
            </h3>
            <p className="text-sm text-slate-400">
              Good luck with your prediction.
            </p>
          </motion.div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <h3 className="text-sm font-semibold text-slate-100 mb-1">
              Something went wrong
            </h3>
            <p className="text-xs text-slate-400 mb-4">Please try again.</p>
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-lg border border-slate-600 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Insufficient funds state */}
        {status === 'insufficientFunds' && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
            <h3 className="text-sm font-semibold text-slate-100 mb-1">
              Insufficient Funds
            </h3>
            <p className="text-xs text-slate-400 mb-1">
              Your balance is <span className="font-mono text-white">£{user.balance.toFixed(2)}</span>
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Reduce your stake or add funds to continue.
            </p>
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-lg border border-slate-600 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        {/* Submitting state */}
        {status === 'submitting' && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
            <p className="text-sm text-slate-400">Placing your position...</p>
          </div>
        )}

        {/* Empty state */}
        {!hasSelections && status === 'idle' && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <LayoutGrid className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-400 mb-1">
              No selections yet
            </h3>
            <p className="text-xs text-slate-500 max-w-[200px]">
              Click on any outcome to add it to your position builder.
            </p>
          </div>
        )}

        {/* Selection cards */}
        {hasSelections && (status === 'idle' || status === 'confirming') && (
          <div className="p-3 space-y-2">
            <AnimatePresence mode="popLayout">
              {selections.map((sel) => {
                const textColour = getProbabilityTextColour(sel.probability);
                return (
                  <motion.div
                    key={`${sel.eventId}-${sel.outcomeId}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs text-slate-400 pr-2 leading-tight">
                        {sel.eventName}
                      </p>
                      <button
                        onClick={() => removeSelection(sel.eventId)}
                        className="p-0.5 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-200">
                        {sel.outcomeName}
                      </span>
                      <span className={`font-mono text-sm font-bold ${textColour}`}>
                        {Math.round(sel.probability)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Stake section -- only when there are selections and status is idle/confirming */}
      {hasSelections && (status === 'idle' || status === 'confirming') && (
        <div className="border-t border-slate-800 px-4 py-3 space-y-3">
          {/* Quick stake buttons */}
          <div className="flex gap-2">
            {QUICK_STAKES.map((amount) => (
              <button
                key={amount}
                onClick={() => setStake(String(amount))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  stakeNum === amount
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                £{amount}
              </button>
            ))}
          </div>

          {/* Stake input */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
              £
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={stake}
              onChange={(e) => handleStakeChange(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
            />
          </div>

          {/* Potential return */}
          {stakeNum > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Potential Return</span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                £{potentialReturn.toFixed(2)}
              </span>
            </div>
          )}

          {/* Place position button */}
          <button
            onClick={handlePlacePosition}
            disabled={stakeNum <= 0}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
              stakeNum > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {stakeNum >= HIGH_STAKE_THRESHOLD
              ? `Confirm Position  ·  £${stakeNum.toFixed(2)}`
              : stakeNum > 0
                ? `Place Position  ·  £${stakeNum.toFixed(2)}`
                : 'Enter Stake'}
          </button>
        </div>
      )}

      {/* Responsible gambling footer -- always visible */}
      <div className="border-t border-slate-800 px-4 py-3 mt-auto">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <button className="hover:text-slate-300 transition-colors underline">
            Deposit Limits
          </button>
          <span>18+ | BeGambleAware.org</span>
        </div>
      </div>

      {/* Confirm modal -- rendered inside the component tree but portals to overlay */}
      <ConfirmModal
        isOpen={status === 'confirming'}
        selections={selections}
        stake={stake}
        potentialReturn={potentialReturn}
        onConfirm={executeSubmission}
        onCancel={cancel}
      />
    </div>
  );

  return (
    <>
      {/* Desktop panel -- hidden on mobile */}
      <aside className="hidden lg:flex flex-col fixed right-0 top-14 bottom-0 w-80 bg-slate-900 border-l border-slate-800 z-30">
        {panelContent}
      </aside>

      {/* Mobile floating action button + bottom sheet */}
      <div className="lg:hidden">
        {/* FAB -- shows selection count */}
        {hasSelections && !mobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center"
          >
            <div className="relative">
              <LayoutGrid className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
                {selections.length}
              </span>
            </div>
          </button>
        )}

        {/* Bottom sheet overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 rounded-t-2xl border-t border-slate-700 max-h-[85vh] flex flex-col"
              >
                {/* Drag handle */}
                <div className="flex justify-center py-2">
                  <div className="w-10 h-1 rounded-full bg-slate-700" />
                </div>
                {panelContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
