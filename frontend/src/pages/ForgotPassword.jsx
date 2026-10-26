import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 selection:bg-[#F04438] selection:text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F04438] to-[#FF7A00] shadow-lg shadow-red-500/20 mb-3">
            <Zap className="h-7 w-7 text-white font-black fill-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Reset Password
          </h1>
          <p className="text-xs text-[#A3A3A3] mt-1">
            VoltLoop Identity & Access Management
          </p>
        </div>

        <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Password Reset Requested</h2>
              <p className="text-xs text-[#A3A3A3]">
                For this prototype demonstration, demo accounts have pre-configured credentials:
              </p>
              <div className="text-left bg-[#181818] p-3 rounded-lg border border-[#2A2A2A] text-xs font-mono space-y-1 text-slate-300">
                <div>Owner: <span className="text-emerald-400">Owner@VoltLoop2026</span></div>
                <div>Customer: <span className="text-emerald-400">Customer@2026</span></div>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#FF7A00] hover:underline pt-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-[#A3A3A3]">
                Enter your campus email address to receive password recovery instructions.
              </p>

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

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#F04438] to-[#FF7A00] py-2.5 text-xs font-bold text-white shadow-lg shadow-red-500/20 hover:opacity-95 transition"
              >
                Request Reset Instructions
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
