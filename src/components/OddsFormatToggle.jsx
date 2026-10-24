/**
 * OddsFormatToggle.jsx
 *
 * Compact three-way segmented control for switching odds display format.
 * Sits in the TopBar right section, before the balance display.
 *
 * Visual: dark pill with active segment highlighted in electric indigo.
 * Small footprint — designed to not compete with balance or avatar.
 */

import { useOddsFormat } from '../context/OddsFormatContext.jsx';

const SEGMENTS = [
  { id: 'probability', label: '%' },
  { id: 'decimal', label: 'DEC' },
  { id: 'fractional', label: 'FRAC' },
];

export default function OddsFormatToggle() {
  const { format, setFormat } = useOddsFormat();

  return (
    <div
      className="flex items-center rounded-full p-0.5"
      style={{ backgroundColor: '#161E2E' }}
    >
      {SEGMENTS.map((seg) => {
        const isActive = format === seg.id;
        return (
          <button
            key={seg.id}
            onClick={() => setFormat(seg.id)}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
            style={
              isActive
                ? { backgroundColor: '#5B6EF5', color: '#ffffff' }
                : { backgroundColor: 'transparent', color: '#8A97B4' }
            }
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = '#8A97B4';
            }}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
