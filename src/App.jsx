/**
 * App.jsx
 *
 * Root layout component for PredictaMarket v3.
 *
 * Desktop (>= 1024px):
 * +----------------------------------------------------------+
 * |                      TopBar (h-14)                        |
 * +----------+-----------------------------+-----------------+
 * | Sidebar  |        Main Content         | PositionBuilder |
 * |  (w-56)  | DiscoverySurface + Cards    |     (w-80)      |
 * |  fixed   |     (scrollable feed)       |     fixed       |
 * +----------+-----------------------------+-----------------+
 *
 * Mobile (< 1024px):
 * - No sidebar
 * - SportNav pill strip below TopBar
 * - Mobile bottom nav (Home, Live, Bet Slip, Markets, Account)
 * - PositionBuilder as bottom sheet
 * - Full-width card feed
 *
 * Wires all 6 sports: football, horseracing, tennis, boxing, NFL, NBA.
 * DiscoverySurface shows on football tab with live strip + popular bets.
 *
 * PredictaMarket v3 ARIA palette — electric indigo primary, deep navy surfaces.
 */

import { useState, useMemo } from 'react';
import { OddsFormatProvider } from './context/OddsFormatContext.jsx';
import { BetSlipProvider, useBetSlip } from './context/BetSlipContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { horseRacingFixtures, tennisFixtures, boxingFixtures, nflFixtures, nbaFixtures } from './data/fixtures.js';
import { matchDetails } from './data/matchDetails.js';
import { useFootballOdds, useBoxingOdds, useNflOdds, useNbaOdds } from './hooks/useOdds.js';
import TopBar from './components/TopBar.jsx';
import SportNav from './components/SportNav.jsx';
import EventCard from './components/EventCard.jsx';
import HorseRacingCard from './components/HorseRacingCard.jsx';
import TennisCard from './components/TennisCard.jsx';
import FightCard from './components/FightCard.jsx';
import AmericanSportsCard from './components/AmericanSportsCard.jsx';
import DiscoverySurface from './components/DiscoverySurface.jsx';
import PositionBuilder from './components/PositionBuilder.jsx';
import MyBets from './components/MyBets.jsx';
import MatchDetailView from './components/MatchDetailView.jsx';
import { Trophy, Radio, Calendar, Star, Home, Zap, LayoutGrid, BarChart3, User } from 'lucide-react';

// -- ARIA colour constants --------------------------------------------------

const C = {
  bg: '#080C14',
  sidebar: 'rgba(15,21,32,0.85)',
  sidebarBorder: '#1A2238',
  elevated: '#161E2E',
  border: '#1A2238',
  primary: '#5B6EF5',
  liveRed: '#FF6B6B',
  green: '#A8FF3E',
  text: '#f0f4ff',
  textSecondary: '#8A97B4',
  textMuted: '#4a5568',
};

// -- Sidebar competition tree config ----------------------------------------

const SIDEBAR_CONFIG = {
  football: {
    icon: '\u26BD',
    competitions: [
      { id: 'pl', label: 'Premier League' },
      { id: 'cl', label: 'Champions League' },
      { id: 'efl', label: 'EFL Championship' },
      { id: 'fa', label: 'FA Cup' },
    ],
  },
  horseracing: {
    icon: '\uD83C\uDFC7',
    competitions: [
      { id: 'che', label: 'Cheltenham' },
      { id: 'kmp', label: 'Kempton' },
      { id: 'hay', label: 'Haydock' },
      { id: 'asc', label: 'Ascot' },
    ],
  },
  tennis: {
    icon: '\uD83C\uDFBE',
    competitions: [
      { id: 'atp', label: 'ATP Finals' },
      { id: 'wta', label: 'WTA Finals' },
      { id: 'ao', label: 'Australian Open' },
    ],
  },
  boxing: {
    icon: '\uD83E\uDD4A',
    competitions: [
      { id: 'box', label: 'Boxing' },
      { id: 'ufc', label: 'UFC / MMA' },
    ],
  },
  nfl: {
    icon: '\uD83C\uDFC8',
    competitions: [
      { id: 'afc', label: 'AFC' },
      { id: 'nfc', label: 'NFC' },
      { id: 'snf', label: 'Sunday Night' },
    ],
  },
  nba: {
    icon: '\uD83C\uDFC0',
    competitions: [
      { id: 'east', label: 'Eastern Conference' },
      { id: 'west', label: 'Western Conference' },
    ],
  },
};

// -- Sport display names ----------------------------------------------------

const SPORT_NAMES = {
  football: 'Football',
  horseracing: 'Horse Racing',
  tennis: 'Tennis',
  boxing: 'Boxing & MMA',
  nfl: 'NFL',
  nba: 'NBA',
};

// -- Live fixture helpers ---------------------------------------------------

function getLiveFixtures(sport, footballFixtures) {
  const fixtureMap = {
    football: footballFixtures,
    horseracing: horseRacingFixtures,
    tennis: tennisFixtures,
    boxing: boxingFixtures,
    nfl: nflFixtures,
    nba: nbaFixtures,
  };
  return (fixtureMap[sport] || []).filter((f) => f.isLive);
}

function getLiveLabel(fixture) {
  if (fixture.sport === 'football') {
    return `${fixture.homeTeam.split(' ').pop()} vs ${fixture.awayTeam.split(' ').pop()}`;
  }
  if (fixture.sport === 'tennis') {
    return `${fixture.player1.name.split(' ').pop()} vs ${fixture.player2.name.split(' ').pop()}`;
  }
  if (fixture.sport === 'boxing') {
    return `${fixture.homeTeam.split(' ').pop()} vs ${fixture.awayTeam.split(' ').pop()}`;
  }
  if (fixture.sport === 'nfl' || fixture.sport === 'nba') {
    return `${fixture.homeTeam.split(' ').pop()} vs ${fixture.awayTeam.split(' ').pop()}`;
  }
  return fixture.raceName || 'Live';
}

function getAllLiveCount(footballFixtures) {
  const all = [
    ...footballFixtures,
    ...horseRacingFixtures,
    ...tennisFixtures,
    ...boxingFixtures,
    ...nflFixtures,
    ...nbaFixtures,
  ];
  return all.filter((f) => f.isLive).length;
}

// -- Mobile Bottom Nav Component --------------------------------------------

function MobileBottomNav({ activeSport, onTabChange, betSlipCount }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'live', label: 'Live', icon: Zap },
    { id: 'betslip', label: 'Bet Slip', icon: LayoutGrid },
    { id: 'markets', label: 'Markets', icon: BarChart3 },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2 px-1"
      style={{
        backgroundColor: 'rgba(8,12,20,0.98)',
        borderTop: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)',
        /* Respect safe area on devices with home indicator */
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === 'home';
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 relative"
          >
            <div className="relative">
              <Icon
                className="w-5 h-5"
                style={{ color: isActive ? C.primary : C.textMuted }}
              />
              {/* Bet slip count badge */}
              {tab.id === 'betslip' && betSlipCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1"
                  style={{ backgroundColor: C.liveRed, color: '#fff' }}
                >
                  {betSlipCount > 9 ? '9+' : betSlipCount}
                </span>
              )}
              {/* Live indicator dot */}
              {tab.id === 'live' && (
                <span
                  className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: C.liveRed }}
                />
              )}
            </div>
            <span
              className="text-[10px] font-medium"
              style={{ color: isActive ? C.primary : C.textMuted }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// -- Bet Slip Count Bridge (needs context access) ---------------------------

function BetSlipCountBridge({ children }) {
  const { selections } = useBetSlip();
  return children(selections.length);
}

// -- Main App ---------------------------------------------------------------

function AppContent() {
  const [activeSport, setActiveSport] = useState('football');
  const [myBetsOpen, setMyBetsOpen] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState(null);

  // Live odds hooks
  const {
    fixtures: footballFixtures,
    usingLive: footballUsingLive,
    lastUpdated: footballLastUpdated,
  } = useFootballOdds();

  const { fixtures: boxingOdds } = useBoxingOdds();
  const { fixtures: nflOdds } = useNflOdds();
  const { fixtures: nbaOdds } = useNbaOdds();

  function handleDropdownAction(actionId) {
    if (actionId === 'mybets') setMyBetsOpen(true);
  }

  function handleSportChange(sport) {
    setActiveSport(sport);
    setSelectedFixture(null);
  }

  function handleBottomNavTab(tabId) {
    if (tabId === 'home') setActiveSport('football');
    if (tabId === 'live') setActiveSport('football');
  }

  const liveFixtures = useMemo(
    () => getLiveFixtures(activeSport, footballFixtures),
    [activeSport, footballFixtures]
  );

  const totalLiveCount = useMemo(
    () => getAllLiveCount(footballFixtures),
    [footballFixtures]
  );

  const sidebarConfig = SIDEBAR_CONFIG[activeSport];

  const selectedDetail = selectedFixture
    ? (matchDetails[selectedFixture.id] || null)
    : null;

  function getFixtureSubtitle() {
    switch (activeSport) {
      case 'football': return `${footballFixtures.length} events \u00B7 ${footballFixtures.filter((f) => f.isLive).length} live`;
      case 'horseracing': return `${horseRacingFixtures.length} races across ${[...new Set(horseRacingFixtures.map((f) => f.competition))].length} meetings`;
      case 'tennis': return `${tennisFixtures.length} matches \u00B7 ${tennisFixtures.filter((f) => f.isLive).length} live`;
      case 'boxing': return `${boxingOdds.length} bouts`;
      case 'nfl': return `${nflOdds.length} games this week`;
      case 'nba': return `${nbaOdds.length} games \u00B7 ${nbaOdds.filter((f) => f.isLive).length} live`;
      default: return '';
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      {/* Fixed top bar */}
      <TopBar
        activeSport={activeSport}
        onSportChange={handleSportChange}
        onDropdownAction={handleDropdownAction}
      />

      {/* Mobile sport nav */}
      <SportNav activeSport={activeSport} onSportChange={handleSportChange} />

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:block fixed left-0 top-14 bottom-0 w-56 z-30 overflow-y-auto custom-scrollbar"
        style={{
          backgroundColor: C.sidebar,
          borderRight: `1px solid ${C.sidebarBorder}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="p-4 space-y-6">
          {/* Data source indicator */}
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
                {liveFixtures.map((fix) => (
                  <button
                    key={fix.id}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2"
                    style={{ color: C.textSecondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = C.elevated;
                      e.currentTarget.style.color = C.text;
                    }}
                    onMouseLeave={(e) => {
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
              {sidebarConfig.competitions.map((comp) => (
                <button
                  key={comp.id}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: C.textSecondary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = C.elevated;
                    e.currentTarget.style.color = C.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = C.textSecondary;
                  }}
                >
                  {comp.label}
                </button>
              ))}
            </div>
          </div>

          {/* My Markets section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-3.5 h-3.5" style={{ color: C.primary }} />
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.text }}>
                My Markets
              </h3>
            </div>
            <div className="space-y-0.5">
              {['Favourites', 'Recent', 'Custom Alerts'].map((label) => (
                <button
                  key={label}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: C.textMuted }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = C.elevated;
                    e.currentTarget.style.color = C.textSecondary;
                  }}
                  onMouseLeave={(e) => {
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
              {['Today', 'Tomorrow', 'This Weekend'].map((label) => (
                <button
                  key={label}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: C.textMuted }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = C.elevated;
                    e.currentTarget.style.color = C.textSecondary;
                  }}
                  onMouseLeave={(e) => {
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

      {/* Main content area — pb-16 on mobile for BottomNav clearance */}
      <main className="pt-14 lg:pl-56 lg:pr-80 pb-16 lg:pb-0">
        {/* Extra top padding on mobile for SportNav */}
        <div className="lg:hidden h-12" />

        <div className="p-4 lg:p-6 max-w-3xl mx-auto">
          {/* Football tab: match detail view when fixture selected */}
          {activeSport === 'football' && selectedFixture ? (
            <MatchDetailView
              fixture={selectedFixture}
              detail={selectedDetail}
              onBack={() => setSelectedFixture(null)}
            />
          ) : (
            <>
              {/* DiscoverySurface -- only on football tab */}
              {activeSport === 'football' && (
                <DiscoverySurface
                  liveFixtures={footballFixtures.filter((f) => f.isLive)}
                  onViewMatch={(f) => setSelectedFixture(f)}
                />
              )}

              {/* Section header */}
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold" style={{ color: C.text }}>
                    {SPORT_NAMES[activeSport]}
                  </h1>

                  {/* Mobile data source badge */}
                  <div className="lg:hidden">
                    {activeSport === 'football' && footballUsingLive ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(0,182,122,0.15)', color: '#00b67a' }}>
                        LIVE ODDS
                      </span>
                    ) : activeSport === 'football' ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(100,116,139,0.15)', color: '#94a3b8' }}>
                        DEMO DATA
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm" style={{ color: C.textSecondary }}>
                  {getFixtureSubtitle()}
                </p>
              </div>

              {/* Football cards */}
              {activeSport === 'football' && (
                <div className="space-y-4">
                  {footballFixtures.map((fixture, i) => (
                    <EventCard
                      key={fixture.id}
                      fixture={fixture}
                      index={i}
                      onViewMatch={(f) => setSelectedFixture(f)}
                    />
                  ))}
                </div>
              )}

              {/* Horse Racing cards */}
              {activeSport === 'horseracing' && (
                <div className="space-y-4">
                  {horseRacingFixtures.map((fixture, i) => (
                    <HorseRacingCard key={fixture.id} fixture={fixture} index={i} />
                  ))}
                </div>
              )}

              {/* Tennis cards */}
              {activeSport === 'tennis' && (
                <div className="space-y-4">
                  {tennisFixtures.map((fixture, i) => (
                    <TennisCard key={fixture.id} fixture={fixture} index={i} />
                  ))}
                </div>
              )}

              {/* Boxing / MMA cards */}
              {activeSport === 'boxing' && (
                <div className="space-y-4">
                  {boxingOdds.map((fixture, i) => (
                    <FightCard key={fixture.id} fixture={fixture} index={i} />
                  ))}
                </div>
              )}

              {/* NFL cards */}
              {activeSport === 'nfl' && (
                <div className="space-y-4">
                  {nflOdds.map((fixture, i) => (
                    <AmericanSportsCard key={fixture.id} fixture={fixture} index={i} />
                  ))}
                </div>
              )}

              {/* NBA cards */}
              {activeSport === 'nba' && (
                <div className="space-y-4">
                  {nbaOdds.map((fixture, i) => (
                    <AmericanSportsCard key={fixture.id} fixture={fixture} index={i} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Bottom spacer for mobile bottom nav */}
          <div className="h-24 lg:h-0" />
        </div>
      </main>

      {/* Position Builder */}
      <PositionBuilder />

      {/* My Bets slide-in panel */}
      <MyBets isOpen={myBetsOpen} onClose={() => setMyBetsOpen(false)} />

      {/* Mobile Bottom Nav */}
      <BetSlipCountBridge>
        {(count) => (
          <MobileBottomNav
            activeSport={activeSport}
            onTabChange={handleBottomNavTab}
            betSlipCount={count}
          />
        )}
      </BetSlipCountBridge>
    </div>
  );
}

function App() {
  return (
    <OddsFormatProvider>
      <UserProvider>
        <BetSlipProvider>
          <AppContent />
        </BetSlipProvider>
      </UserProvider>
    </OddsFormatProvider>
  );
}

export default App;
