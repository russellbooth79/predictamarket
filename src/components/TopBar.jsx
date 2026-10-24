/**
 * TopBar.jsx
 *
 * Fixed header bar with logo, sport navigation (desktop), balance display,
 * and user avatar dropdown.
 *
 * bet365 colour scheme: yellow brand accent (#ffb800), dark navy backgrounds.
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
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur flex items-center px-4 lg:px-6"
      style={{ backgroundColor: 'rgba(26,35,50,0.95)', borderBottom: '1px solid #2d3f52' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <Zap className="w-5 h-5" style={{ color: '#ffb800' }} />
        <span className="text-lg font-bold tracking-tight" style={{ color: '#ffb800' }}>
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
                ? 'text-gray-900'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
            style={activeSport === sport.id ? { backgroundColor: '#ffb800' } : undefined}
          >
            {sport.label}
          </button>
        ))}
      </nav>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-3">
        {/* Balance */}
        <div
          className={`font-mono text-sm font-medium transition-transform duration-300 ${
            balancePulse ? 'scale-110' : 'scale-100'
          }`}
          style={{ color: '#00b67a' }}
        >
          £{user.balance.toFixed(2)}
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-200 transition-colors">
          <Bell className="w-5 h-5" />
          {/* Unread dot */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: '#ffb800' }}
          />
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-900"
              style={{ backgroundColor: '#ffb800' }}
            >
              {user.initials}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform hidden sm:block ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl py-1 animate-fade-in"
              style={{ backgroundColor: '#243040', border: '1px solid #2d3f52' }}
            >
              <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #2d3f52' }}>
                <p className="text-sm font-medium text-gray-200">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              {DROPDOWN_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleDropdownAction(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-colors"
                    style={{ ':hover': { backgroundColor: '#2d3f52' } }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3f52'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Icon className="w-4 h-4 text-gray-400" />
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
