import React, { useState, useEffect } from 'react';
import { Calendar, Plus, RefreshCw, AlertTriangle, CheckCircle2, Clock, X, Ban } from 'lucide-react';
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
      // Highlights the exact conflict message (e.g. 409 Conflict)
      setConflictError(err.message || 'Booking conflict or validation error.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading slot reservations..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Slot Reservations</h1>
          <p className="mt-1 text-sm text-slate-400">
            Advance schedule bookings with real-time interval conflict detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReservations}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={() => {
              setConflictError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition"
          >
            <Plus className="h-4 w-4" />
            New Reservation
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onRetry={fetchReservations} />

      {/* Reservations Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">EV Details</th>
                <th className="p-3.5">Charging Bay</th>
                <th className="p-3.5">Start Time</th>
                <th className="p-3.5">End Time</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reservations.map((r) => (
                <tr key={r.reservationId} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5 font-mono text-slate-400 font-bold">#{r.reservationId}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-white block">{r.registrationNo || `EV #${r.vehicleId}`}</span>
                    <span className="font-mono text-[11px] text-emerald-400">{r.qrIdentifier}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-medium text-white block">{r.stationName || `Station #${r.stationId}`}</span>
                    <span className="text-[11px] text-slate-400">{r.stationLocation}</span>
                  </td>
                  <td className="p-3.5 text-slate-200">{formatDate(r.startTime)}</td>
                  <td className="p-3.5 text-slate-200">{formatDate(r.endTime)}</td>
                  <td className="p-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3.5 text-right">
                    {r.status === 'RESERVED' && (
                      <button
                        onClick={() => handleCancel(r.reservationId)}
                        className="rounded border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition inline-flex items-center gap-1"
                      >
                        <Ban className="h-3 w-3" /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Book Charging Slot Reservation</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Visual Conflict Alert (Test Case 5 & 13) */}
            {conflictError && (
              <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/15 p-4 text-xs text-rose-200 shadow-inner">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-400" />
                  <div>
                    <span className="font-bold text-rose-100 block text-sm">Slot Conflict Detected (HTTP 409)</span>
                    <p className="mt-1 leading-relaxed">{conflictError}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300">Select Electric Vehicle</label>
                <select
                  required
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>
                      {v.registrationNo} ({v.vehicleType}) — SoC: {v.currentBattery}% [{v.qrIdentifier}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300">Select Charging Bay</label>
                <select
                  required
                  value={formData.stationId}
                  onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {stations.map((s) => (
                    <option key={s.stationId} value={s.stationId}>
                      {s.stationName} ({s.powerRating} kW - {s.connectorType}) — [{s.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
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
                  disabled={bookingLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {bookingLoading ? 'Checking Availability...' : 'Confirm Slot Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
