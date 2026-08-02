import { getGameResources } from './hypixel.js';
import { titleCase } from './format.js';

/*
 * Hypixel refers to games by their internal type name (SURVIVAL_GAMES,
 * MCGO, WALLS3...) in /status, /recentgames, /counts and /boosters. The
 * /resources/games endpoint maps those to the names players actually recognise,
 * and it needs no API key, so we just pull it and cache it.
 */

let lookup = null;

async function table() {
  if (lookup) return lookup;

  try {
    const games = await getGameResources();
    lookup = new Map();

    for (const [typeName, game] of Object.entries(games)) {
      const clean = game.name ?? titleCase(typeName);
      lookup.set(typeName, clean);
      if (game.databaseName) lookup.set(game.databaseName, clean);
      if (game.id !== undefined) lookup.set(String(game.id), clean);
    }
  } catch {
    // Not worth failing a command over a cosmetic label; fall back to
    // prettifying the raw type name until the next call succeeds.
    lookup = null;
  }

  return lookup;
}

export async function cleanGameName(gameType) {
  if (!gameType) return 'Unknown';

  const map = await table();
  return map?.get(String(gameType)) ?? titleCase(gameType);
}

/** Preload so the first /counts doesn't pay for the resource fetch. */
export function warmGameNames() {
  return table().catch(() => null);
}
