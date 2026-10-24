/**
 * SwipeFeed.jsx — PredictaMarket v4
 * TikTok-style full-height vertical snap feed for mobile.
 * Uses CSS scroll-snap for GPU-accelerated native performance.
 * Each card occupies 88dvh (leaving 12dvh for the persistent bottom nav).
 * Desktop falls through to a plain vertical list — pass children directly.
 */

import { useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile.js';

const CARD_HEIGHT = 'calc(100dvh - 64px)'; // 64px = bottom nav height

export default function SwipeFeed({ children }) {
  const isMobile = useIsMobile();
  const containerRef = useRef(null);

  if (!isMobile) {
    // Desktop: plain list, children render at natural height
    return <div className="space-y-4">{children}</div>;
  }

  const items = Array.isArray(children) ? children : [children];

  return (
    <div
      ref={containerRef}
      style={{
        height: CARD_HEIGHT,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        // Hide scrollbar but keep scrollability
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
      className="scrollbar-hide"
    >
      {items.map((child, i) => (
        <div
          key={i}
          style={{
            height: CARD_HEIGHT,
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
            // Slight gap between cards to hint at next card
            paddingBottom: i < items.length - 1 ? '12px' : 0,
          }}
        >
          {child}
        </div>
      ))}

      {/* End-of-feed sentinel */}
      {items.length > 0 && (
        <div
          style={{ height: CARD_HEIGHT, scrollSnapAlign: 'start' }}
          className="flex flex-col items-center justify-center gap-4"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)' }}
          >
            🎯
          </div>
          <p className="text-base font-black font-display" style={{ color: '#F0F6FF' }}>You're all caught up</p>
          <p className="text-sm text-center px-8" style={{ color: '#7B8CAA' }}>
            More events coming soon. Check the Markets tab for everything live.
          </p>
        </div>
      )}
    </div>
  );
}
