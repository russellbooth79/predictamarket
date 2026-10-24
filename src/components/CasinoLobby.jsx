/**
 * CasinoLobby.jsx — PredictaMarket v4
 * Gen Z casino — NOT a traditional thumbnail grid.
 * Featured hero card + story lanes + social proof + time-of-day branding.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Users, Play, Zap } from 'lucide-react';

const GAMES = [
  {
    id: 'lightning-roulette',
    name: 'Lightning Roulette',
    category: 'live',
    provider: 'Evolution',
    playing: 4821,
    tag: 'HOT',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FF9500 100%)',
    emoji: '⚡',
    minBet: 0.20,
    rtp: '97.3%',
  },
  {
    id: 'gates-of-olympus',
    name: 'Gates of Olympus',
    category: 'slots',
    provider: 'Pragmatic Play',
    playing: 2143,
    tag: 'JACKPOT',
    gradient: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)',
    emoji: '🏛️',
    minBet: 0.20,
    rtp: '96.5%',
    jackpot: '£124,562',
  },
  {
    id: 'spaceman',
    name: 'Spaceman',
    category: 'crash',
    provider: 'Pragmatic Play',
    playing: 3901,
    tag: 'TRENDING',
    gradient: 'linear-gradient(135deg, #00F5A0 0%, #00D4FF 100%)',
    emoji: '🚀',
    minBet: 0.10,
    rtp: '96.0%',
  },
  {
    id: 'blackjack-vip',
    name: 'Blackjack VIP',
    category: 'live',
    provider: 'Evolution',
    playing: 987,
    tag: 'VIP',
    gradient: 'linear-gradient(135deg, #FF3366 0%, #FF6B35 100%)',
    emoji: '🃏',
    minBet: 25,
    rtp: '99.5%',
  },
  {
    id: 'aviator',
    name: 'Aviator',
    category: 'crash',
    provider: 'Spribe',
    playing: 6721,
    tag: 'POPULAR',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #FFD700 100%)',
    emoji: '✈️',
    minBet: 0.10,
    rtp: '97.0%',
  },
  {
    id: 'sweet-bonanza',
    name: 'Sweet Bonanza',
    category: 'slots',
    provider: 'Pragmatic Play',
    playing: 1542,
    tag: null,
    gradient: 'linear-gradient(135deg, #FF3366 0%, #9B5DE5 100%)',
    emoji: '🍭',
    minBet: 0.20,
    rtp: '96.5%',
  },
  {
    id: 'mega-ball',
    name: 'Mega Ball',
    category: 'live',
    provider: 'Evolution',
    playing: 2109,
    tag: null,
    gradient: 'linear-gradient(135deg, #00D4FF 0%, #6C63FF 100%)',
    emoji: '🎱',
    minBet: 0.10,
    rtp: '95.4%',
  },
  {
    id: 'wolf-gold',
    name: 'Wolf Gold',
    category: 'slots',
    provider: 'Pragmatic Play',
    playing: 891,
    tag: null,
    gradient: 'linear-gradient(135deg, #9B5DE5 0%, #6C63FF 100%)',
    emoji: '🐺',
    minBet: 0.25,
    rtp: '96.0%',
    jackpot: '£8,445',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Games' },
  { id: 'live', label: 'Live Casino' },
  { id: 'slots', label: 'Slots' },
  { id: 'crash', label: 'Crash' },
];

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 22 || h < 5) return 'night';
  if (h >= 18) return 'evening';
  return 'day';
}

function formatPlaying(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

// ── Game Modal ────────────────────────────────────────────────────────────────

function GameModal({ game, onClose }) {
  const [phase, setPhase] = useState('loading');

  useEffect(() => {
    const t = setTimeout(() => setPhase('ready'), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex flex-col"
      style={{ background: 'rgba(2,4,10,0.97)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#7B8CAA' }}>{game.provider}</p>
          <p className="text-base font-black font-display" style={{ color: '#F0F6FF' }}>{game.name}</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <X className="w-5 h-5" style={{ color: '#F0F6FF' }} />
        </button>
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        {phase === 'loading' ? (
          <>
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
              style={{ background: game.gradient, boxShadow: '0 0 60px rgba(108,99,255,0.3)' }}
            >
              {game.emoji}
            </div>
            <div className="text-center">
              <p className="text-base font-black font-display mb-1" style={{ color: '#F0F6FF' }}>Loading {game.name}</p>
              <p className="text-sm" style={{ color: '#7B8CAA' }}>Securing your session…</p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#6C63FF' }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div
              className="w-full max-w-sm aspect-[3/4] rounded-2xl flex flex-col items-center justify-center gap-4"
              style={{
                background: 'rgba(10,14,28,0.9)',
                border: '1px solid rgba(108,99,255,0.3)',
                boxShadow: '0 0 40px rgba(108,99,255,0.1)',
              }}
            >
              <span className="text-7xl">{game.emoji}</span>
              <p className="text-2xl font-black font-display" style={{ color: '#F0F6FF' }}>{game.name}</p>
              <p className="text-sm" style={{ color: '#7B8CAA' }}>Demo mode — full game coming soon</p>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: '#7B8CAA' }}>Min Bet</p>
                  <p className="text-sm font-black font-mono" style={{ color: '#00F5A0' }}>£{game.minBet}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: '#7B8CAA' }}>RTP</p>
                  <p className="text-sm font-black font-mono" style={{ color: '#9B8FFF' }}>{game.rtp}</p>
                </div>
                {game.jackpot && (
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: '#7B8CAA' }}>Jackpot</p>
                    <p className="text-sm font-black font-mono" style={{ color: '#FFD700' }}>{game.jackpot}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 w-full max-w-sm">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-black"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#7B8CAA',
                }}
              >
                Back
              </button>
              <button
                className="flex-1 py-3 rounded-xl text-sm font-black"
                style={{
                  background: game.gradient,
                  color: '#05080F',
                  boxShadow: '0 4px 20px rgba(108,99,255,0.35)',
                }}
              >
                Play Now
              </button>
            </div>
          </>
        )}
      </div>

      <div className="px-4 py-3 text-center shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-xs" style={{ color: '#3A4560' }}>18+ · BeGambleAware.org · Play responsibly</p>
      </div>
    </motion.div>
  );
}

// ── Featured hero card ────────────────────────────────────────────────────────

function FeaturedGameCard({ game, onPlay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden cursor-pointer"
      style={{ minHeight: '200px' }}
      onClick={() => onPlay(game)}
    >
      <div className="absolute inset-0" style={{ background: game.gradient, opacity: 0.85 }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(5,8,15,0.92) 100%)' }} />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-14">
          {game.tag && (
            <span
              className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(5,8,15,0.5)', color: '#F0F6FF', backdropFilter: 'blur(8px)' }}
            >
              {game.tag}
            </span>
          )}
          <span className="text-4xl ml-auto">{game.emoji}</span>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(240,246,255,0.55)' }}>
          {game.provider}
        </p>
        <p className="text-2xl font-black font-display mb-3" style={{ color: '#F0F6FF' }}>
          {game.name}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00F5A0' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgba(240,246,255,0.65)' }}>
              {formatPlaying(game.playing)} playing
            </span>
          </div>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black"
            style={{
              background: 'rgba(240,246,255,0.15)',
              border: '1px solid rgba(240,246,255,0.3)',
              color: '#F0F6FF',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Play className="w-3 h-3" />
            Play Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Mini horizontal story card ────────────────────────────────────────────────

function MiniGameCard({ game, onPlay, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05, duration: 0.3 } }}
      className="shrink-0 relative rounded-xl overflow-hidden"
      style={{ width: '130px', height: '170px' }}
      onClick={() => onPlay(game)}
    >
      <div className="absolute inset-0" style={{ background: game.gradient }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(5,8,15,0.88) 100%)' }} />

      <div className="absolute inset-0 flex flex-col justify-between p-3">
        <div className="flex items-start justify-between">
          {game.tag ? (
            <span
              className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(5,8,15,0.5)', color: '#F0F6FF' }}
            >
              {game.tag}
            </span>
          ) : <span />}
          <span className="text-3xl">{game.emoji}</span>
        </div>
        <div className="text-left">
          <p className="text-xs font-black font-display leading-tight mb-1" style={{ color: '#F0F6FF' }}>
            {game.name}
          </p>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full" style={{ background: '#00F5A0' }} />
            <span className="text-[10px]" style={{ color: 'rgba(240,246,255,0.6)' }}>
              {formatPlaying(game.playing)}
            </span>
          </div>
          {game.jackpot && (
            <p className="text-[10px] font-mono font-black mt-0.5" style={{ color: '#FFD700' }}>
              {game.jackpot}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CasinoLobby() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeGame, setActiveGame] = useState(null);
  const tod = getTimeOfDay();

  const filteredGames = activeCategory === 'all'
    ? GAMES
    : GAMES.filter(g => g.category === activeCategory);

  const featuredGame = GAMES.find(g => g.tag === 'HOT') || GAMES[0];
  const hotGames = [...GAMES].sort((a, b) => b.playing - a.playing).slice(0, 5);

  return (
    <div className="space-y-5">

      {/* Night Sessions banner */}
      {tod === 'night' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(9,1,30,0.9) 100%)',
            border: '1px solid rgba(108,99,255,0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌙</span>
            <div className="flex-1">
              <p className="text-sm font-black font-display" style={{ color: '#F0F6FF' }}>Night Sessions</p>
              <p className="text-xs" style={{ color: '#9B8FFF' }}>The tables are hot. Bonus spins active.</p>
            </div>
            <div
              className="px-3 py-1.5 rounded-full text-xs font-black"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #9B5DE5)', color: '#F0F6FF' }}
            >
              Claim
            </div>
          </div>
        </motion.div>
      )}

      {/* Evening prompt */}
      {tod === 'evening' && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.15)' }}
        >
          <Zap className="w-4 h-4 shrink-0" style={{ color: '#9B8FFF' }} />
          <p className="text-sm font-semibold" style={{ color: '#9B8FFF' }}>Evening bonus: 50 free spins waiting</p>
        </div>
      )}

      {/* Section header */}
      <div>
        <h1 className="text-2xl font-black font-display mb-1" style={{ color: '#F0F6FF' }}>Casino</h1>
        <p className="text-sm" style={{ color: '#7B8CAA' }}>Live tables, slots & crash games</p>
      </div>

      {/* Featured hero */}
      <FeaturedGameCard game={featuredGame} onPlay={setActiveGame} />

      {/* Hot right now lane */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" style={{ color: '#FF3366' }} />
          <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: '#7B8CAA' }}>Hot Right Now</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {hotGames.map((game, i) => (
            <MiniGameCard key={game.id} game={game} onPlay={setActiveGame} index={i} />
          ))}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all duration-200"
            style={{
              background: activeCategory === cat.id ? 'linear-gradient(135deg, #6C63FF, #9B5DE5)' : 'rgba(255,255,255,0.04)',
              color: activeCategory === cat.id ? '#F0F6FF' : '#7B8CAA',
              border: activeCategory === cat.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: activeCategory === cat.id ? '0 4px 16px rgba(108,99,255,0.35)' : 'none',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Games list */}
      <div className="space-y-3">
        {filteredGames.map((game, i) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3 } }}
            onClick={() => setActiveGame(game)}
            className="w-full rounded-2xl overflow-hidden text-left"
            style={{
              background: 'rgba(10,14,28,0.8)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center gap-4 p-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: game.gradient }}
              >
                {game.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-black font-display" style={{ color: '#F0F6FF' }}>{game.name}</p>
                  {game.tag && (
                    <span
                      className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(108,99,255,0.15)', color: '#9B8FFF', border: '1px solid rgba(108,99,255,0.2)' }}
                    >
                      {game.tag}
                    </span>
                  )}
                </div>
                <p className="text-xs mb-1.5" style={{ color: '#7B8CAA' }}>{game.provider}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" style={{ color: '#00F5A0' }} />
                    <span className="text-[11px] font-semibold" style={{ color: '#7B8CAA' }}>
                      {formatPlaying(game.playing)} playing
                    </span>
                  </div>
                  {game.jackpot && (
                    <span className="text-[11px] font-black font-mono" style={{ color: '#FFD700' }}>
                      JP {game.jackpot}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}
              >
                <Play className="w-4 h-4" style={{ color: '#9B8FFF' }} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="text-center py-4">
        <p className="text-xs" style={{ color: '#3A4560' }}>18+ · BeGambleAware.org · Gamble Responsibly · T&Cs apply</p>
      </div>

      <AnimatePresence>
        {activeGame && (
          <GameModal game={activeGame} onClose={() => setActiveGame(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
