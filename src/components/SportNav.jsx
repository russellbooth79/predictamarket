/**
 * SportNav.jsx
 *
 * Horizontal scrolling pill navigation for mobile viewports.
 * Hidden on desktop (lg+) where TopBar handles sport switching.
 * All 6 sports with emoji icons.
 *
 * PredictaMarket v3 ARIA palette — electric indigo active pill.
 */

const SPORTS = [
  { id: 'football', label: '\u26BD Football' },
  { id: 'horseracing', label: '\uD83C\uDFC7 Racing' },
  { id: 'tennis', label: '\uD83C\uDFBE Tennis' },
  { id: 'boxing', label: '\uD83E\uDD4A Boxing' },
  { id: 'nfl', label: '\uD83C\uDFC8 NFL' },
  { id: 'nba', label: '\uD83C\uDFC0 NBA' },
];

const C = {
  bg: 'rgba(8,12,20,0.95)',
  border: '#1A2238',
  activeBg: '#5B6EF5',
  inactiveBg: '#161E2E',
  activeText: '#ffffff',
  inactiveText: '#8A97B4',
  hoverText: '#f0f4ff',
};

export default function SportNav({ activeSport, onSportChange }) {
  return (
    <nav
      className="lg:hidden sticky top-14 z-40 backdrop-blur px-4 py-2"
      style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {SPORTS.map((sport) => (
          <button
            key={sport.id}
            onClick={() => onSportChange(sport.id)}
            className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={
              activeSport === sport.id
                ? { backgroundColor: C.activeBg, color: C.activeText }
                : { backgroundColor: C.inactiveBg, color: C.inactiveText }
            }
            onMouseEnter={(e) => {
              if (activeSport !== sport.id) {
                e.currentTarget.style.color = C.hoverText;
              }
            }}
            onMouseLeave={(e) => {
              if (activeSport !== sport.id) {
                e.currentTarget.style.color = C.inactiveText;
              }
            }}
          >
            {sport.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
