import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Plus,
  Search,
  Battery,
  ExternalLink,
  RefreshCw,
  X,
  Check,
  Edit2,
  QrCode,
  Zap,
  User,
  Sliders,
} from 'lucide-react';
import { vehiclesApi, usersApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import BatteryIndicator from '../components/BatteryIndicator';
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
        qrIdentifier: (formData.qrIdentifier || `VL-EV-${Date.now().toString().slice(-3)}`).trim().toUpperCase(),
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            EV Fleet Asset Inventory
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Registered electric vehicles, telemetry state-of-charge, battery capacities, and unique QR boarding passes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchVehicles}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-sm shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Register EV</span>
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onRetry={fetchVehicles} />

      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by license plate, QR code, model, driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="rounded-md bg-slate-900 border border-slate-800 px-2 py-1 font-mono text-slate-300">
            {filteredVehicles.length} of {vehicles.length} EVs
          </span>
        </div>
      </div>

      {/* Fleet Table Card */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/70 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3 px-3.5">ID</th>
                <th className="py-3 px-3.5">Vehicle License</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Battery SoC</th>
                <th className="py-3 px-3.5">Pack Capacity</th>
                <th className="py-3 px-3.5">QR Identifier</th>
                <th className="py-3 px-3.5">Driver / Owner</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No electric vehicles match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => {
                  const color = getBatteryColor(v.currentBattery);
                  return (
                    <tr key={v.vehicleId} className="hover:bg-slate-850/40 transition">
                      <td className="py-3 px-3.5 font-mono text-slate-400">
                        #{v.vehicleId}
                      </td>
                      <td className="py-3 px-3.5">
                        <Link
                          to={`/vehicles/${v.vehicleId}`}
                          className="font-bold text-white hover:text-emerald-400 transition flex items-center gap-1.5"
                        >
                          <span>{v.registrationNo}</span>
                          <ExternalLink className="h-3 w-3 text-slate-500" />
                        </Link>
                      </td>
                      <td className="py-3 px-3.5 text-slate-300">
                        {v.vehicleType}
                      </td>
                      <td className="py-3 px-3.5 min-w-[140px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full ${color.bg}`}
                              style={{ width: `${Math.min(100, Math.max(0, v.currentBattery))}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-white text-[11px]">
                            {v.currentBattery}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-300">
                        {v.batteryCapacity} kWh
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-850 border border-slate-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                          <QrCode className="h-3 w-3 text-emerald-400/80" />
                          {v.qrIdentifier}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-slate-200">
                          {v.ownerName || 'Campus User'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {v.ownerEmail || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openBatteryModal(v)}
                            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 transition"
                            title="Adjust Battery SoC"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                          </button>
                          <Link
                            to={`/vehicles/${v.vehicleId}`}
                            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:border-slate-700 hover:text-white transition"
                            title="View Full Profile & Pass"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register EV Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                  <Car className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Register New Electric Vehicle</h3>
                  <p className="text-[11px] text-slate-400">Add asset to university fleet directory</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {regError && <ErrorAlert message={regError} />}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  License Plate / Registration No *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-EV-9020"
                  value={formData.registrationNo}
                  onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono uppercase focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Vehicle Category / Type *
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Pack Capacity (kWh) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="200"
                    required
                    value={formData.batteryCapacity}
                    onChange={(e) => setFormData({ ...formData, batteryCapacity: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Initial Battery (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.currentBattery}
                    onChange={(e) => setFormData({ ...formData, currentBattery: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Assigned User / Driver *
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.name} ({u.role}) — {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Unique QR Identifier (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if blank (e.g. VL-EV-099)"
                  value={formData.qrIdentifier}
                  onChange={(e) => setFormData({ ...formData, qrIdentifier: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono uppercase focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50"
                >
                  {regLoading ? 'Registering...' : 'Save & Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Battery SoC Update Modal */}
      {isBatteryModalOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Update Battery SoC</h3>
                  <p className="text-[10px] text-slate-400 font-mono">{selectedVehicle.registrationNo}</p>
                </div>
              </div>
              <button
                onClick={() => setIsBatteryModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {batteryError && <ErrorAlert message={batteryError} />}

            <form onSubmit={handleBatterySubmit} className="space-y-4 text-xs">
              <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 flex items-center justify-between">
                <span className="text-slate-400">Current Level</span>
                <span className="font-mono font-bold text-white text-sm">{selectedVehicle.currentBattery}%</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-semibold text-slate-300">Target Level</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">{newBatteryVal}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={newBatteryVal}
                  onChange={(e) => setNewBatteryVal(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBatteryModalOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batteryLoading}
                  className="rounded-lg bg-emerald-500 px-4 py-1.5 font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50"
                >
                  {batteryLoading ? 'Saving...' : 'Apply Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
