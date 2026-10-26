import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Zap,
  Download,
  RefreshCw,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { getOwnerRecentActivity } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';

export default function OwnerActivity() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerRecentActivity();
      setSessions(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load customer charging activity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registrationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.stationQrCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'SUCCESSFUL' && s.paymentStatus === 'SUCCESSFUL') ||
      (statusFilter === 'PENDING' && (s.paymentStatus === 'PENDING' || !s.paymentStatus)) ||
      (statusFilter === 'ACTIVE' && s.status === 'ACTIVE');

    return matchesSearch && matchesStatus;
  });

  const exportCsv = () => {
    const headers = [
      'Session ID',
      'Customer Name',
      'Customer Email',
      'Vehicle Reg',
      'Vehicle Type',
      'Station Code',
      'Station Name',
      'Start Time',
      'End Time',
      'Duration (min)',
      'Energy (kWh)',
      'Cost (INR)',
      'Payment Status',
      'Transaction Ref',
    ];

    const rows = filteredSessions.map((s) => [
      s.sessionId,
      `"${s.userName || 'Customer'}"`,
      `"${s.userEmail || ''}"`,
      `"${s.registrationNo || ''}"`,
      `"${s.vehicleType || ''}"`,
      `"${s.stationQrCode || ''}"`,
      `"${s.stationName || ''}"`,
      `"${s.startTime || ''}"`,
      `"${s.endTime || ''}"`,
      s.durationMinutes || 0,
      s.energyConsumed || 0,
      s.chargingCost || 0,
      s.paymentStatus || 'PENDING',
      `"${s.transactionRef || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `voltloop_charging_activity_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && sessions.length === 0) {
    return <LoadingSpinner message="Loading customer activity audit log..." />;
  }

  if (error && sessions.length === 0) {
    return <ErrorAlert message={error} onRetry={fetchActivity} />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Customer Charging Activity Audit Log
            </h2>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              Auditable timestamp ledger tracking when customer EVs connected, started charging, concluded, and paid.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 rounded-lg bg-[#202020] hover:bg-[#262626] border border-[#2A2A2A] px-3 py-1.5 text-xs font-semibold text-white transition"
            >
              <Download className="h-3.5 w-3.5 text-[#FF7A00]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchActivity}
              className="flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#202020] border border-[#2A2A2A] px-3 py-1.5 text-xs font-semibold text-[#A3A3A3] hover:text-white transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[#2A2A2A]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by customer name, email, vehicle reg, station code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] pl-9 pr-3 py-2 text-xs text-white placeholder-[#666] focus:border-[#F04438]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#A3A3A3]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg bg-[#181818] border border-[#2A2A2A] px-3 py-2 text-xs text-white focus:border-[#F04438]"
            >
              <option value="ALL">All Statuses ({sessions.length})</option>
              <option value="SUCCESSFUL">Paid / Successful</option>
              <option value="PENDING">Pending Payment</option>
              <option value="ACTIVE">Actively Charging</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c0c0c] text-[#A3A3A3] uppercase text-[10px] tracking-wider border-b border-[#2A2A2A]">
              <tr>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4">Customer & Vehicle</th>
                <th className="py-3 px-4">Station Bay</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">End Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Energy</th>
                <th className="py-3 px-4">Cost (₹)</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Txn Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202020]">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#A3A3A3]">
                    No charging activity records match your criteria.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-[#181818] transition">
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      #{s.sessionId}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{s.userName || 'Customer'}</div>
                      <div className="text-[10px] text-[#A3A3A3]">{s.userEmail}</div>
                      <div className="text-[10px] font-mono text-[#FF7A00] mt-0.5">
                        {s.registrationNo} ({s.vehicleType})
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white">
                        {s.stationQrCode || `Bay ${s.stationId}`}
                      </div>
                      <div className="text-[10px] text-[#A3A3A3] truncate max-w-[120px]">
                        {s.stationName}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#A3A3A3] font-mono">
                      {s.startTime ? new Date(s.startTime).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '—'}
                    </td>

                    <td className="py-3 px-4 text-[#A3A3A3] font-mono">
                      {s.endTime ? new Date(s.endTime).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : (
                        <span className="text-emerald-400 font-bold">In Progress</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-white font-mono">
                      {s.durationMinutes ? `${s.durationMinutes} min` : '0 min'}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {Number(s.energyConsumed || 0).toFixed(2)} kWh
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      ₹{Number(s.chargingCost || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.paymentStatus === 'SUCCESSFUL'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : s.status === 'ACTIVE'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {s.paymentStatus || (s.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING')}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[#A3A3A3]">
                      {s.transactionRef || '—'}
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
