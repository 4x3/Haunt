import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { cleanGameName } from '../lib/gamenames.js';
import { getLeaderboards } from '../lib/hypixel.js';
import { resolveUsername } from '../lib/players.js';
import { count, stripColors, titleCase } from '../lib/format.js';
import { respond } from '../lib/respond.js';
import { UserError } from '../lib/errors.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboards')
  .setDescription('Top players on a Hypixel leaderboard')
  .addStringOption(option =>
    option.setName('game')
      .setDescription('Which game')
      .setRequired(true)
      .setAutocomplete(true));

const LEADERS_SHOWN = 5;
const BOARDS_SHOWN = 3;

/*
 * The set of leaderboards Hypixel exposes shifts around as games come and go,
 * so the options are built from the live response instead of a hardcoded list.
 * It's cached for five minutes by the client, so autocomplete is cheap.
 */
export async function autocomplete(interaction) {
  const typed = interaction.options.getFocused().toLowerCase();

  let keys = [];
  try {
    keys = Object.keys(await getLeaderboards());
  } catch {
    // Autocomplete has a hard 3s budget and can't show an error, so an empty
    // list is the only sensible failure mode here.
    await interaction.respond([]);
    return;
  }

  const matches = await Promise.all(
    keys.map(async key => ({ name: await cleanGameName(key), value: key })),
  );

  await interaction.respond(
    matches
      .filter(choice => choice.name.toLowerCase().includes(typed))
      .slice(0, 25),
  );
}

export async function execute(interaction) {
  const gameKey = interaction.options.getString('game');
  const boards = (await getLeaderboards())[gameKey];

  if (!boards?.length) {
    throw new UserError(`No leaderboards available for \`${gameKey}\`.`);
  }

  const embed = new EmbedBuilder()
    .setTitle(`${await cleanGameName(gameKey)} leaderboards`)
    .setColor(0x36056E)
    .setTimestamp();

  for (const board of boards.slice(0, BOARDS_SHOWN)) {
    const leaders = board.leaders?.slice(0, LEADERS_SHOWN) ?? [];
    const names = await Promise.all(leaders.map(uuid => resolveUsername(uuid)));

    const list = names.length
      ? names.map((name, i) => `${i + 1}. ${name ?? 'Unknown'}`).join('\n')
      : 'No entries';

    // `location` looks tempting but it's the coordinates of the leaderboard
    // block in the lobby, and it's "0,0,0" on every board anyway.
    const title = stripColors(board.prefix ? `${board.prefix} ${board.title}` : board.title);

    embed.addFields({
      name: title ?? titleCase(board.path),
      value: list,
      inline: true,
    });
  }

  embed.setFooter({ text: `${count(boards.length)} leaderboards for this game` });
  await respond(interaction, { embeds: [embed] });
}
