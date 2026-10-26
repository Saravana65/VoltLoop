import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Car,
  Zap,
  ArrowLeft,
  Battery,
  QrCode,
  Clock,
  Shield,
  RefreshCw,
  ExternalLink,
  User,
  Sliders,
} from 'lucide-react';
import { vehiclesApi, smartChargingApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EVQRPass from '../components/EVQRPass';
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

  if (loading) return <LoadingSpinner message="Fetching vehicle telemetry & pass data..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchVehicleDetails} />;
  if (!vehicle) return <p className="text-slate-400 p-8 text-center text-xs">Vehicle record not found.</p>;

  const color = getBatteryColor(vehicle.currentBattery);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <Link
          to="/vehicles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to EV Fleet Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to={`/station-checkin?qr=${encodeURIComponent(vehicle.qrIdentifier)}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition"
          >
            <QrCode className="h-3.5 w-3.5 text-emerald-400" />
            <span>Check-In at Bay</span>
          </Link>

          <Link
            to={`/smart-charging?qr=${encodeURIComponent(vehicle.qrIdentifier)}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-sm shadow-emerald-500/20"
          >
            <Zap className="h-3.5 w-3.5 fill-slate-950" />
            <span>Find Charging Bay</span>
          </Link>
        </div>
      </div>

      {/* Main Vehicle Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Battery Radial Gauge & Status */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Circular Meter Background */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke={color.hex}
                strokeWidth="8"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * Math.min(100, Math.max(0, vehicle.currentBattery))) / 100}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{vehicle.currentBattery}%</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Battery SoC</span>
            </div>
          </div>

          <div className="mt-4">
            <StatusBadge status={vehicle.status} />
          </div>
        </div>

        {/* Middle & Right Column: Telemetry & Specs */}
        <div className="md:col-span-2 rounded-xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">{vehicle.registrationNo}</h2>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  {vehicle.qrIdentifier}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{vehicle.vehicleType}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-850">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Battery Capacity</span>
              <span className="text-sm font-bold text-white mt-1 block font-mono">{vehicle.batteryCapacity} kWh</span>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-850">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Energy Stored</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 block font-mono">
                {((vehicle.batteryCapacity * vehicle.currentBattery) / 100).toFixed(1)} kWh
              </span>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-850">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Req. to 80% SoC</span>
              <span className="text-sm font-bold text-cyan-400 mt-1 block font-mono">
                {Math.max(0, (vehicle.batteryCapacity * (80 - vehicle.currentBattery)) / 100).toFixed(1)} kWh
              </span>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-850 col-span-2 sm:col-span-3">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Driver / Fleet Profile</span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-bold text-white">{vehicle.ownerName || 'Campus Fleet'}</span>
                <span className="text-slate-400 font-mono text-[11px]">{vehicle.ownerEmail || 'fleet@campus.edu'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Digital EV Charging Pass (Scannable 2D QR Code) */}
      <EVQRPass vehicle={vehicle} />

      {/* Charging History Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Charging History for {vehicle.registrationNo}</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{history.length} recorded session(s)</span>
        </div>

        <div className="mt-3.5 overflow-x-auto">
          {history.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">No charging sessions recorded for this EV yet.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/70 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Session</th>
                  <th className="py-2.5 px-3">Station Bay</th>
                  <th className="py-2.5 px-3">Start Time</th>
                  <th className="py-2.5 px-3">End Time</th>
                  <th className="py-2.5 px-3 text-right">Energy (kWh)</th>
                  <th className="py-2.5 px-3 text-right">Total Cost (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {history.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-slate-850/40 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-400 font-bold">#{s.sessionId}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{s.stationName || `Station #${s.stationId}`}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{formatDate(s.startTime)}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{s.endTime ? formatDate(s.endTime) : 'In progress'}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400 text-right">{formatEnergy(s.energyConsumed)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-right">{formatCurrency(s.chargingCost)}</td>
                    <td className="py-2.5 px-3 text-center"><StatusBadge status={s.status} /></td>
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
