import { UserError } from './errors.js';
import { resolvePlayer } from './players.js';

/*
 * Thin client for the Hypixel Public API (v2).
 *
 * Two things worth knowing before touching this file:
 *
 *  1. The key goes in an `API-Key` header. The old `?key=` query parameter is
 *     gone - Hypixel answers 400 "Missing API-Key header" whether or not you
 *     pass a valid key in the query string, which is a confusing way to fail.
 *
 *  2. Everything under /resources plus a few SkyBlock market routes are open to
 *     anonymous callers. We skip the header for those so they keep working even
 *     if the bot has no key configured yet.
 */

const BASE = 'https://api.hypixel.net/v2';
const TIMEOUT_MS = 8000;

// Confirmed open by request; anything not listed here gets the auth header.
const KEYLESS = [
  /^\/resources\//,
  /^\/skyblock\/(bazaar|auctions|auctions_ended|news|firesales)$/,
];

// Cache lifetimes, in ms. Player stats change constantly but nobody needs
// second-by-second accuracy, and resource dumps are effectively static.
const TTL = {
  '/resources/': 6 * 60 * 60 * 1000,
  '/skyblock/bazaar': 60 * 1000,
  '/skyblock/auctions': 5 * 60 * 1000,
  '/skyblock/news': 30 * 60 * 1000,
  '/skyblock/firesales': 10 * 60 * 1000,
  '/counts': 30 * 1000,
  '/punishmentstats': 60 * 1000,
  '/boosters': 60 * 1000,
  '/leaderboards': 5 * 60 * 1000,
  default: 60 * 1000,
};

const cache = new Map();

// Populated from the RateLimit-* response headers so we can refuse a request
// we already know will bounce, instead of spending it to find out.
const quota = { remaining: null, resetAt: 0 };

function ttlFor(path) {
  const match = Object.keys(TTL).find(prefix => prefix !== 'default' && path.startsWith(prefix));
  return TTL[match ?? 'default'];
}

function needsKey(path) {
  return !KEYLESS.some(pattern => pattern.test(path));
}

function buildUrl(path, params) {
  const url = new URL(BASE + path);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(name, value);
  }
  return url;
}

function readQuota(res) {
  const remaining = Number(res.headers.get('RateLimit-Remaining'));
  const reset = Number(res.headers.get('RateLimit-Reset'));

  if (Number.isFinite(remaining)) quota.remaining = remaining;
  // Reset is "seconds until the window rolls over", not a timestamp.
  if (Number.isFinite(reset)) quota.resetAt = Date.now() + reset * 1000;
}

function throttledMessage() {
  const seconds = Math.max(1, Math.ceil((quota.resetAt - Date.now()) / 1000));
  return `The bot is being rate limited by Hypixel right now. Try again in ${seconds}s.`;
}

async function send(path, params) {
  const url = buildUrl(path, params);
  const headers = {};

  if (needsKey(path)) {
    const apiKey = process.env.HYPIXEL_API_KEY;
    if (!apiKey) throw new Error('HYPIXEL_API_KEY is not set');
    headers['API-Key'] = apiKey;

    // Soft throttle: if the last response said we're out of budget and the
    // window hasn't rolled over yet, fail fast rather than burning the retry.
    if (quota.remaining === 0 && Date.now() < quota.resetAt) {
      throw new UserError(throttledMessage());
    }
  }

  let res;
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new UserError('Hypixel took too long to respond. Try again in a moment.');
    }
    throw err;
  }

  readQuota(res);

  if (res.status === 429) throw new UserError(throttledMessage());
  if (res.status === 403) {
    throw new UserError("The bot's Hypixel API key is invalid or expired.");
  }
  if (res.status === 422) {
    throw new UserError('Hypixel rejected that request as invalid.');
  }
  if (!res.ok) throw new Error(`Hypixel returned ${res.status} for ${path}`);

  const body = await res.json();
  if (!body.success) throw new Error(`Hypixel error on ${path}: ${body.cause}`);
  return body;
}

/**
 * GET a Hypixel endpoint, with a short-lived response cache.
 *
 * In-flight requests are shared too - if three people run /counts at once we
 * make one call, not three.
 */
export async function request(path, params = {}) {
  const key = buildUrl(path, params).toString();
  const entry = cache.get(key);

  if (entry) {
    if (entry.pending) return entry.pending;
    if (entry.expiresAt > Date.now()) return entry.value;
  }

  const pending = send(path, params)
    .then(value => {
      cache.set(key, { value, expiresAt: Date.now() + ttlFor(path) });
      return value;
    })
    .catch(err => {
      cache.delete(key);
      throw err;
    });

  cache.set(key, { pending });
  return pending;
}

/* ------------------------------------------------------------------ */
/* Endpoint wrappers                                                    */
/* ------------------------------------------------------------------ */

export async function getPlayer(uuid) {
  const { player } = await request('/player', { uuid });
  return player;
}

export async function getStatus(uuid) {
  const { session } = await request('/status', { uuid });
  return session ?? {};
}

export async function getRecentGames(uuid) {
  const { games } = await request('/recentgames', { uuid });
  return games ?? [];
}

export async function getGuildByPlayer(uuid) {
  const { guild } = await request('/guild', { player: uuid });
  return guild;
}

export async function getGuildByName(name) {
  const { guild } = await request('/guild', { name });
  return guild;
}

export async function getCounts() {
  return request('/counts');
}

export async function getPunishmentStats() {
  return request('/punishmentstats');
}

export async function getBoosters() {
  const { boosters } = await request('/boosters');
  return boosters ?? [];
}

export async function getLeaderboards() {
  const { leaderboards } = await request('/leaderboards');
  return leaderboards ?? {};
}

export async function getBazaar() {
  const { products } = await request('/skyblock/bazaar');
  return products ?? {};
}

export async function getAuctionPage(page = 0) {
  return request('/skyblock/auctions', { page });
}

export async function getSkyblockNews() {
  const { items } = await request('/skyblock/news');
  return items ?? [];
}

export async function getFireSales() {
  const { sales } = await request('/skyblock/firesales');
  return sales ?? [];
}

export async function getSkyblockProfiles(uuid) {
  const { profiles } = await request('/skyblock/profiles', { uuid });
  return profiles ?? [];
}

export async function getElection() {
  return request('/resources/skyblock/election');
}

export async function getSkillResources() {
  const { skills } = await request('/resources/skyblock/skills');
  return skills ?? {};
}

export async function getGameResources() {
  const { games } = await request('/resources/games');
  return games ?? {};
}

/* ------------------------------------------------------------------ */
/* Level maths                                                          */
/* ------------------------------------------------------------------ */

// Hypixel's published network level curve.
export function networkLevel(exp = 0) {
  return Math.sqrt(2 * (exp ?? 0) + 30625) / 50 - 2.5;
}

// Inverse of the above: total XP needed to reach a given level.
export function xpForNetworkLevel(level) {
  return 1250 * level ** 2 + 6250 * level - 7500;
}

/*
 * Bed Wars stars. The first four levels of each prestige are discounted and the
 * other 96 cost a flat 5000, which is where the 487,000 per prestige comes from.
 * The old implementation used a made-up XP table and ignored prestiges entirely.
 */
const EASY_LEVEL_COSTS = [500, 1000, 2000, 3500];
const BEDWARS_XP_PER_LEVEL = 5000;
const LEVELS_PER_PRESTIGE = 100;
const XP_PER_PRESTIGE = 96 * BEDWARS_XP_PER_LEVEL + 7000;

export function bedwarsLevel(exp = 0) {
  let level = Math.floor(exp / XP_PER_PRESTIGE) * LEVELS_PER_PRESTIGE;
  let remaining = exp % XP_PER_PRESTIGE;

  for (const cost of EASY_LEVEL_COSTS) {
    if (remaining < cost) return level;
    level++;
    remaining -= cost;
  }

  return level + Math.floor(remaining / BEDWARS_XP_PER_LEVEL);
}

/**
 * Resolve a name to a profile and pull their Hypixel data in one step.
 * Most commands want exactly this pair.
 */
export async function requirePlayer(query) {
  const profile = await resolvePlayer(query);
  const player = await getPlayer(profile.uuid);

  if (!player) {
    throw new UserError(`**${profile.name}** has never logged into Hypixel.`);
  }

  return { profile, player };
}
