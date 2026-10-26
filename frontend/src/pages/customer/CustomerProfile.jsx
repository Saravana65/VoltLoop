import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Car,
  Key,
  CheckCircle,
  AlertCircle,
  LogOut,
  Save,
} from 'lucide-react';
import { getCustomerProfile, updateCustomerProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';

export default function CustomerProfile() {
  const { user, updateProfile, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCustomerProfile();
      setProfile(res);
      setForm({
        name: res.name || '',
        phone: res.phone || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setError(null);

    try {
      const updated = await updateCustomerProfile(form);
      setProfile((prev) => ({ ...prev, ...updated }));
      updateProfile(updated);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return <LoadingSpinner message="Loading customer profile..." />;
  }

  if (error && !profile) {
    return <ErrorAlert message={error} onRetry={fetchProfile} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8 flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F04438] to-[#FF7A00] text-xl font-black text-white shadow-lg shadow-orange-500/20">
          {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{profile?.name || 'Customer'}</h2>
            <span className="rounded bg-[#202020] border border-[#2A2A2A] px-2 py-0.5 text-[10px] font-mono font-bold text-[#FF7A00]">
              {profile?.role || 'CUSTOMER'}
            </span>
          </div>
          <p className="text-xs text-[#A3A3A3] mt-0.5">{profile?.email}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>BCrypt Authenticated & Verified</span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Personal Information
        </h3>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A3A3A3] mb-1 font-semibold">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3A3A3]" />
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl bg-[#181818] border border-[#2A2A2A] pl-10 pr-3.5 py-2.5 text-white focus:border-[#FF7A00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#A3A3A3] mb-1 font-semibold">Campus Email (Locked)</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full rounded-xl bg-[#141414] border border-[#222] pl-10 pr-3.5 py-2.5 text-[#666] cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#A3A3A3] mb-1 font-semibold">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3A3A3]" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl bg-[#181818] border border-[#2A2A2A] pl-10 pr-3.5 py-2.5 text-white focus:border-[#FF7A00]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F04438] to-[#FF7A00] px-5 py-2.5 font-bold text-white shadow-lg shadow-orange-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security Info Card */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 text-xs text-[#A3A3A3] space-y-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Key className="h-4 w-4 text-[#FF7A00]" />
          <span>Security & Data Privacy</span>
        </h3>
        <p>
          Your password is cryptographic-salted using BCrypt (cost factor 10) on the VoltLoop backend database. Your charging telemetry is isolated to your customer account.
        </p>
      </div>
    </div>
  );
}
