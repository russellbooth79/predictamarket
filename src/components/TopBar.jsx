/**
 * TopBar.jsx — PredictaMarket v4
 * Glassmorphism header. Gradient logo, gradient active sport pill.
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, ChevronDown, User, History, ShieldCheck, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext.jsx';
import OddsFormatToggle from './OddsFormatToggle.jsx';
import { SPORTS } from '../data/sports.js';

const DROPDOWN_ITEMS = [
  { id: 'account',     label: 'Account',              icon: User },
  { id: 'mybets',      label: 'My Bets',               icon: History },
  { id: 'responsible', label: 'Responsible Gambling',  icon: ShieldCheck },
  { id: 'signout',     label: 'Sign Out',              icon: LogOut },
];

export default function TopBar({ activeSport, onSportChange, onDropdownAction, availableSports }) {
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
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [dropdownOpen]);

  function handleDropdownAction(actionId) {
    setDropdownOpen(false);
    onDropdownAction?.(actionId);
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 lg:px-6"
      style={{
        background: 'rgba(5,8,15,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center shrink-0">
        <span
          className="text-2xl font-black tracking-tight font-display"
          style={{
            background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          PUNT
        </span>
      </div>

      {/* Desktop sport nav */}
      <nav className="hidden lg:flex items-center gap-1 ml-8">
        {(availableSports ? availableSports.map(id => SPORTS.find(s => s.id === id)) : SPORTS).map((sport) => {
          const isActive = activeSport === sport.id;
          return (
            <button
              key={sport.id}
              onClick={() => onSportChange(sport.id)}
              className="relative px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
              style={{
                color: isActive ? '#B0A5FF' : '#7B8CAA',
                border: '1px solid transparent',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#F0F6FF';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#7B8CAA';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Active pill slides between tabs via shared layout animation */}
              {isActive && (
                <motion.span
                  layoutId="topbar-sport-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(108,99,255,0.2) 0%, rgba(176,111,255,0.15) 100%)',
                    border: '1px solid rgba(108,99,255,0.35)',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">{sport.icon}</span>
              <span className="relative">{sport.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {/* Odds format lives in Account on mobile to keep the bar clear */}
        <div className="hidden lg:block">
          <OddsFormatToggle />
        </div>

        {/* Balance */}
        <div
          className={`font-mono text-sm font-bold transition-transform duration-300 ${balancePulse ? 'scale-110' : 'scale-100'}`}
          style={{
            background: 'linear-gradient(135deg, #00F5A0 0%, #00D4FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          £{user.balance.toFixed(2)}
        </div>

        {/* Bell */}
        <button
          className="relative p-2 rounded-xl transition-all"
          style={{ color: '#7B8CAA' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F0F6FF'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#7B8CAA'; e.currentTarget.style.background = 'transparent'; }}
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: 'linear-gradient(135deg, #FF3366, #FF6B35)' }}
          />
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl transition-all"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
              style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #9B5DE5 100%)' }}
            >
              {user.initials}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`}
              style={{ color: '#7B8CAA' }}
            />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-2xl py-1 animate-fade-in"
              style={{
                background: 'rgba(15,20,35,0.95)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-sm font-semibold" style={{ color: '#F0F6FF' }}>{user.name}</p>
                <p className="text-xs" style={{ color: '#7B8CAA' }}>{user.email}</p>
              </div>
              {DROPDOWN_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleDropdownAction(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
                    style={{ color: '#7B8CAA' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(108,99,255,0.08)';
                      e.currentTarget.style.color = '#F0F6FF';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#7B8CAA';
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
