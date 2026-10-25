/**
 * App.jsx — PredictaMarket v4
 *
 * Navigation model:
 *   activeView: 'home' | 'live' | 'markets' | 'explore' | 'casino' | 'account'
 *   activeSport: 'football' | 'horseracing' | 'tennis' | 'boxing' | 'nfl' | 'nba'
 *   mobileSlipOpen: boolean (lifted from PositionBuilder)
 *
 * Bottom nav (mobile):
 *   Home  → activeView = 'home'
 *   Live  → activeView = 'live'   (aggregated live events across all sports)
 *   Slip  → mobileSlipOpen = true  (opens Position Builder bottom sheet)
 *   Markets → activeView = 'markets'  (sport/competition explorer)
 *   Account → activeView = 'account'  (profile, bet history)
 *
 * Desktop sidebar shows competition tree for active sport.
 * Sport nav pills (mobile) only visible when activeView === 'home'.
 *
 * Auth changes (v4.1):
 *   - AuthProvider wraps everything
 *   - AuthGate replaces the direct <AppContent /> render — shows LandingScreen
 *     when unauthenticated and the app when authenticated
 *   - UserProvider moved inside AuthGate so it always has an authenticated user
 *   - handleDropdownAction wired to authContext.logout() for 'signout'
 */

import { useState, useMemo, useEffect } from 'react';
import { OddsFormatProvider } from './context/OddsFormatContext.jsx';
import { BetSlipProvider, useBetSlip } from './context/BetSlipContext.jsx';
import { UserProvider, useUser } from './context/UserContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { GamificationProvider } from './context/GamificationContext.jsx';
import AuthGate from './auth/AuthGate.jsx';
import { footballFixtures, championsLeagueFixtures, tennisFixtures, boxingFixtures, nflFixtures, nbaFixtures } from './data/fixtures.js';
import { matchDetails } from './data/matchDetails.js';
import {
  useFootballOdds,
  useTennisOdds,
  useBoxingOdds,
  useNflOdds,
  useNbaOdds,
  useHorseRacingOdds,
} from './hooks/useOdds.js';
import SwipeFeed from './components/SwipeFeed.jsx';
import DailyChallengeCard from './components/DailyChallengeCard.jsx';
import PredictionFeed from './components/PredictionFeed.jsx';
import CasinoLobby from './components/CasinoLobby.jsx';
import { useIsMobile } from './hooks/useIsMobile.js';
import TopBar from './components/TopBar.jsx';
import SportNav from './components/SportNav.jsx';
import EventCard from './components/EventCard.jsx';
import HorseRacingCard from './components/HorseRacingCard.jsx';
import TennisCard from './components/TennisCard.jsx';
import FightCard from './components/FightCard.jsx';
import AmericanSportsCard from './components/AmericanSportsCard.jsx';
import DiscoverySurface from './components/DiscoverySurface.jsx';
import LiveTicker from './components/LiveTicker.jsx';
import PositionBuilder from './components/PositionBuilder.jsx';
import MyBets from './components/MyBets.jsx';
import MatchDetailView from './components/MatchDetailView.jsx';
import {
  Trophy, Radio, Calendar, Star,
  Home, Zap, LayoutGrid, BarChart3, User,
  ChevronRight, Clock, Activity, Dices,
} from 'lucide-react';

// ── Colour palette — v4 dark sport futurism ───────────────────────────────────

const C = {
  bg: '#05080F',
  sidebar: 'rgba(8,12,20,0.9)',
  sidebarBorder: 'rgba(255,255,255,0.07)',
  elevated: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',
  primary: '#6C63FF',
  primaryGlow: 'rgba(108,99,255,0.2)',
  liveRed: '#FF3366',
  green: '#00F5A0',
  text: '#F0F6FF',
  textSecondary: '#7B8CAA',
  textMuted: '#3A4560',
};

// ── Sidebar competition config ────────────────────────────────────────────────

const SIDEBAR_CONFIG = {
  football: {
    icon: '⚽',
    competitions: [
      { id: 'pl', label: 'Premier League' },
      { id: 'cl', label: 'Champions League' },
      { id: 'efl', label: 'EFL Championship' },
      { id: 'laliga', label: 'La Liga' },
    ],
  },
  horseracing: {
    icon: '🏇',
    competitions: [
      { id: 'uk', label: 'UK & Ireland' },
    ],
  },
  tennis: {
    icon: '🎾',
    competitions: [
      { id: 'atp', label: 'ATP Tour' },
      { id: 'wta', label: 'WTA Tour' },
    ],
  },
  boxing: {
    icon: '🥊',
    competitions: [
      { id: 'box', label: 'Boxing' },
      { id: 'mma', label: 'UFC / MMA' },
    ],
  },
  nfl: {
    icon: '🏈',
    competitions: [
      { id: 'afc', label: 'AFC' },
      { id: 'nfc', label: 'NFC' },
    ],
  },
  nba: {
    icon: '🏀',
    competitions: [
      { id: 'east', label: 'Eastern Conference' },
      { id: 'west', label: 'Western Conference' },
    ],
  },
};

const SPORT_NAMES = {
  football: 'Football',
  horseracing: 'Horse Racing',
  tennis: 'Tennis',
  boxing: 'Boxing & MMA',
  nfl: 'NFL',
  nba: 'NBA',
};

// ── Sport card config for Markets view ───────────────────────────────────────

const SPORT_TILES = [
  { id: 'football', label: 'Football', icon: '⚽', desc: 'EPL · UCL · EFL · La Liga' },
  { id: 'boxing', label: 'Boxing & MMA', icon: '🥊', desc: 'Title fights · UFC events' },
  { id: 'tennis', label: 'Tennis', icon: '🎾', desc: 'ATP · WTA Grand Slams' },
  { id: 'nba', label: 'NBA', icon: '🏀', desc: 'Eastern · Western Conference' },
  { id: 'nfl', label: 'NFL', icon: '🏈', desc: 'AFC · NFC · Sunday Night' },
  { id: 'horseracing', label: 'Horse Racing', icon: '🏇', desc: 'UK & Ireland Win Markets' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLiveLabel(fixture) {
  if (fixture.sport === 'tennis') {
    return `${(fixture.player1?.name || fixture.homeTeam).split(' ').pop()} vs ${(fixture.player2?.name || fixture.awayTeam).split(' ').pop()}`;
  }
  return `${(fixture.homeTeam || '').split(' ').pop()} vs ${(fixture.awayTeam || '').split(' ').pop()}`;
}

function getTimeOfDayBias() {
  const h = new Date().getHours();
  if (h >= 22 || h < 5) return 'casino';
  if (h >= 18) return 'evening';
  return 'sports';
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso) {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ── Live View ─────────────────────────────────────────────────────────────────

function LiveView({ allFixtures, onViewMatch }) {
  const liveEvents = allFixtures.filter(f => f.isLive);

  if (liveEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.15)' }}
        >
          <Zap className="w-7 h-7" style={{ color: '#FF3366', opacity: 0.6 }} />
        </div>
        <h3 className="text-lg font-black font-display mb-2" style={{ color: C.text }}>No live events right now</h3>
        <p className="text-sm max-w-xs" style={{ color: C.textSecondary }}>
          Events appear here as they kick off. Check back soon or browse upcoming fixtures.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: '#FF3366', opacity: 0.75 }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: '#FF3366' }} />
        </span>
        <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#FF3366' }}>Live Now</h2>
        <span
          className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,51,102,0.12)', color: '#FF3366', border: '1px solid rgba(255,51,102,0.2)' }}
        >
          {liveEvents.length}
        </span>
      </div>

      <div className="space-y-4">
        {liveEvents.map((fixture, i) => {
          switch (fixture.sport) {
            case 'football':
              return <EventCard key={fixture.id} fixture={fixture} index={i} onViewMatch={onViewMatch} />;
            case 'tennis':
              return <TennisCard key={fixture.id} fixture={fixture} index={i} />;
            case 'boxing':
              return <FightCard key={fixture.id} fixture={fixture} index={i} />;
            case 'americanfootball':
            case 'basketball':
              return <AmericanSportsCard key={fixture.id} fixture={fixture} index={i} />;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

// ── Markets View ──────────────────────────────────────────────────────────────

function MarketsView({ onSportSelect, fixtureCounts }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black font-display mb-1" style={{ color: C.text }}>All Markets</h1>
        <p className="text-sm" style={{ color: C.textSecondary }}>
          Every sport. Every competition. Right now.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SPORT_TILES.map(tile => {
          const count = fixtureCounts[tile.id] || 0;
          return (
            <button
              key={tile.id}
              onClick={() => onSportSelect(tile.id)}
              className="rounded-2xl p-4 text-left transition-all duration-200"
              style={{
                background: 'rgba(12,17,30,0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)';
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(108,99,255,0.15), 0 8px 24px rgba(0,0,0,0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span className="text-3xl block mb-3">{tile.icon}</span>
              <span className="text-sm font-black font-display block mb-0.5" style={{ color: C.text }}>{tile.label}</span>
              <span className="text-xs block mb-3" style={{ color: C.textSecondary }}>{tile.desc}</span>
              {count > 0 ? (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(108,99,255,0.12)', color: '#9B8FFF', border: '1px solid rgba(108,99,255,0.2)' }}
                >
                  {count} events
                </span>
              ) : (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)', color: C.textMuted, border: `1px solid ${C.border}` }}
                >
                  Loading…
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2.5 mb-4">
          <Trophy className="w-4 h-4" style={{ color: '#FFD700' }} />
          <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: C.textMuted }}>
            Popular Competitions
          </h2>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Premier League', sport: 'football', icon: '⚽' },
            { label: 'Champions League', sport: 'football', icon: '⚽' },
            { label: 'NFL', sport: 'nfl', icon: '🏈' },
            { label: 'NBA', sport: 'nba', icon: '🏀' },
            { label: 'Boxing', sport: 'boxing', icon: '🥊' },
            { label: 'Tennis', sport: 'tennis', icon: '🎾' },
          ].map(comp => (
            <button
              key={comp.label}
              onClick={() => onSportSelect(comp.sport)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(108,99,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(108,99,255,0.25)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{comp.icon}</span>
                <span className="text-sm font-semibold font-display" style={{ color: C.text }}>{comp.label}</span>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: C.textMuted }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Account View ──────────────────────────────────────────────────────────────

const INTENT_OPTIONS = [
  { value: 'sports', label: 'Sports Betting', emoji: '⚽', desc: 'Fixtures, live odds, bet slip' },
  { value: 'casino', label: 'Casino',         emoji: '🎰', desc: 'Live tables, slots, crash games' },
  { value: 'both',   label: 'Sports + Casino', emoji: '🎯', desc: 'The full PUNT experience' },
];

function AccountView({ onOpenMyBets }) {
  const { user } = useUser();
  const { selections } = useBetSlip();
  const { logout, savePreferences } = useAuth();
  const [editingIntent, setEditingIntent] = useState(false);

  const intent = user?.preferences?.intent ?? null;
  const currentIntentOption = INTENT_OPTIONS.find(o => o.value === intent);

  return (
    <div>
      {/* Profile card */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{
          background: 'rgba(12,17,30,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)', boxShadow: '0 8px 20px rgba(108,99,255,0.4)' }}
          >
            {user.initials}
          </div>
          <div>
            <p className="text-xl font-black font-display" style={{ color: C.text }}>{user.name}</p>
            <p className="text-sm" style={{ color: C.textSecondary }}>{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ background: 'rgba(0,245,160,0.07)', border: '1px solid rgba(0,245,160,0.15)' }}>
            <p className="text-xs mb-1" style={{ color: C.textSecondary }}>Balance</p>
            <p
              className="font-mono text-xl font-black"
              style={{
                background: 'linear-gradient(135deg, #00F5A0 0%, #00D4FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              £{user.balance.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.15)' }}>
            <p className="text-xs mb-1" style={{ color: C.textSecondary }}>Selections</p>
            <p
              className="font-mono text-xl font-black"
              style={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {selections.length}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <button
          onClick={onOpenMyBets}
          className="w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-200"
          style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(108,99,255,0.14)';
            e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(108,99,255,0.08)';
            e.currentTarget.style.borderColor = 'rgba(108,99,255,0.2)';
          }}
        >
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5" style={{ color: '#9B8FFF' }} />
            <span className="text-sm font-bold font-display" style={{ color: C.text }}>My Bets</span>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: '#9B8FFF' }} />
        </button>

        {/* My Interests — change Sports / Casino / Both preference */}
        <div>
          <button
            onClick={() => setEditingIntent(v => !v)}
            className="w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🎯</span>
              <div className="text-left">
                <p className="text-sm font-medium" style={{ color: C.text }}>My Interests</p>
                <p className="text-xs" style={{ color: C.textSecondary }}>
                  {currentIntentOption ? currentIntentOption.label : 'Choose your products'}
                </p>
              </div>
            </div>
            <ChevronRight
              className="w-4 h-4 transition-transform duration-200"
              style={{ color: C.textMuted, transform: editingIntent ? 'rotate(90deg)' : 'none' }}
            />
          </button>

          {editingIntent && (
            <div
              className="mt-1 rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(108,99,255,0.2)', background: 'rgba(8,12,24,0.95)' }}
            >
              {INTENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    savePreferences({ intent: opt.value });
                    setEditingIntent(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: intent === opt.value ? 'rgba(108,99,255,0.12)' : 'transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.08)'; }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = intent === opt.value ? 'rgba(108,99,255,0.12)' : 'transparent';
                  }}
                >
                  <span className="text-xl shrink-0">{opt.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: intent === opt.value ? '#9B8FFF' : C.text }}>
                      {opt.label}
                    </p>
                    <p className="text-xs" style={{ color: C.textSecondary }}>{opt.desc}</p>
                  </div>
                  {intent === opt.value && (
                    <span className="ml-auto text-xs font-bold" style={{ color: '#6C63FF' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {[
          { label: 'Deposit Funds', icon: '💳' },
          { label: 'Withdrawal', icon: '🏦' },
          { label: 'Deposit Limits', icon: '🛡️' },
          { label: 'Responsible Gambling', icon: '⚖️' },
          { label: 'Settings', icon: '⚙️' },
        ].map(item => (
          <button
            key={item.label}
            className="w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium" style={{ color: C.text }}>{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: C.textMuted }} />
          </button>
        ))}

        {/* Sign out */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-200"
          style={{ background: 'rgba(255,51,102,0.04)', border: '1px solid rgba(255,51,102,0.12)' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,51,102,0.08)';
            e.currentTarget.style.borderColor = 'rgba(255,51,102,0.25)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,51,102,0.04)';
            e.currentTarget.style.borderColor = 'rgba(255,51,102,0.12)';
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🚪</span>
            <span className="text-sm font-medium" style={{ color: '#FF3366' }}>Sign out</span>
          </div>
        </button>
      </div>

      {/* Legal footer */}
      <div className="text-center">
        <p className="text-xs" style={{ color: C.textMuted }}>18+ · BeGambleAware.org · T&Cs apply</p>
      </div>
    </div>
  );
}

// ── Empty state for horse racing ──────────────────────────────────────────────

function HorseRacingEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <span className="text-4xl mb-4">🏇</span>
      <h3 className="text-lg font-semibold mb-2" style={{ color: C.text }}>No races available right now</h3>
      <p className="text-sm max-w-xs" style={{ color: C.textSecondary }}>
        UK & Ireland horse racing markets will appear here when available. Check back closer to race day.
      </p>
    </div>
  );
}

// ── Mobile Bottom Nav — TikTok style, raised centre Bet Slip button ──────────

// ── Nav tab config per intent ─────────────────────────────────────────────────
// sports → Home + Live on left, Markets + Account on right, slip centre
// casino → Casino on left, Account on right, no slip (casino has no bet slip)
// both / null → Home + Live on left, Casino + Account on right, slip centre

function MobileBottomNav({ activeTab, onTabChange, betSlipCount, liveCount, intent }) {
  const isCasinoOnly = intent === 'casino';

  const leftTabs = isCasinoOnly
    ? [{ id: 'casino', label: 'Casino', Icon: Dices }]
    : [{ id: 'home', label: 'Home', Icon: Home }, { id: 'live', label: 'Live', Icon: Zap }];

  const rightTabs = isCasinoOnly
    ? [{ id: 'account', label: 'Account', Icon: User }]
    : intent === 'sports'
    ? [{ id: 'markets', label: 'Markets', Icon: LayoutGrid }, { id: 'account', label: 'Account', Icon: User }]
    : [{ id: 'casino', label: 'Casino', Icon: Dices }, { id: 'account', label: 'Account', Icon: User }];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around px-2"
      style={{
        background: 'rgba(5,8,15,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        height: '64px',
      }}
    >
      {/* Left tabs */}
      {leftTabs.map(tab => {
        const { Icon } = tab;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-0.5 py-2 px-4 relative flex-1 active:opacity-60"
          >
            <div className="relative">
              <Icon
                className="w-5 h-5"
                style={{
                  color: isActive ? '#9B8FFF' : '#3A4560',
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(108,99,255,0.6))' : 'none',
                }}
              />
              {tab.id === 'live' && liveCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full text-[9px] font-black flex items-center justify-center px-1 text-white"
                  style={{ background: 'linear-gradient(135deg, #FF3366, #FF6B35)' }}
                >
                  {liveCount > 9 ? '9+' : liveCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold" style={{ color: isActive ? '#9B8FFF' : '#3A4560' }}>
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Centre raised Bet Slip — hidden for casino-only (no slip workflow) */}
      {!isCasinoOnly ? (
        <div className="flex flex-col items-center relative" style={{ marginBottom: '10px' }}>
          <button
            onClick={() => onTabChange('betslip')}
            className="w-16 h-16 rounded-full flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)',
              boxShadow: activeTab === 'betslip'
                ? '0 0 0 3px rgba(108,99,255,0.3), 0 8px 24px rgba(108,99,255,0.5)'
                : '0 4px 20px rgba(108,99,255,0.4)',
              border: '3px solid rgba(5,8,15,0.97)',
            }}
          >
            <LayoutGrid className="w-6 h-6 text-white" />
            {betSlipCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full text-[10px] font-black flex items-center justify-center px-1.5 text-white"
                style={{ background: 'linear-gradient(135deg, #FF3366, #FF6B35)' }}
              >
                {betSlipCount > 9 ? '9+' : betSlipCount}
              </span>
            )}
          </button>
          <span className="text-[10px] font-semibold mt-0.5" style={{ color: activeTab === 'betslip' ? '#9B8FFF' : '#3A4560' }}>
            Slip
          </span>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Right tabs */}
      {rightTabs.map(tab => {
        const { Icon } = tab;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-0.5 py-2 px-4 flex-1"
          >
            <Icon
              className="w-5 h-5"
              style={{
                color: isActive ? '#9B8FFF' : '#3A4560',
                filter: isActive ? 'drop-shadow(0 0 6px rgba(108,99,255,0.6))' : 'none',
              }}
            />
            <span className="text-[10px] font-semibold" style={{ color: isActive ? '#9B8FFF' : '#3A4560' }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Bet Slip Count Bridge ─────────────────────────────────────────────────────

function BetSlipCountBridge({ children }) {
  const { selections } = useBetSlip();
  return children(selections.length);
}

// ── Main App ──────────────────────────────────────────────────────────────────

function AppContent() {
  const { user } = useUser();
  const intent = user?.preferences?.intent ?? null;

  const [activeView, setActiveView] = useState(
    () => intent === 'casino' ? 'casino' : 'home'
  );
  const [activeSport, setActiveSport] = useState('football');
  const [mobileSlipOpen, setMobileSlipOpen] = useState(false);
  const [myBetsOpen, setMyBetsOpen] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const isMobile = useIsMobile();
  const { logout } = useAuth();

  // When intent changes (after profiling or settings update), redirect to the right home
  useEffect(() => {
    if (intent === 'casino') setActiveView('casino');
  }, [intent]);

  // Scroll to top when active view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeView]);

  // ── Data hooks ──────────────────────────────────────────────────────────────
  const {
    fixtures: footballFixturesLive,
    usingLive: footballUsingLive,
    lastUpdated: footballLastUpdated,
  } = useFootballOdds();

  const { fixtures: tennisOdds } = useTennisOdds();
  const { fixtures: boxingOdds } = useBoxingOdds();
  const { fixtures: nflOdds } = useNflOdds();
  const { fixtures: nbaOdds } = useNbaOdds();
  const { fixtures: horseRacingOdds } = useHorseRacingOdds();

  // ── Aggregated data ─────────────────────────────────────────────────────────
  const allFixtures = useMemo(() => [
    ...footballFixturesLive,
    ...tennisOdds,
    ...boxingOdds,
    ...nflOdds,
    ...nbaOdds,
    ...horseRacingOdds,
  ], [footballFixturesLive, tennisOdds, boxingOdds, nflOdds, nbaOdds, horseRacingOdds]);

  const totalLiveCount = useMemo(
    () => allFixtures.filter(f => f.isLive).length,
    [allFixtures]
  );

  // ── Fixture counts for markets view ────────────────────────────────────────
  const fixtureCounts = useMemo(() => ({
    football: footballFixturesLive.length,
    tennis: tennisOdds.length,
    boxing: boxingOdds.length,
    nfl: nflOdds.length,
    nba: nbaOdds.length,
    horseracing: horseRacingOdds.length,
  }), [footballFixturesLive, tennisOdds, boxingOdds, nflOdds, nbaOdds, horseRacingOdds]);

  // ── Live fixtures for current sport (sidebar) ───────────────────────────────
  const sidebarLiveFixtures = useMemo(() => {
    const sportMap = {
      football: footballFixturesLive,
      tennis: tennisOdds,
      boxing: boxingOdds,
      nfl: nflOdds,
      nba: nbaOdds,
      horseracing: horseRacingOdds,
    };
    return (sportMap[activeSport] || []).filter(f => f.isLive);
  }, [activeSport, footballFixturesLive, tennisOdds, boxingOdds, nflOdds, nbaOdds, horseRacingOdds]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleDropdownAction(actionId) {
    if (actionId === 'mybets') setMyBetsOpen(true);
    if (actionId === 'signout') logout();
  }

  function handleSportChange(sport) {
    setActiveSport(sport);
    setActiveView('home');
    setSelectedFixture(null);
  }

  function handleBottomNavTab(tabId) {
    if (tabId === 'betslip') {
      setMobileSlipOpen(true);
      return;
    }
    setMobileSlipOpen(false);
    setActiveView(tabId);
    if (tabId === 'home') setSelectedFixture(null);
    // Scroll to top on tab change
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function handleMarketsSelectSport(sport) {
    setActiveSport(sport);
    setActiveView('home');
    setSelectedFixture(null);
  }

  // Active tab for bottom nav: betslip when slip is open, else activeView
  const activeBottomTab = mobileSlipOpen ? 'betslip' : activeView;

  // ── Section subtitle for home view ──────────────────────────────────────────
  function getFixtureSubtitle() {
    const liveSuffix = (arr) => {
      const n = arr.filter(f => f.isLive).length;
      return n > 0 ? ` · ${n} live` : '';
    };
    switch (activeSport) {
      case 'football': return `${footballFixturesLive.length} events${liveSuffix(footballFixturesLive)}`;
      case 'horseracing': return horseRacingOdds.length > 0
        ? `${horseRacingOdds.length} races`
        : 'No races available';
      case 'tennis': return `${tennisOdds.length} matches${liveSuffix(tennisOdds)}`;
      case 'boxing': return `${boxingOdds.length} bouts`;
      case 'nfl': return `${nflOdds.length} games this week`;
      case 'nba': return `${nbaOdds.length} games${liveSuffix(nbaOdds)}`;
      default: return '';
    }
  }

  const sidebarConfig = SIDEBAR_CONFIG[activeSport];

  const selectedDetail = selectedFixture
    ? (matchDetails[selectedFixture.id] || null)
    : null;

  // ── Current sport's fixtures ────────────────────────────────────────────────
  const sportFixtures = {
    football: footballFixturesLive,
    horseracing: horseRacingOdds,
    tennis: tennisOdds,
    boxing: boxingOdds,
    nfl: nflOdds,
    nba: nbaOdds,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      {/* ── Fixed top bar ──────────────────────────────────────────────────── */}
      <TopBar
        activeSport={activeSport}
        onSportChange={handleSportChange}
        onDropdownAction={handleDropdownAction}
      />

      {/* ── Mobile sport nav — only visible on home view ───────────────────── */}
      {activeView === 'home' && (
        <SportNav activeSport={activeSport} onSportChange={handleSportChange} />
      )}

      {/* ── Live score ticker — mobile, always on top ───────────────────────── */}
      <div className={`lg:hidden sticky z-30 ${activeView === 'home' ? 'top-[calc(3.5rem+80px)]' : 'top-14'}`}>
        <LiveTicker allFixtures={allFixtures} />
      </div>

      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:block fixed left-0 top-14 bottom-0 w-56 z-30 overflow-y-auto custom-scrollbar"
        style={{
          backgroundColor: C.sidebar,
          borderRight: `1px solid ${C.sidebarBorder}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="p-4 space-y-6">
          {/* Data source badge */}
          <div className="flex items-center gap-2">
            {footballUsingLive ? (
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(0,182,122,0.15)', color: '#00b67a' }}
              >
                LIVE ODDS
              </span>
            ) : (
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(100,116,139,0.15)', color: '#94a3b8' }}
              >
                DEMO DATA
              </span>
            )}
            {footballLastUpdated && footballUsingLive && (
              <span className="text-[9px]" style={{ color: C.textMuted }}>
                {footballLastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Live Now section */}
          {totalLiveCount > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-3.5 h-3.5" style={{ color: C.liveRed }} />
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.text }}>
                  Live Now
                </h3>
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,107,107,0.15)', color: C.liveRed }}
                >
                  {totalLiveCount}
                </span>
              </div>
              <div className="space-y-1">
                {sidebarLiveFixtures.map(fix => (
                  <button
                    key={fix.id}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2"
                    style={{ color: C.textSecondary }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = C.elevated;
                      e.currentTarget.style.color = C.text;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = C.textSecondary;
                    }}
                    onClick={() => {
                      if (fix.sport === 'football') setSelectedFixture(fix);
                    }}
                  >
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: C.liveRed }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: C.liveRed }} />
                    </span>
                    <span className="truncate">{getLiveLabel(fix)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Competition tree for active sport */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-3.5 h-3.5" style={{ color: C.primary }} />
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.text }}>
                {SPORT_NAMES[activeSport]}
              </h3>
            </div>
            <div className="space-y-0.5">
              {sidebarConfig.competitions.map(comp => (
                <button
                  key={comp.id}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: C.textSecondary }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = C.elevated;
                    e.currentTarget.style.color = C.text;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = C.textSecondary;
                  }}
                >
                  {comp.label}
                </button>
              ))}
            </div>
          </div>

          {/* My Markets */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-3.5 h-3.5" style={{ color: C.primary }} />
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.text }}>
                My Markets
              </h3>
            </div>
            <div className="space-y-0.5">
              {['Favourites', 'Recent', 'Custom Alerts'].map(label => (
                <button
                  key={label}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: C.textMuted }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = C.elevated;
                    e.currentTarget.style.color = C.textSecondary;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = C.textMuted;
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textSecondary }}>
                Quick Links
              </h3>
            </div>
            <div className="space-y-0.5">
              {['Today', 'Tomorrow', 'This Weekend'].map(label => (
                <button
                  key={label}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: C.textMuted }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = C.elevated;
                    e.currentTarget.style.color = C.textSecondary;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = C.textMuted;
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="pt-14 lg:pl-56 lg:pr-80 pb-20 lg:pb-0">
        {/* Extra top padding on mobile when sport nav is visible */}
        {activeView === 'home' && <div className="lg:hidden h-12" />}

        <div className="p-4 lg:p-6 max-w-3xl mx-auto">

          {/* ── LIVE VIEW ─────────────────────────────────────────────────── */}
          {activeView === 'live' && (
            <LiveView allFixtures={allFixtures} onViewMatch={fix => {
              setSelectedFixture(fix);
              setActiveView('home');
              setActiveSport('football');
            }} />
          )}

          {/* ── MARKETS VIEW ──────────────────────────────────────────────── */}
          {activeView === 'markets' && (
            <MarketsView
              onSportSelect={handleMarketsSelectSport}
              fixtureCounts={fixtureCounts}
            />
          )}

          {/* ── ACCOUNT VIEW ──────────────────────────────────────────────── */}
          {activeView === 'account' && (
            <AccountView onOpenMyBets={() => setMyBetsOpen(true)} />
          )}

          {/* ── EXPLORE VIEW ──────────────────────────────────────────────── */}
          {activeView === 'explore' && <PredictionFeed />}

          {/* ── CASINO VIEW ───────────────────────────────────────────────── */}
          {activeView === 'casino' && <CasinoLobby />}

          {/* ── HOME VIEW ─────────────────────────────────────────────────── */}
          {activeView === 'home' && (
            <>
              {/* Match detail view when a fixture is selected */}
              {activeSport === 'football' && selectedFixture ? (
                <MatchDetailView
                  fixture={selectedFixture}
                  detail={selectedDetail}
                  onBack={() => setSelectedFixture(null)}
                />
              ) : (
                <>
                  {/* Discovery surface — football tab only, desktop only (mobile uses SwipeFeed hero) */}
                  {activeSport === 'football' && !isMobile && (
                    <DiscoverySurface
                      liveFixtures={footballFixturesLive.filter(f => f.isLive)}
                      onViewMatch={f => setSelectedFixture(f)}
                    />
                  )}

                  {/* Section header */}
                  <div className="mb-5">
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-xl font-bold" style={{ color: C.text }}>
                        {SPORT_NAMES[activeSport]}
                      </h1>
                      {/* Mobile live data badge */}
                      <div className="lg:hidden">
                        {activeSport === 'football' && footballUsingLive ? (
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(0,182,122,0.15)', color: '#00b67a' }}
                          >
                            LIVE ODDS
                          </span>
                        ) : activeSport === 'football' ? (
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(100,116,139,0.15)', color: '#94a3b8' }}
                          >
                            DEMO DATA
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: C.textSecondary }}>
                      {getFixtureSubtitle()}
                    </p>
                  </div>

                  {/* ── Sport feeds ─────────────────────────────────────── */}

                  {activeSport === 'football' && (() => {
                    const bias = getTimeOfDayBias();
                    const casinoCta = (
                      <button
                        key="casino-cta"
                        onClick={() => { setActiveView('casino'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                        className="w-full rounded-2xl overflow-hidden text-left"
                        style={{
                          background: bias === 'casino'
                            ? 'linear-gradient(135deg, rgba(108,99,255,0.2) 0%, rgba(9,1,30,0.95) 100%)'
                            : 'rgba(10,14,28,0.8)',
                          border: '1px solid rgba(108,99,255,0.25)',
                        }}
                      >
                        <div className="flex items-center gap-4 px-4 py-3.5">
                          <span className="text-3xl">{bias === 'casino' ? '🌙' : bias === 'evening' ? '🎰' : '🎲'}</span>
                          <div className="flex-1">
                            <p className="text-sm font-black font-display" style={{ color: '#F0F6FF' }}>
                              {bias === 'casino' ? 'Night Sessions Live' : bias === 'evening' ? 'Evening Casino Bonus' : 'Casino'}
                            </p>
                            <p className="text-xs" style={{ color: '#9B8FFF' }}>
                              {bias === 'casino' ? 'Tables are hot right now' : bias === 'evening' ? '50 free spins waiting' : 'Live tables · Slots · Crash games'}
                            </p>
                          </div>
                          <div
                            className="px-3 py-1.5 rounded-full text-xs font-black"
                            style={{ background: 'linear-gradient(135deg, #6C63FF, #9B5DE5)', color: '#F0F6FF' }}
                          >
                            Play
                          </div>
                        </div>
                      </button>
                    );

                    const cards = footballFixturesLive.map((fixture, i) => (
                      <EventCard
                        key={fixture.id}
                        fixture={fixture}
                        index={i}
                        hero={isMobile}
                        onViewMatch={f => setSelectedFixture(f)}
                      />
                    ));

                    // Inject DailyChallengeCard at position 1
                    if (cards.length >= 1) {
                      cards.splice(1, 0, <DailyChallengeCard key="daily-challenge" index={0} />);
                    }
                    // Inject casino CTA only for users who aren't sports-only
                    if (intent !== 'sports') {
                      if (cards.length >= 4) {
                        cards.splice(bias === 'casino' ? 0 : cards.length, 0, casinoCta);
                      } else {
                        cards.push(casinoCta);
                      }
                    }

                    return <SwipeFeed topOffset={totalLiveCount > 0 ? 168 : 136}>{cards}</SwipeFeed>;
                  })()}

                  {activeSport === 'horseracing' && (
                    horseRacingOdds.length > 0 ? (
                      <div className="space-y-4">
                        {horseRacingOdds.map((fixture, i) => (
                          <HorseRacingCard key={fixture.id} fixture={fixture} index={i} />
                        ))}
                      </div>
                    ) : (
                      <HorseRacingEmpty />
                    )
                  )}

                  {activeSport === 'tennis' && (
                    tennisOdds.length > 0 ? (
                      <div className="space-y-4">
                        {tennisOdds.map((fixture, i) => (
                          <TennisCard key={fixture.id} fixture={fixture} index={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <span className="text-4xl mb-4">🎾</span>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: C.text }}>No tennis markets right now</h3>
                        <p className="text-sm max-w-xs" style={{ color: C.textSecondary }}>
                          Tennis markets are tournament-specific. Check back during the Grand Slams and ATP/WTA events.
                        </p>
                      </div>
                    )
                  )}

                  {activeSport === 'boxing' && (
                    <div className="space-y-4">
                      {boxingOdds.map((fixture, i) => (
                        <FightCard key={fixture.id} fixture={fixture} index={i} />
                      ))}
                    </div>
                  )}

                  {activeSport === 'nfl' && (
                    <div className="space-y-4">
                      {nflOdds.map((fixture, i) => (
                        <AmericanSportsCard key={fixture.id} fixture={fixture} index={i} />
                      ))}
                    </div>
                  )}

                  {activeSport === 'nba' && (
                    <div className="space-y-4">
                      {nbaOdds.map((fixture, i) => (
                        <AmericanSportsCard key={fixture.id} fixture={fixture} index={i} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Bottom spacer for mobile bottom nav */}
          <div className="h-24 lg:h-0" />
        </div>
      </main>

      {/* ── Position Builder (desktop panel + mobile bottom sheet) ─────────── */}
      <PositionBuilder
        mobileOpen={mobileSlipOpen}
        onMobileOpenChange={setMobileSlipOpen}
      />

      {/* ── My Bets slide-in ────────────────────────────────────────────────── */}
      <MyBets isOpen={myBetsOpen} onClose={() => setMyBetsOpen(false)} />

      {/* ── Mobile Bottom Nav ───────────────────────────────────────────────── */}
      <BetSlipCountBridge>
        {count => (
          <MobileBottomNav
            activeTab={activeBottomTab}
            onTabChange={handleBottomNavTab}
            betSlipCount={count}
            liveCount={totalLiveCount}
            intent={intent}
          />
        )}
      </BetSlipCountBridge>
    </div>
  );
}

// ── Provider tree ─────────────────────────────────────────────────────────────
// AuthProvider is outermost — everything needs auth state.
// AuthGate decides what to render (LandingScreen vs AppContent).
// UserProvider is inside AuthGate so it only mounts when authenticated,
// receiving the authenticated user profile via the initialUser prop.
// OddsFormatProvider and BetSlipProvider are inside UserProvider as they
// depend on the authenticated session being established.

function App() {
  return (
    <AuthProvider>
      <OddsFormatProvider>
        <BetSlipProvider>
          <GamificationProvider>
            <AuthGate>
              <UserProvider>
                <AppContent />
              </UserProvider>
            </AuthGate>
          </GamificationProvider>
        </BetSlipProvider>
      </OddsFormatProvider>
    </AuthProvider>
  );
}

export default App;
