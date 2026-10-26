import React, { useState, useEffect } from 'react';
import {
  Clock,
  BatteryCharging,
  CheckCircle2,
  RefreshCw,
  Zap,
  IndianRupee,
  ArrowRight,
  X,
  Activity,
  Check,
  AlertCircle,
} from 'lucide-react';
import { sessionsApi, smartChargingApi, vehiclesApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { formatCurrency, formatEnergy, formatDate } from '../utils/formatters';

export default function ChargingSessions() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [sessions, setSessions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Complete Session Modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [finalBattery, setFinalBattery] = useState(100);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allData, actData] = await Promise.all([
        sessionsApi.getAll(),
        sessionsApi.getActive(),
      ]);
      setSessions(allData || []);
      setActiveSessions(actData || []);
    } catch (err) {
      setError(err.message || 'Failed to load charging sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const openCompleteModal = async (session) => {
    setSelectedSession(session);
    setFinalBattery(100);
    setCompleteError(null);
    setIsCompleteModalOpen(true);
    try {
      const v = await vehiclesApi.getById(session.vehicleId);
      setSelectedVehicle(v);
    } catch (e) {
      setSelectedVehicle(null);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    setCompleteLoading(true);
    setCompleteError(null);
    try {
      await smartChargingApi.complete({
        sessionId: selectedSession.sessionId,
        finalBattery: Number(finalBattery),
      });
      setIsCompleteModalOpen(false);
      fetchSessions();
    } catch (err) {
      setCompleteError(err.message || 'Failed to complete session.');
    } finally {
      setCompleteLoading(false);
    }
  };

  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');

  // Mathematical formula calculations
  const batteryGain = Math.max(0, finalBattery - (selectedSession?.initialBattery || 0));
  const capacity = selectedVehicle?.batteryCapacity || 40.0;
  const previewEnergy = ((capacity * batteryGain) / 100).toFixed(2);
  const previewCost = (previewEnergy * 15.0).toFixed(2);

  if (loading) return <LoadingSpinner message="Auditing charging sessions and power ledger..." />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Live Charging Sessions & Billing
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time power dispensing, active bay monitoring, and energy consumption auditing (Cost = kWh × ₹15.00).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSessions}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onRetry={fetchSessions} />

      {/* Segmented Tab Control */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === 'active'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BatteryCharging className="h-4 w-4" />
            <span>Active Sessions</span>
            <span className="rounded-full bg-cyan-500/20 px-2 py-0.2 text-[10px] font-mono">
              {activeSessions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === 'completed'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed History</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.2 text-[10px] font-mono">
              {completedSessions.length}
            </span>
          </button>
        </div>

        <span className="hidden sm:inline-flex text-xs text-slate-400 font-mono">
          Tariff Rate: ₹15.00 / kWh
        </span>
      </div>

      {/* TAB 1: Active Charging Sessions Cards */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/40">
              <BatteryCharging className="mx-auto h-10 w-10 text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-white">No Active Charging Sessions</h3>
              <p className="text-xs text-slate-400 mt-1">All charging bays are currently disconnected and available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSessions.map((sess) => (
                <div
                  key={sess.sessionId}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-sm space-y-4 hover:border-slate-700/80 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Zap className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {sess.registrationNo || `EV #${sess.vehicleId}`}
                          </h3>
                          <span className="font-mono text-xs text-slate-400">
                            #{sess.sessionId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Station: <strong className="text-slate-300">{sess.stationName || `Bay #${sess.stationId}`}</strong>
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={sess.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                    <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-850">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Initial SoC</span>
                      <span className="text-sm font-bold text-white font-mono mt-0.5 block">{sess.initialBattery}%</span>
                    </div>
                    <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-850">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Connected At</span>
                      <span className="text-xs font-semibold text-slate-300 font-mono mt-0.5 block truncate">
                        {formatDate(sess.startTime)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => openCompleteModal(sess)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-sm shadow-emerald-500/20"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Complete Session & Bill</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Completed Sessions History Table */}
      {activeTab === 'completed' && (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/70 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-3.5">Session ID</th>
                  <th className="py-3 px-3.5">Vehicle License</th>
                  <th className="py-3 px-3.5">Station Bay</th>
                  <th className="py-3 px-3.5">Start / End Time</th>
                  <th className="py-3 px-3.5 text-right">Energy (kWh)</th>
                  <th className="py-3 px-3.5 text-right">Total Cost (₹)</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {completedSessions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No completed charging sessions recorded.
                    </td>
                  </tr>
                ) : (
                  completedSessions.map((s) => (
                    <tr key={s.sessionId} className="hover:bg-slate-850/40 transition">
                      <td className="py-3 px-3.5 font-mono text-slate-400 font-bold">
                        #{s.sessionId}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-semibold text-white block">
                          {s.registrationNo || `EV #${s.vehicleId}`}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {s.vehicleType}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-medium text-slate-200">
                          {s.stationName || `Station #${s.stationId}`}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-300 font-mono text-[11px]">
                        <div>{formatDate(s.startTime)}</div>
                        {s.endTime && <div className="text-slate-400 text-[10px]">to {formatDate(s.endTime)}</div>}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-amber-400 text-right">
                        {formatEnergy(s.energyConsumed)}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-emerald-400 text-right">
                        {formatCurrency(s.chargingCost)}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <StatusBadge status={s.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complete Session Modal */}
      {isCompleteModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Complete Session & Reconcile Bill</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Session #{selectedSession.sessionId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {completeError && <ErrorAlert message={completeError} />}

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle</span>
                  <span className="font-bold text-white">{selectedSession.registrationNo || `EV #${selectedSession.vehicleId}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Charging Bay</span>
                  <span className="font-medium text-slate-200">{selectedSession.stationName || `Station #${selectedSession.stationId}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Initial SoC</span>
                  <span className="font-mono font-bold text-white">{selectedSession.initialBattery}%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-300">
                    Final Disconnect SoC
                  </label>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{finalBattery}%</span>
                </div>
                <input
                  type="range"
                  min={selectedSession.initialBattery || 0}
                  max="100"
                  step="1"
                  value={finalBattery}
                  onChange={(e) => setFinalBattery(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Real-time Math Formulation Preview Card */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Automated Power Billing Preview
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Energy Dispensed</span>
                    <span className="font-mono font-bold text-white text-sm">{previewEnergy} kWh</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Calculated Cost (₹15/kWh)</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">₹{previewCost}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completeLoading}
                  className="rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50"
                >
                  {completeLoading ? 'Finalizing...' : 'Conclude & Release Bay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
