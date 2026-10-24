/**
 * SportNav.jsx
 *
 * Horizontal scrolling pill navigation for mobile viewports.
 * Hidden on desktop (lg+) where TopBar handles sport switching.
 * Uses scrollbar-hide utility from index.css for clean horizontal scroll.
 */

const SPORTS = [
  { id: 'football', label: 'Football' },
  { id: 'horseracing', label: 'Horse Racing' },
  { id: 'tennis', label: 'Tennis' },
];

export default function SportNav({ activeSport, onSportChange }) {
  return (
    <nav className="lg:hidden sticky top-14 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {SPORTS.map((sport) => (
          <button
            key={sport.id}
            onClick={() => onSportChange(sport.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeSport === sport.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {sport.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
