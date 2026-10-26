import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, QrCode, RefreshCw, Zap, PanelLeft, ArrowRightLeft, User, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const titleMap = {
  // Owner Routes
  '/owner/overview': { title: 'Owner Command Overview', subtitle: 'Live campus charging operations, telemetry, and revenue monitoring' },
  '/owner/stations': { title: 'Charging Station Bays & Control', subtitle: 'Real-time bay status, power rating, maintenance toggle, and bay QR codes' },
  '/owner/activity': { title: 'Customer Activity Audit Log', subtitle: 'Detailed check-in, start, end, duration, energy consumed, and payment status records' },
  '/owner/revenue': { title: 'Verified Revenue & Payments Ledger', subtitle: 'Audited financial accounting for confirmed successful charging transactions' },

  // Customer Routes
  '/customer/dashboard': { title: 'Customer Charging Hub', subtitle: 'Welcome to your smart EV charging portal. Scan, charge, pay, and track' },
  '/customer/scan': { title: 'Scan Station QR Code', subtitle: 'Scan the QR on any campus charging bay or enter station code to initiate charging' },
  '/customer/vehicles': { title: 'My Registered Electric Vehicles', subtitle: 'Manage your personal EV fleet, battery status, and digital QR passes' },
  '/customer/bookings': { title: 'Advance Charging Reservations', subtitle: 'Book charging slots in advance with automated conflict checking' },
  '/customer/sessions': { title: 'Personal Charging History', subtitle: 'Complete log of your charging sessions, timestamps, kWh, and payment receipts' },
  '/customer/payments': { title: 'Payments & Digital Receipts', subtitle: 'Settle pending charging invoices and view official GST receipts' },
  '/customer/profile': { title: 'Customer Profile & Security', subtitle: 'Manage personal credentials, contact info, and linked vehicles' },

  // Legacy Phases 1-8 Routes (accessible to Owner / Admins)
  '/': { title: 'VoltLoop Enterprise Console', subtitle: 'Smart Campus EV Fleet & Energy Management System' },
  '/dashboard': { title: 'Fleet Command Dashboard', subtitle: 'Campus-wide EV fleet telemetry, grid nodes, and real-time charging status' },
  '/evs': { title: 'Campus EV Fleet Directory', subtitle: 'Battery SoC, connector profiles, and vehicle ownership registry' },
  '/vehicles': { title: 'Campus EV Fleet Directory', subtitle: 'Battery SoC, connector profiles, and vehicle ownership registry' },
  '/stations': { title: 'Charging Bays & Grid Nodes', subtitle: 'Campus charging infrastructure, live bay availability, and power ratings' },
  '/reservations': { title: 'Advance Slot Reservations', subtitle: 'Schedule bookings, conflict detection, and queue management' },
  '/sessions': { title: 'Live Charging Sessions & Billing', subtitle: 'Active charging sessions, energy metering, and cost calculation ledger' },
  '/smart-charging': { title: 'Smart Charging Allocation Engine', subtitle: 'Rule-based multi-factor station assignment and urgency optimization' },
  '/station-checkin': { title: 'Charging Station Terminal Check-In', subtitle: 'Phase 7 metro turnstile authorization, QR validation, and bay access' },
  '/analytics': { title: 'Fleet & Grid Energy Analytics', subtitle: 'Consumption trends, utilization rates, and financial accounting reports' },
};

export default function Navbar({
  onOpenMobileSidebar,
  onToggleDesktopCollapse,
  isCollapsed,
  onRefresh,
  isRefreshing,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, portal, switchPortal } = useAuth();

  const getPageMeta = () => {
    if (titleMap[location.pathname]) {
      return titleMap[location.pathname];
    }
    if (location.pathname.startsWith('/evs/') || location.pathname.startsWith('/vehicles/')) {
      return {
        title: 'EV Telemetry & Digital Pass',
        subtitle: 'Real-time battery state-of-charge, specifications, and QR boarding pass',
      };
    }
    return {
      title: 'VoltLoop Console',
      subtitle: 'Smart Campus EV Fleet & Energy Management System',
    };
  };

  const meta = getPageMeta();

  const handleTogglePortal = () => {
    const nextPortal = portal === 'OWNER' ? 'CUSTOMER' : 'OWNER';
    switchPortal(nextPortal);
    if (nextPortal === 'OWNER') {
      navigate('/owner/overview');
    } else {
      navigate('/customer/dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#2A2A2A] bg-[#0c0c0c]/90 px-4 backdrop-blur-md sm:px-6">
      {/* Left side: Desktop Collapse Toggle / Mobile Hamburger & Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile toggle */}
        <button
          onClick={onOpenMobileSidebar}
          className="rounded-lg p-2 text-[#A3A3A3] hover:bg-[#202020] hover:text-white lg:hidden transition"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleDesktopCollapse}
          className="hidden lg:flex items-center justify-center rounded-lg p-2 text-[#A3A3A3] hover:bg-[#202020] hover:text-white transition"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar collapse"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white sm:text-base truncate">
              {meta.title}
            </h1>
            <span
              className={`hidden sm:inline-flex rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border ${
                portal === 'OWNER'
                  ? 'bg-[#F04438]/10 text-[#F04438] border-[#F04438]/30'
                  : 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/30'
              }`}
            >
              {portal} PORTAL
            </span>
          </div>
          <p className="hidden text-xs text-[#A3A3A3] md:block truncate">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right side: Quick Actions & Portal Switch */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh live data"
            className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#1a1a1a] px-2.5 py-1.5 text-xs font-semibold text-[#F5F5F5] hover:bg-[#202020] transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#FF7A00]' : 'text-[#A3A3A3]'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        {/* Quick Station QR Scan shortcut */}
        <Link
          to="/customer/scan"
          className="flex items-center gap-1.5 rounded-lg bg-[#202020] border border-[#2A2A2A] hover:border-[#FF7A00]/40 px-2.5 py-1.5 text-xs font-semibold text-white transition shadow-sm"
          title="Scan Station QR Code"
        >
          <QrCode className="h-3.5 w-3.5 text-[#FF7A00]" />
          <span className="hidden md:inline">Scan Station QR</span>
        </Link>

        {/* Quick Portal Switcher */}
        <button
          onClick={handleTogglePortal}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#F04438]/15 to-[#FF7A00]/15 border border-[#F04438]/30 hover:border-[#F04438]/60 px-2.5 py-1.5 text-xs font-bold text-white transition shadow-sm"
          title={`Switch view to ${portal === 'OWNER' ? 'Customer' : 'Owner'} Portal`}
        >
          <ArrowRightLeft className="h-3.5 w-3.5 text-[#FF7A00]" />
          <span className="hidden sm:inline">
            {portal === 'OWNER' ? 'Customer Mode' : 'Owner Mode'}
          </span>
        </button>

        {/* User Pill / Profile link */}
        <Link
          to={portal === 'OWNER' ? '/owner/overview' : '/customer/profile'}
          className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] border border-[#2A2A2A] px-2.5 py-1 text-xs text-white hover:bg-[#202020] transition"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F04438] text-[11px] font-bold text-white">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="hidden lg:inline text-xs font-medium truncate max-w-[100px]">
            {user?.name?.split(' ')[0] || 'User'}
          </span>
        </Link>
      </div>
    </header>
  );
}
