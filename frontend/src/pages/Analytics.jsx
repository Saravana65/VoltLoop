import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Zap,
  BatteryCharging,
  IndianRupee,
  Clock,
  Layers,
  RefreshCw,
  TrendingUp,
  Activity,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { getAnalytics } from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency, formatEnergy } from '../utils/formatters';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('energy'); // 'energy' | 'sessions' | 'cost'

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalytics();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch campus analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <Loading message="Aggregating campus fleet energy and session analytics..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchAnalytics} />;
  }

  const dailyData = data?.dailyEnergyConsumption || [];
  const stationData = data?.stationUtilization || [];

  // Max calculations for chart scaling
  const maxEnergy = Math.max(...dailyData.map((d) => Number(d.energyConsumed) || 0), 30);
  const maxSessions = Math.max(...dailyData.map((d) => Number(d.sessionCount) || 0), 3);
  const maxCost = Math.max(...dailyData.map((d) => Number(d.chargingCost) || 0), 450);
  const maxStationEnergy = Math.max(...stationData.map((s) => Number(s.totalEnergy) || 0), 60);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              Fleet Energy & Utilization Analytics
            </h1>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Live JDBC Ledger
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time power dispensing metrics, station utilization distribution, and cost accounting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Ledger
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Energy Consumed"
          value={data?.totalEnergyConsumed != null ? data.totalEnergyConsumed.toFixed(1) : '0.0'}
          unit="kWh"
          subtext="Audited across all sessions"
          icon={Zap}
          accent="amber"
        />
        <StatCard
          title="Total Charging Sessions"
          value={data?.totalChargingSessions || 0}
          unit={`(${data?.activeSessionsCount || 0} active)`}
          subtext="Total campus connections"
          icon={BatteryCharging}
          accent="cyan"
        />
        <StatCard
          title="Total Charging Cost"
          value={formatCurrency(data?.totalChargingCost || 0)}
          subtext="Audited at ₹15.00/kWh"
          icon={IndianRupee}
          accent="emerald"
        />
        <StatCard
          title="Avg Session Duration"
          value={data?.averageDurationMinutes ? `${data.averageDurationMinutes.toFixed(0)}m` : '0m'}
          unit={data?.averageDurationMinutes ? `(${(data.averageDurationMinutes / 60).toFixed(1)}h)` : ''}
          subtext="Average turnaround time"
          icon={Clock}
          accent="purple"
        />
        <StatCard
          title="Station Utilization"
          value={`${data?.totalStations ? (((data.totalStations - data.availableStations) / data.totalStations) * 100).toFixed(0) : 0}%`}
          unit={`${data?.totalStations - data?.availableStations}/${data?.totalStations}`}
          subtext="Bays in use / maintenance"
          icon={Layers}
          accent="emerald"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Daily Breakdown */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Daily Charging Trends
              </h3>
              <p className="text-xs text-slate-400">Timeline breakdown across active charging dates</p>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setActiveChartTab('energy')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  activeChartTab === 'energy'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Energy (kWh)
              </button>
              <button
                onClick={() => setActiveChartTab('sessions')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  activeChartTab === 'sessions'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sessions
              </button>
              <button
                onClick={() => setActiveChartTab('cost')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  activeChartTab === 'cost'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Billing (₹)
              </button>
            </div>
          </div>

          {/* SVG Bar Visualizer */}
          <div className="h-64 w-full pt-4">
            {dailyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No daily energy telemetry available.
              </div>
            ) : (
              <div className="h-full flex items-end justify-between gap-3 px-2 pb-6 border-b border-slate-800">
                {dailyData.map((item, idx) => {
                  let val = 0;
                  let maxVal = 1;
                  let colorClass = 'bg-amber-500';
                  let displayVal = '';

                  if (activeChartTab === 'energy') {
                    val = Number(item.energyConsumed) || 0;
                    maxVal = maxEnergy;
                    colorClass = 'bg-gradient-to-t from-amber-600 to-amber-400';
                    displayVal = `${val} kWh`;
                  } else if (activeChartTab === 'sessions') {
                    val = Number(item.sessionCount) || 0;
                    maxVal = maxSessions;
                    colorClass = 'bg-gradient-to-t from-cyan-600 to-cyan-400';
                    displayVal = `${val} sess`;
                  } else {
                    val = Number(item.chargingCost) || 0;
                    maxVal = maxCost;
                    colorClass = 'bg-gradient-to-t from-emerald-600 to-emerald-400';
                    displayVal = `₹${val}`;
                  }

                  const heightPercent = Math.max(12, Math.round((val / maxVal) * 100));

                  return (
                    <div
                      key={item.date || idx}
                      className="group relative flex-1 flex flex-col items-center justify-end h-full"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-slate-950 border border-slate-700 px-2 py-1 rounded shadow-lg text-[11px] font-mono whitespace-nowrap text-white">
                        <div>{item.date}</div>
                        <div className="font-bold text-emerald-400">{displayVal}</div>
                      </div>

                      {/* Bar */}
                      <div
                        className={`w-full max-w-[48px] rounded-t-md transition-all duration-500 ${colorClass} opacity-85 group-hover:opacity-100 shadow-md`}
                        style={{ height: `${heightPercent}%` }}
                      />

                      {/* Date label */}
                      <span className="absolute -bottom-5 text-[10px] font-mono text-slate-400 truncate max-w-[60px]">
                        {item.date ? item.date.slice(5) : `D${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Station Usage Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Station Bay Energy Dispensed
            </h3>
            <p className="text-xs text-slate-400">Total kWh delivered per campus charging station</p>
          </div>

          <div className="space-y-4 pt-2">
            {stationData.map((station) => {
              const energy = Number(station.totalEnergy) || 0;
              const percent = Math.round((energy / maxStationEnergy) * 100);

              return (
                <div key={station.stationId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{station.stationName}</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
                        {station.powerRating} kW
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-amber-400">
                      {energy.toFixed(1)} kWh
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-700"
                      style={{ width: `${Math.max(3, percent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{station.sessionCount} sessions completed</span>
                    <span>{formatCurrency(station.totalCost || 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Station Utilization Ledger Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Station Utilization Ledger</h3>
            <p className="text-xs text-slate-400">Comprehensive hardware utilization and electrical load</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {stationData.length} bays configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Station ID</th>
                <th className="p-3.5">Station Bay</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Power & Standard</th>
                <th className="p-3.5">Sessions</th>
                <th className="p-3.5">Energy Dispensed</th>
                <th className="p-3.5">Total Revenue</th>
                <th className="p-3.5">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stationData.map((st) => (
                <tr key={st.stationId} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5 font-mono font-bold text-slate-400">#{st.stationId}</td>
                  <td className="p-3.5 font-bold text-white">{st.stationName}</td>
                  <td className="p-3.5 text-slate-300">{st.location}</td>
                  <td className="p-3.5">
                    <span className="font-mono text-cyan-400 font-semibold">{st.powerRating} kW</span>
                    <span className="text-slate-400 ml-1.5 font-medium">({st.connectorType})</span>
                  </td>
                  <td className="p-3.5 font-mono text-white font-semibold">
                    {st.sessionCount}
                  </td>
                  <td className="p-3.5 font-mono font-semibold text-amber-400">
                    {formatEnergy(st.totalEnergy)}
                  </td>
                  <td className="p-3.5 font-mono font-semibold text-emerald-400">
                    {formatCurrency(st.totalCost)}
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={st.status} />
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
