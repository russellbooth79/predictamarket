/**
 * SportsSelector.jsx — Player Profiling P2
 *
 * Multi-select sport grid + betting style preference.
 * Always-enabled CTA so users can proceed without selecting anything —
 * preferences are optional enrichment, not blockers.
 */

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import AuthButton from '../components/AuthButton.jsx';

const SPORTS = [
  { id: 'football',     label: 'Football',      icon: '⚽' },
  { id: 'horseracing',  label: 'Horse Racing',   icon: '🏇' },
  { id: 'tennis',       label: 'Tennis',         icon: '🎾' },
  { id: 'boxing',       label: 'Boxing',         icon: '🥊' },
  { id: 'nfl',          label: 'NFL',            icon: '🏈' },
  { id: 'nba',          label: 'NBA',            icon: '🏀' },
];

const STYLE_OPTIONS = [
  { value: 'results',  label: 'Match results' },
  { value: 'accas',    label: 'Building accas' },
];

export default function SportsSelector({ onNext, onBack, onSkip, isFinalStep = false }) {
  const [selectedSports, setSelectedSports] = useState([]);
  const [bettingStyle, setBettingStyle] = useState(null);

  function toggleSport(id) {
    setSelectedSports(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  function handleNext() {
    onNext({
      favouriteSports: selectedSports,
      styleSignal: bettingStyle,
    });
  }

  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl"
          style={{ color: '#7B8CAA', background: 'rgba(255,255,255,0.05)' }}
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-semibold"
            style={{ color: '#7B8CAA' }}
          >
            Skip
          </button>
        )}
        {!onSkip && <div className="w-9" />}
      </div>

      <h1 className="text-2xl font-black mb-2" style={{ color: '#F0F6FF' }}>
        Which sports do you follow?
      </h1>
      <p className="text-sm mb-6" style={{ color: '#7B8CAA' }}>
        We'll prioritise your feed with the sports you care about.
      </p>

      {/* 3×2 sport grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {SPORTS.map(sport => {
          const isSelected = selectedSports.includes(sport.id);
          return (
            <button
              key={sport.id}
              type="button"
              onClick={() => toggleSport(sport.id)}
              className="flex flex-col items-center gap-2 rounded-2xl py-5 transition-all duration-150"
              style={{
                background: isSelected ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isSelected ? '#6C63FF' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isSelected ? '0 0 0 1px rgba(108,99,255,0.2)' : 'none',
              }}
            >
              <span className="text-3xl">{sport.icon}</span>
              <span
                className="text-xs font-semibold text-center leading-tight"
                style={{ color: isSelected ? '#F0F6FF' : '#7B8CAA' }}
              >
                {sport.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Betting style question */}
      <div className="mb-8">
        <p className="text-sm font-semibold mb-3" style={{ color: '#F0F6FF' }}>
          How do you like to bet?
        </p>
        <div className="flex gap-3">
          {STYLE_OPTIONS.map(opt => {
            const isActive = bettingStyle === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBettingStyle(isActive ? null : opt.value)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{
                  background: isActive ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${isActive ? '#6C63FF' : 'rgba(255,255,255,0.08)'}`,
                  color: isActive ? '#F0F6FF' : '#7B8CAA',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <AuthButton
        variant="primary-gradient"
        onClick={handleNext}
      >
        {isFinalStep ? "Let's go" : 'Next'}
      </AuthButton>
    </div>
  );
}
