/**
 * App.jsx — PredictaMarket v5
 *
 * Navigation model:
 *   activeView: 'home' | 'live' | 'discover' | 'mybets' | 'explore' | 'casino' | 'account'
 *   activeSport: 'football' | 'horseracing' | 'tennis' | 'boxing' | 'nfl' | 'nba'
 *   mobileSlipOpen: boolean (lifted from PositionBuilder)
 *
 * Bottom nav (mobile), filtered by the user's intent from profiling:
 *   Home     → activeView = 'home'
 *   Live     → activeView = 'live'     (In-Play hub: simulated live football with
 *                                       quick bets, plus other live sports);
 *              a live match opens activeView = 'inplay-match'
 *   Discover → activeView = 'discover' (full-page card feed: matches, boosts,
 *                                       casino releases, offers, new features)
 *   My Bets  → activeView = 'mybets'   (open and settled bets)
 *   Casino   → activeView = 'casino'   (casino or both intents only)
 * Account (profile, odds display, limits) opens from the avatar menu.
 * The bet slip is a tray that slides up once a selection is added.
 *
 * Desktop sidebar shows competition tree for active sport.
 * Sport chips (mobile) only visible when activeView === 'home', and only
 * for sports that currently have markets.
 *
 * Auth changes (v4.1):
 *   - AuthProvider wraps everything
 *   - AuthGate replaces the direct <AppContent /> render — shows LandingScreen
 *     when unauthenticated and the app when authenticated
 *   - UserProvider moved inside AuthGate so it always has an authenticated user
 *   - handleDropdownAction wired to authContext.logout() for 'signout'
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { OddsFormatProvider } from './context/OddsFormatContext.jsx';
import { BetSlipProvider, useBetSlip } from './context/BetSlipContext.jsx';
import { UserProvider, useUser } from './context/UserContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { GamificationProvider } from './context/GamificationContext.jsx';
import AuthGate from './auth/AuthGate.jsx';
import { footballFixtures, championsLeagueFixtures, tennisFixtures, boxingFixtures, nflFixtures, nbaFixtures } from './data/fixtures.js';
import { matchDetails } from './data/matchDetails.js';
import {
  useTennisOdds,
  useBoxingOdds,
  useNflOdds,
  useNbaOdds,
  useHorseRacingOdds,
} from './hooks/useOdds.js';
import PredictionFeed from './components/PredictionFeed.jsx';
import CasinoLobby from './components/CasinoLobby.jsx';
import TopBar from './components/TopBar.jsx';
import SportNav from './components/SportNav.jsx';
import EventCard from './components/EventCard.jsx';
import HorseRacingCard from './components/HorseRacingCard.jsx';
import TennisCard from './components/TennisCard.jsx';
import FightCard from './components/FightCard.jsx';
import AmericanSportsCard from './components/AmericanSportsCard.jsx';
import FootballHome from './components/FootballHome.jsx';
import DiscoverFeed from './components/discover/DiscoverFeed.jsx';
import { SPORTS } from './data/sports.js';
import { LiveProvider, useLive } from './live/LiveContext.jsx';
import InPlayHub from './components/inplay/InPlayHub.jsx';
import InPlayMatch from './components/inplay/InPlayMatch.jsx';
import QuickBetSheet from './components/inplay/QuickBetSheet.jsx';
import LiveToasts from './components/inplay/LiveToasts.jsx';
import { decodeSlip } from './data/friends.js';
import OddsFormatToggle from './components/OddsFormatToggle.jsx';
import PositionBuilder from './components/PositionBuilder.jsx';
import MyBets, { MyBetsPage } from './components/MyBets.jsx';
import MatchDetailView from './components/MatchDetailView.jsx';
import {
  Trophy, Radio, Calendar, Star,
  Home, Zap, Ticket, Compass,
  ChevronRight, Activity, Dices,
} from 'lucide-react';
import { trackPageView, trackSelectSport, trackSelectMatch } from './utils/analytics.js';
import { useScrollDepth } from './hooks/useScrollDepth.js';

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
  textMuted: '#6B7894',
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLiveLabel(fixture) {
  if (fixture.sport === 'tennis') {
    return `${(fixture.player1?.name || fixture.homeTeam).split(' ').pop()} vs ${(fixture.player2?.name || fixture.awayTeam).split(' ').pop()}`;
  }
  return `${(fixture.homeTeam || '').split(' ').pop()} vs ${(fixture.awayTeam || '').split(' ').pop()}`;
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

function LiveView({ allFixtures, onViewMatch, title = 'Live Now' }) {
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
        <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#FF3366' }}>{title}</h2>
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

// ── Account View ──────────────────────────────────────────────────────────────

const INTENT_OPTIONS = [
  { value: 'sports', label: 'Sports Betting', emoji: '⚽', desc: 'Fixtures, live odds, bet slip' },
  { value: 'casino', label: 'Casino',         emoji: '🎰', desc: 'Live tables, slots, crash games' },
  { value: 'both',   label: 'Sports + Casino', emoji: '🎯', desc: 'The full PUNT experience' },
];

function AccountView({ onOpenMyBets }) {
  const { user, bets } = useUser();
  const openBetCount = bets.filter(b => b.status === 'open').length;
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
            <p className="text-xs mb-1" style={{ color: C.textSecondary }}>Open bets</p>
            <p
              className="font-mono text-xl font-black"
              style={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {openBetCount}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {/* Odds display — moved here from the top bar on mobile */}
        <div
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: C.text }}>Odds display</p>
            <p className="text-xs" style={{ color: C.textSecondary }}>Chance %, decimal or fractional</p>
          </div>
          <OddsFormatToggle />
        </div>

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

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────────
// Tabs depend on what the user chose in profiling. Discover sits in the
// middle; Account lives in the avatar menu.
//   sports      → Home, Live, Discover, My Bets
//   casino      → Casino, Discover
//   both / null → Home, Live, Discover, My Bets, Casino

function getNavTabs(intent) {
  const discover = { id: 'discover', label: 'Discover', Icon: Compass };
  if (intent === 'casino') {
    return [{ id: 'casino', label: 'Casino', Icon: Dices }, discover];
  }
  return [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'live', label: 'Live', Icon: Zap },
    discover,
    { id: 'mybets', label: 'My Bets', Icon: Ticket },
    ...(intent === 'sports' ? [] : [{ id: 'casino', label: 'Casino', Icon: Dices }]),
  ];
}

function MobileBottomNav({ activeTab, onTabChange, liveCount, openBetCount, intent }) {
  const badges = { live: liveCount, mybets: openBetCount };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1"
      style={{
        background: 'rgba(5,8,15,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        // Tabs fill the top 64px; the home-indicator area below stays clear
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'var(--bottom-nav-total)',
      }}
    >
      {getNavTabs(intent).map(tab => {
        const { Icon } = tab;
        const isActive = tab.id === activeTab;
        const badge = badges[tab.id];
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-0.5 py-2 px-1 relative flex-1 active:opacity-60"
          >
            {isActive && (
              <motion.span
                layoutId="bottom-nav-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                style={{ background: 'linear-gradient(90deg, #6C63FF, #B06FFF)', boxShadow: '0 0 8px rgba(108,99,255,0.8)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <div className="relative">
              <Icon
                className="w-5 h-5 transition-colors duration-200"
                style={{
                  color: isActive ? '#9B8FFF' : '#6B7894',
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(108,99,255,0.6))' : 'none',
                }}
              />
              {badge > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full text-[9px] font-black flex items-center justify-center px-1 text-white"
                  style={{ background: tab.id === 'live' ? 'linear-gradient(135deg, #FF3366, #FF6B35)' : 'linear-gradient(135deg, #6C63FF, #9B5DE5)' }}
                >
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold transition-colors duration-200 whitespace-nowrap" style={{ color: isActive ? '#9B8FFF' : '#6B7894' }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

// ── View transition variants ─────────────────────────────────────────────────
// Views fade and rise slightly on enter; exit is a quick fade. Discover is a
// position:fixed feed, so it fades only: a transform on its wrapper would
// make the feed position relative to the wrapper mid-animation.

const viewVariants = {
  enter: (slide) => ({ opacity: 0, y: slide ? 10 : 0 }),
  center: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } },
};

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
  const { logout } = useAuth();
  const { selections: slipSelections, loadSelections } = useBetSlip();
  const hasSlipSelections = slipSelections.length > 0;
  const openBetCount = useUser().bets.filter(b => b.status === 'open').length;

  // When intent changes (after profiling or settings update), redirect to the right home
  useEffect(() => {
    if (intent === 'casino') setActiveView('casino');
  }, [intent]);

  // Track SPA navigation in GA4
  useEffect(() => {
    trackPageView(activeView);
  }, [activeView]);

  // Track scroll depth milestones per view
  useScrollDepth(activeView);


  // ── Data hooks ──────────────────────────────────────────────────────────────
  // Football comes through the live engine so scores, minutes and prices
  // tick in real time everywhere they appear
  const {
    fixtures: footballFixturesLive,
    usingLive: footballUsingLive,
    lastUpdated: footballLastUpdated,
    getMatch: getLiveMatch,
  } = useLive();
  const [liveMatchId, setLiveMatchId] = useState(null);

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

  // ── Fixture counts — sports with none are hidden from the sport nav ────────
  const fixtureCounts = useMemo(() => ({
    football: footballFixturesLive.length,
    tennis: tennisOdds.length,
    boxing: boxingOdds.length,
    nfl: nflOdds.length,
    nba: nbaOdds.length,
    horseracing: horseRacingOdds.length,
  }), [footballFixturesLive, tennisOdds, boxingOdds, nflOdds, nbaOdds, horseRacingOdds]);

  // Favourites from profiling come first, then the rest in the usual order
  const favouriteSports = user?.preferences?.favouriteSports;
  const availableSports = useMemo(() => {
    const favs = favouriteSports ?? [];
    return SPORTS.map(s => s.id)
      .filter(id => fixtureCounts[id] > 0)
      .sort((a, b) => (favs.includes(b) - favs.includes(a)));
  }, [fixtureCounts, favouriteSports]);

  // Shared slip links (?slip=...) load straight into the bet slip, then the
  // param is removed so a refresh doesn't reload it
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('slip');
    if (!shared) return;
    const picks = decodeSlip(shared, footballFixturesLive);
    if (picks.length) {
      loadSelections(picks);
      setMobileSlipOpen(true);
    }
    params.delete('slip');
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open home on the user's top favourite sport (once, on first load)
  useEffect(() => {
    if (favouriteSports?.length && availableSports[0]) setActiveSport(availableSports[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (actionId === 'account' || actionId === 'responsible') {
      setMobileSlipOpen(false);
      setActiveView('account');
    }
    if (actionId === 'discover') setActiveView('discover');
    if (actionId === 'mybets') setMyBetsOpen(true);
    if (actionId === 'signout') logout();
  }

  function openLiveMatch(id) {
    setMobileSlipOpen(false);
    setLiveMatchId(id);
    setActiveView('inplay-match');
    trackSelectMatch(id, 'football');
  }

  // In-play matches open the live view; everything else the Match Centre
  function openMatch(fixture) {
    if (getLiveMatch(fixture.id)) {
      openLiveMatch(fixture.id);
      return;
    }
    setSelectedFixture(fixture);
    setActiveSport('football');
    setActiveView('home');
  }

  function handleSportChange(sport) {
    setActiveSport(sport);
    setActiveView('home');
    setSelectedFixture(null);
    trackSelectSport(sport);
  }

  function handleBottomNavTab(tabId) {
    setMobileSlipOpen(false);
    setActiveView(tabId);
    if (tabId === 'home') setSelectedFixture(null);
  }

  // Key for the main view transition — changes on tab, sport, or match detail
  const showMatchDetail = activeView === 'home' && activeSport === 'football' && selectedFixture;
  const viewKey = showMatchDetail ? `match-${selectedFixture.id}`
    : activeView === 'home' ? `home-${activeSport}`
    : activeView === 'inplay-match' ? `inplay-${liveMatchId}`
    : activeView;
  const otherLiveFixtures = allFixtures.filter(f => f.isLive && f.sport !== 'football');

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      {/* ── Fixed top bar ──────────────────────────────────────────────────── */}
      <TopBar
        activeSport={activeSport}
        onSportChange={handleSportChange}
        onDropdownAction={handleDropdownAction}
        availableSports={availableSports}
      />

      {/* ── Mobile sport nav — only visible on home view ───────────────────── */}
      {activeView === 'home' && (
        <SportNav activeSport={activeSport} onSportChange={handleSportChange} availableSports={availableSports} />
      )}

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
              {/* Desktop's way into In-Play (mobile uses the bottom nav) */}
              <button type="button" onClick={() => setActiveView('live')} className="w-full flex items-center gap-2 mb-3">
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
                <span className="ml-auto text-[10px] font-semibold" style={{ color: '#9B8FFF' }}>In-Play →</span>
              </button>
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
                      if (fix.sport === 'football') openMatch(fix);
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

        <div className="p-4 lg:p-6 max-w-3xl mx-auto">
          {/* Scroll to top once the outgoing view has faded, so it doesn't visibly jump */}
          <AnimatePresence
            mode="wait"
            initial={false}
            onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}
          >
          <motion.div
            key={viewKey}
            custom={activeView !== 'discover'}
            variants={viewVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >

          {/* ── LIVE VIEW ─────────────────────────────────────────────────── */}
          {activeView === 'live' && (
            <InPlayHub
              onOpenMatch={openLiveMatch}
              onTakeBreak={() => setActiveView('account')}
              otherLive={otherLiveFixtures.length > 0 && (
                <div className="mt-8">
                  <LiveView allFixtures={otherLiveFixtures} onViewMatch={openMatch} title="More live sport" />
                </div>
              )}
            />
          )}

          {/* ── IN-PLAY MATCH VIEW ────────────────────────────────────────── */}
          {activeView === 'inplay-match' && (
            <InPlayMatch fixtureId={liveMatchId} onBack={() => setActiveView('live')} />
          )}

          {/* ── DISCOVER VIEW ─────────────────────────────────────────────── */}
          {activeView === 'discover' && (
            <DiscoverFeed
              fixtures={footballFixturesLive}
              intent={intent}
              onViewMatch={openMatch}
              onNavigate={view => setActiveView(view)}
              onOpenCasino={() => setActiveView('casino')}
            />
          )}

          {/* ── MY BETS VIEW ──────────────────────────────────────────────── */}
          {activeView === 'mybets' && <MyBetsPage />}

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
              {showMatchDetail ? (
                <MatchDetailView
                  fixture={selectedFixture}
                  detail={selectedDetail}
                  onBack={() => setSelectedFixture(null)}
                />
              ) : (
                <>
                  {/* Section header — football uses FootballHome's own sections */}
                  {activeSport !== 'football' && (
                    <div className="mb-5">
                      <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-xl font-bold" style={{ color: C.text }}>
                          {SPORT_NAMES[activeSport]}
                        </h1>
                      </div>
                      <p className="text-sm" style={{ color: C.textSecondary }}>
                        {getFixtureSubtitle()}
                      </p>
                    </div>
                  )}

                  {/* ── Sport feeds ─────────────────────────────────────── */}

                  {activeSport === 'football' && (
                    <FootballHome
                      fixtures={footballFixturesLive}
                      intent={intent}
                      onViewMatch={openMatch}
                      onOpenCasino={() => setActiveView('casino')}
                    />
                  )}

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

          </motion.div>
          </AnimatePresence>

          {/* Bottom spacer for mobile bottom nav (+ bet slip tray when showing) */}
          <div
            className="lg:hidden"
            style={{ height: `calc(${hasSlipSelections ? 160 : 96}px + env(safe-area-inset-bottom, 0px))` }}
          />
        </div>
      </main>

      {/* ── Bet slip (desktop panel + mobile tray and sheet) ───────────────── */}
      <PositionBuilder
        mobileOpen={mobileSlipOpen}
        onMobileOpenChange={setMobileSlipOpen}
      />

      {/* ── My Bets slide-in ────────────────────────────────────────────────── */}
      <MyBets isOpen={myBetsOpen} onClose={() => setMyBetsOpen(false)} />

      {/* ── In-play: quick bet sheet and goal / result alerts ───────────── */}
      <QuickBetSheet />
      <LiveToasts onOpenMatch={openLiveMatch} />

      {/* ── Mobile Bottom Nav ───────────────────────────────────────────────── */}
      <MobileBottomNav
        activeTab={activeView === 'inplay-match' ? 'live' : activeView}
        onTabChange={handleBottomNavTab}
        liveCount={totalLiveCount}
        openBetCount={openBetCount}
        intent={intent}
      />
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
    <MotionConfig reducedMotion="user">
    <AuthProvider>
      <OddsFormatProvider>
        <BetSlipProvider>
          <GamificationProvider>
            <AuthGate>
              <UserProvider>
                <LiveProvider>
                  <AppContent />
                </LiveProvider>
              </UserProvider>
            </AuthGate>
          </GamificationProvider>
        </BetSlipProvider>
      </OddsFormatProvider>
    </AuthProvider>
    </MotionConfig>
  );
}

export default App;
