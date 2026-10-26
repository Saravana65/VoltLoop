import React from 'react';

const ACCENTS = {
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderTop: 'border-t-emerald-500',
    text: 'text-emerald-400',
  },
  cyan: {
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    borderTop: 'border-t-cyan-500',
    text: 'text-cyan-400',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderTop: 'border-t-amber-500',
    text: 'text-amber-400',
  },
  purple: {
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    borderTop: 'border-t-purple-500',
    text: 'text-purple-400',
  },
  rose: {
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    borderTop: 'border-t-rose-500',
    text: 'text-rose-400',
  },
  blue: {
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    borderTop: 'border-t-blue-500',
    text: 'text-blue-400',
  },
};

export default function StatCard({
  title,
  value,
  unit = '',
  subtext,
  icon: Icon,
  accent = 'emerald',
  trend,
  className = '',
}) {
  const theme = ACCENTS[accent] || ACCENTS.emerald;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-md ${className}`}
    >
      {/* Subtle top indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-${accent === 'cyan' ? 'cyan-500' : accent === 'amber' ? 'amber-500' : 'emerald-500'} to-transparent opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${theme.iconBg} shadow-sm group-hover:scale-105 transition-transform`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-400 font-mono">
            {unit}
          </span>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          {subtext && <span className="truncate">{subtext}</span>}
          {trend && (
            <span className="font-mono text-[11px] font-semibold text-emerald-400">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
