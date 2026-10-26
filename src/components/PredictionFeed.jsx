/**
 * PredictionFeed.jsx — PredictaMarket v4 Explore Tab
 * Social prediction feed — public bets from the community.
 * Also shows leaderboard snippet every ~7 cards.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Copy, TrendingUp, Trophy, Zap } from 'lucide-react';
import { MOCK_PREDICTIONS, LEADERBOARD } from '../data/socialData.js';
import AIBetBuilder from './AIBetBuilder.jsx';

const CONFIDENCE_STYLES = {
  high:   { label: '🔥 High',   bg: 'rgba(255,51,102,0.1)',   border: 'rgba(255,51,102,0.25)',  colour: '#FF7096' },
  medium: { label: '⚡ Mid',    bg: 'rgba(108,99,255,0.1)',   border: 'rgba(108,99,255,0.25)',  colour: '#9B8FFF' },
  low:    { label: '💭 Speccy', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)',   colour: '#7B8CAA' },
};

function TierBadge({ tier, tierColour, tierGrad }) {
  return (
    <span
      className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
      style={{
        background: tierGrad ? tierGrad : tierColour ? `${tierColour}22` : 'rgba(255,255,255,0.06)',
        color: tierGrad ? '#05080F' : tierColour || '#7B8CAA',
        border: tierGrad ? 'none' : `1px solid ${tierColour ? `${tierColour}44` : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      {tier}
    </span>
  );
}

function PredictionCard({ pred, index }) {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const conf = CONFIDENCE_STYLES[pred.confidence] || CONFIDENCE_STYLES.medium;

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(12,17,30,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Live accent */}
      {pred.isLive && (
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #FF3366, #FF6B35, transparent)' }} />
      )}

      {/* User header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white"
            style={{ background: pred.user.tierGrad || `linear-gradient(135deg, ${pred.user.tierColour || '#6C63FF'}, rgba(0,0,0,0.3))` }}
          >
            {pred.user.initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold" style={{ color: '#F0F6FF' }}>{pred.user.name}</span>
              {pred.verified && <span className="text-[10px]">✓</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px]" style={{ color: '#7B8CAA' }}>{pred.user.handle}</span>
              <TierBadge tier={pred.user.tier} tierColour={pred.user.tierColour} tierGrad={pred.user.tierGrad} />
            </div>
          </div>
        </div>
        <span className="text-[11px]" style={{ color: '#6B7894' }}>{pred.timestamp}</span>
      </div>

      {/* Prediction content */}
      <div className="px-4 py-3">
        {/* Event + competition pill */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,99,255,0.12)', color: '#9B8FFF', border: '1px solid rgba(108,99,255,0.2)' }}>
            {pred.competition}
          </span>
          <span className="text-xs font-semibold" style={{ color: '#7B8CAA' }}>{pred.event}</span>
          {pred.isLive && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,51,102,0.12)', border: '1px solid rgba(255,51,102,0.2)' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: '#FF3366', opacity: 0.75 }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: '#FF3366' }} />
              </span>
              <span className="text-[10px] font-bold" style={{ color: '#FF3366' }}>{pred.liveMinute}'</span>
            </div>
          )}
        </div>

        {/* Live score if active */}
        {pred.isLive && pred.liveScore && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,51,102,0.06)', border: '1px solid rgba(255,51,102,0.12)' }}>
            <span className="font-mono text-2xl font-black" style={{ background: 'linear-gradient(135deg, #6C63FF, #9B5DE5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {pred.liveScore.home}
            </span>
            <span style={{ color: '#6B7894' }}>–</span>
            <span className="font-mono text-2xl font-black" style={{ background: 'linear-gradient(135deg, #6C63FF, #9B5DE5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {pred.liveScore.away}
            </span>
            <span className="text-xs ml-2" style={{ color: '#FF7096' }}>WINNING 🔥</span>
          </div>
        )}

        {/* Selection + odds */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-lg font-black font-display" style={{ color: '#F0F6FF' }}>{pred.selection}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[13px] font-bold" style={{ color: '#9B8FFF' }}>@ {pred.odds}</span>
              <span className="text-[11px]" style={{ color: '#7B8CAA' }}>{pred.stakeDisplay} → {pred.returnDisplay}</span>
            </div>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: conf.bg, border: `1px solid ${conf.border}`, color: conf.colour }}
          >
            {conf.label}
          </span>
        </div>

        {/* Reasoning */}
        <p className="text-xs leading-relaxed" style={{ color: '#7B8CAA' }}>
          {pred.reasoning}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLiked(!liked)}
            className="flex items-center gap-1.5 transition-all"
          >
            <Heart
              className="w-4 h-4 transition-all"
              style={{ color: liked ? '#FF3366' : '#6B7894', fill: liked ? '#FF3366' : 'none' }}
            />
            <span className="text-xs font-semibold" style={{ color: liked ? '#FF7096' : '#6B7894' }}>
              {pred.likes + (liked ? 1 : 0)}
            </span>
          </button>
          <button className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" style={{ color: '#6B7894' }} />
            <span className="text-xs font-semibold" style={{ color: '#6B7894' }}>{pred.comments}</span>
          </button>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200"
          style={{
            background: copied ? 'rgba(0,245,160,0.12)' : 'rgba(108,99,255,0.08)',
            border: copied ? '1px solid rgba(0,245,160,0.3)' : '1px solid rgba(108,99,255,0.2)',
          }}
        >
          <Copy className="w-3.5 h-3.5" style={{ color: copied ? '#00F5A0' : '#9B8FFF' }} />
          <span className="text-xs font-bold" style={{ color: copied ? '#00F5A0' : '#9B8FFF' }}>
            {copied ? 'Copied!' : `Copy bet · ${pred.copies}`}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

function LeaderboardSnippet() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(10,12,22,0.9)',
        border: '1.5px solid rgba(108,99,255,0.25)',
        boxShadow: '0 0 24px rgba(108,99,255,0.08)',
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(108,99,255,0.1)' }}>
        <Trophy className="w-4 h-4" style={{ color: '#FFD700' }} />
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#9B8FFF' }}>This Week's Leaderboard</span>
      </div>
      <div className="p-3 space-y-2">
        {LEADERBOARD.map(entry => (
          <div key={entry.rank} className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ background: entry.rank === 1 ? 'rgba(255,215,0,0.05)' : 'transparent' }}>
            <span className="w-5 text-center text-xs font-black" style={{ color: entry.rank <= 3 ? '#FFD700' : '#6B7894' }}>{entry.rank}</span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
              style={{ background: entry.tierGrad || `${entry.tierColour}33` }}
            >
              {entry.name.split(' ').map(w => w[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: '#F0F6FF' }}>{entry.name}</p>
              <p className="text-[11px]" style={{ color: '#7B8CAA' }}>{entry.streak} day streak 🔥</p>
            </div>
            <span className="text-sm font-black font-mono" style={{ color: '#00F5A0' }}>{entry.roi}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PredictionFeed() {
  return (
    <div className="space-y-4">
      {/* AI Bet Builder at top */}
      <AIBetBuilder />

      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4" style={{ color: '#6C63FF' }} />
        <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#7B8CAA' }}>Community Predictions</h2>
      </div>

      {/* Feed with leaderboard injected at position 4 */}
      {MOCK_PREDICTIONS.map((pred, i) => (
        <div key={pred.id}>
          {i === 3 && <LeaderboardSnippet />}
          <div className={i === 3 ? 'mt-4' : ''}>
            <PredictionCard pred={pred} index={i} />
          </div>
        </div>
      ))}
    </div>
  );
}
