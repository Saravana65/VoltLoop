import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Ban,
  Zap,
  Car,
  AlertCircle,
} from 'lucide-react';
import { reservationsApi, vehiclesApi, stationsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { formatDate } from '../utils/formatters';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Reservation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [formData, setFormData] = useState({
    vehicleId: '',
    stationId: '',
    startTime: '',
    endTime: '',
  });

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, vData, sData] = await Promise.all([
        reservationsApi.getAll(),
        vehiclesApi.getAll().catch(() => []),
        stationsApi.getAll().catch(() => []),
      ]);
      setReservations(resData || []);
      setVehicles(vData || []);
      setStations(sData || []);
      if (vData && vData.length > 0) {
        setFormData((prev) => ({ ...prev, vehicleId: vData[0].vehicleId }));
      }
      if (sData && sData.length > 0) {
        setFormData((prev) => ({ ...prev, stationId: sData[0].stationId }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm(`Are you sure you want to cancel reservation #${id}?`)) return;
    try {
      await reservationsApi.cancel(id);
      fetchReservations();
    } catch (err) {
      alert(err.message || 'Failed to cancel reservation.');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setConflictError(null);
    try {
      await reservationsApi.create({
        vehicleId: Number(formData.vehicleId),
        stationId: Number(formData.stationId),
        startTime: formData.startTime,
        endTime: formData.endTime,
      });
      setIsModalOpen(false);
      fetchReservations();
    } catch (err) {
      setConflictError(err.message || 'Booking conflict or schedule overlap detected.');
    } finally {
      setBookingLoading(false);
    }
  };

  const activeReservations = reservations.filter((r) => r.status === 'CONFIRMED');

  if (loading) return <LoadingSpinner message="Querying advance reservation ledger..." />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Advance Slot Reservations
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Guaranteed bay scheduling with mathematical interval collision prevention.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReservations}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setConflictError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-sm shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Book Charging Slot</span>
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onRetry={fetchReservations} />

      {/* Summary Chips */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-slate-300">
          Total Bookings: <strong className="text-white font-mono">{reservations.length}</strong>
        </span>
        <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-400">
          Confirmed: <strong className="font-mono">{activeReservations.length}</strong>
        </span>
        <span className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-slate-400">
          Completed/Cancelled: <strong className="text-slate-300 font-mono">{reservations.length - activeReservations.length}</strong>
        </span>
      </div>

      {/* Reservations Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/70 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3 px-3.5">ID</th>
                <th className="py-3 px-3.5">Vehicle License</th>
                <th className="py-3 px-3.5">Target Station</th>
                <th className="py-3 px-3.5">Start Time</th>
                <th className="py-3 px-3.5">End Time</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No reservations recorded in the system.
                  </td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.reservationId} className="hover:bg-slate-850/40 transition">
                    <td className="py-3 px-3.5 font-mono text-slate-400">
                      #{r.reservationId}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="font-bold text-white block">
                        {r.registrationNo || `EV #${r.vehicleId}`}
                      </span>
                      {r.qrIdentifier && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {r.qrIdentifier}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="font-medium text-slate-200 block">
                        {r.stationName || `Station #${r.stationId}`}
                      </span>
                      {r.stationLocation && (
                        <span className="text-[10px] text-slate-400 truncate block max-w-[200px]">
                          {r.stationLocation}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-300 font-mono text-[11px]">
                      {formatDate(r.startTime)}
                    </td>
                    <td className="py-3 px-3.5 text-slate-300 font-mono text-[11px]">
                      {formatDate(r.endTime)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      {r.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleCancel(r.reservationId)}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                        >
                          <Ban className="h-3 w-3" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Book Charging Slot</h3>
                  <p className="text-[11px] text-slate-400">Reserve a bay for a registered EV</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Specialized Conflict Alert Banner */}
            {conflictError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Reservation Collision Detected (HTTP 409)</span>
                </div>
                <p className="text-[11px] text-rose-200 leading-relaxed">
                  {conflictError}
                </p>
                <p className="text-[10px] text-rose-400/80 pt-1">
                  Tip: Choose an alternative time slot or select another compatible charging bay.
                </p>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Select Electric Vehicle *
                </label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>
                      {v.registrationNo} ({v.vehicleType}) — {v.currentBattery}% SoC
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Target Charging Bay *
                </label>
                <select
                  value={formData.stationId}
                  onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {stations.map((s) => (
                    <option key={s.stationId} value={s.stationId}>
                      {s.stationName} ({s.connectorType}, {s.powerRating} kW) — {s.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Start DateTime *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    End DateTime *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
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
                  disabled={bookingLoading}
                  className="rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50"
                >
                  {bookingLoading ? 'Validating Conflicts...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
