import React from 'react';
import { Battery, BatteryCharging, BatteryWarning, Zap } from 'lucide-react';

export function getBatteryLevelInfo(percentage) {
  const pct = Math.min(100, Math.max(0, Number(percentage) || 0));
  if (pct <= 20) {
    return {
      label: 'CRITICAL',
      sublabel: 'Immediate charge required',
      color: 'rose',
      hex: '#f43f5e',
      bgClass: 'bg-rose-500',
      textClass: 'text-rose-400',
      borderClass: 'border-rose-500/30',
      bgLightClass: 'bg-rose-500/10',
    };
  }
  if (pct <= 50) {
    return {
      label: 'LOW',
      sublabel: 'Charging recommended',
      color: 'amber',
      hex: '#f59e0b',
      bgClass: 'bg-amber-500',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/30',
      bgLightClass: 'bg-amber-500/10',
    };
  }
  if (pct <= 80) {
    return {
      label: 'OPTIMAL',
      sublabel: 'Standard operating level',
      color: 'emerald',
      hex: '#10b981',
      bgClass: 'bg-emerald-500',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/30',
      bgLightClass: 'bg-emerald-500/10',
    };
  }
  return {
    label: 'FULL',
    sublabel: 'Maximum range available',
    color: 'teal',
    hex: '#14b8a6',
    bgClass: 'bg-teal-400',
    textClass: 'text-teal-300',
    borderClass: 'border-teal-400/30',
    bgLightClass: 'bg-teal-400/10',
  };
}

export default function BatteryIndicator({
  percentage = 0,
  capacity,
  variant = 'bar',
  isCharging = false,
  showLabel = true,
  className = '',
}) {
  const pct = Math.min(100, Math.max(0, Math.round(Number(percentage) || 0)));
  const info = getBatteryLevelInfo(pct);

  // Circular gauge variant
  if (variant === 'circle') {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
      <div className={`relative flex flex-col items-center justify-center ${className}`}>
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              className="text-slate-800"
              fill="transparent"
            />
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke={info.hex}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            {isCharging ? (
              <Zap className="h-4 w-4 text-amber-400 animate-pulse mb-0.5" />
            ) : null}
            <span className="text-xl font-black text-white font-mono">{pct}%</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {info.label}
            </span>
          </div>
        </div>
        {capacity && (
          <div className="mt-1 text-xs text-slate-400 font-mono">
            {((capacity * pct) / 100).toFixed(1)} / {capacity} kWh
          </div>
        )}
      </div>
    );
  }

  // Badge pill variant
  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.bgLightClass} ${info.textClass} border ${info.borderClass} ${className}`}
      >
        {isCharging ? (
          <Zap className="h-3 w-3 animate-pulse" />
        ) : pct <= 20 ? (
          <BatteryWarning className="h-3 w-3" />
        ) : (
          <Battery className="h-3 w-3" />
        )}
        <span className="font-mono">{pct}%</span>
        {showLabel && <span className="text-[10px] uppercase font-bold">({info.label})</span>}
      </span>
    );
  }

  // Default Bar variant
  return (
    <div className={`space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            {isCharging ? (
              <BatteryCharging className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            ) : (
              <Battery className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span className="font-medium">Battery SoC</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white">{pct}%</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${info.bgLightClass} ${info.textClass} border ${info.borderClass}`}
            >
              {info.label}
            </span>
          </div>
        </div>
      )}

      {/* Progress Bar Track */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700/60 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${info.bgClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {capacity && (
        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
          <span>{((capacity * pct) / 100).toFixed(1)} kWh remaining</span>
          <span>{capacity} kWh pack</span>
        </div>
      )}
    </div>
  );
}
