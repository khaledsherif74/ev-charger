export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' }).format(date);
}

export function formatDuration(seconds) {
  if (!Number.isFinite(Number(seconds))) return '—';
  const total = Math.max(0, Math.round(Number(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m ${String(secs).padStart(2, '0')}s`;
}

export function formatKwh(energyWh) {
  if (energyWh === null || energyWh === undefined || energyWh === '') return '—';
  const value = Number(energyWh) / 1000;
  return Number.isFinite(value) ? `${value.toFixed(value >= 100 ? 1 : 2)} kWh` : '—';
}

export function formatMoneyPiastres(value) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value) / 100;
  return Number.isFinite(amount) ? `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP` : '—';
}

export function formatUptime(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return '—';
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (days) return `${days}d ${hours}h ${minutes}m`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function toneForStatus(status) {
  if (status === 'Available') return 'success';
  if (status === 'Charging') return 'accent';
  if (status === 'Faulted') return 'danger';
  if (status === 'Unavailable' || status === 'Offline') return 'danger';
  return 'neutral';
}

export function sessionTone(state) {
  if (state === 'COMPLETED') return 'success';
  if (state === 'FAILED' || state === 'TIMEOUT') return 'danger';
  if (state === 'UNRESOLVED' || state === 'OFFLINE_CHARGING') return 'warning';
  return 'accent';
}
