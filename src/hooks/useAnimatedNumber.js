import { useState, useEffect, useRef } from 'react';

// Animates a number from its previous value to a new one.
// Used for probability % and odds displays to give the "live data" feel.
// Sub-200ms animation so it feels reactive, not laggy.
export function useAnimatedNumber(value, duration = 180) {
  const [display, setDisplay] = useState(value);
  const [direction, setDirection] = useState(null); // 'up' | 'down' | null
  const prevRef = useRef(value);
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;

    setDirection(value > prev ? 'up' : 'down');
    prevRef.current = value;

    // Clear any in-flight animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const start = performance.now();
    const from = prev;
    const to = value;

    function step(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplay(Math.round(current));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(to);
        // Reset direction highlight after 1.2s
        timeoutRef.current = setTimeout(() => setDirection(null), 1200);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, duration]);

  return { display, direction };
}
