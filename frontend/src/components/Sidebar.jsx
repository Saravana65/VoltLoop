import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  DollarSign,
  Activity,
  QrCode,
  Car,
  CalendarClock,
  BatteryCharging,
  Cpu,
  BarChart3,
  CreditCard,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Sliders,
  ShieldCheck,
  ArrowRightLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) {
  const { user, portal, switchPortal, logout, isOwner } = useAuth();
  const navigate = useNavigate();

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const ownerSections = [
    {
      title: 'Owner Business Ops',
      items: [
        { name: 'Overview', path: '/owner/overview', icon: LayoutDashboard },
        { name: 'Live Activity', path: '/owner/activity', icon: Activity },
        { name: 'Station Bays', path: '/owner/stations', icon: Zap },
        { name: 'Verified Revenue', path: '/owner/revenue', icon: DollarSign },
      ],
    },
    {
      title: 'Campus Fleet & Grid',
      items: [
        { name: 'Bay Check-In', path: '/station-checkin', icon: QrCode, badge: 'Phase 7' },
        { name: 'Smart Charging', path: '/smart-charging', icon: Cpu, badge: 'Rule-Based' },
        { name: 'Fleet Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'EV Fleet Directory', path: '/evs', icon: Car },
        { name: 'Reservations', path: '/reservations', icon: CalendarClock },
        { name: 'All Sessions', path: '/sessions', icon: BatteryCharging },
      ],
    },
  ];

  const customerSections = [
    {
      title: 'Customer Charging',
      items: [
        { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
        { name: 'Scan Station QR', path: '/customer/scan', icon: QrCode, badge: 'Quick Scan' },
        { name: 'My Electric Vehicles', path: '/customer/vehicles', icon: Car },
        { name: 'Book a Charger', path: '/customer/bookings', icon: CalendarClock },
        { name: 'Charging Sessions', path: '/customer/sessions', icon: BatteryCharging },
        { name: 'Payments & Receipts', path: '/customer/payments', icon: CreditCard },
        { name: 'My Profile', path: '/customer/profile', icon: User },
      ],
    },
  ];

  const currentSections = portal === 'OWNER' ? ownerSections : customerSections;

  const handlePortalSwitch = () => {
    const next = portal === 'OWNER' ? 'CUSTOMER' : 'OWNER';
    switchPortal(next);
    if (next === 'OWNER') {
      navigate('/owner/overview');
    } else {
      navigate('/customer/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#121212] border-r border-[#2A2A2A] transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#2A2A2A] px-4">
          <NavLink
            to={portal === 'OWNER' ? '/owner/overview' : '/customer/dashboard'}
            onClick={() => isOpen && onClose()}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F04438] to-[#FF7A00] shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 text-white font-black fill-white" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-white font-sans">
                    Volt<span className="text-[#FF7A00]">Loop</span>
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold border ${
                      portal === 'OWNER'
                        ? 'bg-[#F04438]/10 text-[#F04438] border-[#F04438]/30'
                        : 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/30'
                    }`}
                  >
                    {portal}
                  </span>
                </div>
                <span className="block text-[10px] font-medium tracking-wider text-[#A3A3A3] uppercase truncate">
                  {portal === 'OWNER' ? 'Owner Enterprise' : 'Customer Portal'}
                </span>
              </div>
            )}
          </NavLink>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#A3A3A3] hover:bg-[#202020] hover:text-white lg:hidden transition"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {currentSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-[#A3A3A3] uppercase">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => isOpen && onClose()}
                    title={isCollapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#202020] text-white border border-[#F04438]/40 shadow-sm'
                          : 'text-[#A3A3A3] hover:bg-[#1a1a1a] hover:text-[#F5F5F5]'
                      } ${isCollapsed ? 'justify-center' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-[#F04438]'
                              : 'text-[#A3A3A3] group-hover:text-white'
                          }`}
                        />
                        {!isCollapsed && (
                          <div className="flex flex-1 items-center justify-between min-w-0">
                            <span className="truncate">{item.name}</span>
                            {item.badge && (
                              <span className="rounded bg-[#2A2A2A] px-1.5 py-0.5 text-[9px] font-mono font-medium text-[#FF7A00] border border-[#383838]">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer / Portal Switcher */}
        <div className="shrink-0 border-t border-[#2A2A2A] p-3 space-y-2 bg-[#0c0c0c]">
          {/* Quick portal switch (available for Owner or demo) */}
          {!isCollapsed ? (
            <button
              onClick={handlePortalSwitch}
              className="w-full flex items-center justify-between gap-2 rounded-lg bg-[#202020] hover:bg-[#262626] border border-[#2A2A2A] px-2.5 py-1.5 text-xs font-medium text-[#F5F5F5] transition"
              title="Switch portal view"
            >
              <div className="flex items-center gap-1.5 truncate">
                <ArrowRightLeft className="h-3.5 w-3.5 text-[#FF7A00]" />
                <span className="truncate">Switch to {portal === 'OWNER' ? 'Customer' : 'Owner'}</span>
              </div>
              <span className="text-[10px] text-[#A3A3A3]">Demo</span>
            </button>
          ) : (
            <button
              onClick={handlePortalSwitch}
              className="w-full flex items-center justify-center p-2 rounded-lg bg-[#202020] hover:bg-[#262626] border border-[#2A2A2A] text-[#FF7A00] transition"
              title={`Switch to ${portal === 'OWNER' ? 'Customer' : 'Owner'}`}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>
          )}

          {/* User profile row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#202020] border border-[#2A2A2A] text-xs font-bold text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.name || 'Guest User'}
                  </p>
                  <p className="text-[10px] text-[#A3A3A3] truncate">
                    {user?.email || 'Not logged in'}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-[#A3A3A3] hover:bg-[#202020] hover:text-[#F04438] transition"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop collapse toggle at very bottom */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-1.5 py-1 text-[11px] font-medium text-[#A3A3A3] hover:text-white transition"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
