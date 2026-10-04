import React, { useState, useEffect } from 'react';
import { BatteryCharging, Plus, RefreshCw, Zap, MapPin, Wrench, CheckCircle, X } from 'lucide-react';
import { stationsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const CONNECTOR_TYPES = ['Type-2 AC', 'CCS2 Fast DC', 'Normal AC (5A/15A Socket)', 'Type 2'];
const CHARGER_TYPES = ['AC Level 2', 'DC Fast Charger'];

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
    chargerType: 'AC Level 2',
    connectorType: 'Type-2 AC',
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
        chargerType: 'AC Level 2',
        connectorType: 'Type-2 AC',
        powerRating: 22.0,
        status: 'AVAILABLE',
      });
      fetchStations();
    } catch (err) {
      setModalError(err.message || 'Failed to add station.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Scanning campus charging bays..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Charging Stations</h1>
          <p className="mt-1 text-sm text-slate-400">
            Campus EV charging bays, power ratings (kW), connector compatibility, and operational status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStations}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition"
          >
            <Plus className="h-4 w-4" />
            Add Station Bay
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onRetry={fetchStations} />

      {/* Stations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stations.map((st) => (
          <div
            key={st.stationId}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-wide">{st.stationName}</h3>
                    <span className="font-mono text-xs text-slate-400">#{st.stationId}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span>{st.location}</span>
                  </div>
                </div>
                <StatusBadge status={st.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs border-t border-slate-800 pt-3">
                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Power Rating</span>
                  <span className="text-sm font-bold text-emerald-400">{st.powerRating} kW</span>
                </div>
                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Charger Type</span>
                  <span className="text-xs font-semibold text-white truncate block">{st.chargerType}</span>
                </div>
                <div className="col-span-2 rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Connector Standard</span>
                  <span className="text-xs font-semibold text-cyan-400">{st.connectorType}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
              <span className="text-[11px] text-slate-400">Hardware Control:</span>
              <button
                onClick={() => handleStatusToggle(st)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  st.status === 'MAINTENANCE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                }`}
              >
                <Wrench className="h-3 w-3" />
                {st.status === 'MAINTENANCE' ? 'Restore Available' : 'Mark Maintenance'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Station Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Add Charging Station Bay</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && <div className="mt-3"><ErrorAlert message={modalError} /></div>}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300">Station Code / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-AUDITORIUM-01"
                  value={formData.stationName}
                  onChange={(e) => setFormData({ ...formData, stationName: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white font-mono uppercase focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300">Campus Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auditorium Parking Lot B"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300">Charger Type</label>
                  <select
                    value={formData.chargerType}
                    onChange={(e) => setFormData({ ...formData, chargerType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {CHARGER_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300">Power Rating (kW)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="350"
                    required
                    value={formData.powerRating}
                    onChange={(e) => setFormData({ ...formData, powerRating: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300">Connector Standard</label>
                <select
                  value={formData.connectorType}
                  onChange={(e) => setFormData({ ...formData, connectorType: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {CONNECTOR_TYPES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
