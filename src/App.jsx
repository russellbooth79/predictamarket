/**
 * App.jsx
 *
 * Root layout component for PredictaMarket.
 *
 * Layout structure (desktop >= 1024px):
 * +----------------------------------------------------------+
 * |                      TopBar (h-14)                        |
 * +----------+-----------------------------+-----------------+
 * | Sidebar  |        Main Content         | PositionBuilder |
 * |  (w-56)  |     (scrollable feed)       |     (w-80)      |
 * |  fixed   |                             |     fixed       |
 * +----------+-----------------------------+-----------------+
 *
 * Mobile (< 1024px):
 * - No sidebar (hidden)
 * - SportNav pill strip below TopBar
 * - PositionBuilder as bottom sheet FAB
 * - Full-width card feed
 *
 * State management: sport selection, My Bets panel visibility,
 * and selected fixture for MatchDetailView managed with useState.
 *
 * Live odds: useFootballOdds hook fetches real data from the backend,
 * falls back silently to mock data when the API is unavailable.
 *
 * bet365 colour scheme applied throughout.
 */

import { useState, useMemo } from 'react';
import { BetSlipProvider } from './context/BetSlipContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { horseRacingFixtures, tennisFixtures } from './data/fixtures.js';
import { matchDetails } from './data/matchDetails.js';
import { useFootballOdds } from './hooks/useOdds.js';
import TopBar from './components/TopBar.jsx';
import SportNav from './components/SportNav.jsx';
import EventCard from './components/EventCard.jsx';
import HorseRacingCard from './components/HorseRacingCard.jsx';
import TennisCard from './components/TennisCard.jsx';
import PositionBuilder from './components/PositionBuilder.jsx';
import MyBets from './components/MyBets.jsx';
import MatchDetailView from './components/MatchDetailView.jsx';
import { Trophy, Radio, Calendar } from 'lucide-react';

/**
 * Sidebar competition/filter links for each sport.
 */
const SIDEBAR_CONFIG = {
  football: {
    competitions: [
      { id: 'pl', label: 'Premier League' },
      { id: 'cl', label: 'Champions League' },
      { id: 'efl', label: 'EFL Championship' },
      { id: 'fa', label: 'FA Cup' },
    ],
  },
  horseracing: {
    competitions: [
      { id: 'che', label: 'Cheltenham' },
      { id: 'kmp', label: 'Kempton' },
      { id: 'hay', label: 'Haydock' },
      { id: 'asc', label: 'Ascot' },
    ],
  },
  tennis: {
    competitions: [
      { id: 'atp', label: 'ATP Finals' },
      { id: 'wta', label: 'WTA Finals' },
      { id: 'ao', label: 'Australian Open' },
    ],
  },
};

function getLiveFixtures(sport, footballFixtures) {
  const fixtureMap = {
    football: footballFixtures,
    horseracing: horseRacingFixtures,
    tennis: tennisFixtures,
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
  return fixture.raceName;
}

function App() {
  const [activeSport, setActiveSport] = useState('football');
  const [myBetsOpen, setMyBetsOpen] = useState(false);
  // MatchDetailView state: when non-null, renders detail view instead of card feed
  const [selectedFixture, setSelectedFixture] = useState(null);

  // Live odds hook — fetches from backend, falls back to mock data
  const {
    fixtures: footballFixtures,
    loading: footballLoading,
    usingLive: footballUsingLive,
    lastUpdated: footballLastUpdated,
  } = useFootballOdds();

  function handleDropdownAction(actionId) {
    if (actionId === 'mybets') {
      setMyBetsOpen(true);
    }
  }

  // Clear selected fixture when switching sports
  function handleSportChange(sport) {
    setActiveSport(sport);
    setSelectedFixture(null);
  }

  const liveFixtures = useMemo(
    () => getLiveFixtures(activeSport, footballFixtures),
    [activeSport, footballFixtures]
  );
  const sidebarConfig = SIDEBAR_CONFIG[activeSport];

  // Look up detail data for selected fixture (safe fallback to null)
  const selectedDetail = selectedFixture
    ? (matchDetails[selectedFixture.id] || null)
    : null;

  return (
    <UserProvider>
      <BetSlipProvider>
        <div className="min-h-screen" style={{ backgroundColor: '#111827' }}>
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
              backgroundColor: 'rgba(26,35,50,0.5)',
              borderRight: '1px solid #2d3f52',
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
                  <span className="text-[9px] text-gray-500">
                    {footballLastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Live Now section */}
              {liveFixtures.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Radio className="w-3.5 h-3.5" style={{ color: '#e5302f' }} />
                    <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Live Now
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {liveFixtures.map((fix) => (
                      <button
                        key={fix.id}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-300 transition-colors flex items-center gap-2"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#243040'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={() => {
                          if (fix.sport === 'football') setSelectedFixture(fix);
                        }}
                      >
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                          <span
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ backgroundColor: '#e5302f' }}
                          />
                          <span
                            className="relative inline-flex rounded-full h-1.5 w-1.5"
                            style={{ backgroundColor: '#e5302f' }}
                          />
                        </span>
                        <span className="truncate">{getLiveLabel(fix)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-3.5 h-3.5" style={{ color: '#ffb800' }} />
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Competitions
                  </h3>
                </div>
                <div className="space-y-0.5">
                  {sidebarConfig.competitions.map((comp) => (
                    <button
                      key={comp.id}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 transition-colors"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#243040';
                        e.currentTarget.style.color = '#e2e8f0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                    >
                      {comp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Quick Links
                  </h3>
                </div>
                <div className="space-y-0.5">
                  {['Today', 'Tomorrow', 'This Weekend'].map((label) => (
                    <button
                      key={label}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 transition-colors"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#243040';
                        e.currentTarget.style.color = '#e2e8f0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main content area */}
          <main className="pt-14 lg:pl-56 lg:pr-80">
            {/* Extra top padding on mobile for SportNav */}
            <div className="lg:hidden h-12" />

            <div className="p-4 lg:p-6 max-w-3xl mx-auto">
              {/* When football tab active AND a fixture is selected: show MatchDetailView */}
              {activeSport === 'football' && selectedFixture ? (
                <MatchDetailView
                  fixture={selectedFixture}
                  detail={selectedDetail}
                  onBack={() => setSelectedFixture(null)}
                />
              ) : (
                <>
                  {/* Section header */}
                  <div className="mb-5">
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-xl font-bold text-white">
                        {activeSport === 'football' && 'Football'}
                        {activeSport === 'horseracing' && 'Horse Racing'}
                        {activeSport === 'tennis' && 'Tennis'}
                      </h1>

                      {/* Mobile data source badge (sidebar not visible on mobile) */}
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
                    <p className="text-sm text-gray-400">
                      {activeSport === 'football' && `${footballFixtures.length} events  ·  ${footballFixtures.filter((f) => f.isLive).length} live`}
                      {activeSport === 'horseracing' && `${horseRacingFixtures.length} races across ${[...new Set(horseRacingFixtures.map((f) => f.competition))].length} meetings`}
                      {activeSport === 'tennis' && `${tennisFixtures.length} matches  ·  ${tennisFixtures.filter((f) => f.isLive).length} live`}
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
                </>
              )}

              {/* Bottom spacer for mobile to clear FAB */}
              <div className="h-24 lg:h-0" />
            </div>
          </main>

          {/* Position Builder (right panel / mobile bottom sheet) */}
          <PositionBuilder />

          {/* My Bets slide-in panel */}
          <MyBets isOpen={myBetsOpen} onClose={() => setMyBetsOpen(false)} />
        </div>
      </BetSlipProvider>
    </UserProvider>
  );
}

export default App;
