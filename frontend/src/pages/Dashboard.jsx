import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, BatteryCharging, Zap, IndianRupee, Clock, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { vehiclesApi, stationsApi, sessionsApi } from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { formatCurrency, formatEnergy, formatDate } from '../utils/formatters';

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vData, sData, allSess, actSess] = await Promise.all([
        vehiclesApi.getAll(),
        stationsApi.getAll(),
        sessionsApi.getAll(),
        sessionsApi.getActive(),
      ]);
      setVehicles(vData || []);
      setStations(sData || []);
      setSessions(allSess || []);
      setActiveSessions(actSess || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Aggregate Metrics
  const totalVehicles = vehicles.length;
  const activeChargingCount = activeSessions.length;
  const availableStationsCount = stations.filter((s) => s.status === 'AVAILABLE').length;

  const totalEnergyDispensed = sessions.reduce((acc, curr) => acc + (Number(curr.energyConsumed) || 0), 0);
  const totalChargingCost = sessions.reduce((acc, curr) => acc + (Number(curr.chargingCost) || 0), 0);

  if (loading) {
    return <LoadingSpinner message="Connecting to VoltLoop fleet telemetry..." />;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">Campus Fleet Dashboard</h1>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Live Telemetry
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time electric vehicle fleet operations, smart bay allocation, and energy accounting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Data
          </button>
          <Link
            to="/smart-charging"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:opacity-90 transition"
          >
            <Zap className="h-4 w-4" />
            Smart Allocation Engine
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} onRetry={fetchDashboardData} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Registered EVs"
          value={totalVehicles}
          subtext="Active fleet inventory"
          icon={Car}
          accent="emerald"
        />
        <StatCard
          title="Active Charging Bays"
          value={activeChargingCount}
          subtext="Current ongoing sessions"
          icon={BatteryCharging}
          accent="cyan"
        />
        <StatCard
          title="Available Stations"
          value={availableStationsCount}
          unit={`/ ${stations.length}`}
          subtext="Ready for allocation"
          icon={Zap}
          accent="purple"
        />
        <StatCard
          title="Total Energy Dispensed"
          value={totalEnergyDispensed.toFixed(1)}
          unit="kWh"
          subtext="Campus power delivered"
          icon={Zap}
          accent="amber"
        />
        <StatCard
          title="Total Charging Cost"
          value={formatCurrency(totalChargingCost)}
          subtext="Audited at ₹15.00/kWh"
          icon={IndianRupee}
          accent="emerald"
        />
      </div>

      {/* Grid: Currently Charging & Station Bays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Currently Charging EVs */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <BatteryCharging className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Currently Charging EVs</h3>
                <p className="text-xs text-slate-400">Live active sessions connected to campus chargers</p>
              </div>
            </div>
            <Link
              to="/sessions"
              className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
            >
              View all sessions <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {activeSessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
                <p className="text-sm text-slate-400">No vehicles are currently charging.</p>
                <Link
                  to="/smart-charging"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Start a smart charging session <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              activeSessions.map((sess) => (
                <div
                  key={sess.sessionId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 font-mono text-xs font-bold">
                      #{sess.sessionId}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{sess.registrationNo || `EV #${sess.vehicleId}`}</span>
                        <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {sess.qrIdentifier || 'QR'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Plugged into <span className="font-medium text-slate-300">{sess.stationName || `Station #${sess.stationId}`}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Initial SoC:</span>
                      <span className="font-semibold text-white">{sess.initialBattery}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Started:</span>
                      <span className="font-medium text-slate-300">{formatDate(sess.startTime)}</span>
                    </div>
                    <StatusBadge status={sess.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Station Bays Status Quick View */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Campus Bays</h3>
                <p className="text-xs text-slate-400">Real-time station hardware</p>
              </div>
            </div>
            <Link
              to="/stations"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              Manage
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {stations.map((st) => (
              <div
                key={st.stationId}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{st.stationName}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                      {st.powerRating} kW
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-[180px]">{st.location}</p>
                </div>
                <StatusBadge status={st.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Completed Charging Sessions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Recent Charging Sessions</h3>
              <p className="text-xs text-slate-400">Audited power consumption and billing logs</p>
            </div>
          </div>
          <Link
            to="/sessions"
            className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
          >
            All records <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Session ID</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Station</th>
                <th className="p-3">Start / End Time</th>
                <th className="p-3">Energy (kWh)</th>
                <th className="p-3">Cost (₹)</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sessions.slice(0, 5).map((s) => (
                <tr key={s.sessionId} className="hover:bg-slate-800/30 transition">
                  <td className="p-3 font-mono font-bold text-slate-300">#{s.sessionId}</td>
                  <td className="p-3">
                    <span className="font-semibold text-white">{s.registrationNo || `EV #${s.vehicleId}`}</span>
                    <span className="block text-[11px] text-slate-400">{s.vehicleType}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-slate-200">{s.stationName || `Station #${s.stationId}`}</span>
                  </td>
                  <td className="p-3 text-slate-300">
                    <div>{formatDate(s.startTime)}</div>
                    {s.endTime && <div className="text-slate-400 text-[11px]">to {formatDate(s.endTime)}</div>}
                  </td>
                  <td className="p-3 font-mono font-semibold text-amber-400">
                    {formatEnergy(s.energyConsumed)}
                  </td>
                  <td className="p-3 font-mono font-semibold text-emerald-400">
                    {formatCurrency(s.chargingCost)}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={s.status} />
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
