/**
 * SportNav.jsx — PredictaMarket v4
 * Glassmorphism mobile sport pill navigation.
 */

const SPORTS = [
  { id: 'football',    label: '⚽ Football' },
  { id: 'horseracing', label: '🏇 Racing' },
  { id: 'tennis',      label: '🎾 Tennis' },
  { id: 'boxing',      label: '🥊 Boxing' },
  { id: 'nfl',         label: '🏈 NFL' },
  { id: 'nba',         label: '🏀 NBA' },
];

export default function SportNav({ activeSport, onSportChange }) {
  return (
    <nav
      className="lg:hidden sticky top-14 z-40 px-4 py-2.5"
      style={{
        background: 'rgba(5,8,15,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {SPORTS.map((sport) => {
          const isActive = activeSport === sport.id;
          return (
            <button
              key={sport.id}
              onClick={() => onSportChange(sport.id)}
              className="shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(108,99,255,0.35)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      color: '#7B8CAA',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }
              }
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#F0F6FF';
                  e.currentTarget.style.background = 'rgba(108,99,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(108,99,255,0.25)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#7B8CAA';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                }
              }}
            >
              {sport.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
