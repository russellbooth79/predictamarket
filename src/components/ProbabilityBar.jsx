/**
 * ProbabilityBar.jsx
 *
 * A thin horizontal bar that visually represents a probability percentage.
 * Animates from 0 to the target width on mount when `animated` is true.
 * Colour is derived from the probability threshold via getProbabilityColour.
 * Updated for bet365 brand palette.
 */

import { useState, useEffect } from 'react';
import { getProbabilityColour } from '../data/oddsUtils.js';

export default function ProbabilityBar({ probability, animated = true }) {
  const [width, setWidth] = useState(animated ? 0 : probability);

  useEffect(() => {
    if (!animated) return;
    // requestAnimationFrame ensures the initial 0-width render paints
    // before the transition kicks in -- without this, the browser may
    // batch the 0 and target values into a single paint (no animation).
    const raf = requestAnimationFrame(() => {
      setWidth(probability);
    });
    return () => cancelAnimationFrame(raf);
  }, [probability, animated]);

  const colourClass = getProbabilityColour(probability);

  return (
    <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(45,63,82,0.5)' }}>
      <div
        className={`h-full rounded-full ${colourClass} transition-all duration-700 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
