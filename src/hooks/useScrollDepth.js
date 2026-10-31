/**
 * useScrollDepth — fires GA4 scroll depth events at 25 / 50 / 75 / 100 %
 * milestones as the user scrolls the window.
 *
 * Milestones reset automatically when viewId changes so each view gets
 * its own fresh set of depth events in GA4.
 */

import { useEffect, useRef } from 'react';
import { trackScrollDepth } from '../utils/analytics.js';

const MILESTONES = [25, 50, 75, 100];

export function useScrollDepth(viewId) {
  const firedRef = useRef(new Set());

  // Reset fired milestones when the view changes
  useEffect(() => {
    firedRef.current = new Set();
  }, [viewId]);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const pct = Math.round((scrollTop / docHeight) * 100);

      for (const milestone of MILESTONES) {
        if (pct >= milestone && !firedRef.current.has(milestone)) {
          firedRef.current.add(milestone);
          trackScrollDepth(milestone, viewId);
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewId]);
}
