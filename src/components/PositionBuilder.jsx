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
 * Accumulator support:
 * - When 2+ selections: shows ACCA badge, acca label, combined probability,
 *   combined decimal odds, numbered leg chain, and risk warning for 6+ legs.
 * - Potential return uses combined odds for accas vs single-selection odds.
 *
 * PredictaMarket v3 palette: electric indigo accent, deep navy panels.
 */

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, LayoutGrid, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useUser } from '../context/UserContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds, formatDecimalOdds } from '../utils/oddsFormatter.js';
import { getProbabilityTextColour } from '../data/oddsUtils.js';
import ConfirmModal from './ConfirmModal.jsx';

const QUICK_STAKES = [5, 10, 25, 50];
const HIGH_STAKE_THRESHOLD = 20;
const SUCCESS_DISPLAY_MS = 2500;
const MAX_RECOMMENDED_LEGS = 6;

export default function PositionBuilder({ mobileOpen = false, onMobileOpenChange }) {
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
    // Accumulator derived values
    combinedProbability,
    combinedDecimalOdds,
    isAccumulator,
    accaLabel,
  } = useBetSlip();

  const { user, placeBet } = useUser();
  const { format } = useOddsFormat();

  function setMobileOpen(val) {
    onMobileOpenChange?.(val);
  }

  const stakeNum = parseFloat(stake) || 0;

  // Potential return: single uses individual odds, acca uses combined odds
  const potentialReturn =
    selections.length > 0 && stakeNum > 0
      ? isAccumulator
        ? parseFloat((stakeNum * combinedDecimalOdds).toFixed(2))
        : parseFloat((stakeNum / (selections[0].probability / 100)).toFixed(2))
      : 0;

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

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1A2238' }}>
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4" style={{ color: '#5B6EF5' }} />
          <h2 className="text-sm font-semibold text-white">Position Builder</h2>
          {hasSelections && (
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: '#5B6EF5' }}
            >
              {selections.length}
            </span>
          )}
          {/* ACCA badge -- shown when 2+ selections */}
          {isAccumulator && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(0,182,122,0.15)', color: '#00b67a' }}
            >
              ACCA
            </span>
          )}
        </div>
        {hasSelections && status === 'idle' && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
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
              <CheckCircle className="w-16 h-16 mb-4" style={{ color: '#00b67a' }} />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Position Placed!
            </h3>
            <p className="text-sm text-gray-400">
              Good luck with your prediction.
            </p>
          </motion.div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle className="w-12 h-12 mb-3" style={{ color: '#e5302f' }} />
            <h3 className="text-sm font-semibold text-white mb-1">
              Something went wrong
            </h3>
            <p className="text-xs text-gray-400 mb-4">Please try again.</p>
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
              style={{ border: '1px solid #1A2238' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#161E2E'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Insufficient funds state */}
        {status === 'insufficientFunds' && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle className="w-12 h-12 mb-3" style={{ color: '#f59e0b' }} />
            <h3 className="text-sm font-semibold text-white mb-1">
              Insufficient Funds
            </h3>
            <p className="text-xs text-gray-400 mb-1">
              Your balance is <span className="font-mono text-white">{'\u00A3'}{user.balance.toFixed(2)}</span>
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Reduce your stake or add funds to continue.
            </p>
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
              style={{ border: '1px solid #1A2238' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#161E2E'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Go Back
            </button>
          </div>
        )}

        {/* Submitting state */}
        {status === 'submitting' && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: '#5B6EF5' }} />
            <p className="text-sm text-gray-400">Placing your position...</p>
          </div>
        )}

        {/* Empty state */}
        {!hasSelections && status === 'idle' && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: '#161E2E' }}
            >
              <LayoutGrid className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">
              No selections yet
            </h3>
            <p className="text-xs text-gray-500 max-w-[200px]">
              Click on any outcome to add it to your position builder.
            </p>
          </div>
        )}

        {/* Accumulator summary -- shown above selections when 2+ legs */}
        {isAccumulator && (status === 'idle' || status === 'confirming') && (
          <div className="px-3 pt-3">
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: 'rgba(0,182,122,0.06)',
                border: '1px solid rgba(0,182,122,0.15)',
              }}
            >
              {/* Acca label + combined probability */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#00b67a' }}>
                  {accaLabel}
                </span>
                <span className="font-mono text-lg font-bold text-white">
                  {formatOdds(combinedProbability, format)}
                </span>
              </div>

              {/* Combined decimal odds */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">Combined Odds</span>
                <span className="font-mono text-sm font-medium" style={{ color: '#5B6EF5' }}>
                  {formatDecimalOdds(combinedDecimalOdds, format)}
                </span>
              </div>

              {/* Leg chain -- numbered legs connected by + */}
              <div className="flex items-center flex-wrap gap-1">
                {selections.map((sel, i) => (
                  <div key={`${sel.eventId}-${sel.outcomeId}`} className="flex items-center gap-1">
                    <span
                      className="flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold"
                      style={{ backgroundColor: '#161E2E', color: '#8A97B4' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[80px]">
                      {sel.outcomeName}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {formatOdds(sel.probability, format)}
                    </span>
                    {i < selections.length - 1 && (
                      <span className="text-gray-600 font-bold text-xs mx-0.5">+</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Risk warning for 6+ legs */}
              {selections.length > MAX_RECOMMENDED_LEGS && (
                <div
                  className="mt-3 px-2.5 py-2 rounded-lg text-[10px] text-gray-300 leading-relaxed"
                  style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)' }}
                >
                  Accas over {MAX_RECOMMENDED_LEGS} legs carry significantly higher risk.
                  Combined probability drops to {combinedProbability.toFixed(1)}%.
                </div>
              )}

              {/* Boost your Acca -- visual element for 3+ legs */}
              {selections.length >= 3 && (
                <div className="mt-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" style={{ color: '#5B6EF5' }} />
                  <span className="text-[10px] font-medium" style={{ color: '#5B6EF5' }}>
                    Boost your Acca — enhanced odds available
                  </span>
                </div>
              )}
            </div>
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
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: 'rgba(22,30,46,0.5)',
                      border: '1px solid rgba(26,34,56,0.5)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs text-gray-400 pr-2 leading-tight">
                        {sel.eventName}
                      </p>
                      <button
                        onClick={() => removeSelection(sel.eventId)}
                        className="p-0.5 text-gray-500 hover:text-red-400 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-200">
                        {sel.outcomeName}
                      </span>
                      <span className={`font-mono text-sm font-bold ${textColour}`}>
                        {formatOdds(sel.probability, format)}
                      </span>
                    </div>
                    {/* Each-way toggle for horse racing legs -- visual placeholder */}
                    {sel.sport === 'horseracing' && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          className="text-[10px] text-gray-500 px-2 py-0.5 rounded-full transition-colors"
                          style={{ border: '1px solid #1A2238' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#5B6EF5';
                            e.currentTarget.style.color = '#5B6EF5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#1A2238';
                            e.currentTarget.style.color = '#8A97B4';
                          }}
                        >
                          Each Way
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Stake section */}
      {hasSelections && (status === 'idle' || status === 'confirming') && (
        <div className="px-4 py-3 space-y-3" style={{ borderTop: '1px solid #1A2238' }}>
          {/* Quick stake buttons */}
          <div className="flex gap-2">
            {QUICK_STAKES.map((amount) => (
              <button
                key={amount}
                onClick={() => setStake(String(amount))}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={
                  stakeNum === amount
                    ? { backgroundColor: '#5B6EF5', color: '#ffffff' }
                    : { backgroundColor: '#161E2E', color: '#8A97B4' }
                }
                onMouseEnter={(e) => {
                  if (stakeNum !== amount) {
                    e.currentTarget.style.backgroundColor = '#1A2238';
                    e.currentTarget.style.color = '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (stakeNum !== amount) {
                    e.currentTarget.style.backgroundColor = '#161E2E';
                    e.currentTarget.style.color = '#8A97B4';
                  }
                }}
              >
                {'\u00A3'}{amount}
              </button>
            ))}
          </div>

          {/* Stake input */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">
              {'\u00A3'}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={stake}
              onChange={(e) => handleStakeChange(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg pl-7 pr-3 py-2.5 font-mono text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
              style={{
                backgroundColor: '#161E2E',
                border: '1px solid #1A2238',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#5B6EF5';
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(91,110,245,0.3)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#1A2238';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Potential return */}
          {stakeNum > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Potential Return</span>
              <span className="font-mono text-sm font-bold" style={{ color: '#00b67a' }}>
                {'\u00A3'}{potentialReturn.toFixed(2)}
              </span>
            </div>
          )}

          {/* Place position button */}
          <button
            onClick={handlePlacePosition}
            disabled={stakeNum <= 0}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            style={
              stakeNum > 0
                ? {
                    background: 'linear-gradient(135deg, #5B6EF5, #7082F8)',
                    color: '#ffffff',
                    boxShadow: '0 4px 15px rgba(91,110,245,0.25)',
                  }
                : {
                    backgroundColor: '#161E2E',
                    color: '#64748b',
                    cursor: 'not-allowed',
                  }
            }
            onMouseEnter={(e) => {
              if (stakeNum > 0) e.currentTarget.style.background = 'linear-gradient(135deg, #7082F8, #8B9AF9)';
            }}
            onMouseLeave={(e) => {
              if (stakeNum > 0) e.currentTarget.style.background = 'linear-gradient(135deg, #5B6EF5, #7082F8)';
            }}
          >
            {stakeNum >= HIGH_STAKE_THRESHOLD
              ? `Confirm ${isAccumulator ? accaLabel : 'Position'}  \u00B7  \u00A3${stakeNum.toFixed(2)}`
              : stakeNum > 0
                ? `Place ${isAccumulator ? accaLabel : 'Position'}  \u00B7  \u00A3${stakeNum.toFixed(2)}`
                : 'Enter Stake'}
          </button>
        </div>
      )}

      {/* Responsible gambling footer */}
      <div className="px-4 py-3 mt-auto" style={{ borderTop: '1px solid #1A2238' }}>
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <button className="hover:text-gray-300 transition-colors underline">
            Deposit Limits
          </button>
          <span>18+ | BeGambleAware.org</span>
        </div>
      </div>

      {/* Confirm modal */}
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
      {/* Desktop panel */}
      <aside
        className="hidden lg:flex flex-col fixed right-0 top-14 bottom-0 w-80 z-30"
        style={{
          backgroundColor: '#0F1520',
          borderLeft: '1px solid #1A2238',
        }}
      >
        {panelContent}
      </aside>

      {/* Mobile floating action button + bottom sheet */}
      <div className="lg:hidden">
        {/* FAB */}
        {hasSelections && !mobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full text-white flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #5B6EF5, #7082F8)',
              boxShadow: '0 4px 15px rgba(91,110,245,0.3)',
            }}
          >
            <div className="relative">
              <LayoutGrid className="w-6 h-6" />
              <span
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: '#e5302f' }}
              >
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
                className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[85vh] flex flex-col"
                style={{
                  backgroundColor: '#0F1520',
                  borderTop: '1px solid #1A2238',
                }}
              >
                {/* Drag handle */}
                <div className="flex justify-center py-2">
                  <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#1A2238' }} />
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
