/**
 * DepositLimits.jsx — Signup Step 4
 *
 * Responsible gambling deposit limit configuration.
 * Default: Weekly tab selected, £100 pre-selected.
 *
 * The three-tab approach is deliberate from a compliance perspective —
 * showing all three frequencies makes the cumulative impact clearer.
 * Pre-selecting a sensible default (£100/week) follows GamCare best practice
 * of nudging toward lower limits rather than showing no default.
 */

import { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import ProgressDots from '../components/ProgressDots.jsx';
import SegmentedControl from '../components/SegmentedControl.jsx';
import AuthButton from '../components/AuthButton.jsx';

const LIMIT_OPTIONS = {
  daily:   [10, 25, 50, 100, 200, 500],
  weekly:  [50, 100, 200, 500, 1000, 2000],
  monthly: [100, 200, 500, 1000, 2500, null], // null = Custom
};

const TABS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

// Default selections matching spec: Weekly, £100 pre-selected
const DEFAULT_LIMITS = {
  daily: 50,
  weekly: 100,
  monthly: 500,
};

export default function DepositLimits({ onNext, onBack, totalSteps = 4, currentStep = 2 }) {
  const [activeTab, setActiveTab] = useState('weekly');
  const [selections, setSelections] = useState({ ...DEFAULT_LIMITS });
  const [customValue, setCustomValue] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  function handlePillSelect(amount) {
    if (amount === null) {
      // Custom option
      setShowCustom(true);
      setSelections(p => ({ ...p, [activeTab]: null }));
    } else {
      setShowCustom(false);
      setSelections(p => ({ ...p, [activeTab]: amount }));
    }
  }

  function handleCustomInput(e) {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomValue(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) {
      setSelections(p => ({ ...p, [activeTab]: n }));
    }
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setShowCustom(false);
    setCustomValue('');
  }

  function handleContinue() {
    onNext({
      depositLimit: {
        daily: selections.daily,
        weekly: selections.weekly,
        monthly: selections.monthly,
      },
    });
  }

  const currentOptions = LIMIT_OPTIONS[activeTab];
  const currentSelection = selections[activeTab];

  return (
    <div className="flex flex-col min-h-full shrink-0 px-6 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="p-2 rounded-xl"
          style={{ color: '#7B8CAA', background: 'rgba(255,255,255,0.05)' }}
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <ProgressDots total={totalSteps} current={currentStep} />
        <div className="w-9" />
      </div>

      {/* Almost there label */}
      <p className="text-center text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#00F5A0' }}>
        Almost there
      </p>

      <h1 className="text-2xl font-black mb-2" style={{ color: '#F0F6FF' }}>
        Set your deposit limit
      </h1>
      <p className="text-sm mb-6" style={{ color: '#7B8CAA' }}>
        You're in control. Change this any time in Settings.
      </p>

      {/* Tab control */}
      <SegmentedControl
        options={TABS}
        value={activeTab}
        onChange={handleTabChange}
      />

      {/* Amount pills grid */}
      <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
        {currentOptions.map((amount, i) => {
          const isCustom = amount === null;
          const isSelected = isCustom
            ? showCustom || currentSelection === null
            : currentSelection === amount;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handlePillSelect(amount)}
              className="rounded-xl py-3.5 text-sm font-bold transition-all duration-150"
              style={{
                background: isSelected
                  ? 'rgba(108,99,255,0.2)'
                  : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isSelected ? '#6C63FF' : 'rgba(255,255,255,0.08)'}`,
                color: isSelected ? '#F0F6FF' : '#7B8CAA',
                boxShadow: isSelected ? '0 0 0 1px rgba(108,99,255,0.2)' : 'none',
              }}
            >
              {isCustom ? 'Custom' : `£${amount.toLocaleString()}`}
            </button>
          );
        })}
      </div>

      {/* Custom input */}
      {showCustom && (
        <div className="mb-4">
          <div
            className="flex items-center rounded-xl overflow-hidden"
            style={{
              border: '1.5px solid #6C63FF',
              background: 'rgba(108,99,255,0.08)',
              height: '56px',
            }}
          >
            <span className="px-4 font-mono font-semibold" style={{ color: '#9B8FFF' }}>£</span>
            <input
              type="text"
              inputMode="numeric"
              value={customValue}
              onChange={handleCustomInput}
              placeholder="Enter amount"
              autoFocus
              className="flex-1 min-w-0 bg-transparent outline-none pr-4 font-mono text-base"
              style={{ color: '#F0F6FF', caretColor: '#6C63FF' }}
            />
          </div>
        </div>
      )}

      {/* Green callout — context-aware message */}
      <div
        className="flex items-start gap-3 rounded-xl p-4 mb-6"
        style={{
          background: 'rgba(0,245,160,0.06)',
          border: '1px solid rgba(0,245,160,0.2)',
        }}
      >
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#00F5A0' }} />
        <p className="text-xs leading-relaxed" style={{ color: '#7B8CAA' }}>
          {activeTab === 'weekly' && currentSelection === 100
            ? '£100 per week is pre-selected as a sensible starting point. You can always change this later.'
            : `A £${currentSelection?.toLocaleString() ?? '—'} ${activeTab} limit helps you stay in control of your spending.`
          }
        </p>
      </div>

      {/* CTA */}
      <AuthButton
        variant="primary-gradient"
        onClick={handleContinue}
        className="mb-3"
      >
        Set limit and continue
      </AuthButton>

      <button
        type="button"
        onClick={() => onNext({ depositLimit: { daily: 150, weekly: 500, monthly: 1500 } })}
        className="w-full py-2 text-sm text-center transition-opacity"
        style={{ color: '#7B8CAA' }}
      >
        Skip for now
      </button>
    </div>
  );
}
