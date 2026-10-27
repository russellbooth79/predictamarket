/**
 * DiscoverFeed.jsx
 *
 * Full-page, one-card-at-a-time vertical feed (snap scrolling). Mixes big
 * matches, insights, price boosts, new casino releases, offers, new features
 * and a weekly safer-gambling check-in — see data/discover.js for the mix.
 *
 * Fixed between the top bar and the bottom nav (plus the slip tray when it's
 * showing). On desktop it sits between the sidebars as a centred column.
 */

import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { useBetSlip } from '../../context/BetSlipContext.jsx';
import { buildDiscoverFeed } from '../../data/discover.js';
import { MOBILE_TRAY_H } from '../../utils/layout.js';
import DiscoverCard from './DiscoverCards.jsx';

export default function DiscoverFeed({ fixtures, intent, onViewMatch, onNavigate, onOpenCasino }) {
  const feed = useMemo(() => buildDiscoverFeed(fixtures, intent), [fixtures, intent]);
  const scrollerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [optedIn, setOptedIn] = useState(() => new Set());
  const trayShowing = useBetSlip().selections.length > 0;

  function handleScroll(e) {
    const el = e.currentTarget;
    const index = Math.round(el.scrollTop / el.clientHeight);
    if (index !== activeIndex) setActiveIndex(index);
  }

  function toggleOptIn(id) {
    setOptedIn(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className="fixed left-0 right-0 top-14 z-[5] lg:left-56 lg:right-80 bottom-[var(--feed-bottom)] lg:bottom-0"
      style={{
        // Room for the bottom nav, plus the slip tray when it's showing
        '--feed-bottom': `calc(var(--bottom-nav-total) + ${trayShowing ? MOBILE_TRAY_H : 0}px)`,
        transition: 'bottom 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory', overscrollBehavior: 'contain' }}
      >
        {feed.map((item, i) => (
          <section
            key={item.id}
            className="h-full px-3 py-3 lg:px-0"
            style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
            aria-label={`Discover card ${i + 1} of ${feed.length}`}
          >
            <motion.div
              className="h-full max-w-md mx-auto"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ root: scrollerRef, amount: 0.55 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <DiscoverCard
                item={item}
                onViewMatch={onViewMatch}
                onNavigate={onNavigate}
                onOpenCasino={onOpenCasino}
                optedIn={optedIn.has(item.id)}
                onToggleOptIn={() => toggleOptIn(item.id)}
              />
            </motion.div>
          </section>
        ))}
      </div>

      {/* Progress rail */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-none" aria-hidden="true">
        {feed.map((item, i) => (
          <motion.span
            key={item.id}
            className="w-1 rounded-full"
            animate={{ height: i === activeIndex ? 14 : 4, opacity: i === activeIndex ? 1 : 0.3 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            style={{ background: i === activeIndex ? 'var(--action)' : '#9AA6C0' }}
          />
        ))}
      </div>

      {/* First-card hint */}
      <AnimatePresence>
        {activeIndex === 0 && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 top-5 flex items-center gap-1 px-2.5 py-1 rounded-full pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, -6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { delay: 1.2 }, y: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } }}
            aria-hidden="true"
          >
            <ChevronUp className="w-3.5 h-3.5" style={{ color: '#F0F6FF' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#F0F6FF' }}>Swipe up</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
