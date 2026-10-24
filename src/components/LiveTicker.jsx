/**
 * LiveTicker.jsx — PredictaMarket v4
 * Infinite-scroll horizontal live score ticker.
 * Auto-hides when no live fixtures exist.
 */

const TICKER_SPEED = '35s';

export default function LiveTicker({ allFixtures }) {
  const liveFixtures = allFixtures.filter(f => f.isLive);
  if (liveFixtures.length === 0) return null;

  // Build ticker items — duplicate for seamless loop
  const items = liveFixtures.map(f => {
    const home = f.homeTeam || f.player1?.name || 'Home';
    const away = f.awayTeam || f.player2?.name || 'Away';
    const score = f.liveScore
      ? `${f.liveScore.home} – ${f.liveScore.away}`
      : f.liveMinute
        ? `${f.liveMinute}'`
        : 'LIVE';
    const label = f.competitionShort || '';
    return { home, away, score, label, id: f.id };
  });

  // Duplicate so the loop is seamless
  const doubled = [...items, ...items];

  return (
    <div
      className="lg:hidden overflow-hidden relative"
      style={{
        background: 'rgba(255,51,102,0.06)',
        borderBottom: '1px solid rgba(255,51,102,0.15)',
        height: '32px',
      }}
    >
      {/* LIVE badge */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-2.5 gap-1.5"
        style={{
          background: 'linear-gradient(90deg, rgba(255,51,102,0.25) 0%, rgba(255,51,102,0.08) 100%)',
          borderRight: '1px solid rgba(255,51,102,0.2)',
        }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full"
            style={{ backgroundColor: '#FF3366', opacity: 0.75 }}
          />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: '#FF3366' }} />
        </span>
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#FF3366' }}>
          Live
        </span>
      </div>

      {/* Scrolling content */}
      <div className="absolute inset-0 flex items-center" style={{ paddingLeft: '60px' }}>
        <div
          className="flex items-center gap-0 whitespace-nowrap"
          style={{ animation: `ticker-scroll ${TICKER_SPEED} linear infinite` }}
        >
          {doubled.map((item, i) => (
            <div key={`${item.id}-${i}`} className="flex items-center">
              <span className="flex items-center gap-2 px-4">
                {item.label && (
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: '#3A4560' }}>
                    {item.label}
                  </span>
                )}
                <span className="text-[11px] font-bold" style={{ color: '#F0F6FF' }}>
                  {item.home}
                </span>
                <span
                  className="font-mono text-[11px] font-black px-2 py-0.5 rounded"
                  style={{
                    background: 'rgba(108,99,255,0.15)',
                    color: '#9B8FFF',
                  }}
                >
                  {item.score}
                </span>
                <span className="text-[11px] font-bold" style={{ color: '#F0F6FF' }}>
                  {item.away}
                </span>
              </span>
              <span style={{ color: '#3A4560', fontSize: '10px' }}>·</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
