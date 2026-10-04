import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="relative w-10 h-10">
        <div className="w-10 h-10 rounded-full border-2 border-slate-700"></div>
        <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm text-slate-400 animate-pulse font-medium">{message}</p>
    </div>
  );
}
