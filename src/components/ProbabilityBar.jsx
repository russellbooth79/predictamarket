/**
 * ProbabilityBar.jsx — v4 gradient bar
 */
import { useState, useEffect } from 'react';

export default function ProbabilityBar({ probability, animated = true, selected = false }) {
  const [width, setWidth] = useState(animated ? 0 : probability);

  useEffect(() => {
    if (!animated) return;
    const raf = requestAnimationFrame(() => setWidth(probability));
    return () => cancelAnimationFrame(raf);
  }, [probability, animated]);

  const gradient = selected
    ? 'linear-gradient(90deg, #6C63FF 0%, #B06FFF 100%)'
    : probability >= 60
    ? 'linear-gradient(90deg, #00F5A0 0%, #00D4FF 100%)'
    : probability >= 40
    ? 'linear-gradient(90deg, #6C63FF 0%, #9B5DE5 100%)'
    : 'linear-gradient(90deg, #FF6B35 0%, #FF3366 100%)';

  return (
    <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${width}%`,
          background: gradient,
          boxShadow: selected ? '0 0 6px rgba(108,99,255,0.5)' : 'none',
        }}
      />
    </div>
  );
}
