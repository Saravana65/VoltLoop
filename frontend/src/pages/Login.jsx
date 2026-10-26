import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Zap, Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const portalParam = searchParams.get('portal')?.toUpperCase();
  const isCustomerInitial = portalParam === 'CUSTOMER' || location.pathname.includes('/customer');

  const [activeTab, setActiveTab] = useState(isCustomerInitial ? 'CUSTOMER' : 'OWNER');
  const [email, setEmail] = useState(isCustomerInitial ? 'amit.verma@campus.edu' : 'rajesh.sharma@campus.edu');
  const [password, setPassword] = useState(isCustomerInitial ? 'Customer@2026' : 'Owner@VoltLoop2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('portal')?.toUpperCase();
    if (p === 'CUSTOMER' || location.pathname.includes('/customer')) {
      setActiveTab('CUSTOMER');
      setEmail('amit.verma@campus.edu');
      setPassword('Customer@2026');
    } else if (p === 'OWNER' || location.pathname.includes('/owner')) {
      setActiveTab('OWNER');
      setEmail('rajesh.sharma@campus.edu');
      setPassword('Owner@VoltLoop2026');
    }
  }, [location.pathname, location.search]);

  const handleTabChange = (portal) => {
    setActiveTab(portal);
    setError('');
    if (portal === 'OWNER') {
      setEmail('rajesh.sharma@campus.edu');
      setPassword('Owner@VoltLoop2026');
    } else {
      setEmail('amit.verma@campus.edu');
      setPassword('Customer@2026');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password, activeTab);
      if (res.portal === 'OWNER') {
        navigate('/owner/overview');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 selection:bg-[#F04438] selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F04438] to-[#FF7A00] shadow-lg shadow-red-500/20 mb-3">
            <Zap className="h-7 w-7 text-white font-black fill-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Volt<span className="text-[#FF7A00]">Loop</span>
          </h1>
          <p className="text-xs text-[#A3A3A3] mt-1">
            Smart Campus EV Fleet & Energy Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Dual Portal Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#1a1a1a] rounded-xl mb-6 border border-[#2A2A2A]">
            <button
              type="button"
              onClick={() => handleTabChange('OWNER')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'OWNER'
                  ? 'bg-[#202020] text-white border border-[#F04438]/50 shadow'
                  : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              <ShieldCheck className={`h-4 w-4 ${activeTab === 'OWNER' ? 'text-[#F04438]' : ''}`} />
              <span>Owner Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('CUSTOMER')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'CUSTOMER'
                  ? 'bg-[#202020] text-white border border-[#FF7A00]/50 shadow'
                  : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              <UserCheck className={`h-4 w-4 ${activeTab === 'CUSTOMER' ? 'text-[#FF7A00]' : ''}`} />
              <span>Customer Portal</span>
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-lg font-bold text-white">
              {activeTab === 'OWNER' ? 'Owner Sign In' : 'Customer Sign In'}
            </h2>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              {activeTab === 'OWNER'
                ? 'Manage charging stations, monitor live activity, and track revenue.'
                : 'Find bays, scan station QR, charge your EV, and pay securely.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-red-950/40 border border-red-500/40 p-3 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3A3A3]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@campus.edu"
                  className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#666] focus:border-[#F04438] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#FF7A00] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3A3A3]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] pl-10 pr-10 py-2.5 text-xs text-white placeholder-[#666] focus:border-[#F04438] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials Autofill Pill */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'OWNER') {
                    setEmail('rajesh.sharma@campus.edu');
                    setPassword('Owner@VoltLoop2026');
                  } else {
                    setEmail('amit.verma@campus.edu');
                    setPassword('Customer@2026');
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#202020] border border-[#2A2A2A] text-[11px] text-[#A3A3A3] transition"
              >
                <span>Prefill demo {activeTab.toLowerCase()} credentials</span>
                <span className="font-mono text-[#FF7A00] font-bold">Auto Fill</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#F04438] to-[#FF7A00] py-2.5 text-xs font-bold text-white shadow-lg shadow-red-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to {activeTab === 'OWNER' ? 'Owner Portal' : 'Customer Portal'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-[#2A2A2A] text-center">
            <p className="text-xs text-[#A3A3A3]">
              New to VoltLoop?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#FF7A00] hover:underline"
              >
                Create a Customer Account
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials Helper Box */}
        <div className="mt-6 bg-[#121212]/80 border border-[#2A2A2A] rounded-xl p-3.5 text-center text-xs text-[#A3A3A3]">
          <p className="font-semibold text-white mb-1">PBL Live Demonstration Accounts</p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-2">
            <div className="p-2 rounded bg-[#181818] border border-[#2A2A2A]">
              <span className="block text-[#F04438] font-bold">Owner Access</span>
              <span className="text-[#A3A3A3]">rajesh.sharma@campus.edu</span>
            </div>
            <div className="p-2 rounded bg-[#181818] border border-[#2A2A2A]">
              <span className="block text-[#FF7A00] font-bold">Customer Access</span>
              <span className="text-[#A3A3A3]">amit.verma@campus.edu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
