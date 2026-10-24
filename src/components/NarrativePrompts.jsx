/**
 * NarrativePrompts.jsx
 *
 * DraftKings-style narrative prompts — 3-5 curated story-driven bet suggestions
 * shown above the full market list on the match detail page.
 * Much more engaging for 20-30s than a raw market menu.
 *
 * PredictaMarket v3 palette: electric indigo accent, deep navy surfaces.
 */

import { useBetSlip } from '../context/BetSlipContext.jsx';

const CONTEXT_LABELS = {
  live: ['In-play pick', 'Right now', 'Live opportunity', 'Game changer'],
  prematch: ['Popular pick', 'Trending', 'Sharp money on', 'Hot market'],
};

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export default function NarrativePrompts({ fixture, detail }) {
  const { addSelection, selections } = useBetSlip();

  if (!fixture) return null;

  const isLive = fixture.isLive;
  const labels = isLive ? CONTEXT_LABELS.live : CONTEXT_LABELS.prematch;
  const hash = hashStr(fixture.id);

  // Build prompts from available markets + outcomes
  const prompts = [];

  // Always add the main match winner prompts
  const homeOutcome = fixture.outcomes?.find(o => o.id === 'home');
  const awayOutcome = fixture.outcomes?.find(o => o.id === 'away');

  if (homeOutcome) {
    prompts.push({
      id: `home-${fixture.id}`,
      text: `${fixture.homeTeam} to win`,
      probability: homeOutcome.probability,
      outcome: homeOutcome,
      fixtureId: fixture.id,
      fixtureName: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
      contextLabel: labels[hash % labels.length],
      icon: '\u26BD',
    });
  }

  // Markets from detail if available
  if (detail?.markets) {
    const btts = detail.markets.find(m => m.id === 'btts');
    if (btts) {
      const yes = btts.outcomes.find(o => o.id === 'yes');
      if (yes) prompts.push({
        id: `btts-${fixture.id}`,
        text: 'Both teams to score',
        probability: yes.probability,
        outcome: { ...yes, eventId: fixture.id, eventName: `${fixture.homeTeam} vs ${fixture.awayTeam}`, marketId: 'btts' },
        fixtureId: fixture.id,
        fixtureName: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
        contextLabel: labels[(hash + 1) % labels.length],
        icon: '\uD83C\uDFAF',
      });
    }

    const ou = detail.markets.find(m => m.id === 'over-under');
    if (ou) {
      const over = ou.outcomes.find(o => o.id === 'over25');
      if (over) prompts.push({
        id: `ou-${fixture.id}`,
        text: 'Over 2.5 goals',
        probability: over.probability,
        outcome: { ...over, eventId: fixture.id, eventName: `${fixture.homeTeam} vs ${fixture.awayTeam}`, marketId: 'over-under' },
        fixtureId: fixture.id,
        fixtureName: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
        contextLabel: labels[(hash + 2) % labels.length],
        icon: '\uD83D\uDCC8',
      });
    }
  }

  if (awayOutcome && prompts.length < 5) {
    prompts.push({
      id: `away-${fixture.id}`,
      text: `${fixture.awayTeam} to win`,
      probability: awayOutcome.probability,
      outcome: awayOutcome,
      fixtureId: fixture.id,
      fixtureName: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
      contextLabel: labels[(hash + 3) % labels.length],
      icon: '\u26A1',
    });
  }

  const display = prompts.slice(0, 4);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8A97B4' }}>
          Popular Bets
        </span>
        {isLive && (
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#FF6B6B' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: '#FF6B6B' }} />
            Live
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {display.map((prompt) => {
          const isSelected = selections.some(
            s => s.eventId === prompt.fixtureId && s.outcomeId === prompt.outcome.id
          );

          return (
            <button
              key={prompt.id}
              onClick={() => {
                const selectionData = {
                  eventId: prompt.fixtureId,
                  eventName: prompt.fixtureName,
                  outcomeId: prompt.outcome.id,
                  outcomeName: prompt.text,
                  probability: prompt.probability,
                  sport: fixture.sport,
                };
                addSelection(selectionData);
              }}
              className="text-left p-3 rounded-xl transition-all duration-150 cursor-pointer"
              style={{
                backgroundColor: isSelected ? 'rgba(91,110,245,0.1)' : '#161E2E',
                border: isSelected ? '1px solid #5B6EF5' : '1px solid #1A2238',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base">{prompt.icon}</span>
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#1A2238', color: '#8A97B4' }}
                >
                  {prompt.contextLabel}
                </span>
              </div>
              <p className="text-xs font-medium mb-2 leading-tight" style={{ color: '#f0f4ff' }}>
                {prompt.text}
              </p>
              <div
                className="font-mono text-lg font-bold"
                style={{ color: isSelected ? '#5B6EF5' : '#f0f4ff' }}
              >
                {prompt.probability}%
              </div>
              <div className="mt-1.5 w-full rounded-full overflow-hidden" style={{ height: '3px', backgroundColor: '#1A2238' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${prompt.probability}%`,
                    backgroundColor: prompt.probability >= 60 ? '#A8FF3E' : prompt.probability >= 40 ? '#5B6EF5' : '#8A97B4',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
