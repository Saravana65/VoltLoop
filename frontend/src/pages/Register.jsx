import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, User, Mail, Lock, Phone, Car, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: 'Suresh Raina',
    email: 'suresh.raina@campus.edu',
    password: 'Customer@2026',
    confirmPassword: 'Customer@2026',
    phone: '+91 98765 43219',
    vehicleName: 'Tata Nexon EV Max',
    registrationNo: 'KA-01-EV-7788',
    vehicleType: 'FOUR_WHEELER',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePrefillDemo = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      name: `EV Commuter ${randomSuffix}`,
      email: `customer${randomSuffix}@campus.edu`,
      password: 'Customer@2026',
      confirmPassword: 'Customer@2026',
      phone: `+91 98${randomSuffix} 1234`,
      vehicleName: 'Hyundai Ioniq 5',
      registrationNo: `KA-03-EV-${randomSuffix}`,
      vehicleType: 'FOUR_WHEELER',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        vehicleName: formData.vehicleName,
        registrationNo: formData.registrationNo,
        vehicleType: formData.vehicleType,
      });
      navigate('/customer/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 selection:bg-[#FF7A00] selection:text-white">
      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F04438] to-[#FF7A00] shadow-lg shadow-orange-500/20 mb-3">
            <Zap className="h-7 w-7 text-white font-black fill-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Create Customer Account
          </h1>
          <p className="text-xs text-[#A3A3A3] mt-1">
            Register your profile and primary electric vehicle for seamless campus charging
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-red-950/40 border border-red-500/40 p-3 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Account & Vehicle Details</span>
            <button
              type="button"
              onClick={handlePrefillDemo}
              className="text-[11px] font-semibold text-[#FF7A00] hover:underline"
            >
              Prefill Fresh Demo Data
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A3A3A3]" />
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Suresh Raina"
                    className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] pl-9 pr-3 py-2 text-xs text-white placeholder-[#666] focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Campus Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A3A3A3]" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@campus.edu"
                    className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] pl-9 pr-3 py-2 text-xs text-white placeholder-[#666] focus:border-[#FF7A00]"
                  />
                </div>
              </div>
            </div>

            {/* Phone & Vehicle Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A3A3A3]" />
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] pl-9 pr-3 py-2 text-xs text-white placeholder-[#666] focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Vehicle Category</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] px-3 py-2 text-xs text-white focus:border-[#FF7A00]"
                >
                  <option value="FOUR_WHEELER">4-Wheeler (Sedan / SUV / Hatchback)</option>
                  <option value="TWO_WHEELER">2-Wheeler (e-Scooter / e-Bike)</option>
                  <option value="BUS">Campus Shuttle Bus</option>
                  <option value="TRUCK">Campus Maintenance Van</option>
                </select>
              </div>
            </div>

            {/* Vehicle Model & Registration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Vehicle Name / Model</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A3A3A3]" />
                  <input
                    type="text"
                    required
                    name="vehicleName"
                    value={formData.vehicleName}
                    onChange={handleChange}
                    placeholder="e.g. Tata Nexon EV"
                    className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] pl-9 pr-3 py-2 text-xs text-white placeholder-[#666] focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Registration Number</label>
                <input
                  type="text"
                  required
                  name="registrationNo"
                  value={formData.registrationNo}
                  onChange={handleChange}
                  placeholder="e.g. KA-01-EV-1234"
                  className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] px-3 py-2 text-xs text-white uppercase placeholder-[#666] focus:border-[#FF7A00]"
                />
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A3A3A3]" />
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] pl-9 pr-3 py-2 text-xs text-white placeholder-[#666] focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A3A3A3]" />
                  <input
                    type="password"
                    required
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] pl-9 pr-3 py-2 text-xs text-white placeholder-[#666] focus:border-[#FF7A00]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#F04438] py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Creating Account & Registering Vehicle...</span>
              ) : (
                <>
                  <span>Create Account & Enter Customer Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#2A2A2A] text-center">
            <p className="text-xs text-[#A3A3A3]">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-[#FF7A00] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
