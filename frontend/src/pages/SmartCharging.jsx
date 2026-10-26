import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Battery,
  Clock,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Award,
  Cpu,
  Layers,
  Sliders,
  QrCode,
} from 'lucide-react';
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Smart Charging Allocation Engine
            </h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-400 border border-emerald-500/20">
              Rule-Based
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Intelligently pairs vehicles with optimal charging bays based on battery SoC, power rating, compatibility, and queue urgency.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/station-checkin"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <QrCode className="h-3.5 w-3.5 text-emerald-400" />
            <span>Terminal Check-In</span>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{actionSuccess} Redirecting to live sessions...</span>
        </div>
      )}

      {actionError && <ErrorAlert message={actionError} />}

      {/* Main Allocation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Allocation Parameters</h3>
                  <p className="text-[11px] text-slate-400">Select EV and charging preferences</p>
                </div>
              </div>
            </div>

            {/* EV Selection Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Electric Vehicle *
              </label>
              <select
                value={selectedVehicle?.vehicleId || ''}
                onChange={(e) => {
                  const match = vehicles.find((v) => v.vehicleId === Number(e.target.value));
                  if (match) handleVehicleSelected(match);
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Choose a registered EV --</option>
                {vehicles.map((v) => (
                  <option key={v.vehicleId} value={v.vehicleId}>
                    {v.registrationNo} ({v.vehicleType}) • {v.currentBattery}% SoC • {v.qrIdentifier}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Demo EV Chips */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Or select demo sample chip:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {vehicles.slice(0, 5).map((v) => (
                  <button
                    key={v.vehicleId}
                    type="button"
                    onClick={() => handleVehicleSelected(v)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-mono transition ${
                      selectedVehicle?.vehicleId === v.vehicleId
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {v.qrIdentifier} ({v.currentBattery}%)
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Telemetry Snapshot */}
            {selectedVehicle && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Battery</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{selectedVehicle.currentBattery}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Battery Pack</span>
                  <span className="font-mono text-white">{selectedVehicle.batteryCapacity} kWh</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status</span>
                  <StatusBadge status={selectedVehicle.status} />
                </div>
              </div>
            )}

            {/* Target Battery Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <label className="font-semibold text-slate-300">Desired Target SoC</label>
                <span className="font-mono font-bold text-white">{targetBattery}%</span>
              </div>
              <input
                type="range"
                min={selectedVehicle?.currentBattery || 10}
                max="100"
                step="5"
                value={targetBattery}
                onChange={(e) => setTargetBattery(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Current ({selectedVehicle?.currentBattery || 0}%)</span>
                <span>Standard (80%)</span>
                <span>Full (100%)</span>
              </div>
            </div>

            {/* Waiting Time Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <label className="font-semibold text-slate-300">Queue Waiting Time</label>
                <span className="font-mono font-bold text-cyan-400">{waitingMinutes} mins</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={waitingMinutes}
                onChange={(e) => setWaitingMinutes(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Increases urgency score by up to 50 points based on waiting time.
              </span>
            </div>

            <button
              onClick={handleGetRecommendation}
              disabled={!selectedVehicle || recLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-sm shadow-emerald-500/20 disabled:opacity-50"
            >
              <Cpu className="h-4 w-4 fill-slate-950" />
              <span>{recLoading ? 'Evaluating Priority Rules...' : 'Compute Optimal Station'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Engine Recommendation Output (7 cols) */}
        <div className="lg:col-span-7">
          {recError && <ErrorAlert message={recError} />}

          {!recommendation && !recError && (
            <div className="h-full rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 flex flex-col items-center justify-center text-center">
              <Cpu className="h-12 w-12 text-slate-700 mb-3" />
              <h3 className="text-sm font-bold text-white">Rule-Based Allocation Standby</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Select an EV on the left and click "Compute Optimal Station" to evaluate campus charging priority and compatibility.
              </p>
            </div>
          )}

          {recommendation && (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-sans">
                      Optimal Charging Station Assigned
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Calculated using multi-factor urgency and compatibility matrix
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Priority Score</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {recommendation.priorityScore} <span className="text-xs text-slate-400 font-normal">pts</span>
                  </span>
                </div>
              </div>

              {/* Recommended Station Card */}
              {recommendation.recommendedStation ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                        Assigned Hardware Node
                      </span>
                      <h4 className="text-lg font-bold text-white mt-0.5">
                        {recommendation.recommendedStation.stationName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {recommendation.recommendedStation.location}
                      </p>
                    </div>
                    <StatusBadge status={recommendation.recommendedStation.status} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-emerald-500/20 text-xs">
                    <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Power Rating</span>
                      <span className="font-mono font-bold text-white">{recommendation.recommendedStation.powerRating} kW</span>
                    </div>
                    <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Connector</span>
                      <span className="font-mono font-bold text-emerald-400 truncate block">
                        {recommendation.recommendedStation.connectorType}
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Energy Req.</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {formatEnergy(recommendation.energyRequiredKwh)}
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Est. Cost</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatCurrency(recommendation.estimatedCost)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                    <span>Estimated Duration: <strong className="text-white font-mono">{formatDuration(recommendation.estimatedDurationMinutes)}</strong></span>
                    <span className="text-emerald-400 font-semibold text-[11px]">✓ Fully Compatible</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
                  <div className="font-bold flex items-center gap-1.5 text-amber-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>No Compatible Charging Bays Available</span>
                  </div>
                  <p className="mt-1 text-amber-200">
                    All matching stations are currently occupied or in maintenance. Vehicle added to priority queue.
                  </p>
                </div>
              )}

              {/* Action Button */}
              {recommendation.recommendedStation && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleStartCharging}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-sm shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4 fill-slate-950" />
                    <span>{actionLoading ? 'Connecting to Station...' : 'Start Charging Immediately'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
