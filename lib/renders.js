/*
 * Skin render URLs.
 *
 * These are pure string builders on purpose - we never request the image
 * ourselves. Discord fetches the URL when it renders the embed, so making our
 * own round trip would only double the traffic and slow the reply down.
 *
 * Every host reference in the project lives in this file. That indirection has
 * now earned its keep twice. Crafatar went first (521 on every path, site root
 * included). Minotar replaced it and then quietly stopped resolving UUIDs -
 * not with an error, which would have been obvious, but by serving the default
 * skin, so every embed showed a perfectly healthy Steve. Byte-for-byte the
 * response for a real player matched the response for the null UUID.
 *
 * Crafthead is the third try. It mirrors Minotar's URL scheme, so the swap was
 * only this file again, and unlike Minotar it actually resolves UUIDs.
 *
 * Confirmed against the live service:
 *  - Dashed and undashed UUIDs both work.
 *  - The .png suffix is optional. We include it so the URLs are unambiguous.
 *  - Sizes scale properly and clamp at 300.
 *
 * If a render ever comes back as Steve again, check it against the null UUID
 * before assuming the player just has a default skin - that's the tell.
 */

const BASE = 'https://crafthead.net';

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
  return `${BASE}/skin/${uuid}`;
}
