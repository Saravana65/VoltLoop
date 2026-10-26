import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  QrCode,
  Car,
  Clock,
  DollarSign,
  BatteryCharging,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  StopCircle,
} from 'lucide-react';
import { getCustomerDashboard, completeCustomerCharging } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';
import BatteryIndicator from '../../components/BatteryIndicator';

export default function CustomerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stopping, setStopping] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCustomerDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load customer dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleStopCharging = async (sessionId, vehicleId) => {
    if (!window.confirm('Are you sure you want to stop this charging session?')) {
      return;
    }
    try {
      setStopping(true);
      await completeCustomerCharging({
        sessionId,
        vehicleId,
        finalBattery: 90,
      });
      await fetchDashboard();
      navigate('/customer/payments');
    } catch (err) {
      alert(`Failed to stop session: ${err.message}`);
    } finally {
      setStopping(false);
    }
  };

  if (loading && !data) {
    return <LoadingSpinner message="Loading your customer charging portal..." />;
  }

  if (error && !data) {
    return <ErrorAlert message={error} onRetry={fetchDashboard} />;
  }

  const {
    customer,
    vehicles = [],
    activeSession = null,
    upcomingBookings = [],
    recentSessions = [],
    totalEnergyConsumed = 0,
    totalSpent = 0,
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Scan Station CTA */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#121212] via-[#181818] to-[#121212] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF7A00]/10 border border-[#FF7A00]/30 text-[11px] font-bold text-[#FF7A00] mb-3">
              <Zap className="h-3.5 w-3.5" />
              Smart Campus Charging Hub
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome, {customer?.name || user?.name || 'EV Commuter'}!
            </h2>
            <p className="text-xs text-[#A3A3A3] mt-1.5 leading-relaxed">
              Plug in at any campus charging bay, scan the station QR code on the charger column, and monitor your session in real time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/customer/scan"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F04438] to-[#FF7A00] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/25 hover:opacity-95 transition"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan Station QR to Charge</span>
            </Link>

            <Link
              to="/customer/bookings"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#202020] hover:bg-[#262626] border border-[#2A2A2A] px-4 py-3 text-xs font-semibold text-white transition"
            >
              <Calendar className="h-4 w-4 text-[#A3A3A3]" />
              <span>Book a Slot</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Session Live Alert Card (if charging right now) */}
      {activeSession && (
        <div className="bg-[#181818] border-2 border-[#F04438]/50 rounded-2xl p-5 shadow-lg shadow-red-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F04438]/10 text-[#F04438] border border-[#F04438]/30 mt-0.5">
                <BatteryCharging className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Actively Charging Now
                  </span>
                  <span className="font-mono text-xs text-[#A3A3A3]">
                    Session #{activeSession.sessionId}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Connected to {activeSession.stationQrCode || 'Charging Bay'} ({activeSession.stationName})
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#A3A3A3]">
                  <span>Vehicle: <strong className="text-white font-mono">{activeSession.registrationNo}</strong></span>
                  <span>•</span>
                  <span>Started: <strong className="text-white">{new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                  <span>•</span>
                  <span>Power: <strong className="text-[#FF7A00]">{activeSession.powerRating} kW</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-[#A3A3A3] block uppercase">Current Energy</span>
                <span className="text-lg font-bold font-mono text-white">
                  {Number(activeSession.energyConsumed || 0).toFixed(2)} kWh
                </span>
                <span className="text-xs font-mono text-emerald-400 block font-semibold">
                  ≈ ₹{Number(activeSession.chargingCost || 0).toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => handleStopCharging(activeSession.sessionId, activeSession.vehicleId)}
                disabled={stopping}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-bold text-white shadow transition disabled:opacity-50"
              >
                <StopCircle className="h-4 w-4" />
                <span>{stopping ? 'Stopping...' : 'Stop Charging'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicles */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">My Registered EVs</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Car className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">{vehicles.length}</span>
          </div>
          <Link
            to="/customer/vehicles"
            className="mt-1 flex items-center gap-1 text-[11px] text-[#FF7A00] hover:underline"
          >
            <span>Manage vehicles</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Total Energy */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Total Energy Drawn</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {Number(totalEnergyConsumed || 0).toFixed(1)} <span className="text-sm font-normal text-[#A3A3A3]">kWh</span>
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">Lifetime clean campus energy</p>
        </div>

        {/* Total Spend */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Total Spend</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              ₹{Number(totalSpent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <Link
            to="/customer/payments"
            className="mt-1 flex items-center gap-1 text-[11px] text-[#FF7A00] hover:underline"
          >
            <span>View payment receipts</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Advance Bookings */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Upcoming Bookings</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">{upcomingBookings.length}</span>
          </div>
          <Link
            to="/customer/bookings"
            className="mt-1 flex items-center gap-1 text-[11px] text-[#FF7A00] hover:underline"
          >
            <span>Book next slot</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Vehicles & Recent Sessions 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Vehicles */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-[#FF7A00]" />
              <h3 className="text-sm font-bold text-white">My Electric Vehicles</h3>
            </div>
            <Link
              to="/customer/vehicles"
              className="text-xs font-semibold text-[#FF7A00] hover:underline"
            >
              + Add Vehicle
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#A3A3A3]">
              No electric vehicles registered yet. Add your vehicle to begin charging.
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((v) => (
                <div
                  key={v.vehicleId}
                  className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between gap-4 hover:border-[#383838] transition"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">{v.vehicleModel || 'Electric Vehicle'}</h4>
                    <p className="text-xs font-mono text-[#A3A3A3]">{v.registrationNumber}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#A3A3A3]">
                      <span>Type: <strong className="text-white">{v.vehicleType}</strong></span>
                      <span>•</span>
                      <span>Capacity: <strong className="text-white">{v.batteryCapacity} kWh</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <BatteryIndicator batteryLevel={v.currentBattery || 75} />
                    <span className="text-[10px] text-[#A3A3A3] mt-1 font-mono">
                      Connector: {v.connectorType || 'CCS2'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#A3A3A3]" />
              <h3 className="text-sm font-bold text-white">Recent Charging History</h3>
            </div>
            <Link
              to="/customer/sessions"
              className="text-xs font-semibold text-[#FF7A00] hover:underline"
            >
              View All History
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#A3A3A3]">
              No previous charging sessions found.
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.slice(0, 4).map((s) => (
                <div
                  key={s.sessionId}
                  className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-3.5 flex items-center justify-between hover:border-[#383838] transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#FF7A00]">
                        {s.stationQrCode || `Bay ${s.stationId}`}
                      </span>
                      <span className="text-[10px] text-[#A3A3A3]">
                        {s.startTime ? new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
                      </span>
                    </div>
                    <p className="text-xs text-white font-medium mt-0.5">{s.stationName}</p>
                    <p className="text-[11px] text-[#A3A3A3] font-mono">
                      {Number(s.energyConsumed || 0).toFixed(2)} kWh • {s.durationMinutes || 0} min
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-emerald-400 block">
                      ₹{Number(s.chargingCost || 0).toFixed(2)}
                    </span>
                    <span
                      className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        s.paymentStatus === 'SUCCESSFUL'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {s.paymentStatus || 'PENDING'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
