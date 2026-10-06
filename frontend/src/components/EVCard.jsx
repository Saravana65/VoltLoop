import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Zap, QrCode, Copy, Check, ChevronRight, User } from 'lucide-react';
import BatteryIndicator from './BatteryIndicator';
import StatusBadge from './StatusBadge';

export default function EVCard({ vehicle, onUpdateBattery }) {
  const [copied, setCopied] = useState(false);

  if (!vehicle) return null;

  const handleCopyQR = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (vehicle.qrIdentifier) {
      navigator.clipboard.writeText(vehicle.qrIdentifier);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCharging = vehicle.status === 'CHARGING';

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 flex flex-col justify-between">
      <div>
        {/* Card Header: Reg & Badges */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-wide text-white font-mono">
                {vehicle.registrationNo}
              </span>
              <button
                onClick={handleCopyQR}
                title="Copy QR Identifier"
                className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-400 border border-slate-700 hover:bg-slate-750 transition"
              >
                <QrCode className="h-3 w-3" />
                <span>{vehicle.qrIdentifier || 'QR'}</span>
                {copied ? <Check className="h-2.5 w-2.5 text-emerald-300" /> : <Copy className="h-2.5 w-2.5 text-slate-400" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>{vehicle.vehicleType}</span>
            </p>
          </div>
          <StatusBadge status={vehicle.status} />
        </div>

        {/* Battery Telemetry */}
        <div className="py-4">
          <BatteryIndicator
            percentage={vehicle.currentBattery}
            capacity={vehicle.batteryCapacity}
            isCharging={isCharging}
            showLabel={true}
          />
        </div>

        {/* Driver / Owner info */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800/80">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-500" />
            <span className="truncate max-w-[130px]">{vehicle.ownerName || 'Campus Fleet'}</span>
          </span>
          <span className="font-mono text-slate-400 text-[11px]">
            Pack: {vehicle.batteryCapacity} kWh
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center justify-between gap-2 pt-1">
        <Link
          to={`/evs/${vehicle.vehicleId}`}
          className="flex-1 text-center rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-600 hover:text-white transition"
        >
          View Telemetry
        </Link>
        <Link
          to={`/smart-charging?qr=${encodeURIComponent(vehicle.qrIdentifier || '')}`}
          className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition shadow-sm"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Charge</span>
        </Link>
      </div>
    </div>
  );
}
