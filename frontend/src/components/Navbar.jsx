import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, QrCode, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

const titleMap = {
  '/': 'Fleet Overview & Command Dashboard',
  '/dashboard': 'Fleet Overview & Command Dashboard',
  '/evs': 'Campus EV Fleet Asset Directory',
  '/vehicles': 'Campus EV Fleet Asset Directory',
  '/stations': 'Campus Charging Bays & Station Control',
  '/reservations': 'Advance Slot Bookings & Conflict Monitor',
  '/sessions': 'Live Charging Sessions & Billing Ledger',
  '/smart-charging': 'Rule-Based Smart Charging Allocation',
  '/analytics': 'Fleet Energy & Utilization Analytics',
};

export default function Navbar({ onOpenSidebar, onOpenQRScanner, onRefresh, isRefreshing }) {
  const location = useLocation();
  const currentTitle =
    titleMap[location.pathname] ||
    (location.pathname.startsWith('/evs/') || location.pathname.startsWith('/vehicles/')
      ? 'Electric Vehicle Telemetry Details'
      : 'VoltLoop Management Portal');

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-white sm:text-lg">
            {currentTitle}
          </h1>
          <p className="hidden text-xs text-slate-400 sm:block">
            Smart Campus EV Fleet & Energy Management System
          </p>
        </div>
      </div>

      {/* Right side: Quick actions & Live Telemetry pill */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh current page data"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        {/* Global QR Scan Launcher */}
        <button
          onClick={onOpenQRScanner}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition shadow-sm"
        >
          <QrCode className="h-3.5 w-3.5" />
          <span>Quick Scan</span>
        </button>

        {/* System Online badge */}
        <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>ACID Transactions Active</span>
        </div>
      </div>
    </header>
  );
}
