import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Zap,
  Activity,
  Layers,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { getOwnerOverview, updateOwnerStationStatus } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';

export default function OwnerOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStationId, setUpdatingStationId] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerOverview();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load owner overview data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = async (stationId, currentStatus) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
    try {
      setUpdatingStationId(stationId);
      await updateOwnerStationStatus(stationId, nextStatus);
      await fetchOverview();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingStationId(null);
    }
  };

  if (loading && !data) {
    return <LoadingSpinner message="Loading Owner Command Overview..." />;
  }

  if (error && !data) {
    return <ErrorAlert message={error} onRetry={fetchOverview} />;
  }

  const {
    totalRevenue = 0,
    todayRevenue = 0,
    activeSessionsCount = 0,
    availableStations = 0,
    totalStations = 5,
    occupiedStations = 0,
    maintenanceStations = 0,
    totalEnergyConsumed = 0,
    activeSessions = [],
    recentActivity = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121212] border border-[#2A2A2A] rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Owner Enterprise Live Monitor
            </h2>
          </div>
          <p className="text-xs text-[#A3A3A3] mt-0.5">
            Real-time telemetry and revenue tracking for campus charging stations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/owner/revenue"
            className="flex items-center gap-1.5 rounded-lg bg-[#202020] hover:bg-[#262626] border border-[#2A2A2A] px-3 py-1.5 text-xs font-semibold text-white transition"
          >
            <DollarSign className="h-3.5 w-3.5 text-[#FF7A00]" />
            <span>Revenue Ledger</span>
          </Link>
          <button
            onClick={fetchOverview}
            className="flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#202020] border border-[#2A2A2A] px-3 py-1.5 text-xs font-semibold text-[#A3A3A3] hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Verified Revenue */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4 shadow-sm hover:border-[#383838] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Verified Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-white">
              ₹{Number(totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            <span>Confirmed Successful Transactions</span>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4 shadow-sm hover:border-[#383838] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Today's Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-white">
              ₹{Number(todayRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            24h billing window
          </p>
        </div>

        {/* Active Charging Sessions */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4 shadow-sm hover:border-[#383838] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Active Sessions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F04438]/10 text-[#F04438] border border-[#F04438]/20">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{activeSessionsCount}</span>
            {activeSessionsCount > 0 && (
              <span className="text-xs font-medium text-[#F04438] flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-[#F04438] animate-ping" />
                Live Drawing
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Connected customer vehicles
          </p>
        </div>

        {/* Station Availability */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4 shadow-sm hover:border-[#383838] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Station Bays</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-bold text-white">{availableStations}</span>
            <span className="text-sm text-[#A3A3A3]">/ {totalStations} Available</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-[#A3A3A3]">
            <span className="text-amber-400">{occupiedStations} Charging</span>
            <span>•</span>
            <span className="text-red-400">{maintenanceStations} Maint.</span>
          </div>
        </div>
      </div>

      {/* Live Active Sessions Table */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#F04438]" />
            <h3 className="text-sm font-bold text-white">Live Customer Charging Sessions</h3>
            <span className="rounded bg-[#202020] px-2 py-0.5 text-[11px] font-mono text-[#A3A3A3]">
              {activeSessions.length} Active
            </span>
          </div>
          <Link
            to="/owner/activity"
            className="flex items-center gap-1 text-xs font-semibold text-[#FF7A00] hover:underline"
          >
            <span>View Full Audit Log</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {activeSessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#A3A3A3]">
            No live customer charging sessions active right now. All stations are idle or reserved.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c0c0c] text-[#A3A3A3] uppercase text-[10px] tracking-wider border-b border-[#2A2A2A]">
                <tr>
                  <th className="py-2.5 px-4">Session ID</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Vehicle</th>
                  <th className="py-2.5 px-4">Station Bay</th>
                  <th className="py-2.5 px-4">Start Time</th>
                  <th className="py-2.5 px-4">Energy (kWh)</th>
                  <th className="py-2.5 px-4">Accrued (₹)</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020]">
                {activeSessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-[#181818] transition">
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      #{s.sessionId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{s.userName || 'Customer'}</div>
                      <div className="text-[10px] text-[#A3A3A3]">{s.userEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-white">{s.registrationNo || 'EV'}</div>
                      <div className="text-[10px] text-[#A3A3A3]">{s.vehicleType}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#FF7A00]">{s.stationQrCode || `Bay ${s.stationId}`}</span>
                      <span className="text-[10px] text-[#A3A3A3] block truncate max-w-[140px]">{s.stationName}</span>
                    </td>
                    <td className="py-3 px-4 text-[#A3A3A3] font-mono">
                      {s.startTime ? new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {Number(s.energyConsumed || 0).toFixed(2)} kWh
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      ₹{Number(s.chargingCost || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        CHARGING
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Station Control Grid */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#FF7A00]" />
            <h3 className="text-sm font-bold text-white">Campus Station Bays & Rapid Controls</h3>
          </div>
          <Link
            to="/owner/stations"
            className="flex items-center gap-1 text-xs font-semibold text-[#FF7A00] hover:underline"
          >
            <span>Manage All Stations</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { id: 1, name: 'CS-ENGG-01', qr: 'VL-ST-001', kw: 22, type: 'Type 2' },
            { id: 2, name: 'CS-ADMIN-01', qr: 'VL-ST-002', kw: 50, type: 'CCS2' },
            { id: 3, name: 'CS-HOSTEL-01', qr: 'VL-ST-003', kw: 7.4, type: 'Type 2' },
            { id: 4, name: 'CS-WORKSHOP-01', qr: 'VL-ST-004', kw: 60, type: 'CCS2' },
            { id: 5, name: 'CS-SPORTS-01', qr: 'VL-ST-005', kw: 11, type: 'GB/T' },
          ].map((bay) => (
            <div
              key={bay.id}
              className="bg-[#181818] border border-[#2A2A2A] rounded-lg p-3 hover:border-[#383838] transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-[#FF7A00]">{bay.qr}</span>
                  <span className="text-[10px] text-[#A3A3A3] font-mono">{bay.kw} kW</span>
                </div>
                <p className="text-xs font-bold text-white truncate">{bay.name}</p>
                <p className="text-[10px] text-[#A3A3A3]">{bay.type}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#2A2A2A] flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <CheckCircle className="h-3 w-3" /> Active
                </span>
                <Link
                  to="/owner/stations"
                  className="text-[10px] text-[#A3A3A3] hover:text-white"
                >
                  Configure
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Customer Activity Preview */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#A3A3A3]" />
            <h3 className="text-sm font-bold text-white">Recent Customer Activity</h3>
          </div>
          <Link
            to="/owner/activity"
            className="text-xs font-semibold text-[#FF7A00] hover:underline"
          >
            View Full Table
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c0c0c] text-[#A3A3A3] uppercase text-[10px] tracking-wider border-b border-[#2A2A2A]">
              <tr>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Station</th>
                <th className="py-2.5 px-4">Vehicle</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Energy</th>
                <th className="py-2.5 px-4">Cost (₹)</th>
                <th className="py-2.5 px-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202020]">
              {recentActivity.slice(0, 5).map((act) => (
                <tr key={act.sessionId} className="hover:bg-[#181818] transition">
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-white">{act.userName || 'Customer'}</span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#FF7A00]">
                    {act.stationQrCode || `Bay ${act.stationId}`}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#A3A3A3]">
                    {act.registrationNo || 'EV'}
                  </td>
                  <td className="py-2.5 px-4 text-[#A3A3A3]">
                    {act.durationMinutes ? `${act.durationMinutes} min` : '—'}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-white">
                    {Number(act.energyConsumed || 0).toFixed(2)} kWh
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                    ₹{Number(act.chargingCost || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        act.paymentStatus === 'SUCCESSFUL'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {act.paymentStatus || 'PENDING'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
