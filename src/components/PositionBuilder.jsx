/**
 * PositionBuilder.jsx
 *
 * Right-panel bet slip (desktop) / tray + bottom sheet (mobile).
 *
 * Mobile: a collapsed tray slides up above the bottom nav as soon as the
 * first selection is added. Tapping or swiping it up expands the full sheet;
 * the sheet can be dragged down by its handle to collapse back to the tray.
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
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Trash2, LayoutGrid, ChevronUp, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { useUser } from '../context/UserContext.jsx';
import { useOddsFormat } from '../context/OddsFormatContext.jsx';
import { formatOdds, formatDecimalOdds } from '../utils/oddsFormatter.js';
import ConfirmModal from './ConfirmModal.jsx';

const QUICK_STAKES = [5, 10, 25, 50];
const HIGH_STAKE_THRESHOLD = 20;
const SUCCESS_DISPLAY_MS = 2500;
const MAX_RECOMMENDED_LEGS = 6;

// Mobile tray height (App's bottom spacer leaves matching room for it)
const MOBILE_TRAY_H = 60;

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
  const sheetDragControls = useDragControls();

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
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'linear-gradient(180deg, rgba(108,99,255,0.08) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center gap-2">
          <LayoutGrid
            className="w-4 h-4"
            style={{
              color: '#6C63FF',
              filter: 'drop-shadow(0 0 4px rgba(108,99,255,0.5))',
            }}
          />
          <h2
            className="text-sm font-black font-display"
            style={{
              background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Bet slip
          </h2>
          {hasSelections && (
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black text-white"
              style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)' }}
            >
              {selections.length}
            </span>
          )}
          {isAccumulator && (
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,245,160,0.1)', color: '#00F5A0', border: '1px solid rgba(0,245,160,0.2)' }}
            >
              ACCA
            </span>
          )}
        </div>
        {hasSelections && status === 'idle' && (
          <button
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: '#6B7894' }}
            onClick={clearAll}
            onMouseEnter={e => e.currentTarget.style.color = '#FF3366'}
            onMouseLeave={e => e.currentTarget.style.color = '#6B7894'}
          >
            <Trash2 className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Success */}
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
              <CheckCircle className="w-16 h-16 mb-4" style={{ color: '#00F5A0', filter: 'drop-shadow(0 0 12px rgba(0,245,160,0.5))' }} />
            </motion.div>
            <h3
              className="text-lg font-black font-display mb-1"
              style={{
                background: 'linear-gradient(135deg, #00F5A0 0%, #00D4FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Bet placed!
            </h3>
            <p className="text-sm" style={{ color: '#7B8CAA' }}>Good luck with your prediction.</p>
          </motion.div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle className="w-12 h-12 mb-3" style={{ color: '#FF3366' }} />
            <h3 className="text-sm font-bold text-white mb-1">Something went wrong</h3>
            <p className="text-xs mb-4" style={{ color: '#7B8CAA' }}>Please try again.</p>
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-xl text-sm transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F6FF' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Insufficient funds */}
        {status === 'insufficientFunds' && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle className="w-12 h-12 mb-3" style={{ color: '#FFD700' }} />
            <h3 className="text-sm font-bold text-white mb-1">Insufficient Funds</h3>
            <p className="text-xs mb-1" style={{ color: '#7B8CAA' }}>
              Balance: <span className="font-mono text-white">£{user.balance.toFixed(2)}</span>
            </p>
            <p className="text-xs mb-4" style={{ color: '#7B8CAA' }}>Reduce stake or add funds.</p>
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-xl text-sm transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F6FF' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Go Back
            </button>
          </div>
        )}

        {/* Submitting */}
        {status === 'submitting' && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: '#6C63FF' }} />
            <p className="text-sm" style={{ color: '#7B8CAA' }}>Placing your bet...</p>
          </div>
        )}

        {/* Empty state */}
        {!hasSelections && status === 'idle' && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.15)' }}
            >
              <LayoutGrid className="w-6 h-6" style={{ color: '#6C63FF', opacity: 0.6 }} />
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: '#7B8CAA' }}>No selections yet</h3>
            <p className="text-xs max-w-[190px]" style={{ color: '#6B7894' }}>
              Tap any price to add it to your slip.
            </p>
          </div>
        )}

        {/* Accumulator summary */}
        {isAccumulator && (status === 'idle' || status === 'confirming') && (
          <div className="px-3 pt-3">
            <div
              className="rounded-xl p-3"
              style={{
                background: 'rgba(0,245,160,0.05)',
                border: '1px solid rgba(0,245,160,0.15)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#00F5A0' }}>
                  {accaLabel}
                </span>
                <span
                  className="font-mono text-lg font-black"
                  style={{
                    background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {formatOdds(combinedProbability, format)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ color: '#6B7894' }}>Combined Odds</span>
                <span className="font-mono text-sm font-bold" style={{ color: '#9B8FFF' }}>
                  {formatDecimalOdds(combinedDecimalOdds, format)}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-1">
                {selections.map((sel, i) => (
                  <div key={`${sel.eventId}-${sel.outcomeId}`} className="flex items-center gap-1">
                    <span
                      className="flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black"
                      style={{ background: 'rgba(108,99,255,0.15)', color: '#9B8FFF' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[10px] truncate max-w-[72px]" style={{ color: '#7B8CAA' }}>
                      {sel.outcomeName}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: '#6B7894' }}>
                      {formatOdds(sel.probability, format)}
                    </span>
                    {i < selections.length - 1 && (
                      <span className="text-xs font-black mx-0.5" style={{ color: '#6B7894' }}>+</span>
                    )}
                  </div>
                ))}
              </div>
              {selections.length > MAX_RECOMMENDED_LEGS && (
                <div
                  className="mt-3 px-2.5 py-2 rounded-lg text-[10px] leading-relaxed"
                  style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.15)', color: '#FFB347' }}
                >
                  Accas over {MAX_RECOMMENDED_LEGS} legs carry significantly higher risk.
                  Combined probability: {combinedProbability.toFixed(1)}%.
                </div>
              )}
              {selections.length >= 3 && (
                <div className="mt-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" style={{ color: '#6C63FF' }} />
                  <span className="text-[10px] font-semibold" style={{ color: '#9B8FFF' }}>
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
              {selections.map((sel) => (
                <motion.div
                  key={`${sel.eventId}-${sel.outcomeId}`}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl p-3"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(108,99,255,0.2)',
                  }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs pr-2 leading-tight" style={{ color: '#7B8CAA' }}>
                      {sel.eventName}
                    </p>
                    <button
                      onClick={() => removeSelection(sel.eventId)}
                      className="shrink-0 transition-colors flex items-center justify-center w-8 h-8 -mr-1 active:opacity-60"
                      style={{ color: '#6B7894' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#FF3366'}
                      onMouseLeave={e => e.currentTarget.style.color = '#6B7894'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-display" style={{ color: '#F0F6FF' }}>
                      {sel.outcomeName}
                    </span>
                    <span
                      className="font-mono text-sm font-black"
                      style={{
                        background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {formatOdds(sel.probability, format)}
                    </span>
                  </div>
                  {sel.sport === 'horseracing' && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="text-[10px] px-2 py-0.5 rounded-full transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.07)', color: '#7B8CAA' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)';
                          e.currentTarget.style.color = '#9B8FFF';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                          e.currentTarget.style.color = '#7B8CAA';
                        }}
                      >
                        Each Way
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Stake section */}
      {hasSelections && (status === 'idle' || status === 'confirming') && (
        <div
          className="px-4 py-3 space-y-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Quick stake buttons */}
          <div className="flex gap-2">
            {QUICK_STAKES.map((amount) => (
              <button
                key={amount}
                onClick={() => setStake(String(amount))}
                className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={
                  stakeNum === amount
                    ? {
                        background: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)',
                        color: '#ffffff',
                        boxShadow: '0 4px 12px rgba(108,99,255,0.3)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.05)',
                        color: '#7B8CAA',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }
                }
                onMouseEnter={e => {
                  if (stakeNum !== amount) {
                    e.currentTarget.style.background = 'rgba(108,99,255,0.1)';
                    e.currentTarget.style.color = '#F0F6FF';
                  }
                }}
                onMouseLeave={e => {
                  if (stakeNum !== amount) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#7B8CAA';
                  }
                }}
              >
                £{amount}
              </button>
            ))}
          </div>

          {/* Stake input */}
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm"
              style={{ color: '#7B8CAA' }}
            >
              £
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={stake}
              onChange={(e) => handleStakeChange(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl pl-7 pr-3 py-2.5 font-mono text-sm focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#F0F6FF',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(108,99,255,0.5)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.1)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Potential return */}
          {stakeNum > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#7B8CAA' }}>Potential Return</span>
              <span
                className="font-mono text-sm font-black"
                style={{
                  background: 'linear-gradient(135deg, #00F5A0 0%, #00D4FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                £{potentialReturn.toFixed(2)}
              </span>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handlePlacePosition}
            disabled={stakeNum <= 0}
            className="w-full py-3.5 rounded-xl text-sm font-black transition-all cursor-pointer"
            style={
              stakeNum > 0
                ? {
                    background: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)',
                    color: '#ffffff',
                    boxShadow: '0 6px 20px rgba(108,99,255,0.4), 0 0 0 1px rgba(108,99,255,0.3)',
                  }
                : {
                    background: 'rgba(255,255,255,0.04)',
                    color: '#6B7894',
                    cursor: 'not-allowed',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }
            }
            onMouseEnter={e => {
              if (stakeNum > 0) e.currentTarget.style.boxShadow = '0 8px 28px rgba(108,99,255,0.55), 0 0 0 1px rgba(108,99,255,0.4)';
            }}
            onMouseLeave={e => {
              if (stakeNum > 0) e.currentTarget.style.boxShadow = '0 6px 20px rgba(108,99,255,0.4), 0 0 0 1px rgba(108,99,255,0.3)';
            }}
          >
            {stakeNum >= HIGH_STAKE_THRESHOLD
              ? `Confirm ${isAccumulator ? accaLabel : 'bet'} · £${stakeNum.toFixed(2)}`
              : stakeNum > 0
                ? `Place ${isAccumulator ? accaLabel : 'bet'} · £${stakeNum.toFixed(2)}`
                : 'Enter Stake'}
          </button>
        </div>
      )}

      {/* Footer */}
      <div
        className="px-4 py-2.5 mt-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center justify-between text-[10px]" style={{ color: '#6B7894' }}>
          <button
            className="underline transition-colors"
            onMouseEnter={e => e.currentTarget.style.color = '#7B8CAA'}
            onMouseLeave={e => e.currentTarget.style.color = '#6B7894'}
          >
            Deposit Limits
          </button>
          <span>18+ | BeGambleAware.org</span>
        </div>
      </div>

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
          background: 'rgba(8,12,20,0.9)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {panelContent}
      </aside>

      {/* Mobile tray + bottom sheet */}
      <div className="lg:hidden">
        <AnimatePresence>
          {hasSelections && (
            <motion.div
              key="slip-tray"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.25, bottom: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -24 || info.velocity.y < -300) setMobileOpen(true);
              }}
              className="fixed left-0 right-0 z-40 px-3"
              style={{ bottom: 'var(--bottom-nav-total)', height: MOBILE_TRAY_H, touchAction: 'none' }}
            >
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open bet slip"
                className="relative w-full h-full flex items-center gap-3 px-4 rounded-t-2xl text-left"
                style={{
                  background: 'linear-gradient(135deg, rgba(30,26,70,0.98) 0%, rgba(14,16,34,0.98) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(108,99,255,0.35)',
                  borderBottom: 'none',
                  boxShadow: '0 -8px 30px rgba(108,99,255,0.25)',
                }}
              >
                {/* Grab handle */}
                <span
                  className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.18)' }}
                />

                {/* Count — pops each time a selection is added or removed */}
                <motion.span
                  key={selections.length}
                  initial={{ scale: 1.35 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 400 }}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white"
                  style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)', boxShadow: '0 0 12px rgba(108,99,255,0.5)' }}
                >
                  {selections.length}
                </motion.span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black font-display truncate" style={{ color: '#F0F6FF' }}>
                    {isAccumulator ? accaLabel : selections[0].outcomeName}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#7B8CAA' }}>
                    {isAccumulator ? `${selections.length} selections` : selections[0].eventName}
                  </p>
                </div>

                <span className="shrink-0 font-mono text-sm font-black" style={{ color: '#B0A5FF' }}>
                  {isAccumulator
                    ? formatDecimalOdds(combinedDecimalOdds, format)
                    : formatOdds(selections[0].probability, format)}
                </span>
                <ChevronUp className="shrink-0 w-5 h-5" style={{ color: '#7B8CAA' }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70]"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                drag="y"
                dragListener={false}
                dragControls={sheetDragControls}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 1 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 100 || info.velocity.y > 500) setMobileOpen(false);
                }}
                className="fixed bottom-0 left-0 right-0 z-[80] rounded-t-3xl max-h-[85vh] flex flex-col"
                style={{
                  background: 'rgba(8,12,20,0.97)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  borderTop: '1px solid rgba(108,99,255,0.25)',
                  boxShadow: '0 -20px 60px rgba(108,99,255,0.15)',
                  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
              >
                {/* Drag handle — pull down to collapse back to the tray */}
                <div
                  className="flex justify-center py-3 cursor-grab"
                  style={{ touchAction: 'none' }}
                  onPointerDown={e => sheetDragControls.start(e)}
                >
                  <div
                    className="w-10 h-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                  />
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
