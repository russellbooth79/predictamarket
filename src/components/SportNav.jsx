/**
 * SportNav.jsx — PredictaMarket v5
 * Compact sport chips (mobile). The active pill slides between chips via a
 * shared layout animation. Sports with no markets right now are hidden.
 */

import { motion } from 'framer-motion';
import { SPORTS } from '../data/sports.js';

export default function SportNav({ activeSport, onSportChange, availableSports }) {
  const sports = availableSports ? SPORTS.filter(s => availableSports.includes(s.id)) : SPORTS;

  return (
    <nav
      className="lg:hidden sticky top-14 z-40 py-2.5"
      style={{
        background: 'rgba(5,8,15,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
        {sports.map((sport) => {
          const isActive = activeSport === sport.id;
          return (
            <motion.button
              key={sport.id}
              type="button"
              onClick={() => onSportChange(sport.id)}
              whileTap={{ scale: 0.94 }}
              aria-pressed={isActive}
              className="relative shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-semibold"
              style={{
                color: isActive ? '#F0F6FF' : '#7B8CAA',
                background: isActive ? 'transparent' : 'rgba(255,255,255,0.05)',
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="sport-nav-pill"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)',
                    boxShadow: '0 0 14px rgba(108,99,255,0.45)',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">{sport.icon}</span>
              <span className="relative">{sport.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
