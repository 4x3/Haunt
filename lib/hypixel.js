import { UserError } from './errors.js';
import { resolveProfile } from './mojang.js';

const BASE_URL = 'https://api.hypixel.net/v2';
const TIMEOUT_MS = 8000;

// Hypixel dropped the ?key= query parameter; the key must be sent as a header
// or every request comes back 400 regardless of whether the key is valid.
async function request(path, params) {
  const apiKey = process.env.HYPIXEL_API_KEY;
  if (!apiKey) throw new Error('HYPIXEL_API_KEY is not set');

  const url = new URL(BASE_URL + path);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }

  const res = await fetch(url, {
    headers: { 'API-Key': apiKey },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (res.status === 403) {
    throw new UserError("The bot's Hypixel API key is invalid or expired.");
  }
  if (res.status === 429) {
    throw new UserError('Hypixel is rate limiting the bot. Try again shortly.');
  }
  if (!res.ok) throw new Error(`Hypixel returned ${res.status} for ${path}`);

  const body = await res.json();
  if (!body.success) throw new Error(`Hypixel error on ${path}: ${body.cause}`);
  return body;
}

// Hypixel's published network level curve.
export function networkLevel(exp = 0) {
  return (Math.sqrt(2 * exp + 30625) / 50) - 2.5;
}

// The first four levels of every Bedwars prestige are discounted; the other 96
// cost a flat 5000, which is what makes one prestige worth 487,000 XP.
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

export async function getPlayer(uuid) {
  const { player } = await request('/player', { uuid });
  return player;
}

export async function getGuildByPlayer(uuid) {
  const { guild } = await request('/guild', { player: uuid });
  return guild;
}

// The entry point for every stats command: name to UUID to Hypixel profile.
export async function requirePlayer(username) {
  const profile = await resolveProfile(username);
  const player = await getPlayer(profile.uuid);
  if (!player) {
    throw new UserError(`**${profile.name}** has never logged into Hypixel.`);
  }
  return { profile, player };
}
