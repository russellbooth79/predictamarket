/**
 * TopBar.jsx
 *
 * Fixed header bar with logo, sport navigation (desktop), balance display,
 * and user avatar dropdown.
 *
 * Balance uses CSS transition on a key trick: when the displayed value
 * changes, the number element gets a brief scale pulse via transition.
 * The actual number formatting is immediate (no counting animation) --
 * the visual feedback is the scale bump, which is cheaper and clearer.
 */

import { useState, useRef, useEffect } from 'react';
import { Zap, Bell, ChevronDown, User, History, ShieldCheck, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext.jsx';

const SPORTS = [
  { id: 'football', label: 'Football' },
  { id: 'horseracing', label: 'Horse Racing' },
  { id: 'tennis', label: 'Tennis' },
];

const DROPDOWN_ITEMS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'mybets', label: 'My Bets', icon: History },
  { id: 'responsible', label: 'Responsible Gambling', icon: ShieldCheck },
  { id: 'signout', label: 'Sign Out', icon: LogOut },
];

export default function TopBar({ activeSport, onSportChange, onDropdownAction }) {
  const { user } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [balancePulse, setBalancePulse] = useState(false);
  const prevBalanceRef = useRef(user.balance);
  const dropdownRef = useRef(null);

  // Pulse animation when balance changes
  useEffect(() => {
    if (prevBalanceRef.current !== user.balance) {
      setBalancePulse(true);
      const timer = setTimeout(() => setBalancePulse(false), 400);
      prevBalanceRef.current = user.balance;
      return () => clearTimeout(timer);
    }
  }, [user.balance]);

  // Close dropdown on outside click
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
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-slate-900/95 backdrop-blur border-b border-slate-800 flex items-center px-4 lg:px-6">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <Zap className="w-5 h-5 text-indigo-400" />
        <span className="text-lg font-bold text-indigo-400 tracking-tight">
          PredictaMarket
        </span>
      </div>

      {/* Desktop sport tabs -- hidden on mobile where SportNav handles it */}
      <nav className="hidden lg:flex items-center gap-1 ml-8">
        {SPORTS.map((sport) => (
          <button
            key={sport.id}
            onClick={() => onSportChange(sport.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeSport === sport.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {sport.label}
          </button>
        ))}
      </nav>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-3">
        {/* Balance -- .toFixed(2) ensures two decimal places */}
        <div
          className={`font-mono text-sm font-medium text-emerald-400 transition-transform duration-300 ${
            balancePulse ? 'scale-110' : 'scale-100'
          }`}
        >
          £{user.balance.toFixed(2)}
        </div>

        {/* Notifications -- fixed: w-4.5/h-4.5 are not valid Tailwind classes, using w-5 h-5 */}
        <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors">
          <Bell className="w-5 h-5" />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              {user.initials}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-700">
                <p className="text-sm font-medium text-slate-200">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              {DROPDOWN_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleDropdownAction(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Icon className="w-4 h-4 text-slate-400" />
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
