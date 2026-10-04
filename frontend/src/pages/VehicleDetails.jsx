import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Car, Zap, ArrowLeft, Battery, QrCode, Clock, Shield, RefreshCw } from 'lucide-react';
import { vehiclesApi, smartChargingApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { formatCurrency, formatEnergy, formatDate, getBatteryColor } from '../utils/formatters';

export default function VehicleDetails() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const v = await vehiclesApi.getById(id);
      setVehicle(v);
      const hist = await smartChargingApi.getHistory(id).catch(() => []);
      setHistory(hist || []);
    } catch (err) {
      setError(err.message || 'Failed to load EV profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  if (loading) return <LoadingSpinner message="Fetching vehicle telemetry..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchVehicleDetails} />;
  if (!vehicle) return <p className="text-slate-400">Vehicle not found.</p>;

  const color = getBatteryColor(vehicle.currentBattery);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          to="/vehicles"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Fleet Inventory
        </Link>
        <Link
          to={`/smart-charging?qr=${encodeURIComponent(vehicle.qrIdentifier)}`}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-95 transition"
        >
          <Zap className="h-4 w-4" />
          Find Charging Station
        </Link>
      </div>

      {/* Main Vehicle Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Battery Gauge & Status */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Circular Meter Background */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={color.hex}
                strokeWidth="10"
                strokeDasharray="440"
                strokeDashoffset={440 - (440 * Math.min(100, Math.max(0, vehicle.currentBattery))) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-white">{vehicle.currentBattery}%</span>
              <span className="text-xs font-semibold text-slate-400">Current SoC</span>
            </div>
          </div>

          <div className="mt-4">
            <StatusBadge status={vehicle.status} className="text-sm px-3 py-1" />
          </div>
        </div>

        {/* Middle & Right Column: Telemetry & Specs */}
        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white tracking-wide">{vehicle.registrationNo}</h2>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  {vehicle.qrIdentifier}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{vehicle.vehicleType}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-lg bg-slate-950/60 p-3.5 border border-slate-800">
              <span className="text-slate-400 block">Battery Capacity</span>
              <span className="text-base font-bold text-white mt-1 block">{vehicle.batteryCapacity} kWh</span>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3.5 border border-slate-800">
              <span className="text-slate-400 block">Current Energy Stored</span>
              <span className="text-base font-bold text-emerald-400 mt-1 block">
                {((vehicle.batteryCapacity * vehicle.currentBattery) / 100).toFixed(1)} kWh
              </span>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3.5 border border-slate-800">
              <span className="text-slate-400 block">Energy to 80% SoC</span>
              <span className="text-base font-bold text-cyan-400 mt-1 block">
                {Math.max(0, (vehicle.batteryCapacity * (80 - vehicle.currentBattery)) / 100).toFixed(1)} kWh
              </span>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3.5 border border-slate-800 col-span-2 sm:col-span-3">
              <span className="text-slate-400 block">Assigned Driver / Owner Profile</span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{vehicle.ownerName || 'Campus Fleet'}</span>
                <span className="text-slate-400 font-mono">{vehicle.ownerEmail || 'fleet@campus.edu'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charging History Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-400" />
            <h3 className="text-base font-semibold text-white">Charging History for {vehicle.registrationNo}</h3>
          </div>
          <span className="text-xs text-slate-400">{history.length} recorded session(s)</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {history.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">No charging sessions recorded for this EV yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Session</th>
                  <th className="p-3">Station</th>
                  <th className="p-3">Start Time</th>
                  <th className="p-3">End Time</th>
                  <th className="p-3">Energy (kWh)</th>
                  <th className="p-3">Total Cost (₹)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-slate-800/30 transition">
                    <td className="p-3 font-mono text-slate-300">#{s.sessionId}</td>
                    <td className="p-3 font-medium text-white">{s.stationName || `Station #${s.stationId}`}</td>
                    <td className="p-3 text-slate-300">{formatDate(s.startTime)}</td>
                    <td className="p-3 text-slate-300">{s.endTime ? formatDate(s.endTime) : 'In progress'}</td>
                    <td className="p-3 font-mono font-semibold text-amber-400">{formatEnergy(s.energyConsumed)}</td>
                    <td className="p-3 font-mono font-semibold text-emerald-400">{formatCurrency(s.chargingCost)}</td>
                    <td className="p-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
