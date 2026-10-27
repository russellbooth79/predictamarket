/**
 * DiscoverCards.jsx
 *
 * One full-height card per Discover feed item. Every card shares the same
 * shell — type chip top-left, content in the middle, actions at the bottom —
 * so the feed reads as one system while each type has its own look.
 * Lime (--action) marks anything that adds to the slip or opts in.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Check, Zap, Clock } from 'lucide-react';
import { useBetSlip } from '../../context/BetSlipContext.jsx';
import { useOddsFormat } from '../../context/OddsFormatContext.jsx';
import { useUser } from '../../context/UserContext.jsx';
import { formatOdds } from '../../utils/oddsFormatter.js';
import { simpleHash, payoutFor, formatKickoff, formatDateLabel, outcomeShortName } from '../../utils/fixtureMeta.js';
import { getFriendPicks, friendPicksHeadline, toSelection } from '../../data/friends.js';
import { CrowdBar, FormStrip } from '../EventCard.jsx';
import FriendAvatars from '../FriendAvatars.jsx';

const TEAM_ACCENTS = ['#6C63FF', '#FF3366', '#00F5A0', '#00D4FF', '#FF9500', '#9B5DE5', '#FF6B35'];
const teamAccent = (name) => TEAM_ACCENTS[simpleHash(name) % TEAM_ACCENTS.length];

// ── Shared pieces ────────────────────────────────────────────────────────────

// onImage: the card sits on a bright image/gradient (casino art), so the chip
// and meta switch to white-on-dark for contrast
function Shell({ chip, chipColour = '#9B8FFF', meta, background, children, footer, onImage = false }) {
  return (
    <div
      className="relative h-full w-full rounded-3xl overflow-hidden flex flex-col"
      style={{ background, border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <span
          className="text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={onImage
            ? { background: 'rgba(0,0,0,0.35)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)' }
            : { background: `${chipColour}1F`, color: chipColour, border: `1px solid ${chipColour}40` }}
        >
          {chip}
        </span>
        {meta && <span className="text-xs font-medium" style={{ color: onImage ? 'rgba(255,255,255,0.9)' : '#9AA6C0' }}>{meta}</span>}
      </div>
      <div className="flex-1 min-h-0 flex flex-col justify-center px-5 py-4 overflow-hidden">{children}</div>
      {footer && <div className="px-5 pb-5">{footer}</div>}
    </div>
  );
}

function PrimaryButton({ children, onClick, active = false, disabled = false }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-black transition-colors"
      style={active
        ? { background: 'rgba(198,255,61,0.12)', color: 'var(--action)', border: '1px solid var(--action)' }
        : { background: 'var(--action)', color: 'var(--action-ink)' }
      }
    >
      {children}
    </motion.button>
  );
}

function SecondaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-11 mt-2 rounded-2xl flex items-center justify-center gap-1 text-sm font-semibold"
      style={{ color: '#C9D3E8', background: 'rgba(255,255,255,0.05)' }}
    >
      {children}
    </button>
  );
}

function Crest({ name }) {
  const accent = teamAccent(name);
  return (
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
      style={{ background: `${accent}22`, border: `2px solid ${accent}55`, color: accent }}
    >
      {name.split(' ').map(w => w[0]).slice(0, 2).join('')}
    </div>
  );
}

// ── Match ────────────────────────────────────────────────────────────────────

function MatchCard({ fixture, onViewMatch }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();
  const friendPicks = getFriendPicks(fixture);
  const home = teamAccent(fixture.homeTeam);
  const away = teamAccent(fixture.awayTeam);

  return (
    <Shell
      chip={fixture.isLive ? '● Live' : '⚽ Big match'}
      chipColour={fixture.isLive ? '#FF3366' : '#9B8FFF'}
      meta={fixture.isLive ? `${fixture.liveMinute}'` : `${formatDateLabel(fixture.kickoff)} · ${formatKickoff(fixture.kickoff, false)}`}
      background={`linear-gradient(160deg, ${home}30 0%, transparent 40%), linear-gradient(200deg, ${away}26 0%, transparent 45%), rgb(10,14,26)`}
      footer={
        <>
          <div className="grid grid-cols-3 gap-2">
            {fixture.outcomes.map(o => {
              const selected = isSelected(fixture.id, o.id);
              return (
                <motion.button
                  key={o.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addSelection(toSelection(fixture, o))}
                  aria-pressed={selected}
                  className="flex flex-col items-center gap-0.5 py-3 rounded-2xl"
                  style={selected
                    ? { background: 'rgba(198,255,61,0.12)', border: '1px solid var(--action)' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: selected ? 'var(--action)' : '#9AA6C0' }}>
                    {o.label === 'Draw' ? 'Draw' : outcomeShortName(o.label)}
                  </span>
                  <span className="font-mono text-2xl font-black" style={{ color: selected ? 'var(--action)' : '#F0F6FF' }}>
                    {formatOdds(o.probability, format)}
                  </span>
                  <span className="text-[10px]" style={{ color: '#6B7894' }}>£10 → £{payoutFor(o.probability).toFixed(2)}</span>
                </motion.button>
              );
            })}
          </div>
          <SecondaryButton onClick={() => onViewMatch(fixture)}>Match Centre <ChevronRight className="w-4 h-4" /></SecondaryButton>
        </>
      }
    >
      <p className="text-xs font-bold uppercase tracking-widest text-center mb-4" style={{ color: '#9AA6C0' }}>{fixture.competition}</p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
          <Crest name={fixture.homeTeam} />
          <span className="text-lg font-black font-display text-center leading-tight" style={{ color: '#F0F6FF' }}>{fixture.homeTeam}</span>
        </div>
        {fixture.isLive && fixture.liveScore ? (
          <span className="font-mono text-5xl font-black shrink-0" style={{ color: '#F0F6FF' }}>
            {fixture.liveScore.home}<span style={{ color: '#6B7894' }}>–</span>{fixture.liveScore.away}
          </span>
        ) : (
          <span className="text-sm font-black shrink-0" style={{ color: '#6B7894' }}>VS</span>
        )}
        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
          <Crest name={fixture.awayTeam} />
          <span className="text-lg font-black font-display text-center leading-tight" style={{ color: '#F0F6FF' }}>{fixture.awayTeam}</span>
        </div>
      </div>
      <div className="mt-6 -mx-4">
        <CrowdBar fixture={fixture} />
      </div>
      {friendPicks.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <FriendAvatars friends={friendPicks.map(p => p.friend)} size={20} />
          <span className="text-xs font-semibold" style={{ color: '#C9D3E8' }}>{friendPicksHeadline(friendPicks)}</span>
        </div>
      )}
    </Shell>
  );
}

// ── Insight ──────────────────────────────────────────────────────────────────

function InsightCard({ fixture, insight, onViewMatch }) {
  const { addSelection, isSelected } = useBetSlip();
  const { format } = useOddsFormat();
  const o = insight.outcome;
  const selected = o && isSelected(fixture.id, o.id);

  return (
    <Shell
      chip="📊 Insight"
      chipColour="#00D4FF"
      meta={`${fixture.homeTeam.split(' ')[0]} v ${fixture.awayTeam.split(' ')[0]}`}
      background="radial-gradient(ellipse 80% 50% at 50% 30%, rgba(0,212,255,0.12) 0%, transparent 70%), rgb(10,14,26)"
      footer={
        <>
          {o && (
            <PrimaryButton active={selected} onClick={() => addSelection(toSelection(fixture, o))}>
              {selected
                ? <><Check className="w-4 h-4" /> In your slip</>
                : <>Back {o.label === 'Draw' ? 'the draw' : outcomeShortName(o.label)} · {formatOdds(o.probability, format)}</>}
            </PrimaryButton>
          )}
          <SecondaryButton onClick={() => onViewMatch(fixture)}>Match Centre <ChevronRight className="w-4 h-4" /></SecondaryButton>
        </>
      }
    >
      <h2 className="text-[28px] leading-tight font-black font-display mb-6" style={{ color: '#F0F6FF' }}>{insight.headline}</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl p-4" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)' }}>
          <p className="font-mono text-[32px] leading-none font-black whitespace-nowrap" style={{ color: '#00D4FF' }}>{insight.stat}</p>
          <p className="text-xs mt-2" style={{ color: '#9AA6C0' }}>{insight.statLabel}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="font-mono text-[32px] leading-none font-black whitespace-nowrap" style={{ color: '#F0F6FF' }}>{insight.compare}</p>
          <p className="text-xs mt-2" style={{ color: '#9AA6C0' }}>{insight.compareLabel}</p>
        </div>
      </div>
      {insight.form && <div className="mb-4"><FormStrip form={insight.form} /></div>}
      <p className="text-sm leading-relaxed" style={{ color: '#C9D3E8' }}>{insight.body}</p>
    </Shell>
  );
}

// ── Boost ────────────────────────────────────────────────────────────────────

function BoostCard({ boost }) {
  const { addSelection, isSelected } = useBetSlip();
  const selected = isSelected(boost.id, 'boost');

  function handleAdd() {
    addSelection({
      eventId: boost.id,
      eventName: boost.match,
      outcomeId: 'boost',
      outcomeName: `⚡ ${boost.title}`,
      probability: 100 / boost.now,
      decimalOdds: boost.now,
      sport: 'boost',
    });
  }

  return (
    <Shell
      chip="⚡ Price boost"
      chipColour="#FFB547"
      meta={boost.match}
      background="radial-gradient(ellipse 90% 60% at 50% 20%, rgba(255,181,71,0.18) 0%, transparent 65%), rgb(10,14,26)"
      footer={
        <>
          <PrimaryButton active={selected} onClick={handleAdd}>
            {selected ? <><Check className="w-4 h-4" /> Boost in your slip</> : <><Zap className="w-4 h-4" /> Add boost to slip</>}
          </PrimaryButton>
          <p className="text-[11px] text-center mt-3" style={{ color: '#6B7894' }}>18+ · {boost.note} · T&Cs apply</p>
        </>
      }
    >
      <h2 className="text-[30px] leading-tight font-black font-display mb-8" style={{ color: '#F0F6FF' }}>{boost.title}</h2>
      <div className="flex items-end gap-4 mb-2">
        <div>
          <p className="text-xs mb-1" style={{ color: '#9AA6C0' }}>Was</p>
          <p className="font-mono text-2xl font-bold line-through" style={{ color: '#6B7894' }}>£{(10 * boost.was).toFixed(2)}</p>
        </div>
        <ChevronRight className="w-6 h-6 mb-1.5" style={{ color: '#FFB547' }} />
        <div>
          <p className="text-xs mb-1" style={{ color: '#FFB547' }}>Now</p>
          <p className="font-mono text-5xl font-black" style={{ color: 'var(--action)' }}>£{(10 * boost.now).toFixed(2)}</p>
        </div>
      </div>
      <p className="text-sm" style={{ color: '#9AA6C0' }}>returned from a £10 bet · {Math.round(100 / boost.now)}% chance</p>
    </Shell>
  );
}

// ── Casino release ───────────────────────────────────────────────────────────

function CasinoCard({ game, onOpenCasino }) {
  return (
    <Shell
      chip="🎰 New release"
      onImage
      meta={game.provider}
      background={game.gradient}
      footer={<PrimaryButton onClick={onOpenCasino}>Play {game.name}</PrimaryButton>}
    >
      <motion.div
        className="text-[96px] leading-none text-center mb-6 select-none"
        animate={{ y: [0, -8, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        {game.emoji}
      </motion.div>
      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{game.category}</p>
      <h2 className="text-4xl font-black font-display mb-3" style={{ color: '#FFFFFF' }}>{game.name}</h2>
      <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.8)' }}>{game.blurb}</p>
      <div className="grid grid-cols-3 gap-2">
        {[['RTP', `${game.rtp}%`], ['Volatility', game.volatility], ['Max win', game.maxWin]].map(([k, v]) => (
          <div key={k} className="rounded-xl px-3 py-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>{k}</p>
            <p className="text-sm font-black" style={{ color: '#FFFFFF' }}>{v}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ── Offer ────────────────────────────────────────────────────────────────────

function OfferCard({ offer, optedIn, onToggleOptIn }) {
  return (
    <Shell
      chip="🎁 Offer"
      chipColour="#00F5A0"
      meta={offer.product === 'casino' ? 'Casino' : 'Sports'}
      background="radial-gradient(ellipse 80% 50% at 50% 25%, rgba(0,245,160,0.12) 0%, transparent 65%), rgb(10,14,26)"
      footer={
        <>
          <PrimaryButton active={optedIn} onClick={onToggleOptIn}>
            {optedIn ? <><Check className="w-4 h-4" /> You're in</> : 'Opt in'}
          </PrimaryButton>
          <p className="text-[11px] text-center mt-3 leading-relaxed" style={{ color: '#6B7894' }}>{offer.terms}</p>
        </>
      }
    >
      <div className="text-6xl mb-6" aria-hidden="true">{offer.emoji}</div>
      <h2 className="text-[30px] leading-tight font-black font-display mb-3" style={{ color: '#F0F6FF' }}>{offer.title}</h2>
      <p className="text-base leading-relaxed" style={{ color: '#C9D3E8' }}>{offer.body}</p>
    </Shell>
  );
}

// ── New feature ──────────────────────────────────────────────────────────────

function FeatureCard({ feature, onNavigate }) {
  return (
    <Shell
      chip="✨ New on PUNT"
      chipColour="#B06FFF"
      background="radial-gradient(ellipse 90% 60% at 50% 30%, rgba(176,111,255,0.2) 0%, transparent 65%), rgb(10,14,26)"
      footer={<SecondaryButton onClick={() => onNavigate(feature.target)}>{feature.cta} <ChevronRight className="w-4 h-4" /></SecondaryButton>}
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6"
        style={{ background: 'rgba(176,111,255,0.15)', border: '1px solid rgba(176,111,255,0.35)' }}
        aria-hidden="true"
      >
        {feature.emoji}
      </div>
      <h2 className="text-[30px] leading-tight font-black font-display mb-3" style={{ color: '#F0F6FF' }}>{feature.title}</h2>
      <p className="text-base leading-relaxed" style={{ color: '#C9D3E8' }}>{feature.body}</p>
    </Shell>
  );
}

// ── Safer gambling check-in ──────────────────────────────────────────────────

function SaferCard({ onNavigate }) {
  const { user, bets } = useUser();
  // Fixed when the card mounts — the window doesn't need to tick while viewing
  const [weekAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
  const staked = bets.filter(b => new Date(b.placedAt).getTime() >= weekAgo).reduce((sum, b) => sum + b.stake, 0);
  const limit = user.depositLimit?.weekly ?? 0;
  const pct = limit ? Math.min(100, (staked / limit) * 100) : 0;

  return (
    <Shell
      chip="🧭 Your week"
      chipColour="#9AA6C0"
      background="rgb(10,14,26)"
      footer={<SecondaryButton onClick={() => onNavigate('account')}>Manage limits and breaks <ChevronRight className="w-4 h-4" /></SecondaryButton>}
    >
      <h2 className="text-[28px] leading-tight font-black font-display mb-2" style={{ color: '#F0F6FF' }}>You're in control</h2>
      <p className="text-sm mb-8" style={{ color: '#9AA6C0' }}>A quick look at your week. Same time every week.</p>
      <div className="flex items-end justify-between mb-2">
        <p className="font-mono text-4xl font-black" style={{ color: '#F0F6FF' }}>£{staked.toFixed(2)}</p>
        <p className="text-sm" style={{ color: '#9AA6C0' }}>of £{limit} weekly limit</p>
      </div>
      <div className="h-2 rounded-full overflow-hidden mb-8" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: pct > 80 ? '#FFB547' : '#00F5A0' }}
        />
      </div>
      <div className="flex items-start gap-3 text-sm" style={{ color: '#C9D3E8' }}>
        <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#9AA6C0' }} />
        <p>Need a pause? You can take a break from 24 hours to 6 weeks, any time. BeGambleAware.org · 18+</p>
      </div>
    </Shell>
  );
}

// ── Router ───────────────────────────────────────────────────────────────────

export default function DiscoverCard({ item, onViewMatch, onNavigate, onOpenCasino, optedIn, onToggleOptIn }) {
  switch (item.type) {
    case 'match':   return <MatchCard fixture={item.data.fixture} onViewMatch={onViewMatch} />;
    case 'insight': return <InsightCard fixture={item.data.fixture} insight={item.data.insight} onViewMatch={onViewMatch} />;
    case 'boost':   return <BoostCard boost={item.data} />;
    case 'casino':  return <CasinoCard game={item.data} onOpenCasino={onOpenCasino} />;
    case 'offer':   return <OfferCard offer={item.data} optedIn={optedIn} onToggleOptIn={onToggleOptIn} />;
    case 'feature': return <FeatureCard feature={item.data} onNavigate={onNavigate} />;
    case 'safer':   return <SaferCard onNavigate={onNavigate} />;
    default:        return null;
  }
}
