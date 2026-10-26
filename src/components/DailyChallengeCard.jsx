/**
 * DailyChallengeCard.jsx — PredictaMarket v4
 * Free-to-play daily prediction challenge.
 * Challenge is deterministic per calendar date — same challenge all day.
 * Green border distinguishes it from betting cards.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Check } from 'lucide-react';

const CHALLENGES = [
  { question: 'Who scores first in tonight\'s Premier League clash?', options: ['Home team', 'Away team', 'No goal in 90 mins'], points: 125 },
  { question: 'Which match will have the most corners today?', options: ['Match A', 'Match B', 'Match C'], points: 100 },
  { question: 'Predict the correct score: Man City vs Arsenal', options: ['2–1', '1–0', '1–1'], points: 150 },
  { question: 'Will there be a red card in today\'s El Clásico?', options: ['Yes', 'No'], points: 75 },
  { question: 'Who will win the Man of the Match award?', options: ['Home captain', 'Away striker', 'Home keeper'], points: 110 },
  { question: 'How many goals in the Liverpool vs Chelsea match?', options: ['Under 2.5', 'Exactly 3', 'Over 3.5'], points: 90 },
  { question: 'Which team lands the first shot on target?', options: ['Home side', 'Away side'], points: 80 },
];

function getDailyChallenge() {
  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return CHALLENGES[dayOfYear % CHALLENGES.length];
}

export default function DailyChallengeCard({ index = 1 }) {
  const challenge = getDailyChallenge();
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
  }

  return (
    <motion.div
      custom={index}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(10,20,18,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(0,245,160,0.3)',
        boxShadow: '0 0 24px rgba(0,245,160,0.06)',
      }}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #00F5A0 0%, #00D4FF 100%)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(0,245,160,0.1)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,245,160,0.15)', border: '1px solid rgba(0,245,160,0.3)' }}
          >
            <Zap className="w-3.5 h-3.5" style={{ color: '#00F5A0' }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#00F5A0' }}>
            Daily Challenge
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,245,160,0.1)', border: '1px solid rgba(0,245,160,0.2)' }}>
          <Trophy className="w-3 h-3" style={{ color: '#FFD700' }} />
          <span className="text-[10px] font-black" style={{ color: '#00F5A0' }}>+{challenge.points} pts</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        <p className="text-base font-bold font-display mb-4 leading-snug" style={{ color: '#F0F6FF' }}>
          {challenge.question}
        </p>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="submitted"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-4 gap-3"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,245,160,0.15)', border: '1px solid rgba(0,245,160,0.4)' }}
              >
                <Check className="w-6 h-6" style={{ color: '#00F5A0' }} />
              </div>
              <p className="text-sm font-bold text-center" style={{ color: '#00F5A0' }}>
                Prediction locked in!
              </p>
              <p className="text-xs text-center" style={{ color: '#7B8CAA' }}>
                You'll earn up to {challenge.points} pts when this settles.
              </p>
            </motion.div>
          ) : (
            <motion.div key="options" className="space-y-2">
              {challenge.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150"
                  style={{
                    background: selected === i ? 'rgba(0,245,160,0.12)' : 'rgba(255,255,255,0.03)',
                    border: selected === i ? '1px solid rgba(0,245,160,0.5)' : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: selected === i ? '0 0 12px rgba(0,245,160,0.1)' : 'none',
                  }}
                >
                  <span className="text-sm font-semibold" style={{ color: selected === i ? '#00F5A0' : '#F0F6FF' }}>{opt}</span>
                  {selected === i && <Check className="w-4 h-4" style={{ color: '#00F5A0' }} />}
                </button>
              ))}

              <button
                onClick={handleSubmit}
                disabled={selected === null}
                className="w-full py-3.5 rounded-xl text-sm font-black mt-3 transition-all duration-200"
                style={{
                  background: selected !== null ? 'linear-gradient(135deg, #00F5A0 0%, #00D4FF 100%)' : 'rgba(255,255,255,0.05)',
                  color: selected !== null ? '#05080F' : '#6B7894',
                  cursor: selected !== null ? 'pointer' : 'not-allowed',
                  boxShadow: selected !== null ? '0 4px 16px rgba(0,245,160,0.3)' : 'none',
                }}
              >
                Lock in prediction — free
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
