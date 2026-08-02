import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { resolveProfile } from '../lib/mojang.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('uuid')
  .setDescription('Get the Minecraft UUID for a username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

function dashed(uuid) {
  return uuid.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const profile = await resolveProfile(username);

  const embed = new EmbedBuilder()
    .setTitle(`UUID for ${profile.name}`)
    .setColor(0x36056E)
    .setThumbnail(`https://mc-heads.net/avatar/${profile.uuid}/64`)
    .addFields(
      { name: 'Trimmed', value: `\`${profile.uuid}\`` },
      { name: 'Dashed', value: `\`${dashed(profile.uuid)}\`` },
    )
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
