/*
 * Crafatar URL builders.
 *
 * These are deliberately pure string helpers - we never request the image
 * ourselves. Discord fetches the URL when it renders the embed, so making our
 * own round trip would just double the traffic and slow the reply down.
 *
 * Everything funnels through this file so switching render providers later is
 * a single-file change.
 */

const BASE = 'https://crafatar.com';

// Crafatar takes dashed or undashed UUIDs but not usernames - it dropped name
// support years ago, so callers must resolve the profile first.
export function bodyRender(uuid, { scale = 10, overlay = true } = {}) {
  return `${BASE}/renders/body/${uuid}?scale=${scale}${overlay ? '&overlay' : ''}`;
}

export function headRender(uuid, { scale = 8, overlay = true } = {}) {
  return `${BASE}/renders/head/${uuid}?scale=${scale}${overlay ? '&overlay' : ''}`;
}

export function avatar(uuid, { size = 128, overlay = true } = {}) {
  return `${BASE}/avatars/${uuid}?size=${size}${overlay ? '&overlay' : ''}`;
}

export function skinFile(uuid) {
  return `${BASE}/skins/${uuid}`;
}

export function capeFile(uuid) {
  return `${BASE}/capes/${uuid}`;
}
