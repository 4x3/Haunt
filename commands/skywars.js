import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { UserError } from '../lib/errors.js';
import { count, ratio, stripColors } from '../lib/format.js';
import { requirePlayer } from '../lib/hypixel.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('skywars')
  .setDescription('Get Hypixel SkyWars stats for a Minecraft username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const { profile, player } = await requirePlayer(username);

  const stats = player.stats?.SkyWars;
  if (!stats) throw new UserError(`**${profile.name}** has never played SkyWars.`);

  const kills = stats.kills ?? 0;
  const deaths = stats.deaths ?? 0;
  const wins = stats.wins ?? 0;
  const losses = stats.losses ?? 0;

  const embed = new EmbedBuilder()
    .setTitle(`SkyWars stats for ${profile.name}`)
    .setColor(0x36056E)
    .setThumbnail(`https://mc-heads.net/avatar/${profile.uuid}/64`)
    .addFields(
      { name: 'Level', value: stripColors(stats.levelFormatted) ?? 'Unknown', inline: true },
      { name: 'Kills', value: count(kills), inline: true },
      { name: 'Deaths', value: count(deaths), inline: true },
      { name: 'K/D', value: ratio(kills, deaths), inline: true },
      { name: 'Wins', value: count(wins), inline: true },
      { name: 'Losses', value: count(losses), inline: true },
      { name: 'W/L', value: ratio(wins, losses), inline: true },
      { name: 'Coins', value: count(stats.coins), inline: true },
      { name: 'Souls', value: count(stats.souls), inline: true },
    )
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
