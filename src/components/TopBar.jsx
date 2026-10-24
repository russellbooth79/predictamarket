/**
 * TopBar.jsx
 *
 * Fixed header with redesigned logo, expanded sport tabs with emoji icons,
 * odds format toggle, balance display, notification bell, and user dropdown.
 *
 * PredictaMarket v3 palette: electric indigo primary, deep navy surfaces.
 */

import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, User, History, ShieldCheck, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext.jsx';
import OddsFormatToggle from './OddsFormatToggle.jsx';

const SPORTS = [
  { id: 'football', label: 'Football', icon: '\u26BD' },
  { id: 'horseracing', label: 'Racing', icon: '\uD83C\uDFC7' },
  { id: 'tennis', label: 'Tennis', icon: '\uD83C\uDFBE' },
  { id: 'boxing', label: 'Boxing', icon: '\uD83E\uDD4A' },
  { id: 'nfl', label: 'NFL', icon: '\uD83C\uDFC8' },
  { id: 'nba', label: 'NBA', icon: '\uD83C\uDFC0' },
];

const DROPDOWN_ITEMS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'mybets', label: 'My Bets', icon: History },
  { id: 'responsible', label: 'Responsible Gambling', icon: ShieldCheck },
  { id: 'signout', label: 'Sign Out', icon: LogOut },
];

const C = {
  bg: '#080C14',
  border: '#1A2238',
  primary: '#5B6EF5',
  text: '#f0f4ff',
  textSecondary: '#8A97B4',
  elevated: '#161E2E',
};

export default function TopBar({ activeSport, onSportChange, onDropdownAction }) {
  const { user } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [balancePulse, setBalancePulse] = useState(false);
  const prevBalanceRef = useRef(user.balance);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (prevBalanceRef.current !== user.balance) {
      setBalancePulse(true);
      const timer = setTimeout(() => setBalancePulse(false), 400);
      prevBalanceRef.current = user.balance;
      return () => clearTimeout(timer);
    }
  }, [user.balance]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  function handleDropdownAction(actionId) {
    setDropdownOpen(false);
    onDropdownAction?.(actionId);
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 lg:px-6"
      style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}
    >
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-lg font-bold tracking-tight" style={{ color: C.primary }}>
          Predict<span style={{ color: C.primary }}>a</span>
        </span>
        <span className="text-lg font-bold tracking-tight" style={{ color: C.text }}>
          Market
        </span>
      </div>

      <nav className="hidden lg:flex items-center gap-0.5 ml-8">
        {SPORTS.map((sport) => {
          const isActive = activeSport === sport.id;
          return (
            <button
              key={sport.id}
              onClick={() => onSportChange(sport.id)}
              className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              style={isActive ? { color: C.text } : { color: C.textSecondary }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = C.text;
                  e.currentTarget.style.backgroundColor = C.elevated;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = C.textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span className="text-sm">{sport.icon}</span>
              <span>{sport.label}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: C.primary }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <OddsFormatToggle />
        <div
          className={`font-mono text-sm font-bold transition-transform duration-300 ${balancePulse ? 'scale-110' : 'scale-100'}`}
          style={{ color: '#00b67a' }}
        >
          {'\u00A3'}{user.balance.toFixed(2)}
        </div>
        <button
          className="relative p-2 transition-colors"
          style={{ color: C.textSecondary }}
          onMouseEnter={(e) => e.currentTarget.style.color = C.text}
          onMouseLeave={(e) => e.currentTarget.style.color = C.textSecondary}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: C.primary }} />
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.elevated}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: C.primary }}
            >
              {user.initials}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`}
              style={{ color: C.textSecondary }}
            />
          </button>
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl py-1 animate-fade-in"
              style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}
            >
              <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
                <p className="text-sm font-medium" style={{ color: C.text }}>{user.name}</p>
                <p className="text-xs" style={{ color: C.textSecondary }}>{user.email}</p>
              </div>
              {DROPDOWN_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleDropdownAction(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: C.textSecondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = C.border;
                      e.currentTarget.style.color = C.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = C.textSecondary;
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
