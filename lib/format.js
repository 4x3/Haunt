/*
 * Small display helpers. Nothing clever here, but centralising them keeps the
 * command files readable and stops five slightly different ratio formatters
 * from drifting apart.
 */

// A player with wins and no losses should read as their win count, not Infinity.
export function ratio(numerator, denominator) {
  const top = numerator ?? 0;
  const bottom = denominator ?? 0;
  return (bottom === 0 ? top : top / bottom).toFixed(2);
}

export function count(value) {
  return (value ?? 0).toLocaleString('en-US');
}

export function percent(part, whole) {
  if (!whole) return '0%';
  return `${((part / whole) * 100).toFixed(1)}%`;
}

/** Discord renders these in the reader's own timezone, which beats hardcoding UTC. */
export function discordDate(millis, style = 'D') {
  return millis ? `<t:${Math.floor(millis / 1000)}:${style}>` : 'Unknown';
}

export function relativeTime(millis) {
  return millis ? `<t:${Math.floor(millis / 1000)}:R>` : 'Unknown';
}

/** Strips Minecraft's section-sign colour codes out of preformatted labels. */
export function stripColors(value) {
  return typeof value === 'string' ? value.replace(/\u00a7./g, '') : null;
}

/** 1_234_567 -> "1.2M". Used where embed fields would otherwise get very wide. */
export function compact(value) {
  const n = value ?? 0;
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

export function duration(millis) {
  if (!millis || millis < 0) return 'N/A';

  const totalMinutes = Math.floor(millis / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Embed field values cap at 1024 characters; trim before Discord rejects it. */
export function clamp(text, limit = 1024) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 3)}...`;
}

// Turns SNAKE_CASE api values into something presentable.
export function titleCase(value) {
  if (!value) return 'Unknown';
  return String(value)
    .toLowerCase()
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
