import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function Loading({ message = 'Loading VoltLoop data...', variant = 'spinner' }) {
  if (variant === 'skeleton') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-850 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-850 rounded-xl"></div>
          <div className="h-28 bg-slate-850 rounded-xl"></div>
          <div className="h-28 bg-slate-850 rounded-xl"></div>
        </div>
        <div className="h-64 bg-slate-850 rounded-xl"></div>
      </div>
    );
  }

  return <LoadingSpinner message={message} />;
}
