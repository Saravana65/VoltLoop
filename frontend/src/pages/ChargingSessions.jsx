import React, { useState, useEffect } from 'react';
import { Clock, BatteryCharging, CheckCircle2, RefreshCw, Zap, IndianRupee, ArrowRight, X } from 'lucide-react';
import { sessionsApi, smartChargingApi, vehiclesApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { formatCurrency, formatEnergy, formatDate } from '../utils/formatters';

export default function ChargingSessions() {
  const [activeTab, setActiveTab] = useState('active');
  const [sessions, setSessions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const batteryGain = Math.max(0, finalBattery - (selectedSession?.initialBattery || 0));
  const capacity = selectedVehicle?.batteryCapacity || 40.0;
  const previewEnergy = ((capacity * batteryGain) / 100).toFixed(2);
  const previewCost = (previewEnergy * 15.0).toFixed(2);

  if (loading) return <LoadingSpinner message="Auditing charging sessions and power flow..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Charging Sessions</h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time power dispensing, active bay monitoring, and energy consumption auditing.
          </p>
        </div>

        <button
          onClick={fetchSessions}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <ErrorAlert message={error} onRetry={fetchSessions} />

      <div className="flex items-center gap-3 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'active'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BatteryCharging className="h-4 w-4 text-cyan-400" />
          Active Sessions
          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-mono text-cyan-400">
            {activeSessions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'completed'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Completed History
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-400">
            {completedSessions.length}
          </span>
        </button>
      </div>

      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/40">
              <BatteryCharging className="mx-auto h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm text-slate-400">No charging sessions are currently active.</p>
              <p className="text-xs text-slate-500 mt-1">Plug in an EV via the Smart Charging page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSessions.map((sess) => (
                <div
                  key={sess.sessionId}
                  className="rounded-xl border border-cyan-500/30 bg-slate-900/80 p-5 shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400">Session #{sess.sessionId}</span>
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                            {sess.qrIdentifier}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mt-1">{sess.registrationNo}</h3>
                        <p className="text-xs text-slate-400">{sess.vehicleType}</p>
                      </div>
                      <StatusBadge status="CHARGING" />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs border-t border-slate-800 pt-3">
                      <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Charging Station</span>
                        <span className="text-sm font-bold text-white truncate block">{sess.stationName}</span>
                        <span className="text-[10px] text-slate-500">{sess.stationLocation}</span>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Initial Battery</span>
                        <span className="text-sm font-bold text-cyan-400">{sess.initialBattery}%</span>
                      </div>
                      <div className="col-span-2 rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Started At</span>
                        <span className="text-xs font-mono text-slate-200">{formatDate(sess.startTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex justify-end">
                    <button
                      onClick={() => openCompleteModal(sess)}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Complete Session & Calculate Bill
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Vehicle</th>
                  <th className="p-3.5">Station</th>
                  <th className="p-3.5">Start Time</th>
                  <th className="p-3.5">End Time</th>
                  <th className="p-3.5">SoC Delta</th>
                  <th className="p-3.5">Energy (kWh)</th>
                  <th className="p-3.5">Total Cost (₹)</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {completedSessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5 font-mono text-slate-400 font-bold">#{s.sessionId}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-white block">{s.registrationNo}</span>
                      <span className="font-mono text-[11px] text-emerald-400">{s.qrIdentifier}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-white block">{s.stationName}</span>
                      <span className="text-[11px] text-slate-400">{s.stationLocation}</span>
                    </td>
                    <td className="p-3.5 text-slate-300">{formatDate(s.startTime)}</td>
                    <td className="p-3.5 text-slate-300">{formatDate(s.endTime)}</td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {s.initialBattery}% → {s.finalBattery || 100}%
                    </td>
                    <td className="p-3.5 font-mono font-bold text-amber-400">
                      {formatEnergy(s.energyConsumed)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400">
                      {formatCurrency(s.chargingCost)}
                    </td>
                    <td className="p-3.5"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isCompleteModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Complete Charging Session</h3>
              </div>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {completeError && <div className="mt-3"><ErrorAlert message={completeError} /></div>}

            <form onSubmit={handleCompleteSubmit} className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 space-y-1">
                <p className="text-slate-400">
                  Vehicle: <span className="font-bold text-white">{selectedSession.registrationNo}</span>
                </p>
                <p className="text-slate-400">
                  Station: <span className="font-bold text-white">{selectedSession.stationName}</span>
                </p>
                <p className="text-slate-400">
                  Initial Battery SoC: <span className="font-mono text-cyan-400">{selectedSession.initialBattery}%</span>
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300">
                  Final Battery Level (%): <span className="font-bold text-emerald-400">{finalBattery}%</span>
                </label>
                <input
                  type="range"
                  min={Math.ceil(selectedSession.initialBattery)}
                  max="100"
                  step="1"
                  value={finalBattery}
                  onChange={(e) => setFinalBattery(Number(e.target.value))}
                  className="mt-2 w-full accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Energy Dispensed</span>
                  <span className="text-sm font-bold text-amber-300">{previewEnergy} kWh</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Calculated Cost</span>
                  <span className="text-sm font-bold text-emerald-400">{formatCurrency(previewCost)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completeLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {completeLoading ? 'Finalizing Session...' : 'Confirm Session Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
