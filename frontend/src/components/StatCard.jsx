import React from 'react';

export default function StatCard({ title, value, unit = '', subtext, icon: Icon, accent = 'emerald' }) {
  const accents = {
    emerald: 'from-emerald-500/10 to-transparent border-emerald-500/30 text-emerald-400',
    cyan: 'from-cyan-500/10 to-transparent border-cyan-500/30 text-cyan-400',
    amber: 'from-amber-500/10 to-transparent border-amber-500/30 text-amber-400',
    purple: 'from-purple-500/10 to-transparent border-purple-500/30 text-purple-400',
    rose: 'from-rose-500/10 to-transparent border-rose-500/30 text-rose-400',
  };

  const accentStyle = accents[accent] || accents.emerald;

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-slate-900/80 p-5 shadow-lg backdrop-blur bg-gradient-to-b ${accentStyle}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        {Icon && (
          <div className="rounded-lg bg-slate-800/80 p-2.5 shadow-inner">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>
      {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
    </div>
  );
}
