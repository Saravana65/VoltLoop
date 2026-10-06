import React from 'react';
import { Zap, MapPin, Wrench, Calendar, Gauge } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function StationCard({ station, onToggleMaintenance, onReserve }) {
  if (!station) return null;

  const isFastCharger = Number(station.powerRating) >= 50;

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 flex flex-col justify-between">
      <div>
        {/* Header: Name, location & Status */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-wide text-white">
                {station.stationName}
              </span>
              <span className="font-mono text-xs text-slate-500">#{station.stationId}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="truncate max-w-[200px]">{station.location}</span>
            </div>
          </div>
          <StatusBadge status={station.status} />
        </div>

        {/* Specifications Grid */}
        <div className="my-4 grid grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Power Output
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`text-lg font-black font-mono ${
                  isFastCharger ? 'text-cyan-400' : 'text-emerald-400'
                }`}
              >
                {station.powerRating}
              </span>
              <span className="text-xs font-semibold text-slate-400">kW</span>
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              {isFastCharger ? 'DC Fast Charger' : 'AC Standard'}
            </span>
          </div>

          <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Charger Architecture
            </span>
            <div className="mt-1 text-sm font-bold text-white truncate">
              {station.chargerType || 'Standard'}
            </div>
            <span className="text-[10px] text-cyan-400 block truncate mt-0.5">
              {station.connectorType}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {onToggleMaintenance && (
          <button
            onClick={() => onToggleMaintenance(station)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              station.status === 'MAINTENANCE'
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
            }`}
          >
            <Wrench className="h-3 w-3" />
            <span>{station.status === 'MAINTENANCE' ? 'Restore Bay' : 'Maintenance'}</span>
          </button>
        )}

        {onReserve ? (
          <button
            onClick={() => onReserve(station)}
            disabled={station.status === 'MAINTENANCE'}
            className="flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition disabled:opacity-40"
          >
            <Calendar className="h-3 w-3" />
            <span>Book Slot</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-500 font-mono">
            Bay {station.stationId} • Ready
          </span>
        )}
      </div>
    </div>
  );
}
