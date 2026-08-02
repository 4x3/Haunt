import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { UserError } from '../lib/errors.js';
import { count, ratio } from '../lib/format.js';
import { bedwarsLevel, requirePlayer } from '../lib/hypixel.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('bedwars')
  .setDescription('Get Hypixel Bedwars stats for a Minecraft username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const { profile, player } = await requirePlayer(username);

  const stats = player.stats?.Bedwars;
  if (!stats) throw new UserError(`**${profile.name}** has never played Bedwars.`);

  const finalKills = stats.final_kills_bedwars ?? 0;
  const finalDeaths = stats.final_deaths_bedwars ?? 0;
  const wins = stats.wins_bedwars ?? 0;
  const losses = stats.losses_bedwars ?? 0;

  const embed = new EmbedBuilder()
    .setTitle(`Bedwars stats for ${profile.name}`)
    .setColor(0x36056E)
    .setThumbnail(`https://mc-heads.net/avatar/${profile.uuid}/64`)
    .addFields(
      { name: 'Star', value: `${bedwarsLevel(stats.Experience)}`, inline: true },
      { name: 'Final Kills', value: count(finalKills), inline: true },
      { name: 'Final Deaths', value: count(finalDeaths), inline: true },
      { name: 'FKDR', value: ratio(finalKills, finalDeaths), inline: true },
      { name: 'Wins', value: count(wins), inline: true },
      { name: 'Losses', value: count(losses), inline: true },
      { name: 'W/L', value: ratio(wins, losses), inline: true },
      { name: 'Beds Broken', value: count(stats.beds_broken_bedwars), inline: true },
      { name: 'Win Streak', value: count(stats.winstreak), inline: true },
    )
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
