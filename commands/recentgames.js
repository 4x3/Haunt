import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { cleanGameName } from '../lib/gamenames.js';
import { getRecentGames } from '../lib/hypixel.js';
import { headRender } from '../lib/renders.js';
import { duration, relativeTime, titleCase } from '../lib/format.js';
import { respond } from '../lib/respond.js';
import { resolveTarget } from '../lib/target.js';

export const data = new SlashCommandBuilder()
  .setName('recentgames')
  .setDescription('Show the games a player has played recently')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username (defaults to your linked account)')
      .setRequired(false));

const MAX_SHOWN = 8;

export async function execute(interaction) {
  const profile = await resolveTarget(interaction);
  const games = await getRecentGames(profile.uuid);

  const embed = new EmbedBuilder()
    .setTitle(`${profile.name}'s recent games`)
    .setColor(0x36056E)
    .setThumbnail(headRender(profile.uuidDashed))
    .setTimestamp();

  if (!games.length) {
    // Hypixel only keeps a short window of history, and it's hidden entirely if
    // the player turned on the "recent games" privacy option.
    embed.setDescription(
      'Nothing recent to show. Hypixel only keeps a few days of history, and players can hide it in their settings.',
    );
    await respond(interaction, { embeds: [embed] });
    return;
  }

  const lines = await Promise.all(
    games.slice(0, MAX_SHOWN).map(async game => {
      const name = await cleanGameName(game.gameType);
      const mode = game.mode ? ` (${titleCase(game.mode)})` : '';
      // `ended` is absent while a game is still in progress.
      const length = game.ended ? duration(game.ended - game.date) : 'in progress';
      return `**${name}**${mode} - ${relativeTime(game.date)} - ${length}`;
    }),
  );

  embed.setDescription(lines.join('\n'));
  await respond(interaction, { embeds: [embed] });
}
