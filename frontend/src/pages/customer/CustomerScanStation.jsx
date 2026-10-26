import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  Zap,
  Car,
  CheckCircle,
  AlertCircle,
  Camera,
  Search,
  ArrowRight,
  ShieldCheck,
  BatteryCharging,
  Power,
} from 'lucide-react';
import { resolveStationByQr, getCustomerVehicles, startCustomerCharging } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';

export default function CustomerScanStation() {
  const [stationCode, setStationCode] = useState('VL-ST-001');
  const [resolvedStation, setResolvedStation] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [initialBattery, setInitialBattery] = useState(35);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  // Load customer vehicles on mount
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const vList = await getCustomerVehicles();
        setVehicles(vList || []);
        if (vList && vList.length > 0) {
          setSelectedVehicleId(vList[0].vehicleId);
          setInitialBattery(vList[0].currentBattery || 35);
        }
      } catch (err) {
        console.warn('Could not fetch customer vehicles', err);
      }
    };
    fetchVehicles();
    // Auto-resolve initial station
    handleResolveCode('VL-ST-001');
  }, []);

  const handleResolveCode = async (codeToResolve) => {
    const target = (codeToResolve || stationCode).trim();
    if (!target) return;

    setError('');
    setResolvedStation(null);
    setLoading(true);

    try {
      const res = await resolveStationByQr(target);
      if (res && res.station) {
        setResolvedStation(res.station);
      } else {
        setError('Station not found or invalid QR code format.');
      }
    } catch (err) {
      setError(err.message || 'Failed to resolve charging bay. Please verify station code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleChange = (vId) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find((item) => String(item.vehicleId) === String(vId));
    if (v) {
      setInitialBattery(v.currentBattery || 35);
    }
  };

  const handleStartCharging = async () => {
    if (!resolvedStation) {
      setError('Please select or scan a valid charging station first.');
      return;
    }
    if (!selectedVehicleId) {
      setError('Please select an EV to charge.');
      return;
    }

    if (resolvedStation.status !== 'AVAILABLE') {
      setError(`Cannot start charging: Station bay is currently ${resolvedStation.status}.`);
      return;
    }

    setError('');
    setStarting(true);

    try {
      const res = await startCustomerCharging({
        stationId: resolvedStation.stationId,
        vehicleId: Number(selectedVehicleId),
        initialBattery: Number(initialBattery),
      });

      setSuccessMsg(`Session #${res.sessionId} initiated! Connected to ${resolvedStation.stationName}.`);
      setTimeout(() => {
        navigate('/customer/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to start charging session.');
    } finally {
      setStarting(false);
    }
  };

  const quickStationChips = [
    { code: 'VL-ST-001', name: 'Engineering Bay (22kW Type 2)' },
    { code: 'VL-ST-002', name: 'Admin Bay (50kW CCS2)' },
    { code: 'VL-ST-003', name: 'Hostel Bay (7.4kW Type 2)' },
    { code: 'VL-ST-004', name: 'Workshop Bay (60kW CCS2)' },
    { code: 'VL-ST-005', name: 'Sports Complex (11kW GB/T)' },
  ];

  const selectedVehicle = vehicles.find((v) => String(v.vehicleId) === String(selectedVehicleId));
  const isCompatible =
    resolvedStation &&
    selectedVehicle &&
    (resolvedStation.connectorType === selectedVehicle.connectorType ||
      resolvedStation.connectorType?.includes(selectedVehicle.connectorType || ''));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F04438] to-[#FF7A00] text-white shadow-md shadow-orange-500/20">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Scan Station QR Code</h2>
            <p className="text-xs text-[#A3A3A3]">
              Point camera at the QR label on the station bay, or enter the station code directly.
            </p>
          </div>
        </div>

        {/* Quick Demo Station Code Chips */}
        <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
          <span className="text-[11px] font-semibold text-[#A3A3A3] uppercase tracking-wider block mb-2">
            Quick Bay Selectors (Instant Demo Simulation)
          </span>
          <div className="flex flex-wrap gap-2">
            {quickStationChips.map((chip) => (
              <button
                key={chip.code}
                type="button"
                onClick={() => {
                  setStationCode(chip.code);
                  handleResolveCode(chip.code);
                }}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold transition flex items-center gap-1.5 border ${
                  stationCode === chip.code
                    ? 'bg-[#FF7A00]/15 text-[#FF7A00] border-[#FF7A00]/40'
                    : 'bg-[#181818] text-[#A3A3A3] border-[#2A2A2A] hover:text-white'
                }`}
              >
                <span>{chip.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input & Scan bar */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3A3A3]" />
            <input
              type="text"
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value.toUpperCase())}
              placeholder="e.g. VL-ST-001"
              className="w-full rounded-xl bg-[#181818] border border-[#2A2A2A] pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-white uppercase placeholder-[#666] focus:border-[#FF7A00]"
            />
          </div>

          <button
            onClick={() => handleResolveCode(stationCode)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-[#202020] hover:bg-[#262626] border border-[#2A2A2A] px-4 py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
          >
            <Zap className="h-4 w-4 text-[#FF7A00]" />
            <span>{loading ? 'Resolving...' : 'Resolve Bay'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-950/40 border border-red-500/40 p-4 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 p-4 text-xs text-emerald-200">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Resolved Station Preview & Authorization Workflow */}
      {resolvedStation && (
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-[#2A2A2A] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#FF7A00] bg-[#FF7A00]/10 border border-[#FF7A00]/20 px-2.5 py-0.5 rounded-full">
                  {resolvedStation.qrCode}
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Bay Validated
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1.5">{resolvedStation.stationName}</h3>
              <p className="text-xs text-[#A3A3A3] mt-0.5">{resolvedStation.location}</p>
            </div>

            <div className="text-right">
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                  resolvedStation.status === 'AVAILABLE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                {resolvedStation.status}
              </span>
              <span className="block text-[11px] text-[#A3A3A3] mt-1 font-mono">
                Rate: ₹15.00/kWh
              </span>
            </div>
          </div>

          {/* Bay Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#181818] p-3 rounded-xl border border-[#2A2A2A]">
              <span className="text-[#A3A3A3] block text-[10px] uppercase">Power Rating</span>
              <span className="text-base font-bold font-mono text-white mt-0.5 block">
                {resolvedStation.powerRating} kW
              </span>
              <span className="text-[10px] text-emerald-400">Fast Campus Grid</span>
            </div>

            <div className="bg-[#181818] p-3 rounded-xl border border-[#2A2A2A]">
              <span className="text-[#A3A3A3] block text-[10px] uppercase">Station Connector</span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {resolvedStation.connectorType}
              </span>
              <span className="text-[10px] text-[#A3A3A3]">Standard plug</span>
            </div>

            <div className="bg-[#181818] p-3 rounded-xl border border-[#2A2A2A]">
              <span className="text-[#A3A3A3] block text-[10px] uppercase">Station Node</span>
              <span className="text-base font-bold font-mono text-white mt-0.5 block">
                Bay #{resolvedStation.stationId}
              </span>
              <span className="text-[10px] text-[#A3A3A3]">Dr. Rajesh Sharma</span>
            </div>
          </div>

          {/* Vehicle Selection & Compatibility Verification */}
          <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Select Your EV for This Bay
              </span>
              {selectedVehicle && (
                <span
                  className={`text-[11px] font-semibold flex items-center gap-1 ${
                    isCompatible ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {isCompatible ? 'Connector Matched' : 'Connector Warning'}
                </span>
              )}
            </div>

            {vehicles.length === 0 ? (
              <div className="text-xs text-[#A3A3A3]">
                No vehicles registered. Please add a vehicle first in the My Vehicles tab.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.map((v) => (
                  <button
                    key={v.vehicleId}
                    type="button"
                    onClick={() => handleVehicleChange(v.vehicleId)}
                    className={`rounded-xl p-3 text-left border transition flex flex-col justify-between ${
                      String(selectedVehicleId) === String(v.vehicleId)
                        ? 'bg-[#202020] border-[#F04438] shadow-md'
                        : 'bg-[#141414] border-[#2A2A2A] hover:border-[#383838]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{v.vehicleModel || 'EV'}</span>
                        <span className="text-[10px] font-mono text-[#FF7A00]">{v.registrationNumber}</span>
                      </div>
                      <div className="text-[11px] text-[#A3A3A3] mt-1">
                        Connector: <strong className="text-white">{v.connectorType}</strong>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#2A2A2A] flex justify-between text-[11px] text-[#A3A3A3]">
                      <span>Current Battery:</span>
                      <span className="font-mono font-bold text-white">{v.currentBattery || 35}%</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Current Battery % Input slider */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-[#A3A3A3] mb-1">
                <span>Initial Battery Level:</span>
                <span className="font-mono font-bold text-white">{initialBattery}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={initialBattery}
                onChange={(e) => setInitialBattery(Number(e.target.value))}
                className="w-full accent-[#FF7A00] cursor-pointer"
              />
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleStartCharging}
            disabled={starting || resolvedStation.status !== 'AVAILABLE'}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F04438] to-[#FF7A00] py-3.5 text-xs font-bold text-white shadow-xl shadow-red-500/20 hover:opacity-95 transition disabled:opacity-50"
          >
            <Power className="h-4 w-4" />
            <span>
              {starting
                ? 'Authorizing Bay & Initiating Flow...'
                : `Plug In & Start Charging at ${resolvedStation.qrCode}`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
