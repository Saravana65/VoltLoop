import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  Zap,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  getCustomerBookings,
  createCustomerBooking,
  cancelCustomerBooking,
  getCustomerVehicles,
  getStations,
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 7-step modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    vehicleId: '',
    stationId: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '14:00',
    durationMinutes: 60,
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [modalError, setModalError] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bList, vList, sList] = await Promise.all([
        getCustomerBookings(),
        getCustomerVehicles(),
        getStations(),
      ]);
      setBookings(bList || []);
      setVehicles(vList || []);
      setStations(sList || []);

      if (vList && vList.length > 0) {
        setForm((prev) => ({ ...prev, vehicleId: vList[0].vehicleId }));
      }
      if (sList && sList.length > 0) {
        setForm((prev) => ({ ...prev, stationId: sList[0].stationId }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this advance reservation?')) return;
    try {
      await cancelCustomerBooking(bookingId);
      await fetchAll();
    } catch (err) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  const handleOpenModal = () => {
    setStep(1);
    setBookingResult(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const selectedVehicle = vehicles.find((v) => String(v.vehicleId) === String(form.vehicleId));
  const selectedStation = stations.find((s) => String(s.stationId) === String(form.stationId));

  // Compute times & cost estimate
  const startIso = `${form.date}T${form.startTime}:00`;
  const estimatedKwh = selectedStation
    ? Math.min(
        selectedVehicle?.batteryCapacity || 40,
        (selectedStation.powerRating || 22) * (form.durationMinutes / 60)
      )
    : 20;
  const estimatedCost = estimatedKwh * 15;

  const handleConfirmBooking = async () => {
    setSubmitting(true);
    setModalError('');

    try {
      // Calculate end time
      const startDate = new Date(startIso);
      const endDate = new Date(startDate.getTime() + form.durationMinutes * 60000);
      const endIso = endDate.toISOString().slice(0, 19);

      const res = await createCustomerBooking({
        vehicleId: Number(form.vehicleId),
        stationId: Number(form.stationId),
        startTime: startIso,
        endTime: endIso,
      });

      setBookingResult(res);
      setStep(7); // Final step
      await fetchAll();
    } catch (err) {
      setModalError(err.message || 'Failed to complete booking. Slot may have conflict.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && bookings.length === 0) {
    return <LoadingSpinner message="Loading your advance reservations..." />;
  }

  if (error && bookings.length === 0) {
    return <ErrorAlert message={error} onRetry={fetchAll} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6">
        <div>
          <h2 className="text-lg font-bold text-white">Advance Charging Slot Reservations</h2>
          <p className="text-xs text-[#A3A3A3] mt-0.5">
            Reserve dedicated charging bays in advance with smart conflict detection and automated hold.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F04438] to-[#FF7A00] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:opacity-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Book a Charging Bay</span>
          </button>

          <button
            onClick={fetchAll}
            className="p-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] text-[#A3A3A3] hover:text-white transition"
            title="Refresh bookings"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-12 text-center max-w-md mx-auto">
          <CalendarClock className="h-10 w-10 text-[#A3A3A3] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No Advance Bookings</h3>
          <p className="text-xs text-[#A3A3A3] mt-1 mb-5">
            Plan ahead! Book a bay during peak hours to guarantee charger availability.
          </p>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A00] px-4 py-2 text-xs font-bold text-white hover:bg-[#FF7A00]/90 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Book Slot Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((b) => {
            const isConfirmed = b.status === 'CONFIRMED' || b.status === 'PENDING';
            const isCancelled = b.status === 'CANCELLED';

            return (
              <div
                key={b.reservationId}
                className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-5 hover:border-[#383838] transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#FF7A00] bg-[#FF7A00]/10 border border-[#FF7A00]/20 px-2 py-0.5 rounded">
                        Res #{b.reservationId}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-2">
                        {b.stationName || `Station #${b.stationId}`}
                      </h3>
                      <p className="text-xs text-[#A3A3A3]">{b.stationLocation}</p>
                    </div>

                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isConfirmed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isCancelled
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'bg-[#202020] text-[#A3A3A3]'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#A3A3A3]">
                      <span>Vehicle:</span>
                      <span className="font-mono font-bold text-white">
                        {b.registrationNumber || `Vehicle #${b.vehicleId}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#A3A3A3]">
                      <span>Start Time:</span>
                      <span className="font-mono text-white">
                        {b.startTime
                          ? new Date(b.startTime).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#A3A3A3]">
                      <span>End Time:</span>
                      <span className="font-mono text-white">
                        {b.endTime
                          ? new Date(b.endTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-between">
                  <span className="text-[10px] text-[#A3A3A3]">
                    Booked on {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                  </span>

                  {isConfirmed && (
                    <button
                      onClick={() => handleCancel(b.reservationId)}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7-Step Advance Slot Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 max-w-lg w-full relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#A3A3A3] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Stepper Header */}
            <div className="mb-4">
              <span className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-wider">
                Step {step} of 7: {
                  step === 1 ? 'Select Vehicle' :
                  step === 2 ? 'Select Charging Bay' :
                  step === 3 ? 'Choose Date & Start Time' :
                  step === 4 ? 'Set Duration' :
                  step === 5 ? 'Automated Conflict Check' :
                  step === 6 ? 'Cost & Energy Estimation' :
                  'Reservation Confirmed'
                }
              </span>
              <div className="w-full bg-[#1e1e1e] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#F04438] to-[#FF7A00] h-full transition-all duration-300"
                  style={{ width: `${(step / 7) * 100}%` }}
                />
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-200">
                {modalError}
              </div>
            )}

            {/* Step 1: Vehicle */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-[#A3A3A3]">Which EV would you like to charge?</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {vehicles.map((v) => (
                    <button
                      key={v.vehicleId}
                      type="button"
                      onClick={() => setForm({ ...form, vehicleId: v.vehicleId })}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        String(form.vehicleId) === String(v.vehicleId)
                          ? 'bg-[#202020] border-[#FF7A00]'
                          : 'bg-[#181818] border-[#2A2A2A] hover:border-[#383838]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{v.vehicleModel || 'EV'}</div>
                        <div className="text-[11px] font-mono text-[#A3A3A3]">{v.registrationNumber}</div>
                      </div>
                      <span className="text-xs text-[#FF7A00] font-mono">{v.connectorType}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full mt-3 py-2.5 rounded-lg bg-[#FF7A00] font-bold text-xs text-white"
                >
                  Next: Select Charging Bay
                </button>
              </div>
            )}

            {/* Step 2: Station */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-[#A3A3A3]">Select a campus charging bay:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {stations.map((s) => (
                    <button
                      key={s.stationId}
                      type="button"
                      onClick={() => setForm({ ...form, stationId: s.stationId })}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        String(form.stationId) === String(s.stationId)
                          ? 'bg-[#202020] border-[#FF7A00]'
                          : 'bg-[#181818] border-[#2A2A2A] hover:border-[#383838]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{s.stationName}</span>
                          <span className="text-[10px] font-mono text-[#FF7A00]">{s.qrCode}</span>
                        </div>
                        <div className="text-[11px] text-[#A3A3A3]">{s.location}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-white block">{s.powerRating} kW</span>
                        <span className="text-[10px] text-emerald-400">{s.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-2 rounded-lg bg-[#181818] text-xs text-[#A3A3A3]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-2/3 py-2.5 rounded-lg bg-[#FF7A00] font-bold text-xs text-white"
                  >
                    Next: Choose Date & Time
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
              <div className="space-y-3 text-xs">
                <p className="text-[#A3A3A3]">Choose arrival date and reservation start time:</p>
                <div>
                  <label className="block text-[#A3A3A3] mb-1 font-semibold">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#A3A3A3] mb-1 font-semibold">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] px-3 py-2 text-white"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 py-2 rounded-lg bg-[#181818] text-[#A3A3A3]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="w-2/3 py-2.5 rounded-lg bg-[#FF7A00] font-bold text-white"
                  >
                    Next: Set Duration
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Duration */}
            {step === 4 && (
              <div className="space-y-3 text-xs">
                <p className="text-[#A3A3A3]">Estimated charging window needed:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 45, 60, 90, 120, 180].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setForm({ ...form, durationMinutes: mins })}
                      className={`p-3 rounded-xl border text-center font-mono font-bold transition ${
                        form.durationMinutes === mins
                          ? 'bg-[#FF7A00]/20 border-[#FF7A00] text-[#FF7A00]'
                          : 'bg-[#181818] border-[#2A2A2A] text-white'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-1/3 py-2 rounded-lg bg-[#181818] text-[#A3A3A3]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="w-2/3 py-2.5 rounded-lg bg-[#FF7A00] font-bold text-white"
                  >
                    Next: Check Conflicts
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Conflict Check */}
            {step === 5 && (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Slot Confirmed Available!</span>
                  </div>
                  <p className="text-[11px] text-emerald-300">
                    No overlapping bookings found for {selectedStation?.stationName} during {form.startTime} ({form.durationMinutes} mins).
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="w-1/3 py-2 rounded-lg bg-[#181818] text-[#A3A3A3]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(6)}
                    className="w-2/3 py-2.5 rounded-lg bg-[#FF7A00] font-bold text-white"
                  >
                    Next: Cost Estimation
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Cost Estimation & Confirm */}
            {step === 6 && (
              <div className="space-y-3 text-xs">
                <p className="text-[#A3A3A3]">Review reservation details and cost estimate:</p>
                <div className="p-4 rounded-xl bg-[#181818] border border-[#2A2A2A] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#A3A3A3]">Station:</span>
                    <span className="font-bold text-white">{selectedStation?.stationName} ({selectedStation?.powerRating} kW)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A3A3]">Vehicle:</span>
                    <span className="font-mono text-white">{selectedVehicle?.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A3A3]">Window:</span>
                    <span className="font-mono text-white">{form.date} at {form.startTime} ({form.durationMinutes} min)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A3A3]">Est. Energy Draw:</span>
                    <span className="font-mono text-white">{estimatedKwh.toFixed(1)} kWh</span>
                  </div>
                  <div className="pt-2 border-t border-[#2A2A2A] flex justify-between font-bold text-sm">
                    <span className="text-white">Estimated Cost:</span>
                    <span className="font-mono text-emerald-400">≈ ₹{estimatedCost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="w-1/3 py-2 rounded-lg bg-[#181818] text-[#A3A3A3]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleConfirmBooking}
                    className="w-2/3 py-2.5 rounded-lg bg-gradient-to-r from-[#F04438] to-[#FF7A00] font-bold text-white shadow-lg shadow-orange-500/20 disabled:opacity-50"
                  >
                    {submitting ? 'Confirming Reservation...' : 'Confirm Advance Slot'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 7: Completed */}
            {step === 7 && (
              <div className="text-center py-4 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">Slot Reservation Confirmed!</h3>
                <p className="text-xs text-[#A3A3A3]">
                  Reservation #{bookingResult?.reservationId || 'VL-RES'} has been locked for your EV.
                </p>
                <div className="p-3 bg-[#181818] rounded-xl border border-[#2A2A2A] text-xs font-mono text-[#A3A3A3] text-left space-y-1">
                  <div>Station: <span className="text-white">{selectedStation?.stationName}</span></div>
                  <div>Time: <span className="text-[#FF7A00]">{startIso}</span></div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 rounded-lg bg-[#202020] hover:bg-[#262626] font-bold text-xs text-white"
                >
                  Close & View All Bookings
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
