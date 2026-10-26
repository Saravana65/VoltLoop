import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { getOwnerRevenue } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';

export default function OwnerRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerRevenue();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load verified revenue records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  if (loading && !data) {
    return <LoadingSpinner message="Auditing verified revenue and payments ledger..." />;
  }

  if (error && !data) {
    return <ErrorAlert message={error} onRetry={fetchRevenue} />;
  }

  const {
    verifiedRevenue = 0,
    todayRevenue = 0,
    successfulPaymentsCount = 0,
    averageTransactionValue = 0,
    payments = [],
  } = data || {};

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod =
      methodFilter === 'ALL' || p.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121212] border border-[#2A2A2A] rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Verified Revenue & Payment Clearing Ledger
            </h2>
          </div>
          <p className="text-xs text-[#A3A3A3] mt-0.5">
            Strict cash accounting: Only verified SUCCESSFUL charging transactions are credited to enterprise revenue.
          </p>
        </div>

        <button
          onClick={fetchRevenue}
          className="flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#202020] border border-[#2A2A2A] px-3 py-1.5 text-xs font-semibold text-[#A3A3A3] hover:text-white transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Total Verified Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              ₹{Number(verifiedRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Audited & Cleared</span>
          </p>
        </div>

        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Today's Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              ₹{Number(todayRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Current 24-hour cycle
          </p>
        </div>

        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Confirmed Payments</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {successfulPaymentsCount}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Successful settlements
          </p>
        </div>

        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Average Session Value</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              ₹{Number(averageTransactionValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Per completed charge
          </p>
        </div>
      </div>

      {/* Compliance / Accounting Policy Notice */}
      <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[#A3A3A3]">
          <span className="font-bold text-white block mb-0.5">Campus Energy Accounting Standard</span>
          Revenue metrics account exclusively for charging transactions marked with status <span className="font-mono text-emerald-400 font-bold">SUCCESSFUL</span>. Unpaid, pending, or simulated trial sessions are maintained in customer pending ledgers and are never recognized as realized revenue.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by transaction reference, customer, email, payment method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] pl-9 pr-3 py-2 text-xs text-white placeholder-[#666] focus:border-[#FF7A00]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#A3A3A3]" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="rounded-lg bg-[#181818] border border-[#2A2A2A] px-3 py-2 text-xs text-white focus:border-[#FF7A00]"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="CREDIT_CARD">Credit / Debit Card</option>
              <option value="NET_BANKING">Net Banking</option>
              <option value="CAMPUS_WALLET">Campus Wallet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Transactions Table */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c0c0c] text-[#A3A3A3] uppercase text-[10px] tracking-wider border-b border-[#2A2A2A]">
              <tr>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Amount (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Settled At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202020]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#A3A3A3]">
                    No transactions match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-[#181818] transition">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {p.transactionRef}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{p.userName || 'Customer'}</div>
                      <div className="text-[10px] text-[#A3A3A3]">{p.userEmail}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[#A3A3A3]">
                      #{p.sessionId}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">{p.paymentMethod}</span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      ₹{Number(p.amount || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'SUCCESSFUL'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : p.status === 'FAILED'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {p.simulated ? (
                        <span className="rounded bg-[#202020] text-[#A3A3A3] border border-[#2A2A2A] px-1.5 py-0.5 text-[9px] font-mono">
                          Simulated PBL
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 text-[9px] font-mono">
                          Live Gateway
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[#A3A3A3] font-mono">
                      {p.completedAt
                        ? new Date(p.completedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
