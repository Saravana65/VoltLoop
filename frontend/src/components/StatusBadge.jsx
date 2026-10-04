import React from 'react';

const STATUS_CONFIGS = {
  ACTIVE: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  CHARGING: { label: 'Charging', bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', dot: 'bg-cyan-400 animate-pulse' },
  INACTIVE: { label: 'Inactive', bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30', dot: 'bg-slate-400' },
  AVAILABLE: { label: 'Available', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  OCCUPIED: { label: 'Occupied', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  MAINTENANCE: { label: 'Maintenance', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-400' },
  RESERVED: { label: 'Reserved', bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30', dot: 'bg-violet-400' },
  COMPLETED: { label: 'Completed', bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30', dot: 'bg-teal-400' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30', dot: 'bg-zinc-400' },
  VERY_HIGH: { label: 'Very High Urgency', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40', dot: 'bg-rose-500' },
  HIGH: { label: 'High Urgency', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', dot: 'bg-amber-500' },
  MEDIUM: { label: 'Medium Urgency', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', dot: 'bg-blue-500' },
  LOW: { label: 'Low Urgency', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', dot: 'bg-emerald-500' },
};

export default function StatusBadge({ status, className = '' }) {
  const norm = (status || '').toUpperCase().trim();
  const config = STATUS_CONFIGS[norm] || {
    label: status || 'Unknown',
    bg: 'bg-slate-700/50',
    text: 'text-slate-300',
    border: 'border-slate-600',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}
