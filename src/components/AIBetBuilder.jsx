/**
 * AIBetBuilder.jsx — PredictaMarket v4
 * Natural language bet construction using Claude.
 * Falls back to mock suggestions if API unavailable.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, X, Plus } from 'lucide-react';
import { useBetSlip } from '../context/BetSlipContext.jsx';

const EXAMPLE_PROMPTS = [
  'Arsenal to win tonight at home',
  'Build me a football acca for Saturday',
  'LeBron over 28 points and Lakers to win',
  'Canelo to win by knockout',
];

const MOCK_SUGGESTIONS = [
  {
    fixture_id: 'mock-1',
    eventName: 'Arsenal vs Man City',
    market: 'Match Result',
    selection: 'Arsenal Win',
    odds: '3.20',
    probability: 31,
    reasoning: 'Arsenal are strong at home this season and Man City have a congested fixture list. The odds represent good value.',
    confidence: 'high',
  },
  {
    fixture_id: 'mock-2',
    eventName: 'Saturday Premier League Acca',
    market: 'Accumulator',
    selection: 'Chelsea Win + Liverpool Win + Spurs Win',
    odds: '8.50',
    probability: 12,
    reasoning: 'Three solid home favourites this weekend. Each individually has 60%+ implied probability — combined at 8.50 offers value.',
    confidence: 'medium',
  },
];

let mockIdx = 0;

async function fetchAISuggestion(message) {
  try {
    const res = await fetch('/api/ai-bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    // Graceful fallback — cycle through mock suggestions
    const suggestion = MOCK_SUGGESTIONS[mockIdx % MOCK_SUGGESTIONS.length];
    mockIdx++;
    return suggestion;
  }
}

function SuggestionCard({ suggestion, onAdd, onDismiss }) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    setAdded(true);
    onAdd(suggestion);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(10,14,28,0.9)',
        border: '1px solid rgba(108,99,255,0.35)',
        boxShadow: '0 0 24px rgba(108,99,255,0.1)',
      }}
    >
      {/* Top gradient accent */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #6C63FF, #9B5DE5, #B06FFF)' }} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9B8FFF' }}>
              {suggestion.market}
            </p>
            <p className="text-base font-black font-display" style={{ color: '#F0F6FF' }}>
              {suggestion.selection}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#7B8CAA' }}>{suggestion.eventName}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className="font-mono text-2xl font-black"
              style={{
                background: 'linear-gradient(135deg, #6C63FF, #B06FFF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {suggestion.odds}
            </span>
            <button onClick={onDismiss} style={{ color: '#6B7894' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-xs leading-relaxed mb-4" style={{ color: '#7B8CAA' }}>
          {suggestion.reasoning}
        </p>

        <button
          onClick={handleAdd}
          disabled={added}
          className="w-full py-3 rounded-xl text-sm font-black transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: added ? 'rgba(0,245,160,0.12)' : 'linear-gradient(135deg, #6C63FF, #9B5DE5)',
            color: added ? '#00F5A0' : '#F0F6FF',
            border: added ? '1px solid rgba(0,245,160,0.3)' : 'none',
            boxShadow: added ? 'none' : '0 4px 16px rgba(108,99,255,0.35)',
          }}
        >
          {added ? '✓ Added to slip' : <><Plus className="w-4 h-4" />Add to bet slip</>}
        </button>
      </div>
    </motion.div>
  );
}

export default function AIBetBuilder() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const { addSelection } = useBetSlip();
  const inputRef = useRef(null);

  async function handleSubmit(e) {
    e?.preventDefault();
    const msg = input.trim();
    if (!msg) return;
    setLoading(true);
    setSuggestion(null);
    const result = await fetchAISuggestion(msg);
    setLoading(false);
    setSuggestion(result);
    setInput('');
  }

  function handleExample(prompt) {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleAddToSlip(s) {
    addSelection({
      eventId: s.fixture_id,
      eventName: s.eventName,
      outcomeId: `ai-${s.fixture_id}`,
      outcomeName: s.selection,
      probability: s.probability || 20,
      decimalOdds: parseFloat(s.odds) || 2.0,
      sport: 'ai',
    });
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(8,10,22,0.9)',
        border: '1px solid rgba(108,99,255,0.2)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: 'linear-gradient(90deg, rgba(108,99,255,0.1) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(108,99,255,0.12)',
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #9B5DE5)', boxShadow: '0 4px 12px rgba(108,99,255,0.4)' }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-black font-display" style={{ color: '#F0F6FF' }}>AI Bet Builder</p>
          <p className="text-[11px]" style={{ color: '#7B8CAA' }}>Describe your bet in plain English</p>
        </div>
      </div>

      <div className="p-4">
        {/* Example prompts */}
        {!suggestion && !loading && (
          <div className="flex flex-wrap gap-2 mb-3">
            {EXAMPLE_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => handleExample(p)}
                className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: 'rgba(108,99,255,0.08)',
                  border: '1px solid rgba(108,99,255,0.2)',
                  color: '#9B8FFF',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Suggestion */}
        <AnimatePresence>
          {suggestion && (
            <div className="mb-3">
              <SuggestionCard
                suggestion={suggestion}
                onAdd={handleAddToSlip}
                onDismiss={() => setSuggestion(null)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center gap-3 py-4 px-4 mb-3 rounded-xl" style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)' }}>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#6C63FF' }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: '#9B8FFF' }}>Building your bet suggestion…</span>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. Arsenal to win tonight…"
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#F0F6FF',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: input.trim() ? 'linear-gradient(135deg, #6C63FF, #9B5DE5)' : 'rgba(255,255,255,0.05)',
              boxShadow: input.trim() ? '0 4px 16px rgba(108,99,255,0.4)' : 'none',
            }}
          >
            <Send className="w-4 h-4" style={{ color: input.trim() ? '#F0F6FF' : '#6B7894' }} />
          </button>
        </form>
      </div>
    </div>
  );
}
