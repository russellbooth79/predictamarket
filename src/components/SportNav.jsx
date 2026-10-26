/**
 * SportNav.jsx — PredictaMarket v4
 * Instagram Stories-style sport circles. Active = glowing gradient ring.
 */

import { motion } from 'framer-motion';

const SPORTS = [
  { id: 'football',    icon: '⚽', label: 'Football' },
  { id: 'horseracing', icon: '🏇', label: 'Racing' },
  { id: 'tennis',      icon: '🎾', label: 'Tennis' },
  { id: 'boxing',      icon: '🥊', label: 'Boxing' },
  { id: 'nfl',         icon: '🏈', label: 'NFL' },
  { id: 'nba',         icon: '🏀', label: 'NBA' },
];

export default function SportNav({ activeSport, onSportChange }) {
  return (
    <nav
      className="lg:hidden sticky top-14 z-40 px-4 pt-3 pb-3"
      style={{
        background: 'rgba(5,8,15,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex gap-5 overflow-x-auto scrollbar-hide">
        {SPORTS.map((sport) => {
          const isActive = activeSport === sport.id;
          return (
            <button
              key={sport.id}
              onClick={() => onSportChange(sport.id)}
              className="shrink-0 flex flex-col items-center gap-1.5 transition-all duration-200"
            >
              {/* Circle — the active gradient ring slides between sports via layoutId */}
              <motion.div className="relative w-[60px] h-[60px] p-0.5" whileTap={{ scale: 0.92 }}>
                {isActive && (
                  <motion.div
                    layoutId="sport-nav-ring"
                    className="absolute inset-0.5 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #6C63FF 0%, #FF3366 50%, #9B5DE5 100%)',
                      boxShadow: '0 0 16px rgba(108,99,255,0.5)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <div
                  className="relative w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    padding: '2px',
                    border: isActive ? 'none' : '2px solid rgba(255,255,255,0.08)',
                    background: isActive ? 'transparent' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-2xl transition-colors duration-200"
                    style={{
                      background: isActive
                        ? 'rgba(5,8,15,0.95)'
                        : 'rgba(12,17,30,0.8)',
                    }}
                  >
                    {sport.icon}
                  </div>
                </div>
              </motion.div>
              {/* Label */}
              <span
                className="text-[10px] font-semibold tracking-wide transition-colors duration-200"
                style={{
                  color: isActive ? '#B0A5FF' : '#3A4560',
                }}
              >
                {sport.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
