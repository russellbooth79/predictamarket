/**
 * CasinoLobby.jsx — PredictaMarket v4
 * SIGNAL + PULSE + ARCADE architecture.
 * SIGNAL: vertical snap feed with live data cards.
 * PULSE: single full-screen recommendation with PULSE SCORE, swipe to next.
 * ARCADE: room-based sector navigation within SIGNAL.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Zap, Users, TrendingUp, ChevronUp, X, Play, Shuffle, Star } from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────

const ROOMS = [
  { id: 'all',       label: 'All',           emoji: '✦' },
  { id: 'pit',       label: 'The Pit',       emoji: '🎰' },
  { id: 'grid',      label: 'The Grid',      emoji: '⚡' },
  { id: 'jackpot',   label: 'Jackpot Floor', emoji: '💰' },
  { id: 'lounge',    label: 'The Lounge',    emoji: '🍸' },
  { id: 'gameshow',  label: 'Game Show',     emoji: '📺' },
  { id: 'lab',       label: 'The Lab',       emoji: '🔬' },
  { id: 'latenight', label: 'Late Night',    emoji: '🌙' },
];

const MOODS = [
  { id: 'thrill',   label: 'Quick Thrill',    sub: 'Fast games, instant results',  icon: '⚡', color: '#FF3366' },
  { id: 'chill',    label: 'Chill Session',   sub: 'Low stakes, lose yourself',    icon: '🌊', color: '#00D9FF' },
  { id: 'bigswing', label: 'Big Swing',       sub: 'Higher-stakes tables',          icon: '🎯', color: '#FFD700' },
  { id: 'explore',  label: 'Explorer',        sub: 'Show me something new',        icon: '🔭', color: '#B06FFF' },
];

const GAMES = [
  {
    id: 'g1', name: 'Sweet Bonanza',   provider: 'Pragmatic Play',
    room: 'pit',       category: 'Slots',
    rtp: 96.5, maxWin: '21,000x',     volatility: 'HIGH',
    players: 4821,     trend: [12,18,15,22,28,31,27,35,40,38],
    jackpot: null,     justPaid: { amount: '£4,200', ago: '2m ago' },
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF3366 100%)',
    pulseScore: 94,    mood: ['thrill', 'bigswing'],
  },
  {
    id: 'g2', name: 'Crazy Time',      provider: 'Evolution',
    room: 'gameshow',  category: 'Live',
    rtp: 96.1, maxWin: '20,000x',     volatility: 'EXTREME',
    players: 12340,    trend: [40,38,42,39,45,50,48,52,55,58],
    jackpot: null,     justPaid: { amount: '£18,500', ago: '47s ago' },
    gradient: 'linear-gradient(135deg, #FF9500 0%, #FF3366 100%)',
    pulseScore: 91,    mood: ['thrill', 'bigswing', 'explore'],
  },
  {
    id: 'g3', name: 'Starburst XXXtreme', provider: 'NetEnt',
    room: 'grid',      category: 'Slots',
    rtp: 96.3, maxWin: '200,000x',    volatility: 'EXTREME',
    players: 2190,     trend: [8,10,9,12,14,11,15,17,16,19],
    jackpot: null,     justPaid: null,
    gradient: 'linear-gradient(135deg, #9B5DE5 0%, #6C63FF 100%)',
    pulseScore: 88,    mood: ['bigswing', 'explore'],
  },
  {
    id: 'g4', name: 'Mega Moolah',     provider: 'Microgaming',
    room: 'jackpot',   category: 'Jackpot',
    rtp: 88.1, maxWin: '£18,200,000', volatility: 'MED',
    players: 8834,     trend: [50,52,48,55,60,58,62,65,70,68],
    jackpot: '£18.2M', justPaid: null,
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FF9500 100%)',
    pulseScore: 97,    mood: ['bigswing'],
  },
  {
    id: 'g5', name: 'Book of Dead',    provider: "Play'n GO",
    room: 'lounge',    category: 'Slots',
    rtp: 96.2, maxWin: '5,000x',      volatility: 'HIGH',
    players: 3312,     trend: [20,22,21,25,24,26,23,27,29,28],
    jackpot: null,     justPaid: { amount: '£890', ago: '8m ago' },
    gradient: 'linear-gradient(135deg, #D4A853 0%, #8B5E2A 100%)',
    pulseScore: 82,    mood: ['chill', 'explore'],
  },
  {
    id: 'g6', name: 'Lightning Roulette', provider: 'Evolution',
    room: 'pit',       category: 'Live',
    rtp: 97.3, maxWin: '500x',        volatility: 'MED',
    players: 6677,     trend: [30,28,32,35,33,38,36,40,42,41],
    jackpot: null,     justPaid: { amount: '£2,100', ago: '3m ago' },
    gradient: 'linear-gradient(135deg, #00D9FF 0%, #0077FF 100%)',
    pulseScore: 89,    mood: ['thrill', 'chill'],
  },
  {
    id: 'g7', name: 'Big Bass Bonanza', provider: 'Pragmatic Play',
    room: 'lounge',    category: 'Slots',
    rtp: 96.7, maxWin: '2,100x',      volatility: 'MED',
    players: 1890,     trend: [10,12,11,14,13,15,14,16,18,17],
    jackpot: null,     justPaid: null,
    gradient: 'linear-gradient(135deg, #00C896 0%, #0077FF 100%)',
    pulseScore: 79,    mood: ['chill'],
  },
  {
    id: 'g8', name: 'Reactoonz 2',     provider: "Play'n GO",
    room: 'lab',       category: 'Slots',
    rtp: 96.5, maxWin: '5,083x',      volatility: 'HIGH',
    players: 1240,     trend: [5,8,7,10,9,12,11,14,13,16],
    jackpot: null,     justPaid: { amount: '£320', ago: '14m ago' },
    gradient: 'linear-gradient(135deg, #7FFF00 0%, #00C896 100%)',
    pulseScore: 85,    mood: ['explore', 'thrill'],
  },
  {
    id: 'g9', name: "Gonzo's Quest Megaways", provider: 'NetEnt / Red Tiger',
    room: 'lab',       category: 'Slots',
    rtp: 96.0, maxWin: '21,000x',     volatility: 'HIGH',
    players: 987,      trend: [4,6,5,8,7,9,8,10,12,11],
    jackpot: null,     justPaid: null,
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #9B5DE5 100%)',
    pulseScore: 87,    mood: ['explore', 'bigswing'],
  },
  {
    id: 'g10', name: 'Blackjack VIP',  provider: 'Evolution',
    room: 'latenight', category: 'Live',
    rtp: 99.5, maxWin: '21x',         volatility: 'LOW',
    players: 334,      trend: [60,58,62,65,63,68,66,70,72,71],
    jackpot: null,     justPaid: null,
    gradient: 'linear-gradient(135deg, #1A1A2E 0%, #6C63FF 100%)',
    pulseScore: 76,    mood: ['chill', 'bigswing'],
  },
];

const TICKER_WINS = [
  { player: 'G***n', game: 'Mega Moolah',       amount: '£142,800', time: '4m ago' },
  { player: 'M***e', game: 'Crazy Time',         amount: '£18,500',  time: '47s ago' },
  { player: 'K***s', game: 'Sweet Bonanza',      amount: '£4,200',   time: '2m ago' },
  { player: 'A***l', game: 'Lightning Roulette', amount: '£2,100',   time: '3m ago' },
  { player: 'T***y', game: 'Book of Dead',       amount: '£890',     time: '8m ago' },
];

// ─── Sparkline ──────────────────────────────────────────────────────────────

function Sparkline({ data, color = '#6C63FF', width = 80, height = 28 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Live Ticker ────────────────────────────────────────────────────────────

function LiveTicker() {
  const items = [...TICKER_WINS, ...TICKER_WINS];
  return (
    <div className="overflow-hidden" style={{ height: 24 }}>
      <motion.div
        className="flex items-center gap-6 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
      >
        {items.map((w, i) => (
          <span key={i} className="flex items-center gap-2 text-[11px] font-bold">
            <span style={{ color: '#FFD700' }}>◆</span>
            <span style={{ color: '#9B8FFF' }}>{w.player}</span>
            <span style={{ color: '#7B8CAA' }}>won</span>
            <span style={{ color: '#00F5A0' }}>{w.amount}</span>
            <span style={{ color: '#7B8CAA' }}>on {w.game}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Mood Gate ──────────────────────────────────────────────────────────────

function MoodGate({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(4,6,16,0.97)', backdropFilter: 'blur(24px)' }}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22,1,0.36,1] }}
        className="text-center mb-8"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: '#6C63FF' }}>
          PUNT Casino
        </p>
        <h2 className="text-3xl font-black font-display mb-2" style={{ color: '#F0F6FF' }}>
          What's the vibe tonight?
        </h2>
        <p className="text-sm" style={{ color: '#7B8CAA' }}>
          We'll pick your games. You just play.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {MOODS.map((mood, i) => (
          <motion.button
            key={mood.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.4, ease: [0.22,1,0.36,1] }}
            onClick={() => onSelect(mood.id)}
            className="flex flex-col items-start p-4 rounded-2xl text-left transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${mood.color}18 0%, transparent 100%)`,
              border: `1px solid ${mood.color}40`,
            }}
          >
            <span className="text-3xl mb-2">{mood.icon}</span>
            <p className="text-sm font-black" style={{ color: '#F0F6FF' }}>{mood.label}</p>
            <p className="text-[10px] mt-0.5 leading-snug" style={{ color: '#7B8CAA' }}>{mood.sub}</p>
          </motion.button>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={() => onSelect(null)}
        className="mt-6 text-[11px]"
        style={{ color: '#6B7894' }}
      >
        Skip — show me everything
      </motion.button>
    </motion.div>
  );
}

// ─── Signal Card ────────────────────────────────────────────────────────────

function SignalCard({ game, onPlay }) {
  const trendUp = game.trend[game.trend.length - 1] > game.trend[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(10,14,28,0.95)',
        border: '1px solid rgba(108,99,255,0.18)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Gradient hero */}
      <div className="relative h-28 flex items-end p-4" style={{ background: game.gradient }}>
        {game.jackpot && (
          <div
            className="absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-black"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#FFD700', backdropFilter: 'blur(8px)' }}
          >
            JACKPOT {game.jackpot}
          </div>
        )}
        {game.justPaid && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1"
            style={{
              background: 'rgba(0,245,160,0.15)',
              color: '#00F5A0',
              border: '1px solid rgba(0,245,160,0.3)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Zap className="w-3 h-3" />
            JUST PAID {game.justPaid.amount}
          </motion.div>
        )}
        <div
          className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[9px] font-black tracking-widest"
          style={{
            background: game.volatility === 'EXTREME' ? 'rgba(255,51,102,0.3)' :
                        game.volatility === 'HIGH'    ? 'rgba(255,149,0,0.3)'  : 'rgba(108,99,255,0.3)',
            color: game.volatility === 'EXTREME' ? '#FF3366' :
                   game.volatility === 'HIGH'    ? '#FF9500'  : '#9B8FFF',
          }}
        >
          {game.volatility}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#7B8CAA' }}>
              {game.provider}
            </p>
            <h3 className="text-base font-black font-display" style={{ color: '#F0F6FF' }}>
              {game.name}
            </h3>
          </div>
          <div className="flex flex-col items-end">
            <Sparkline data={game.trend} color={trendUp ? '#00F5A0' : '#FF3366'} />
            <p className="text-[9px] mt-0.5" style={{ color: trendUp ? '#00F5A0' : '#FF3366' }}>
              {trendUp ? '▲' : '▼'} trending
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" style={{ color: '#7B8CAA' }} />
            <span className="text-xs font-bold" style={{ color: '#9B8FFF' }}>
              {game.players.toLocaleString()}
            </span>
            <span className="text-[10px]" style={{ color: '#6B7894' }}>playing</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" style={{ color: '#7B8CAA' }} />
            <span className="text-xs font-bold" style={{ color: '#9B8FFF' }}>{game.rtp}%</span>
            <span className="text-[10px]" style={{ color: '#6B7894' }}>RTP</span>
          </div>
          <div className="ml-auto">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(108,99,255,0.12)',
                color: '#9B8FFF',
                border: '1px solid rgba(108,99,255,0.2)',
              }}
            >
              {game.category}
            </span>
          </div>
        </div>

        <div
          className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#7B8CAA' }}>Max Win</span>
          <span className="text-sm font-black" style={{ color: '#FFD700' }}>{game.maxWin}</span>
        </div>

        <button
          onClick={() => onPlay(game)}
          className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #6C63FF, #9B5DE5)',
            color: '#F0F6FF',
            boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
          }}
        >
          <Play className="w-4 h-4" />
          Play Now
        </button>
      </div>
    </motion.div>
  );
}

// ─── Pulse Card ─────────────────────────────────────────────────────────────

function PulseCard({ game, onPlay, onNext, onPass }) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-80, 0, 80], [0, 1, 0]);
  const scale = useTransform(y, [-80, 0, 80], [0.92, 1, 0.92]);

  function handleDragEnd(_, info) {
    if (info.offset.y < -60 || info.velocity.y < -400) onNext();
    else if (info.offset.y > 60 || info.velocity.y > 400) onPass();
  }

  const scoreColor = game.pulseScore >= 90 ? '#00F5A0' : game.pulseScore >= 80 ? '#FFD700' : '#9B8FFF';

  return (
    <motion.div
      style={{ y, opacity, scale }}
      drag="y"
      dragConstraints={{ top: -100, bottom: 100 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      className="rounded-3xl overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      <div
        className="relative flex flex-col justify-between p-6"
        style={{ background: game.gradient, minHeight: 320 }}
      >
        <div className="flex items-start justify-between">
          <div
            className="px-3 py-1.5 rounded-xl flex items-center gap-2"
            style={{
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${scoreColor}50`,
            }}
          >
            <Star className="w-3.5 h-3.5" style={{ color: scoreColor }} />
            <span className="text-xs font-black" style={{ color: scoreColor }}>
              {game.pulseScore}% MATCH FOR YOU
            </span>
          </div>

          <div
            className="px-3 py-1.5 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: '#00F5A0' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <span className="text-xs font-bold" style={{ color: '#F0F6FF' }}>
              {game.players.toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          {game.justPaid && (
            <div
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg mb-3 text-[10px] font-black"
              style={{ background: 'rgba(0,245,160,0.2)', color: '#00F5A0', border: '1px solid rgba(0,245,160,0.3)' }}
            >
              <Zap className="w-3 h-3" />
              JUST PAID {game.justPaid.amount} · {game.justPaid.ago}
            </div>
          )}
          {game.jackpot && (
            <div
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg mb-3 text-[10px] font-black"
              style={{ background: 'rgba(255,215,0,0.2)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}
            >
              JACKPOT {game.jackpot}
            </div>
          )}
          <p className="text-sm font-bold mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{game.provider}</p>
          <h2 className="text-3xl font-black font-display" style={{ color: '#FFFFFF' }}>{game.name}</h2>
          <p className="text-sm mt-1 font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Max {game.maxWin} · {game.rtp}% RTP · {game.volatility}
          </p>
        </div>
      </div>

      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(10,14,28,0.98)', borderTop: '1px solid rgba(108,99,255,0.15)' }}
      >
        <div className="text-center w-12">
          <ChevronUp className="w-4 h-4 mx-auto mb-0.5" style={{ color: '#FF3366', opacity: 0.7 }} />
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#FF3366', opacity: 0.7 }}>Skip</p>
        </div>

        <button
          onClick={() => onPlay(game)}
          className="px-8 py-3 rounded-xl text-sm font-black flex items-center gap-2 active:scale-95 transition-all"
          style={{
            background: 'linear-gradient(135deg, #6C63FF, #9B5DE5)',
            color: '#F0F6FF',
            boxShadow: '0 4px 24px rgba(108,99,255,0.5)',
          }}
        >
          <Play className="w-4 h-4" />
          Play
        </button>

        <div className="text-center w-12">
          <Shuffle className="w-4 h-4 mx-auto mb-0.5" style={{ color: '#9B8FFF', opacity: 0.7 }} />
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#9B8FFF', opacity: 0.7 }}>Next</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Game Modal ──────────────────────────────────────────────────────────────

function GameModal({ game, onClose }) {
  const [phase, setPhase] = useState('loading');

  useEffect(() => {
    const t = setTimeout(() => setPhase('ready'), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(4,6,16,0.97)', backdropFilter: 'blur(24px)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button onClick={onClose} style={{ color: '#7B8CAA' }}>
          <X className="w-5 h-5" />
        </button>
        <p className="text-sm font-black" style={{ color: '#F0F6FF' }}>{game.name}</p>
        <div className="w-5" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {phase === 'loading' ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: game.gradient }}
              >
                <span className="text-4xl">🎮</span>
              </div>
              <div className="flex gap-2">
                {[0,1,2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#6C63FF' }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <p className="text-sm" style={{ color: '#7B8CAA' }}>Loading {game.name}…</p>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22,1,0.36,1] }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center"
                style={{ background: game.gradient, boxShadow: '0 0 48px rgba(108,99,255,0.4)' }}
              >
                <span className="text-5xl">🎰</span>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9B8FFF' }}>
                  {game.provider}
                </p>
                <h3 className="text-2xl font-black font-display mb-2" style={{ color: '#F0F6FF' }}>{game.name}</h3>
                <div className="flex items-center justify-center gap-3 text-xs" style={{ color: '#7B8CAA' }}>
                  <span>RTP {game.rtp}%</span>
                  <span>·</span>
                  <span>Max {game.maxWin}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full">
                <div
                  className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-xs font-bold" style={{ color: '#7B8CAA' }}>Stake</span>
                  <span className="text-sm font-black" style={{ color: '#F0F6FF' }}>£1.00</span>
                </div>
                <button
                  className="flex-1 py-3 rounded-xl text-sm font-black"
                  style={{
                    background: 'linear-gradient(135deg, #6C63FF, #9B5DE5)',
                    color: '#F0F6FF',
                    boxShadow: '0 4px 20px rgba(108,99,255,0.5)',
                  }}
                >
                  Launch Game
                </button>
              </div>

              <p className="text-[10px] text-center" style={{ color: '#6B7894' }}>
                Demo only · 18+ · BeGambleAware.org
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CasinoLobby() {
  const [mood, setMood] = useState(null);
  const [showMoodGate, setShowMoodGate] = useState(true);
  const [mode, setMode] = useState('signal'); // 'signal' | 'pulse'
  const [activeRoom, setActiveRoom] = useState('all');
  const [selectedGame, setSelectedGame] = useState(null);
  const [pulseIdx, setPulseIdx] = useState(0);

  function handleMoodSelect(selectedMood) {
    setMood(selectedMood);
    setShowMoodGate(false);
  }

  const filteredGames = GAMES.filter(g => {
    const roomOk = activeRoom === 'all' || g.room === activeRoom;
    const moodOk = !mood || g.mood.includes(mood);
    return roomOk && moodOk;
  });

  const pulseGames = [...filteredGames].sort((a, b) => b.pulseScore - a.pulseScore);
  const currentPulseGame = pulseGames.length > 0 ? pulseGames[pulseIdx % pulseGames.length] : null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mood Gate overlay */}
      <AnimatePresence>
        {showMoodGate && <MoodGate onSelect={handleMoodSelect} />}
      </AnimatePresence>

      {/* Game Modal overlay */}
      <AnimatePresence>
        {selectedGame && <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        {/* Live ticker */}
        <div
          className="rounded-xl px-3 py-2 mb-4"
          style={{ background: 'rgba(10,14,28,0.8)', border: '1px solid rgba(108,99,255,0.15)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#00F5A0' }}
              animate={{ opacity: [1,0.3,1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#00F5A0' }}>
              Live Wins
            </span>
          </div>
          <LiveTicker />
        </div>

        {/* Mode switcher: SIGNAL ↔ PULSE */}
        <div
          className="flex rounded-2xl p-1 mb-4"
          style={{ background: 'rgba(10,14,28,0.8)', border: '1px solid rgba(108,99,255,0.15)' }}
        >
          {[
            { id: 'signal', label: 'SIGNAL', icon: '⚡' },
            { id: 'pulse',  label: 'PULSE',  icon: '✦' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: mode === m.id ? 'linear-gradient(135deg, #6C63FF, #9B5DE5)' : 'transparent',
                color: mode === m.id ? '#F0F6FF' : '#7B8CAA',
                boxShadow: mode === m.id ? '0 2px 12px rgba(108,99,255,0.4)' : 'none',
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Active mood indicator */}
        {mood && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#7B8CAA' }}>
                Curated for:
              </span>
              <span className="text-[10px] font-black" style={{ color: '#9B8FFF' }}>
                {MOODS.find(m => m.id === mood)?.icon} {MOODS.find(m => m.id === mood)?.label}
              </span>
            </div>
            <button onClick={() => setShowMoodGate(true)} className="text-[10px] font-bold" style={{ color: '#6B7894' }}>
              Change
            </button>
          </div>
        )}
      </div>

      {/* Mode content */}
      <AnimatePresence mode="wait">
        {mode === 'signal' && (
          <motion.div
            key="signal"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
            className="flex-1"
          >
            {/* ARCADE room selector */}
            <div
              className="flex gap-2 overflow-x-auto px-4 pb-3"
              style={{ scrollbarWidth: 'none' }}
            >
              {ROOMS.map(room => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all"
                  style={{
                    background: activeRoom === room.id
                      ? 'linear-gradient(135deg, rgba(108,99,255,0.3), rgba(155,93,229,0.2))'
                      : 'rgba(255,255,255,0.04)',
                    border: activeRoom === room.id
                      ? '1px solid rgba(108,99,255,0.5)'
                      : '1px solid rgba(255,255,255,0.06)',
                    color: activeRoom === room.id ? '#C4BFFF' : '#7B8CAA',
                  }}
                >
                  {room.emoji} {room.label}
                </button>
              ))}
            </div>

            <div className="px-4 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6B7894' }}>
                {filteredGames.length} games · sorted by live activity
              </p>
            </div>

            <div className="px-4 pb-8 flex flex-col gap-4">
              <AnimatePresence>
                {filteredGames.length > 0 ? (
                  filteredGames.map(game => (
                    <SignalCard key={game.id} game={game} onPlay={setSelectedGame} />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 px-6"
                  >
                    <p className="text-4xl mb-4">🎯</p>
                    <p className="text-sm font-bold mb-2" style={{ color: '#F0F6FF' }}>No games match this filter</p>
                    <p className="text-xs mb-4" style={{ color: '#7B8CAA' }}>Try a different room or mood</p>
                    <button
                      onClick={() => setActiveRoom('all')}
                      className="px-4 py-2 rounded-xl text-xs font-bold"
                      style={{ background: 'rgba(108,99,255,0.15)', color: '#9B8FFF', border: '1px solid rgba(108,99,255,0.3)' }}
                    >
                      Show all rooms
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {mode === 'pulse' && (
          <motion.div
            key="pulse"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.28 }}
            className="flex-1 px-4 pb-8"
          >
            <div className="text-center mb-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: '#6C63FF' }}>
                Pulse Mode
              </p>
              <p className="text-xs" style={{ color: '#7B8CAA' }}>
                One game. Binary decision. Drag to skip.
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {pulseGames.slice(0, Math.min(5, pulseGames.length)).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === pulseIdx % Math.max(pulseGames.length, 1) ? 20 : 6,
                    height: 6,
                    background: i === pulseIdx % Math.max(pulseGames.length, 1)
                      ? 'linear-gradient(90deg, #6C63FF, #9B5DE5)'
                      : 'rgba(255,255,255,0.1)',
                  }}
                />
              ))}
            </div>

            {currentPulseGame && (
              <AnimatePresence mode="wait">
                <PulseCard
                  key={`pulse-${pulseIdx}`}
                  game={currentPulseGame}
                  onPlay={setSelectedGame}
                  onNext={() => setPulseIdx(i => i + 1)}
                  onPass={() => setPulseIdx(i => i + 1)}
                />
              </AnimatePresence>
            )}

            {/* Up next queue */}
            {pulseGames.length > 1 && (
              <div className="mt-5">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#6B7894' }}>
                  Up next
                </p>
                <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {pulseGames.slice(1, 4).map((g, i) => (
                    <div
                      key={g.id}
                      className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{
                        background: 'rgba(10,14,28,0.8)',
                        border: '1px solid rgba(108,99,255,0.1)',
                        opacity: 0.7 - i * 0.15,
                      }}
                    >
                      <div className="w-6 h-6 rounded-lg flex-shrink-0" style={{ background: g.gradient }} />
                      <div>
                        <p className="text-[10px] font-black" style={{ color: '#F0F6FF' }}>{g.name}</p>
                        <p className="text-[9px]" style={{ color: '#7B8CAA' }}>{g.pulseScore}% match</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
