/*
 * Skin render URLs.
 *
 * These are pure string builders on purpose - we never request the image
 * ourselves. Discord fetches the URL when it renders the embed, so making our
 * own round trip would only double the traffic and slow the reply down.
 *
 * Every host reference in the project lives in this file. That indirection
 * earned its keep: the bot was on Crafatar until their origin went down hard
 * (521 on every path, including the site root) and every thumbnail in every
 * embed broke at once. Swapping to Minotar was a one-file change. If Minotar
 * ever goes the same way, this is still the only file to touch.
 *
 * Minotar specifics, confirmed against the live service:
 *  - Dashed and undashed UUIDs both work, as does a bare username.
 *  - The .png suffix is optional. We include it so the URLs are unambiguous.
 *  - Sizes clamp at 300; asking for 512 silently returns 300.
 *  - Unknown UUIDs return a default skin rather than a 404, so a bad lookup
 *    degrades to a Steve render instead of a broken image.
 */

const BASE = 'https://minotar.net';

// Anything above this is ignored by the service, so don't pretend otherwise.
const MAX_SIZE = 300;

const clampSize = size => Math.min(Math.max(Math.trunc(size) || 1, 8), MAX_SIZE);

/** Full-length body, outer skin layer included. Renders 1:2, so it suits a large image. */
export function bodyRender(uuid, { size = MAX_SIZE } = {}) {
  return `${BASE}/armor/body/${uuid}/${clampSize(size)}.png`;
}

/** Isometric head. Square and readable at thumbnail scale. */
export function headRender(uuid, { size = 150 } = {}) {
  return `${BASE}/cube/${uuid}/${clampSize(size)}.png`;
}

/** Flat face with the hat layer on top - the plain /avatar path omits it. */
export function avatar(uuid, { size = 128 } = {}) {
  return `${BASE}/helm/${uuid}/${clampSize(size)}.png`;
}

/** The raw 64x64 skin file itself, for download links. */
export function skinDownload(uuid) {
  return `${BASE}/download/${uuid}`;
}
