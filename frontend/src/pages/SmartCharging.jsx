import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Battery, Clock, IndianRupee, AlertCircle, CheckCircle2, ArrowRight, ShieldAlert, Award } from 'lucide-react';
import { vehiclesApi, smartChargingApi } from '../services/api';
import QRScanner from '../components/QRScanner';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { formatCurrency, formatEnergy, formatDuration, getBatteryColor } from '../utils/formatters';

export default function SmartCharging() {
  const location = useLocation();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [targetBattery, setTargetBattery] = useState(80);
  const [waitingMinutes, setWaitingMinutes] = useState(0);

  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qrParam = params.get('qr');

    const loadInitial = async () => {
      try {
        const vList = await vehiclesApi.getAll();
        setVehicles(vList || []);

        if (qrParam) {
          const match = vList?.find((v) => v.qrIdentifier?.toUpperCase() === qrParam.toUpperCase());
          if (match) {
            handleVehicleSelected(match);
          }
        }
      } catch (err) {
        console.error('Failed to load initial vehicles', err);
      }
    };

    loadInitial();
  }, [location.search]);

  const handleVehicleSelected = (vehicle) => {
    setSelectedVehicle(vehicle);
    setRecommendation(null);
    setRecError(null);
    setActionSuccess(null);
    setActionError(null);
    setTargetBattery(vehicle.currentBattery >= 80 ? 100 : 80);
  };

  const handleGetRecommendation = async () => {
    if (!selectedVehicle) return;
    setRecLoading(true);
    setRecError(null);
    setActionSuccess(null);
    setActionError(null);

    try {
      const rec = await smartChargingApi.recommend({
        qrIdentifier: selectedVehicle.qrIdentifier,
        targetBatteryPercentage: Number(targetBattery),
        waitingTimeMinutes: Number(waitingMinutes),
      });
      setRecommendation(rec);
    } catch (err) {
      setRecError(err.message || 'Failed to compute smart recommendation.');
    } finally {
      setRecLoading(false);
    }
  };

  const handleStartCharging = async () => {
    if (!recommendation?.recommendedStation || !selectedVehicle) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const session = await smartChargingApi.start({
        qrIdentifier: selectedVehicle.qrIdentifier,
        stationId: recommendation.recommendedStation.stationId,
      });
      setActionSuccess(`Charging session #${session.sessionId} started successfully! Station ${recommendation.recommendedStation.stationName} is now OCCUPIED.`);
      setTimeout(() => {
        navigate('/sessions');
      }, 2000);
    } catch (err) {
      setActionError(err.message || 'Failed to start charging session.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-2 shadow-lg shadow-emerald-500/20">
            <Sparkles className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              Smart Charging Allocation Engine
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Deterministic, rule-based charging station recommendation based on battery SoC, connector compatibility, and queue urgency.
            </p>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-emerald-300 shadow-md flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <div>
            <span className="font-bold text-white block">Session Active</span>
            <p className="text-xs">{actionSuccess} Redirecting to active sessions...</p>
          </div>
        </div>
      )}

      {actionError && <ErrorAlert message={actionError} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: EV Identification */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Step 1: Identify Electric Vehicle
          </h2>

          <QRScanner
            embedded={true}
            onVehicleFound={(veh) => handleVehicleSelected(veh)}
          />

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <label className="block text-xs font-medium text-slate-400">Or select directly from registered fleet:</label>
            <select
              value={selectedVehicle?.vehicleId || ''}
              onChange={(e) => {
                const found = vehicles.find((v) => v.vehicleId === Number(e.target.value));
                if (found) handleVehicleSelected(found);
              }}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">-- Choose an EV --</option>
              {vehicles.map((v) => (
                <option key={v.vehicleId} value={v.vehicleId}>
                  {v.registrationNo} ({v.vehicleType}) — {v.currentBattery}% [{v.qrIdentifier}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Telemetry & Optimization Parameters */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Step 2: Battery Telemetry & Targets
          </h2>

          {!selectedVehicle ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/30 flex flex-col items-center justify-center">
              <Battery className="h-10 w-10 text-slate-700 mb-2" />
              <p className="text-sm text-slate-400">Scan or select an EV to read battery telemetry</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedVehicle.registrationNo}</h3>
                    <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {selectedVehicle.qrIdentifier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedVehicle.vehicleType}</p>
                </div>
                <StatusBadge status={selectedVehicle.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Current State of Charge</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-white">{selectedVehicle.currentBattery}</span>
                    <span className="text-xs font-semibold text-slate-400">%</span>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Battery Pack Capacity</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-white">{selectedVehicle.batteryCapacity}</span>
                    <span className="text-xs font-semibold text-slate-400">kWh</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Desired Target Battery (%):</span>
                  <span className="font-bold text-emerald-400">{targetBattery}%</span>
                </div>
                <input
                  type="range"
                  min={Math.ceil(selectedVehicle.currentBattery)}
                  max="100"
                  step="5"
                  value={targetBattery}
                  onChange={(e) => setTargetBattery(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="pt-1">
                <label className="block text-xs font-medium text-slate-300">
                  Virtual Queue Waiting Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={waitingMinutes}
                  onChange={(e) => setWaitingMinutes(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="0"
                />
                <span className="text-[10px] text-slate-500">Adds priority points (+1 pt/min, max 50 pts)</span>
              </div>

              <button
                onClick={handleGetRecommendation}
                disabled={recLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 p-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:opacity-90 transition disabled:opacity-50"
              >
                {recLoading ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" /> Evaluating Smart Allocation Matrix...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Run Smart Allocation Recommendation
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {recError && <ErrorAlert message={recError} onRetry={handleGetRecommendation} />}

      {/* Step 3: Recommendation Results Card */}
      {recommendation && (
        <div className="rounded-xl border border-emerald-500/40 bg-slate-900/90 p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Recommended Charging Bay</h3>
                <p className="text-xs text-slate-400">Calculated by Java backend Smart Allocation Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Priority Score:</span>
              <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-sm font-extrabold text-emerald-400">
                {recommendation.priorityScore} pts
              </span>
              <StatusBadge status={recommendation.urgencyLevel} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300 flex items-start gap-3">
            <Zap className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block text-sm mb-1">Decision Logic & Allocation Reason</span>
              <p className="leading-relaxed">{recommendation.reason}</p>
            </div>
          </div>

          {recommendation.recommendedStation ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Station Name</span>
                  <span className="text-lg font-bold text-white mt-1 block">
                    {recommendation.recommendedStation.stationName}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                    {recommendation.recommendedStation.location}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Power & Connector</span>
                  <span className="text-lg font-bold text-cyan-400 mt-1 block">
                    {recommendation.recommendedStation.powerRating} kW
                  </span>
                  <span className="text-[11px] text-slate-300 block mt-0.5">
                    {recommendation.recommendedStation.connectorType}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Estimated Turnaround</span>
                  <span className="text-lg font-bold text-emerald-400 mt-1 block">
                    ~{recommendation.estimatedChargingMinutes} mins
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    ({recommendation.estimatedChargingHours} hrs)
                  </span>
                </div>

                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Energy & Billing</span>
                  <span className="text-lg font-bold text-amber-300 mt-1 block">
                    {formatEnergy(recommendation.requiredEnergyKwh)}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                    {formatCurrency(recommendation.estimatedCost)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={handleStartCharging}
                  disabled={actionLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/25 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Activating Session...' : 'Start Charging Immediately'}
                </button>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertCircle className="mx-auto h-6 w-6 mb-2 text-amber-400" />
              No compatible charging stations are currently AVAILABLE. Please wait or book a future reservation.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
