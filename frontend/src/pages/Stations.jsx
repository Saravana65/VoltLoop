import React, { useState, useEffect } from 'react';
import {
  BatteryCharging,
  Plus,
  RefreshCw,
  Zap,
  MapPin,
  Wrench,
  CheckCircle2,
  X,
  AlertCircle,
  Activity,
  Layers,
} from 'lucide-react';
import { stationsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const CONNECTOR_TYPES = ['Type 2', 'CCS2', 'Standard 15A'];
const CHARGER_TYPES = ['AC Level 2 Dual', 'AC Level 2 Single', 'DC Fast Charger', 'AC Standard Socket'];

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Station Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    stationName: '',
    location: '',
    chargerType: 'AC Level 2 Dual',
    connectorType: 'Type 2',
    powerRating: 22.0,
    status: 'AVAILABLE',
  });

  const fetchStations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stationsApi.getAll();
      setStations(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load charging stations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleStatusToggle = async (station) => {
    const nextStatus = station.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await stationsApi.updateStatus(station.stationId, nextStatus);
      fetchStations();
    } catch (err) {
      alert(err.message || 'Failed to update station status.');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setModalError(null);
    try {
      await stationsApi.create({
        stationName: formData.stationName.trim().toUpperCase(),
        location: formData.location.trim(),
        chargerType: formData.chargerType,
        connectorType: formData.connectorType,
        powerRating: Number(formData.powerRating),
        status: formData.status,
      });
      setIsModalOpen(false);
      setFormData({
        stationName: '',
        location: '',
        chargerType: 'AC Level 2 Dual',
        connectorType: 'Type 2',
        powerRating: 22.0,
        status: 'AVAILABLE',
      });
      fetchStations();
    } catch (err) {
      setModalError(err.message || 'Failed to add charging bay.');
    } finally {
      setActionLoading(false);
    }
  };

  const availableCount = stations.filter((s) => s.status === 'AVAILABLE').length;
  const occupiedCount = stations.filter((s) => s.status === 'OCCUPIED').length;
  const maintenanceCount = stations.filter((s) => s.status === 'MAINTENANCE').length;

  if (loading) return <LoadingSpinner message="Scanning campus charging infrastructure..." />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Charging Stations & Grid Nodes
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Hardware distribution, real-time bay availability, connector specifications, and maintenance control.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStations}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-sm shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Charging Bay</span>
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onRetry={fetchStations} />

      {/* Grid Infrastructure Quick Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Total Bays</span>
          <span className="text-2xl font-bold text-white mt-1 block font-mono">{stations.length}</span>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block">Available</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block font-mono">{availableCount}</span>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block">Occupied / In Use</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block font-mono">{occupiedCount}</span>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 block">Maintenance</span>
          <span className="text-2xl font-bold text-rose-400 mt-1 block font-mono">{maintenanceCount}</span>
        </div>
      </div>

      {/* Station Bays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.map((st) => (
          <div
            key={st.stationId}
            className="group rounded-xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Zap className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {st.stationName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Bay #{st.stationId}
                    </span>
                  </div>
                </div>
                <StatusBadge status={st.status} />
              </div>

              {/* Station Details */}
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{st.location}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-850">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Power Rating</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">{st.powerRating} kW</span>
                  </div>
                  <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-850">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Connector Standard</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block truncate">{st.connectorType}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Architecture: <span className="text-slate-300 font-medium">{st.chargerType}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-mono">
                {st.status === 'AVAILABLE' ? 'Online & Ready' : st.status === 'OCCUPIED' ? 'Dispensing Power' : 'Offline / Service'}
              </span>

              <button
                onClick={() => handleStatusToggle(st)}
                disabled={st.status === 'OCCUPIED'}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  st.status === 'MAINTENANCE'
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Wrench className="h-3 w-3" />
                <span>{st.status === 'MAINTENANCE' ? 'Set Available' : 'Set Maint.'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Charging Bay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add Campus Charging Bay</h3>
                  <p className="text-[11px] text-slate-400">Register new charging station node</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && <ErrorAlert message={modalError} />}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Station Identifier / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-LIB-01"
                  value={formData.stationName}
                  onChange={(e) => setFormData({ ...formData, stationName: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono uppercase focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Campus Location Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Library West Parking Bay"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Connector Type *
                  </label>
                  <select
                    value={formData.connectorType}
                    onChange={(e) => setFormData({ ...formData, connectorType: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {CONNECTOR_TYPES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Power Rating (kW) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="350"
                    required
                    value={formData.powerRating}
                    onChange={(e) => setFormData({ ...formData, powerRating: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Charger Architecture *
                </label>
                <select
                  value={formData.chargerType}
                  onChange={(e) => setFormData({ ...formData, chargerType: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {CHARGER_TYPES.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Creating Bay...' : 'Save Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
