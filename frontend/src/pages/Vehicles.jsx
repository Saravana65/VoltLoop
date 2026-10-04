import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Plus, Search, Battery, ExternalLink, RefreshCw, X, Check, Edit2 } from 'lucide-react';
import { vehiclesApi, usersApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getBatteryColor } from '../utils/formatters';

const VEHICLE_TYPES = [
  '2-Wheeler (e-Scooter)',
  '2-Wheeler (e-Motorbike)',
  '4-Wheeler (Compact EV)',
  '4-Wheeler (Sedan EV)',
  '4-Wheeler (SUV EV)',
  'Campus Shuttle Bus',
  'Campus Delivery Van',
  'Maintenance Utility Cart',
];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState(null);
  const [formData, setFormData] = useState({
    userId: 1,
    vehicleType: '4-Wheeler (Compact EV)',
    registrationNo: '',
    batteryCapacity: 30.0,
    currentBattery: 50.0,
    qrIdentifier: '',
  });

  // Battery Update Modal State
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [newBatteryVal, setNewBatteryVal] = useState(50);
  const [batteryLoading, setBatteryLoading] = useState(false);
  const [batteryError, setBatteryError] = useState(null);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vData, uData] = await Promise.all([
        vehiclesApi.getAll(),
        usersApi.getAll().catch(() => []),
      ]);
      setVehicles(vData || []);
      setUsers(uData || []);
    } catch (err) {
      setError(err.message || 'Failed to load vehicle fleet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);
    try {
      await vehiclesApi.register({
        userId: Number(formData.userId),
        vehicleType: formData.vehicleType,
        registrationNo: formData.registrationNo.trim().toUpperCase(),
        batteryCapacity: Number(formData.batteryCapacity),
        currentBattery: Number(formData.currentBattery),
        qrIdentifier: (formData.qrIdentifier || `VN-EV-${Date.now().toString().slice(-3)}`).trim().toUpperCase(),
      });
      setIsRegisterOpen(false);
      setFormData({
        userId: users[0]?.userId || 1,
        vehicleType: '4-Wheeler (Compact EV)',
        registrationNo: '',
        batteryCapacity: 30.0,
        currentBattery: 50.0,
        qrIdentifier: '',
      });
      fetchVehicles();
    } catch (err) {
      setRegError(err.message || 'Failed to register vehicle.');
    } finally {
      setRegLoading(false);
    }
  };

  const openBatteryModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setNewBatteryVal(vehicle.currentBattery);
    setBatteryError(null);
    setIsBatteryModalOpen(true);
  };

  const handleBatterySubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setBatteryLoading(true);
    setBatteryError(null);
    try {
      await vehiclesApi.updateBattery(selectedVehicle.vehicleId, newBatteryVal);
      setIsBatteryModalOpen(false);
      fetchVehicles();
    } catch (err) {
      setBatteryError(err.message || 'Failed to update battery level.');
    } finally {
      setBatteryLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.registrationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.qrIdentifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading EV fleet inventory..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">EV Fleet Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            Registered campus electric vehicles, telemetry, battery capacity, and unique QR identifiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVehicles}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition"
          >
            <Plus className="h-4 w-4" />
            Register EV
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onRetry={fetchVehicles} />

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by registration, QR, type, or driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="font-bold text-white">{filteredVehicles.length}</span> of {vehicles.length} EVs
        </div>
      </div>

      {/* Fleet Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Registration</th>
                <th className="p-3.5">Vehicle Type</th>
                <th className="p-3.5">Battery %</th>
                <th className="p-3.5">Capacity</th>
                <th className="p-3.5">QR Identifier</th>
                <th className="p-3.5">Driver / Owner</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVehicles.map((v) => {
                const color = getBatteryColor(v.currentBattery);
                return (
                  <tr key={v.vehicleId} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5 font-mono text-slate-400">#{v.vehicleId}</td>
                    <td className="p-3.5 font-bold text-white tracking-wide">
                      <Link to={`/vehicles/${v.vehicleId}`} className="hover:text-emerald-400 transition">
                        {v.registrationNo}
                      </Link>
                    </td>
                    <td className="p-3.5 text-slate-300">{v.vehicleType}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                          <div
                            className={`h-full rounded-full ${color.bg}`}
                            style={{ width: `${Math.min(100, Math.max(0, v.currentBattery))}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold text-slate-200">{v.currentBattery}%</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">{v.batteryCapacity} kWh</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                        {v.qrIdentifier}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="text-white font-medium">{v.ownerName || 'Campus User'}</div>
                      <div className="text-[11px] text-slate-400">{v.ownerEmail || '—'}</div>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openBatteryModal(v)}
                          className="rounded border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition"
                          title="Update Battery SoC"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          to={`/vehicles/${v.vehicleId}`}
                          className="rounded border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:border-emerald-500 hover:text-white transition"
                          title="View Details"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register EV Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Register New Electric Vehicle</h3>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {regError && <div className="mt-3"><ErrorAlert message={regError} /></div>}

            <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-EV-9999"
                  value={formData.registrationNo}
                  onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white font-mono uppercase focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300">Vehicle Type</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300">Battery Capacity (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="200"
                    required
                    value={formData.batteryCapacity}
                    onChange={(e) => setFormData({ ...formData, batteryCapacity: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300">Initial Battery (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={formData.currentBattery}
                    onChange={(e) => setFormData({ ...formData, currentBattery: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300">Driver / Owner</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.name} ({u.role}) — {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300">Custom QR Identifier (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty (e.g. VN-EV-099)"
                  value={formData.qrIdentifier}
                  onChange={(e) => setFormData({ ...formData, qrIdentifier: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white font-mono uppercase focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {regLoading ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Battery SoC Update Modal */}
      {isBatteryModalOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Update Battery Level</h3>
              <button
                onClick={() => setIsBatteryModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {batteryError && <div className="mt-3"><ErrorAlert message={batteryError} /></div>}

            <form onSubmit={handleBatterySubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <p className="text-slate-400">
                  Vehicle: <span className="font-bold text-white">{selectedVehicle.registrationNo}</span>
                </p>
                <p className="text-slate-400">
                  Current Battery: <span className="font-bold text-emerald-400">{selectedVehicle.currentBattery}%</span>
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300">
                  New Battery Level: <span className="font-bold text-white">{newBatteryVal}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={newBatteryVal}
                  onChange={(e) => setNewBatteryVal(Number(e.target.value))}
                  className="mt-2 w-full accent-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBatteryModalOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batteryLoading}
                  className="rounded-lg bg-emerald-500 px-4 py-1.5 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {batteryLoading ? 'Saving...' : 'Update Battery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
