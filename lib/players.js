import { UserError } from './errors.js';

/*
 * Player identity lookups.
 *
 * We used to hit api.mojang.com directly for name -> UUID. It works, but Mojang
 * rate limits that route aggressively and a stats bot burns through it fast
 * (every single command starts with a name lookup). PlayerDB proxies the same
 * data with far friendlier limits, and it bundles the session profile in the
 * same response - so one round trip gets us the UUID, the correctly cased name
 * and the texture blob instead of two or three separate calls.
 */

const ENDPOINT = 'https://playerdb.co/api/player/minecraft';
const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 10 * 60 * 1000;

const USERNAME_RE = /^\w{1,16}$/;
const UUID_RE = /^[0-9a-f]{32}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cache = new Map();

// PlayerDB accepts either form and Hypixel wants the trimmed one, so we keep
// both around rather than converting at every call site.
function undash(uuid) {
  return uuid.replace(/-/g, '');
}

function dash(uuid) {
  const raw = undash(uuid);
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
}

// The textures property is the same base64 payload Mojang's sessionserver
// returns, so the decoding is identical - PlayerDB just saves us the extra hop.
function readTextures(player) {
  const prop = player.properties?.find(entry => entry.name === 'textures');
  if (!prop?.value) return {};

  try {
    const decoded = JSON.parse(Buffer.from(prop.value, 'base64').toString());
    return decoded?.textures ?? {};
  } catch {
    // Malformed base64 shouldn't take a whole command down; the skin fields are
    // cosmetic and every caller treats them as optional.
    return {};
  }
}

function toProfile(player) {
  const textures = readTextures(player);

  return {
    uuid: player.raw_id ?? undash(player.id),
    uuidDashed: player.id ?? dash(player.raw_id),
    name: player.username,
    // Mojang only sets metadata.model on slim skins; classic is the absence of it.
    skinModel: textures.SKIN?.metadata?.model === 'slim' ? 'slim' : 'classic',
    skinTexture: player.skin_texture ?? null,
    capeTexture: player.cape_texture ?? null,
  };
}

/**
 * Look up a player by username or UUID. Returns the same shape either way.
 * Throws UserError when the account genuinely doesn't exist.
 */
export async function resolvePlayer(query) {
  const term = String(query ?? '').trim();

  if (!USERNAME_RE.test(term) && !UUID_RE.test(term)) {
    throw new UserError(`\`${term}\` isn't a valid Minecraft username or UUID.`);
  }

  const cacheKey = term.toLowerCase();
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.profile;

  let res;
  try {
    res = await fetch(`${ENDPOINT}/${term}`, {
      headers: { 'User-Agent': 'Haunt (Discord bot)' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new UserError('The Minecraft profile lookup timed out. Try again in a moment.');
    }
    throw err;
  }

  const body = await res.json().catch(() => null);

  // Heads up: PlayerDB answers "no such player" with 400, not 404, so checking
  // res.ok alone would report a lookup failure for a simple typo.
  if (res.status === 400 && body?.code === 'minecraft.invalid_username') {
    throw new UserError(`No Minecraft account named **${term}** exists.`);
  }
  if (res.status === 429) {
    throw new UserError('Profile lookups are being rate limited. Try again shortly.');
  }
  if (!res.ok || !body?.data?.player) {
    throw new Error(`PlayerDB returned ${res.status} for ${term}`);
  }

  const profile = toProfile(body.data.player);

  // Cache under both the query and the canonical name so "/stats TECHNOBLADE"
  // and a later "/stats Technoblade" share an entry.
  const expiresAt = Date.now() + CACHE_TTL_MS;
  cache.set(cacheKey, { profile, expiresAt });
  cache.set(profile.name.toLowerCase(), { profile, expiresAt });
  cache.set(profile.uuid, { profile, expiresAt });

  return profile;
}

/** Reverse lookup used where Hypixel hands us a UUID and we want a name. */
export async function resolveUsername(uuid) {
  try {
    const profile = await resolvePlayer(uuid);
    return profile.name;
  } catch {
    // Guild rosters can contain hundreds of UUIDs and the odd one won't resolve.
    // Callers fall back to showing the raw UUID rather than failing the command.
    return null;
  }
}

export { dash as toDashedUuid };
