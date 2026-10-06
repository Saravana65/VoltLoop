import React from 'react';
import { AlertTriangle, ShieldAlert, RefreshCw, Info } from 'lucide-react';

export default function ErrorMessage({ error, message, onRetry }) {
  const errText = message || (typeof error === 'string' ? error : error?.message);
  const status = error?.status || (errText?.includes('409') ? 409 : null);

  if (!errText) return null;

  // Specific 409 Conflict Formatting (Requirement Section 20)
  if (status === 409 || errText?.toLowerCase().includes('already reserved') || errText?.toLowerCase().includes('conflict')) {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-4 text-rose-200 shadow-md">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-rose-500/20 p-2 text-rose-400 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white">Booking Conflict (HTTP 409)</h4>
            <p className="mt-1 text-xs text-rose-200 leading-relaxed">
              {errText || 'Unable to reserve this station because another reservation already exists during the selected time.'}
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 transition shrink-0"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // General Error Banner
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <span className="text-xs font-bold text-rose-200 uppercase tracking-wide block">
              System Error
            </span>
            <p className="text-xs font-medium text-rose-300 mt-0.5">{errText}</p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 transition shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
