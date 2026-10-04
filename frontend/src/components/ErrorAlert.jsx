import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-300 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-400" />
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
