import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, LayoutDashboard, Car, BatteryCharging, Calendar, Clock, QrCode, Sparkles } from 'lucide-react';
import { checkBackendHealth } from '../services/api';

export default function Navbar({ onOpenQrModal }) {
  const location = useLocation();
  const [isBackendOnline, setIsBackendOnline] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      const online = await checkBackendHealth();
      if (isMounted) setIsBackendOnline(online);
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/vehicles', label: 'EVs', icon: Car },
    { to: '/stations', label: 'Charging Stations', icon: BatteryCharging },
    { to: '/reservations', label: 'Reservations', icon: Calendar },
    { to: '/sessions', label: 'Sessions', icon: Clock },
    { to: '/smart-charging', label: 'Smart Charging', icon: Sparkles, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
              <Zap className="h-6 w-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white font-display">
                  Volt<span className="text-emerald-400">Loop</span>
                </span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 tracking-wider">
                  CAMPUS EV
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">Smart Fleet & Energy Management</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.to);

              if (link.highlight) {
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition shadow-sm ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-emerald-500/25'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Status Indicator & Quick Scan Action */}
        <div className="flex items-center gap-3">
          {/* Backend Connectivity Status */}
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="hidden sm:inline font-mono text-[11px] text-slate-300">
              {isBackendOnline ? 'Java Backend :8080' : 'Backend Offline'}
            </span>
          </div>

          {/* Quick QR Scan Action */}
          {onOpenQrModal && (
            <button
              onClick={onOpenQrModal}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition"
              title="Quick QR Identification"
            >
              <QrCode className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline">Scan EV</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile Horizontal Navigation */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 text-xs scrollbar-none">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md whitespace-nowrap font-medium transition ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
