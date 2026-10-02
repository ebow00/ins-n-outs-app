const pad = (n) => String(n).padStart(2, '0');

// Local calendar date as YYYY-MM-DD (toISOString() uses UTC and can be off by a day)
export function toLocalDateString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// 24h HH:MM, independent of device locale
export function formatHHMM(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}