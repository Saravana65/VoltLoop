import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Zap,
  CalendarClock,
  BatteryCharging,
  Cpu,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';
import { getStations } from '../services/api';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'EVs', path: '/evs', icon: Car },
  { name: 'Charging Stations', path: '/stations', icon: Zap },
  { name: 'Reservations', path: '/reservations', icon: CalendarClock },
  { name: 'Charging Sessions', path: '/sessions', icon: BatteryCharging },
  { name: 'Smart Charging', path: '/smart-charging', icon: Cpu, badge: 'Rule-Based' },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
];

export default function Sidebar({ isOpen, onClose }) {
  const [backendOnline, setBackendOnline] = useState(null);

  const checkHealth = async () => {
    try {
      await getStations();
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-md transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/20">
              <Zap className="h-5 w-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white">
                Volt<span className="text-emerald-400">Loop</span>
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Smart Campus EV
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Platform Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom System Status */}
        <div className="border-t border-slate-800 p-4">
          <div className="rounded-xl border border-slate-850 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">System Status</span>
              <button
                onClick={checkHealth}
                title="Refresh connectivity check"
                className="text-slate-500 hover:text-slate-300 transition"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {backendOnline === true && (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </>
                )}
                {backendOnline === false && (
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                )}
                {backendOnline === null && (
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                )}
              </span>
              <span className="text-xs font-mono font-medium text-slate-300">
                {backendOnline === true && 'Java Backend :8080 (OK)'}
                {backendOnline === false && 'Backend Offline'}
                {backendOnline === null && 'Connecting...'}
              </span>
            </div>
            <div className="mt-2 text-[10px] font-medium text-slate-400">
              MySQL 8.0 • JDBC Pool Connected
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
