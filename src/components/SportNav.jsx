/**
 * SportNav.jsx
 *
 * Horizontal scrolling pill navigation for mobile viewports.
 * Hidden on desktop (lg+) where TopBar handles sport switching.
 * bet365 colour scheme: yellow selected pill on dark navy background.
 */

const SPORTS = [
  { id: 'football', label: 'Football' },
  { id: 'horseracing', label: 'Horse Racing' },
  { id: 'tennis', label: 'Tennis' },
];

export default function SportNav({ activeSport, onSportChange }) {
  return (
    <nav
      className="lg:hidden sticky top-14 z-40 backdrop-blur px-4 py-2"
      style={{ backgroundColor: 'rgba(17,24,39,0.95)', borderBottom: '1px solid #2d3f52' }}
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {SPORTS.map((sport) => (
          <button
            key={sport.id}
            onClick={() => onSportChange(sport.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeSport === sport.id
                ? 'text-gray-900'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            style={
              activeSport === sport.id
                ? { backgroundColor: '#ffb800' }
                : { backgroundColor: '#243040' }
            }
          >
            {sport.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
