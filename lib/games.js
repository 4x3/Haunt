import { bedwarsLevel } from './hypixel.js';
import { count, ratio, stripColors } from './format.js';

/*
 * Per-gamemode stat extraction.
 *
 * Hypixel stores each game's stats under player.stats[<database name>], and it
 * omits the key entirely for games a player has never touched - so every read
 * in here has to tolerate the whole object being undefined. That's why the `s`
 * helper exists rather than reaching into `stats.foo` directly.
 *
 * The database names come from the GameTypes table in the official docs. They
 * do not always match the display name (Warlords is "Battleground", Mega Walls
 * is "Walls3", Cops and Crims is "MCGO"), which is a long-standing quirk.
 */

// Field names below are the community-standard keys. Anything Hypixel doesn't
// return simply renders as 0, so an unexpected rename degrades to a wrong-looking
// zero rather than a crash.
const num = (stats, key) => stats?.[key] ?? 0;

function field(name, value, inline = true) {
  return { name, value: String(value), inline };
}

function kd(stats, killKey = 'kills', deathKey = 'deaths') {
  return ratio(num(stats, killKey), num(stats, deathKey));
}

function wl(stats, winKey = 'wins', lossKey = 'losses') {
  return ratio(num(stats, winKey), num(stats, lossKey));
}

/* ------------------------------------------------------------------ */

const bedwars = {
  id: 'bedwars',
  label: 'Bed Wars',
  statsKey: 'Bedwars',
  fields(s) {
    const fk = num(s, 'final_kills_bedwars');
    const fd = num(s, 'final_deaths_bedwars');

    return [
      field('Star', bedwarsLevel(s?.Experience ?? 0)),
      field('Wins', count(num(s, 'wins_bedwars'))),
      field('Losses', count(num(s, 'losses_bedwars'))),
      field('W/L', ratio(num(s, 'wins_bedwars'), num(s, 'losses_bedwars'))),
      field('Final Kills', count(fk)),
      field('Final Deaths', count(fd)),
      field('FKDR', ratio(fk, fd)),
      field('Beds Broken', count(num(s, 'beds_broken_bedwars'))),
      field('Win Streak', count(num(s, 'winstreak'))),
    ];
  },
};

const skywars = {
  id: 'skywars',
  label: 'SkyWars',
  statsKey: 'SkyWars',
  fields(s) {
    return [
      field('Level', stripColors(s?.levelFormatted) ?? 'N/A'),
      field('Wins', count(num(s, 'wins'))),
      field('Losses', count(num(s, 'losses'))),
      field('W/L', wl(s)),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
      field('K/D', kd(s)),
      field('Souls', count(num(s, 'souls'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const duels = {
  id: 'duels',
  label: 'Duels',
  statsKey: 'Duels',
  fields(s) {
    return [
      field('Wins', count(num(s, 'wins'))),
      field('Losses', count(num(s, 'losses'))),
      field('W/L', wl(s)),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
      field('K/D', kd(s)),
      field('Best Streak', count(num(s, 'best_overall_winstreak'))),
      field('Current Streak', count(num(s, 'current_winstreak'))),
      field('Melee Accuracy', `${ratio(num(s, 'melee_hits'), num(s, 'melee_swings'))}`),
    ];
  },
};

const murderMystery = {
  id: 'murdermystery',
  label: 'Murder Mystery',
  statsKey: 'MurderMystery',
  fields(s) {
    const games = num(s, 'games');
    const wins = num(s, 'wins');

    return [
      field('Wins', count(wins)),
      field('Games', count(games)),
      field('Win Rate', games ? `${((wins / games) * 100).toFixed(1)}%` : '0%'),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
      field('Murderer Wins', count(num(s, 'murderer_wins'))),
      field('Detective Wins', count(num(s, 'detective_wins'))),
      field('Bow Kills', count(num(s, 'bow_kills'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const buildBattle = {
  id: 'buildbattle',
  label: 'Build Battle',
  statsKey: 'BuildBattle',
  fields(s) {
    const played = num(s, 'games_played');
    const wins = num(s, 'wins');

    return [
      field('Wins', count(wins)),
      field('Games', count(played)),
      field('Win Rate', played ? `${((wins / played) * 100).toFixed(1)}%` : '0%'),
      field('Score', count(num(s, 'score'))),
      field('Correct Guesses', count(num(s, 'correct_guesses'))),
      field('Votes Cast', count(num(s, 'total_votes'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const tntGames = {
  id: 'tntgames',
  label: 'TNT Games',
  statsKey: 'TNTGames',
  fields(s) {
    // Each TNT minigame keeps its own win counter; there's no combined total.
    const record = num(s, 'record_tntrun');

    return [
      field('TNT Run Wins', count(num(s, 'wins_tntrun'))),
      field('TNT Run Record', record ? `${record}s` : 'N/A'),
      field('PVP Run Wins', count(num(s, 'wins_pvprun'))),
      field('Bow Spleef Wins', count(num(s, 'wins_bowspleef'))),
      field('TNT Tag Wins', count(num(s, 'wins_tntag'))),
      field('Wizards Wins', count(num(s, 'wins_capture'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const megaWalls = {
  id: 'megawalls',
  label: 'Mega Walls',
  statsKey: 'Walls3',
  fields(s) {
    const fk = num(s, 'final_kills');
    const fd = num(s, 'final_deaths');

    return [
      field('Class', s?.chosen_class ? String(s.chosen_class) : 'None'),
      field('Wins', count(num(s, 'wins'))),
      field('Losses', count(num(s, 'losses'))),
      field('W/L', wl(s)),
      field('Final Kills', count(fk)),
      field('Final Deaths', count(fd)),
      field('FKDR', ratio(fk, fd)),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
    ];
  },
};

const uhc = {
  id: 'uhc',
  label: 'UHC Champions',
  statsKey: 'UHC',
  fields(s) {
    return [
      field('Score', count(num(s, 'score'))),
      field('Wins', count(num(s, 'wins'))),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
      field('K/D', kd(s)),
      field('Heads Eaten', count(num(s, 'heads_eaten'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const copsAndCrims = {
  id: 'copsandcrims',
  label: 'Cops and Crims',
  statsKey: 'MCGO',
  fields(s) {
    return [
      field('Wins', count(num(s, 'game_wins'))),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
      field('K/D', kd(s)),
      field('Headshots', count(num(s, 'headshot_kills'))),
      field('Bombs Planted', count(num(s, 'bombs_planted'))),
      field('Bombs Defused', count(num(s, 'bombs_defused'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const warlords = {
  id: 'warlords',
  label: 'Warlords',
  statsKey: 'Battleground',
  fields(s) {
    return [
      field('Wins', count(num(s, 'wins'))),
      field('Losses', count(num(s, 'losses'))),
      field('W/L', wl(s)),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
      field('Assists', count(num(s, 'assists'))),
      field('Damage', count(num(s, 'damage'))),
      field('Healing', count(num(s, 'heal'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const smashHeroes = {
  id: 'smashheroes',
  label: 'Smash Heroes',
  statsKey: 'SuperSmash',
  fields(s) {
    return [
      field('Level', count(num(s, 'smashLevel'))),
      field('Wins', count(num(s, 'wins'))),
      field('Losses', count(num(s, 'losses'))),
      field('W/L', wl(s)),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
      field('K/D', kd(s)),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const paintball = {
  id: 'paintball',
  label: 'Paintball',
  statsKey: 'Paintball',
  fields(s) {
    return [
      field('Wins', count(num(s, 'wins'))),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
      field('K/D', kd(s)),
      field('Killstreaks', count(num(s, 'killstreaks'))),
      field('Shots Fired', count(num(s, 'shots_fired'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const quakecraft = {
  id: 'quakecraft',
  label: 'Quakecraft',
  statsKey: 'Quake',
  fields(s) {
    return [
      field('Wins', count(num(s, 'wins'))),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
      field('K/D', kd(s)),
      field('Headshots', count(num(s, 'headshots'))),
      field('Killstreaks', count(num(s, 'killstreaks'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const blitz = {
  id: 'blitz',
  label: 'Blitz Survival Games',
  statsKey: 'HungerGames',
  fields(s) {
    return [
      field('Wins', count(num(s, 'wins'))),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
      field('K/D', kd(s)),
      // No total-games field here on purpose: Blitz only started counting
      // games_played once kits arrived, so veterans come back with fewer
      // games than wins, which looks broken even though the number is real.
      field('Chests Opened', count(num(s, 'chests_opened'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const woolWars = {
  id: 'woolwars',
  label: 'Wool Wars',
  statsKey: 'WoolGames',
  fields(s) {
    // Wool Games nests the actual Wool Wars numbers a couple of levels down.
    const w = s?.wool_wars?.stats ?? {};

    return [
      field('Wins', count(num(w, 'wins'))),
      field('Games', count(num(w, 'games_played'))),
      field('Kills', count(num(w, 'kills'))),
      field('Deaths', count(num(w, 'deaths'))),
      field('K/D', kd(w)),
      field('Blocks Broken', count(num(w, 'blocks_broken'))),
      field('Wool Placed', count(num(w, 'wool_placed'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const pit = {
  id: 'pit',
  label: 'The Pit',
  statsKey: 'Pit',
  fields(s) {
    const p = s?.pit_stats_ptl ?? {};
    const profile = s?.profile ?? {};

    return [
      field('Kills', count(num(p, 'kills'))),
      field('Deaths', count(num(p, 'deaths'))),
      field('K/D', kd(p)),
      field('Assists', count(num(p, 'assists'))),
      field('Joins', count(num(p, 'joins'))),
      field('Damage Dealt', count(num(p, 'damage_dealt'))),
      // Pit tracks gold as a float down to fractions of a coin.
      field('Gold', count(Math.floor(num(profile, 'cash')))),
      field('Renown', count(num(profile, 'renown'))),
    ];
  },
};

const arena = {
  id: 'arena',
  label: 'Arena Brawl',
  statsKey: 'Arena',
  fields(s) {
    // Arena splits everything by team size, so these are summed for a total.
    const sum = prefix => ['1v1', '2v2', '4v4'].reduce((t, m) => t + num(s, `${prefix}_${m}`), 0);
    const wins = sum('wins');
    const losses = sum('losses');

    return [
      field('Wins', count(wins)),
      field('Losses', count(losses)),
      field('W/L', ratio(wins, losses)),
      field('Kills', count(sum('kills'))),
      field('Deaths', count(sum('deaths'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const turboKart = {
  id: 'turbokartracers',
  label: 'Turbo Kart Racers',
  statsKey: 'GingerBread',
  fields(s) {
    return [
      field('Wins', count(num(s, 'wins'))),
      field('Gold Trophies', count(num(s, 'gold_trophy'))),
      field('Silver Trophies', count(num(s, 'silver_trophy'))),
      field('Bronze Trophies', count(num(s, 'bronze_trophy'))),
      field('Laps', count(num(s, 'laps_completed'))),
      field('Box Pickups', count(num(s, 'box_pickups'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const vampirez = {
  id: 'vampirez',
  label: 'VampireZ',
  statsKey: 'VampireZ',
  fields(s) {
    return [
      field('Human Wins', count(num(s, 'human_wins'))),
      field('Vampire Wins', count(num(s, 'vampire_wins'))),
      field('Zombie Kills', count(num(s, 'zombie_kills'))),
      field('Vampire Kills', count(num(s, 'vampire_kills'))),
      field('Human Deaths', count(num(s, 'human_deaths'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const walls = {
  id: 'walls',
  label: 'Walls',
  statsKey: 'Walls',
  fields(s) {
    return [
      field('Wins', count(num(s, 'wins'))),
      field('Losses', count(num(s, 'losses'))),
      field('W/L', wl(s)),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
      field('K/D', kd(s)),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const speedUhc = {
  id: 'speeduhc',
  label: 'Speed UHC',
  statsKey: 'SpeedUHC',
  fields(s) {
    return [
      field('Score', count(num(s, 'score'))),
      field('Wins', count(num(s, 'wins'))),
      field('Losses', count(num(s, 'losses'))),
      field('W/L', wl(s)),
      field('Kills', count(num(s, 'kills'))),
      field('Deaths', count(num(s, 'deaths'))),
      field('K/D', kd(s)),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

const arcade = {
  id: 'arcade',
  label: 'Arcade',
  statsKey: 'Arcade',
  fields(s) {
    // Arcade is a bundle of ~20 minigames each with its own wins_* key, and the
    // set changes as games get added or retired. Totalling whatever is present
    // beats hardcoding a list that goes stale.
    const totalWins = Object.entries(s ?? {})
      .filter(([key, value]) => key.startsWith('wins') && typeof value === 'number')
      .reduce((total, [, value]) => total + value, 0);

    return [
      field('Total Wins', count(totalWins)),
      // Zombies has no win counter - you're scored on how far you survive.
      field('Zombies Best Round', count(num(s, 'best_round_zombies'))),
      field('Hole in the Wall', count(num(s, 'wins_hole_in_the_wall'))),
      field('Farm Hunt', count(num(s, 'wins_farm_hunt'))),
      // Party Games 1/2/3 each kept their own counter when they succeeded
      // one another, so a lifetime total has to add all three.
      field('Party Games', count(
        num(s, 'wins_party') + num(s, 'wins_party_2') + num(s, 'wins_party_3'),
      )),
      field('Dragon Wars', count(num(s, 'wins_dragonwars2'))),
      field('Coins', count(num(s, 'coins'))),
    ];
  },
};

/* ------------------------------------------------------------------ */

export const GAMES = [
  bedwars,
  skywars,
  duels,
  murderMystery,
  buildBattle,
  woolWars,
  pit,
  tntGames,
  megaWalls,
  uhc,
  speedUhc,
  copsAndCrims,
  warlords,
  smashHeroes,
  blitz,
  arcade,
  arena,
  paintball,
  quakecraft,
  turboKart,
  vampirez,
  walls,
];

const byId = new Map(GAMES.map(game => [game.id, game]));

export function getGame(id) {
  return byId.get(id) ?? null;
}

/** Slash command choice list. Discord caps this at 25, hence the guard. */
export function gameChoices() {
  if (GAMES.length > 25) {
    throw new Error(`Too many games for a choice list (${GAMES.length}); switch to autocomplete.`);
  }
  return GAMES.map(game => ({ name: game.label, value: game.id }));
}
