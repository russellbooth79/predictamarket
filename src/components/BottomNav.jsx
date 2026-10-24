/**
 * BottomNav.jsx
 *
 * Fixed mobile bottom navigation bar. Visible only below lg breakpoint.
 * Five tabs: Home, Live, Slip (with selection count badge), Markets, Account.
 *
 * Active tab highlighted with electric indigo. Inactive tabs in muted grey.
 * Parent layout must add pb-16 on mobile to prevent content overlap.
 *
 * PredictaMarket v3 ARIA palette.
 */

import { Home, Radio, LayoutList, User } from 'lucide-react';
import { useBetSlip } from '../context/BetSlipContext.jsx';

const C = {
  bg: '#080C14',
  border: '#1A2238',
  active: '#5B6EF5',
  inactive: '#4a5568',
  badge: '#FF6B6B',
};

const TABS = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'live', label: 'Live', Icon: Radio },
  // Slip tab handled separately — needs badge
  { id: 'markets', label: 'Markets', Icon: LayoutList },
  { id: 'account', label: 'Account', Icon: User },
];

export default function BottomNav({ activeTab = 'home', onTabChange }) {
  const { selections } = useBetSlip();
  const count = selections.length;

  function renderTab(id, label, Icon, badge = null) {
    const isActive = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => onTabChange?.(id)}
        className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative"
      >
        <div className="relative">
          <Icon
            className="w-5 h-5"
            style={{ color: isActive ? C.active : C.inactive }}
          />
          {badge !== null && badge > 0 && (
            <span
              className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
              style={{ backgroundColor: C.badge }}
            >
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>
        <span
          className="text-[10px] font-medium"
          style={{ color: isActive ? C.active : C.inactive }}
        >
          {label}
        </span>
      </button>
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden"
      style={{
        backgroundColor: C.bg,
        borderTop: `1px solid ${C.border}`,
        /* Respect safe area on devices with home indicator */
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {renderTab('home', 'Home', Home)}
      {renderTab('live', 'Live', Radio)}
      {/* Slip tab with badge */}
      {renderTab('slip', 'Slip', LayoutList, count)}
      {renderTab('markets', 'Markets', LayoutList)}
      {renderTab('account', 'Account', User)}
    </nav>
  );
}
