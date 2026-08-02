// Hypixel reports a bare "wins/losses" pair everywhere; a player with no losses
// yet should read as their win count rather than Infinity.
export function ratio(numerator, denominator) {
  return (denominator === 0 ? numerator : numerator / denominator).toFixed(2);
}

export function count(value) {
  return (value ?? 0).toLocaleString();
}

export function discordDate(millis) {
  return millis ? `<t:${Math.floor(millis / 1000)}:D>` : 'Unknown';
}

// Strips Minecraft's section-sign colour codes from preformatted labels.
export function stripColors(value) {
  return value?.replace(/\u00a7./g, '') ?? null;
}
