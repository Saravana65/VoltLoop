import React, { useState } from 'react';
import { QrCode, Search, CheckCircle2, AlertCircle, Camera, RefreshCw } from 'lucide-react';
import { vehiclesApi } from '../services/api';
import StatusBadge from './StatusBadge';

export default function QRScanner({ onVehicleFound, embedded = false }) {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [foundVehicle, setFoundVehicle] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const sampleQrs = ['VL-EV-001', 'VL-EV-002', 'VL-EV-003', 'VL-EV-004', 'VL-EV-008'];

  const handleLookup = async (codeToLookup) => {
    const code = (codeToLookup || qrCode || '').trim().toUpperCase();
    if (!code) {
      setError('Please enter or select a QR identifier.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const vehicle = await vehiclesApi.getByQr(code);
      setFoundVehicle(vehicle);
      if (onVehicleFound) {
        onVehicleFound(vehicle);
      }
    } catch (err) {
      setFoundVehicle(null);
      setError(err.message || 'Vehicle with this QR identifier not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sample) => {
    setQrCode(sample);
    handleLookup(sample);
  };

  const toggleCamera = () => {
    setIsCameraActive((prev) => !prev);
    // If turning on camera, we can auto-simulate scan after 2 seconds for viva convenience
    if (!isCameraActive) {
      setTimeout(() => {
        handleSelectSample('VL-EV-002');
      }, 2200);
    }
  };

  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl ${embedded ? '' : 'max-w-lg mx-auto'}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">QR Code Identification</h3>
            <p className="text-xs text-slate-400">Scan or enter EV identifier (e.g. VL-EV-001)</p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleCamera}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
            isCameraActive
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Camera className="h-3.5 w-3.5" />
          {isCameraActive ? 'Close Camera' : 'Camera Mode'}
        </button>
      </div>

      {/* Simulated / Camera Viewfinder */}
      {isCameraActive && (
        <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-700 bg-black aspect-video flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/60 via-black to-black opacity-80" />
          
          {/* Viewfinder Target Brackets */}
          <div className="relative w-44 h-44 border-2 border-emerald-500/40 rounded-xl flex items-center justify-center">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-1 -ml-1" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-1 -mr-1" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-1 -ml-1" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-1 -mr-1" />

            {/* Animated Laser Scanline */}
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-bounce" />
            <QrCode className="h-12 w-12 text-slate-700/60" />
          </div>

          <p className="relative mt-3 text-xs font-medium text-emerald-400 tracking-wide animate-pulse">
            Point camera at EV QR Code... (Auto-detecting)
          </p>
        </div>
      )}

      {/* Manual Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLookup();
        }}
        className="mt-4 space-y-3"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Enter QR Identifier (e.g. VL-EV-001)"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !qrCode.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Identify
          </button>
        </div>

        {/* Demo Quick Select Chips */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 mr-2">Quick Demo EV Chips:</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {sampleQrs.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => handleSelectSample(code)}
                className="rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Error Message Display */}
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Identified Vehicle Card */}
      {foundVehicle && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <span className="font-mono text-xs font-semibold text-emerald-400">
                  {foundVehicle.qrIdentifier}
                </span>
                <h4 className="text-base font-bold text-white">
                  {foundVehicle.registrationNo}
                </h4>
                <p className="text-xs text-slate-400">{foundVehicle.vehicleType}</p>
              </div>
            </div>
            <StatusBadge status={foundVehicle.status} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-xs">
            <div>
              <span className="text-slate-400">Battery Level:</span>{' '}
              <span className="font-semibold text-white">{foundVehicle.currentBattery}%</span>
            </div>
            <div>
              <span className="text-slate-400">Capacity:</span>{' '}
              <span className="font-semibold text-white">{foundVehicle.batteryCapacity} kWh</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400">Registered Owner:</span>{' '}
              <span className="font-semibold text-slate-200">{foundVehicle.ownerName || 'Campus Fleet'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
