/**
 * SwipeFeed.jsx — PredictaMarket v4
 * TikTok-style full-height vertical snap feed for mobile.
 * Uses position:fixed so card height is exactly the visible viewport minus
 * the top chrome (TopBar + SportNav) and the bottom nav — no matter how the
 * parent container is laid out.
 * Desktop falls through to a plain vertical list.
 */

import { useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { useBetSlip } from '../context/BetSlipContext.jsx';
import { MOBILE_TRAY_H } from './PositionBuilder.jsx';


export default function SwipeFeed({ children, topOffset = 136 }) {
  const isMobile = useIsMobile();
  const containerRef = useRef(null);
  // Leave room for the bet slip tray when it's showing
  const trayH = useBetSlip().selections.length > 0 ? MOBILE_TRAY_H : 0;

  if (!isMobile) {
    // Desktop: plain list, children render at natural height
    return <div className="space-y-4">{children}</div>;
  }

  const items = Array.isArray(children) ? children : [children];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: topOffset,
        bottom: `calc(var(--bottom-nav-total) + ${trayH}px)`,
        transition: 'bottom 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        left: 0,
        right: 0,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        zIndex: 5,
      }}
      className="scrollbar-hide"
    >
      {items.map((child, i) => (
        <div
          key={i}
          style={{
            height: '100%',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
            paddingBottom: i < items.length - 1 ? '12px' : 0,
          }}
        >
          {child}
        </div>
      ))}

      {/* End-of-feed sentinel */}
      {items.length > 0 && (
        <div
          style={{ height: '100%', scrollSnapAlign: 'start' }}
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
