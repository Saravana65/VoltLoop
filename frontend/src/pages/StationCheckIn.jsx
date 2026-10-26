import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Battery,
  ShieldCheck,
  Search,
  RefreshCw,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { stationsApi, vehiclesApi, checkInStation, startCharging } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

export default function StationCheckIn() {
  const location = useLocation();
  const navigate = useNavigate();

  // Selected Station & Fleet State
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [loadingStations, setLoadingStations] = useState(true);

  // QR Identifier Input
  const [qrCode, setQrCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);

  // Authorization Evaluation State
  const [evaluating, setEvaluating] = useState(false);
  const [authResult, setAuthResult] = useState(null);
  const [startLoading, setStartLoading] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState(null);

  const sampleQrs = ['VL-EV-001', 'VL-EV-002', 'VL-EV-003', 'VL-EV-004', 'VL-EV-008'];

  // Load campus stations and parse query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialQr = params.get('qr');
    const initialStationId = params.get('stationId');

    if (initialQr) {
      setQrCode(initialQr.toUpperCase());
    }

    const fetchStations = async () => {
      try {
        const list = await stationsApi.getAll();
        setStations(list || []);
        if (initialStationId) {
          setSelectedStationId(Number(initialStationId));
        } else if (list && list.length > 0) {
          const firstAvail = list.find((s) => s.status === 'AVAILABLE') || list[0];
          setSelectedStationId(firstAvail.stationId);
        }
      } catch (err) {
        console.error('Failed to load stations for check-in', err);
      } finally {
        setLoadingStations(false);
      }
    };

    fetchStations();
  }, [location.search]);

  // Clean up camera scanner on unmount
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      scannerRef.current = null;
      isScanningRef.current = false;
    }
    setIsCameraActive(false);
  };

  const startCameraScanner = async () => {
    setCameraError(null);
    setIsCameraActive(true);

    setTimeout(async () => {
      const element = document.getElementById('qr-reader');
      if (!element) return;

      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
          },
          (decodedText) => {
            if (isScanningRef.current) return;
            isScanningRef.current = true;

            const cleanCode = decodedText.trim().toUpperCase();
            setQrCode(cleanCode);
            stopCameraScanner();
            handleAuthorize(cleanCode);
          },
          () => {}
        );
      } catch (err) {
        console.error('Camera initialization failed', err);
        setCameraError(
          'Unable to access device camera. Please grant camera permission or use manual QR entry.'
        );
        setIsCameraActive(false);
      }
    }, 200);
  };

  const handleAuthorize = async (codeToUse) => {
    const targetCode = (codeToUse || qrCode || '').trim().toUpperCase();
    if (!targetCode) {
      setAuthResult({
        authorized: false,
        status: 'REJECTED',
        reason: 'Please enter or scan a valid EV QR identifier.',
      });
      return;
    }
    if (!selectedStationId) {
      setAuthResult({
        authorized: false,
        status: 'REJECTED',
        reason: 'Please select a campus charging station bay to check in.',
      });
      return;
    }

    setEvaluating(true);
    setAuthResult(null);
    setSessionSuccess(null);

    try {
      const result = await checkInStation({
        qrIdentifier: targetCode,
        stationId: Number(selectedStationId),
      });

      setAuthResult({
        authorized: true,
        status: 'AUTHORIZED',
        reason: result.reason,
        vehicle: result.vehicle,
        station: result.station,
        reservation: result.reservation,
        timestamp: result.timestamp,
      });
    } catch (err) {
      setAuthResult({
        authorized: false,
        status: 'REJECTED',
        httpStatus: err.status,
        reason: err.message || 'Authorization rejected by campus backend rules.',
        rejectionCode: err.status === 409 ? 'CONFLICT' : err.status === 404 ? 'NOT_FOUND' : 'INVALID',
      });
    } finally {
      setEvaluating(false);
      isScanningRef.current = false;
    }
  };

  const handleStartCharging = async () => {
    if (!authResult?.authorized || !authResult?.vehicle || !authResult?.station) return;
    setStartLoading(true);

    try {
      const session = await startCharging({
        qrIdentifier: authResult.vehicle.qrIdentifier,
        stationId: authResult.station.stationId,
      });

      setSessionSuccess({
        sessionId: session.sessionId,
        stationName: authResult.station.stationName,
        registrationNo: authResult.vehicle.registrationNo,
      });

      setTimeout(() => {
        navigate('/sessions');
      }, 2500);
    } catch (err) {
      alert(`Failed to start charging session: ${err.message}`);
    } finally {
      setStartLoading(false);
    }
  };

  const selectedStation = stations.find((s) => s.stationId === Number(selectedStationId));

  if (loadingStations) {
    return <LoadingSpinner message="Connecting to station bay authorization terminals..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Charging Station Terminal Check-In
            </h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-400 border border-emerald-500/20">
              Phase 7 Metro Turnstile
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Validate EV QR pass, connector compatibility, and bay availability before initiating charging. Pure read-only authorization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/smart-charging"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Smart Allocation</span>
          </Link>
        </div>
      </div>

      {/* Step 1: Select Bay Terminal */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/20">
              1
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Target Charging Station Bay
            </h3>
          </div>
          {selectedStation && <StatusBadge status={selectedStation.status} />}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Active Hardware Bay
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => {
                setSelectedStationId(Number(e.target.value));
                setAuthResult(null);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              {stations.map((s) => (
                <option key={s.stationId} value={s.stationId}>
                  {s.stationName} ({s.powerRating} kW • {s.connectorType}) — [{s.status}]
                </option>
              ))}
            </select>
          </div>

          {selectedStation && (
            <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-850 text-xs flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{selectedStation.location}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-slate-400 font-mono text-[11px]">
                <span>Architecture: {selectedStation.chargerType}</span>
                <span className="text-emerald-400 font-bold">{selectedStation.powerRating} kW</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: EV QR Code Scanner & Check-In */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/20">
              2
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Scan or Enter Digital EV Pass
            </h3>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isCameraActive) {
                stopCameraScanner();
              } else {
                startCameraScanner();
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isCameraActive
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>{isCameraActive ? 'Close Camera Scanner' : 'Activate Camera Scanner'}</span>
          </button>
        </div>

        {/* Live Camera Scanner Container */}
        {isCameraActive && (
          <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-black p-3">
            <div id="qr-reader" className="w-full max-w-md mx-auto" />
            <p className="mt-2 text-center text-xs font-medium text-emerald-400 animate-pulse">
              Point terminal camera at EV QR Code on dashboard or mobile pass...
            </p>
          </div>
        )}

        {cameraError && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Manual Input Fallback */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAuthorize();
          }}
          className="space-y-3"
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Enter QR Identifier (e.g. VL-EV-001, VL-EV-002)"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={evaluating || !qrCode.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50 shadow-sm shadow-emerald-500/20"
            >
              {evaluating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Authorize Gate</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Chips */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400">Quick Test EV Chips:</span>
            {sampleQrs.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setQrCode(chip);
                  handleAuthorize(chip);
                }}
                className="rounded border border-slate-800 bg-slate-950 px-2.5 py-1 font-mono text-[11px] text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition"
              >
                {chip}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Active Session Success Flash */}
      {sessionSuccess && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-emerald-300 shadow-sm flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white">Charging Session Activated!</h4>
            <p className="text-xs text-emerald-200 mt-0.5">
              Session #{sessionSuccess.sessionId} underway for {sessionSuccess.registrationNo} at {sessionSuccess.stationName}. Redirecting to live monitor...
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Metro Turnstile Gate Card */}
      {authResult && (
        <div
          className={`rounded-xl border p-5 shadow-sm transition-all duration-300 ${
            authResult.authorized
              ? 'border-emerald-500/40 bg-slate-900/80'
              : 'border-rose-500/40 bg-slate-900/80'
          }`}
        >
          {/* Result Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${
                  authResult.authorized
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {authResult.authorized ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <XCircle className="h-6 w-6" />
                )}
              </div>
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest block ${
                    authResult.authorized ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {authResult.authorized ? 'Gate Open • Access Granted' : 'Gate Locked • Access Denied'}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {authResult.authorized ? 'Authorized to Charge' : 'Check-In Rejected'}
                </h3>
              </div>
            </div>

            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                authResult.authorized
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {authResult.status}
            </span>
          </div>

          {/* Reason Box */}
          <div className="mt-3.5 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
              System Validation Reason
            </span>
            <p
              className={`mt-1 font-medium leading-relaxed ${
                authResult.authorized ? 'text-slate-200' : 'text-rose-300'
              }`}
            >
              {authResult.reason}
            </p>
          </div>

          {/* Verified Vehicle & Bay Details (if authorized) */}
          {authResult.authorized && authResult.vehicle && (
            <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Vehicle</span>
                <span className="font-bold text-white mt-0.5 block truncate">
                  {authResult.vehicle.registrationNo}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 block">
                  {authResult.vehicle.qrIdentifier}
                </span>
              </div>

              <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Battery</span>
                <span className="font-bold text-emerald-400 mt-0.5 block text-sm font-mono">
                  {authResult.vehicle.currentBattery}%
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {authResult.vehicle.batteryCapacity} kWh Pack
                </span>
              </div>

              <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Bay</span>
                <span className="font-bold text-white mt-0.5 block truncate">
                  {authResult.station?.stationName}
                </span>
                <span className="text-[10px] text-cyan-400 block font-mono">
                  {authResult.station?.powerRating} kW
                </span>
              </div>

              <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Connector Fit</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">
                  Compatible
                </span>
                <span className="text-[10px] text-slate-400 block truncate font-mono">
                  {authResult.station?.connectorType}
                </span>
              </div>
            </div>
          )}

          {/* Action Trigger Area */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3.5 border-t border-slate-800">
            <button
              onClick={() => {
                setAuthResult(null);
                setQrCode('');
              }}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              ← Reset / Scan Next EV
            </button>

            {authResult.authorized ? (
              <button
                onClick={handleStartCharging}
                disabled={startLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 font-bold text-slate-950 hover:bg-emerald-400 shadow-sm shadow-emerald-500/20 transition disabled:opacity-50 text-xs"
              >
                <Zap className="h-4 w-4 fill-slate-950" />
                <span>{startLoading ? 'Activating Session...' : 'Plug In & Start Charging'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                to="/smart-charging"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Find Alternative Bay via Smart Engine</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
