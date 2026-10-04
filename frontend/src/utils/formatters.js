/**
 * Utility formatters for VoltLoop EV Fleet Management System
 */

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (e) {
    return dateStr;
  }
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatEnergy = (kwh) => {
  if (kwh === undefined || kwh === null) return '0.00 kWh';
  return `${Number(kwh).toFixed(2)} kWh`;
};

export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '—';
  const mins = Math.round(minutes);
  if (mins < 60) return `${mins} mins`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours} hr ${remainingMins} mins` : `${hours} hr`;
};

export const getBatteryColor = (percentage) => {
  const p = Number(percentage) || 0;
  if (p <= 20) return { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500', hex: '#ef4444' };
  if (p <= 50) return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500', hex: '#f59e0b' };
  if (p <= 80) return { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500', hex: '#3b82f6' };
  return { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500', hex: '#10b981' };
};
