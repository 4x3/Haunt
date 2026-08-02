import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { count } from '../lib/format.js';
import { networkLevel, requirePlayer } from '../lib/hypixel.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('level')
  .setDescription('Shows the Hypixel network level of a player')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

// Inverse of networkLevel: total XP required to reach the given level.
function xpForLevel(level) {
  return 1250 * level ** 2 + 6250 * level - 7500;
}

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const { profile, player } = await requirePlayer(username);

  const exp = player.networkExp ?? 0;
  const exact = networkLevel(exp);
  const level = Math.floor(exact);
  const toNextLevel = Math.max(0, Math.ceil(xpForLevel(level + 1) - exp));

  const embed = new EmbedBuilder()
    .setTitle(`Hypixel level for ${profile.name}`)
    .setColor(0x36056E)
    .setThumbnail(`https://mc-heads.net/avatar/${profile.uuid}/64`)
    .addFields(
      { name: 'Level', value: `${level}`, inline: true },
      { name: 'Progress', value: `${Math.round((exact - level) * 100)}%`, inline: true },
      { name: 'Network XP', value: count(exp), inline: true },
      { name: 'XP to next level', value: count(toNextLevel), inline: true },
      { name: 'Karma', value: count(player.karma), inline: true },
      { name: 'Achievement Points', value: count(player.achievementPoints), inline: true },
    )
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
