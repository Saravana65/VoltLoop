import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BatteryCharging,
  Clock,
  Zap,
  DollarSign,
  Receipt,
  CreditCard,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { getCustomerSessions } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';

export default function CustomerSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCustomerSessions();
      setSessions(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load your charging sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter(
    (s) =>
      s.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.stationQrCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registrationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && sessions.length === 0) {
    return <LoadingSpinner message="Loading your charging session history..." />;
  }

  if (error && sessions.length === 0) {
    return <ErrorAlert message={error} onRetry={fetchSessions} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6">
        <div>
          <h2 className="text-lg font-bold text-white">Personal Charging Sessions</h2>
          <p className="text-xs text-[#A3A3A3] mt-0.5">
            Audit history of all electric vehicle charging sessions, metered energy, and billing timestamps.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by bay or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl bg-[#181818] border border-[#2A2A2A] pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#666] focus:border-[#FF7A00]"
            />
          </div>

          <button
            onClick={fetchSessions}
            className="p-2 rounded-xl bg-[#181818] border border-[#2A2A2A] text-[#A3A3A3] hover:text-white transition"
            title="Refresh sessions"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c0c0c] text-[#A3A3A3] uppercase text-[10px] tracking-wider border-b border-[#2A2A2A]">
              <tr>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4">Station Bay</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">End Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Energy</th>
                <th className="py-3 px-4">Cost (₹)</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202020]">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#A3A3A3]">
                    No charging session records found.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-[#181818] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      #{s.sessionId}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-[#FF7A00]">
                        {s.stationQrCode || `Bay ${s.stationId}`}
                      </div>
                      <div className="text-[10px] text-[#A3A3A3] truncate max-w-[140px]">
                        {s.stationName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-white">
                      {s.registrationNo || 'EV'}
                    </td>

                    <td className="py-3.5 px-4 text-[#A3A3A3] font-mono">
                      {s.startTime
                        ? new Date(s.startTime).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-[#A3A3A3] font-mono">
                      {s.endTime
                        ? new Date(s.endTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : (
                          <span className="text-emerald-400 font-bold">In Progress</span>
                        )}
                    </td>

                    <td className="py-3.5 px-4 text-white font-mono">
                      {s.durationMinutes ? `${s.durationMinutes} min` : '0 min'}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {Number(s.energyConsumed || 0).toFixed(2)} kWh
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      ₹{Number(s.chargingCost || 0).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4">
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

                    <td className="py-3.5 px-4">
                      {s.paymentStatus === 'SUCCESSFUL' ? (
                        <button
                          onClick={() => navigate('/customer/payments')}
                          className="flex items-center gap-1 rounded bg-[#202020] hover:bg-[#262626] border border-[#2A2A2A] px-2.5 py-1 text-[11px] font-semibold text-white transition"
                        >
                          <Receipt className="h-3 w-3 text-[#FF7A00]" />
                          <span>Receipt</span>
                        </button>
                      ) : s.status !== 'ACTIVE' ? (
                        <button
                          onClick={() => navigate('/customer/payments')}
                          className="flex items-center gap-1 rounded bg-[#FF7A00] hover:bg-[#FF7A00]/90 px-2.5 py-1 text-[11px] font-bold text-white transition"
                        >
                          <CreditCard className="h-3 w-3" />
                          <span>Pay Now</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#A3A3A3] italic">Active</span>
                      )}
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
