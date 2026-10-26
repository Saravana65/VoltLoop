import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Printer, ShieldCheck, Zap, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EVQRPass({ vehicle }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const passRef = useRef(null);

  useEffect(() => {
    if (!vehicle?.qrIdentifier) return;

    // Generate real 2D QR Code data URL containing strictly the opaque non-sensitive QR identifier
    QRCode.toDataURL(vehicle.qrIdentifier.trim().toUpperCase(), {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#030712', // slate-950
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code data URL', err));
  }, [vehicle?.qrIdentifier]);

  if (!vehicle) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `VoltLoop-Pass-${vehicle.qrIdentifier}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(vehicle.qrIdentifier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl relative overflow-hidden">
      {/* Background glowing ambient light */}
      <div className="absolute -top-24 -right-24 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md shadow-emerald-500/20">
            <Zap className="h-5 w-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-wide">
              Volt<span className="text-emerald-400">Loop</span> Digital EV Pass
            </h3>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Metro-Style Charging Authorization Pass
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="h-3.5 w-3.5" />
          Official Campus Pass
        </span>
      </div>

      {/* Pass Body / Boarding Pass Visual Layout */}
      <div
        ref={passRef}
        className="mt-6 rounded-xl border-2 border-dashed border-slate-700/80 bg-slate-950/80 p-5 flex flex-col items-center text-center"
      >
        {/* Real Scannable 2D QR Code Container */}
        <div className="relative p-2.5 bg-white rounded-xl shadow-lg shadow-black/50">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`VoltLoop QR Pass for ${vehicle.qrIdentifier}`}
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs font-mono">
              Generating 2D QR...
            </div>
          )}
        </div>

        {/* Big Monospace QR Identifier Badge */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-2xl font-black font-mono tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 rounded-lg shadow-inner">
            {vehicle.qrIdentifier}
          </span>
          <button
            onClick={handleCopy}
            title="Copy QR Identifier"
            className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <QrCode className="h-4 w-4" />}
          </button>
        </div>

        {/* Security & Data Notice */}
        <p className="mt-2 text-[10px] text-slate-500 font-mono">
          Security: Encodes opaque non-sensitive token • Verified on-station via JDBC
        </p>

        {/* Vehicle Metadata Strip */}
        <div className="mt-5 w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-left border-t border-slate-800 pt-4">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration</span>
            <span className="font-bold text-white font-mono mt-0.5 block truncate">{vehicle.registrationNo}</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehicle Model</span>
            <span className="font-semibold text-slate-200 mt-0.5 block truncate">{vehicle.vehicleType}</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Battery Spec</span>
            <span className="font-semibold text-emerald-400 mt-0.5 block">
              {vehicle.currentBattery}% ({vehicle.batteryCapacity} kWh)
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Save QR Image</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Pass</span>
          </button>
        </div>

        <Link
          to={`/station-checkin?qr=${encodeURIComponent(vehicle.qrIdentifier)}`}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition"
        >
          <span>Check-In at Station Bay</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
