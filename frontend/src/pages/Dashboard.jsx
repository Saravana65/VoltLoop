import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  BatteryCharging,
  Zap,
  IndianRupee,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  QrCode,
  Activity,
  Layers,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { vehiclesApi, stationsApi, sessionsApi, analyticsApi } from '../services/api';
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
  const [summaryData, setSummaryData] = useState(null);
  const [chartMetric, setChartMetric] = useState('energy'); // 'energy' or 'cost'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vData, sData, allSess, actSess, summary] = await Promise.all([
        vehiclesApi.getAll(),
        stationsApi.getAll(),
        sessionsApi.getAll(),
        sessionsApi.getActive(),
        analyticsApi.getSummary().catch(() => null),
      ]);
      setVehicles(vData || []);
      setStations(sData || []);
      setSessions(allSess || []);
      setActiveSessions(actSess || []);
      setSummaryData(summary);
    } catch (err) {
      setError(err.message || 'Failed to load live fleet telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Metrics from real data
  const totalVehicles = vehicles.length;
  const activeChargingCount = activeSessions.length;
  const availableStationsCount = stations.filter((s) => s.status === 'AVAILABLE').length;
  const totalEnergyDispensed = summaryData?.totalEnergyConsumed ?? 
    sessions.reduce((acc, curr) => acc + (Number(curr.energyConsumed) || 0), 0);
  const totalChargingCost = summaryData?.totalChargingCost ?? 
    sessions.reduce((acc, curr) => acc + (Number(curr.chargingCost) || 0), 0);

  const dailyTrends = summaryData?.dailyEnergyConsumption || [];

  if (loading) {
    return <LoadingSpinner message="Querying VoltLoop fleet telemetry & grid nodes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Fleet Command Dashboard
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/25">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Grid Telemetry
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time electric vehicle telemetry, intelligent bay allocation, and university energy ledger.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/station-checkin"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500/40 hover:text-white transition shadow-sm"
          >
            <QrCode className="h-3.5 w-3.5 text-emerald-400" />
            <span>Station Check-In</span>
          </Link>

          <Link
            to="/smart-charging"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-sm shadow-emerald-500/20"
          >
            <Zap className="h-3.5 w-3.5 fill-slate-950" />
            <span>Smart Allocation</span>
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} onRetry={fetchDashboardData} />

      {/* 5-Column Responsive KPI Card Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <StatCard
          title="Registered EVs"
          value={totalVehicles}
          subtext="Active fleet inventory"
          icon={Car}
          accent="emerald"
        />
        <StatCard
          title="Active Charging Bays"
          value={activeChargingCount}
          subtext="Vehicles plugged in"
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
          title="Total Energy Delivered"
          value={totalEnergyDispensed.toFixed(1)}
          unit="kWh"
          subtext="Campus power dispensed"
          icon={Activity}
          accent="amber"
        />
        <StatCard
          title="Audited Charging Cost"
          value={formatCurrency(totalChargingCost)}
          subtext="Standard ₹15.00/kWh"
          icon={IndianRupee}
          accent="emerald"
        />
      </div>

      {/* Middle Section: Active Charging Monitor (2/3) + Campus Bays Status (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Charging Sessions Monitor */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <BatteryCharging className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-sans">
                  Active Charging Sessions
                </h3>
                <p className="text-[11px] text-slate-400">
                  Live vehicles actively connected to campus charging bays
                </p>
              </div>
            </div>
            <Link
              to="/sessions"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
            >
              <span>View Sessions</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {activeSessions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center bg-slate-950/40">
                <BatteryCharging className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-400">All charging bays are currently idle.</p>
                <Link
                  to="/smart-charging"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Allocate station for an EV <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              activeSessions.map((sess) => (
                <div
                  key={sess.sessionId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-slate-950/70 p-3.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/15 border border-cyan-500/25 font-mono text-xs font-bold text-cyan-300">
                      #{sess.sessionId}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {sess.registrationNo || `Vehicle #${sess.vehicleId}`}
                        </span>
                        {sess.qrIdentifier && (
                          <span className="rounded bg-slate-850 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400 border border-slate-800">
                            {sess.qrIdentifier}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Connected to <span className="font-semibold text-slate-300">{sess.stationName || `Station #${sess.stationId}`}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-medium">Initial SoC</span>
                      <span className="font-mono font-bold text-white">{sess.initialBattery}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-medium">Started At</span>
                      <span className="text-slate-300 font-mono text-[11px]">{formatDate(sess.startTime)}</span>
                    </div>
                    <StatusBadge status={sess.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Campus Charging Bays Status Panel */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">
                    Campus Charging Bays
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time hardware grid nodes
                  </p>
                </div>
              </div>
              <Link
                to="/stations"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
              >
                All Bays
              </Link>
            </div>

            <div className="mt-3.5 space-y-2">
              {stations.slice(0, 5).map((st) => (
                <div
                  key={st.stationId}
                  className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5 hover:border-slate-700/80 transition"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {st.stationName}
                      </span>
                      <span className="rounded bg-slate-850 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-300 border border-slate-800">
                        {st.powerRating} kW
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {st.location} • <span className="text-slate-300 font-mono">{st.connectorType}</span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={st.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Bays Online: <strong className="text-white font-mono">{stations.filter(s => s.status !== 'MAINTENANCE').length}</strong>/{stations.length}</span>
            <Link to="/stations" className="text-emerald-400 font-semibold hover:underline">Configure bays →</Link>
          </div>
        </div>
      </div>

      {/* Energy Consumption Trend Chart (Rendered from real dailyEnergyConsumption data) */}
      {dailyTrends.length > 0 && (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-sans">
                  Campus Power Consumption Trends
                </h3>
                <p className="text-[11px] text-slate-400">
                  Aggregated energy delivered across recent charging dates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setChartMetric('energy')}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                  chartMetric === 'energy'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Energy (kWh)
              </button>
              <button
                onClick={() => setChartMetric('cost')}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                  chartMetric === 'cost'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Billing (₹)
              </button>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="mt-4">
            <div className="h-48 w-full flex items-end gap-2 pt-4 px-2">
              {dailyTrends.map((item, idx) => {
                const val = chartMetric === 'energy' ? item.energyConsumed : item.chargingCost;
                const maxVal = Math.max(...dailyTrends.map(d => chartMetric === 'energy' ? d.energyConsumed : d.chargingCost), 1);
                const heightPct = Math.max(8, Math.round((val / maxVal) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {chartMetric === 'energy' ? `${val} kWh` : `₹${val}`}
                    </span>
                    <div
                      className="w-full max-w-[42px] rounded-t-md bg-gradient-to-t from-emerald-600/80 to-emerald-400 group-hover:to-cyan-400 transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] font-mono text-slate-400 truncate w-full text-center">
                      {item.date ? item.date.slice(5) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent Completed Charging Sessions Audit Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans">
                Recent Charging Records & Billing Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                Audited power consumption and billing logs
              </p>
            </div>
          </div>
          <Link
            to="/sessions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
          >
            <span>All Records</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-3.5 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-2.5 px-3">Session</th>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3">Station Bay</th>
                <th className="py-2.5 px-3">Timestamp Range</th>
                <th className="py-2.5 px-3 text-right">Energy (kWh)</th>
                <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sessions.slice(0, 5).map((s) => (
                <tr key={s.sessionId} className="hover:bg-slate-850/40 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-300">
                    #{s.sessionId}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-white">
                      {s.registrationNo || `EV #${s.vehicleId}`}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {s.vehicleType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-slate-200">
                      {s.stationName || `Station #${s.stationId}`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    <div>{formatDate(s.startTime)}</div>
                    {s.endTime && (
                      <div className="text-slate-400 text-[10px]">to {formatDate(s.endTime)}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-400 text-right">
                    {formatEnergy(s.energyConsumed)}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-right">
                    {formatCurrency(s.chargingCost)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
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
