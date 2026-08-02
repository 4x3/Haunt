import { UserError } from './errors.js';

const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const USERNAME_PATTERN = /^\w{1,16}$/;

const profileCache = new Map();

// Mojang rate limits username lookups aggressively and every stats command
// starts with one, so repeated lookups of the same name are served from memory.
export async function resolveProfile(username) {
  if (!USERNAME_PATTERN.test(username)) {
    throw new UserError(`\`${username}\` is not a valid Minecraft username.`);
  }

  const cacheKey = username.toLowerCase();
  const cached = profileCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.profile;

  const res = await fetch(
    `https://api.mojang.com/users/profiles/minecraft/${username}`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  );

  if (res.status === 404 || res.status === 204) {
    throw new UserError(`No Minecraft account named **${username}** exists.`);
  }
  if (res.status === 429) {
    throw new UserError('Mojang is rate limiting us. Try again in a minute.');
  }
  if (!res.ok) throw new Error(`Mojang returned ${res.status} for ${username}`);

  const data = await res.json();
  if (!data?.id) {
    throw new UserError(`No Minecraft account named **${username}** exists.`);
  }

  const profile = { uuid: data.id, name: data.name };
  profileCache.set(cacheKey, { profile, expiresAt: Date.now() + CACHE_TTL_MS });
  return profile;
}

const sessionCache = new Map();

async function fetchSessionProfile(uuid) {
  const cached = sessionCache.get(uuid);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const res = await fetch(
    `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  if (!res.ok) return null;

  const data = await res.json();
  sessionCache.set(uuid, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

// Reverse lookup for UUIDs that came from Hypixel rather than user input.
// Returns null rather than throwing; callers fall back to showing the UUID.
export async function fetchUsername(uuid) {
  try {
    const data = await fetchSessionProfile(uuid);
    return data?.name ?? null;
  } catch {
    return null;
  }
}

// Returns 'slim' or 'classic'. Falls back to classic if the session server is
// unreachable, since this only drives a cosmetic label.
export async function fetchSkinModel(uuid) {
  try {
    const data = await fetchSessionProfile(uuid);
    const textures = data?.properties?.find(prop => prop.name === 'textures');
    if (!textures) return 'classic';

    const decoded = JSON.parse(Buffer.from(textures.value, 'base64').toString());
    return decoded?.textures?.SKIN?.metadata?.model === 'slim' ? 'slim' : 'classic';
  } catch {
    return 'classic';
  }
}
