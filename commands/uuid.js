import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { avatar } from '../lib/renders.js';
import { respond } from '../lib/respond.js';
import { resolveTarget } from '../lib/target.js';

export const data = new SlashCommandBuilder()
  .setName('uuid')
  .setDescription('Get the UUID for a Minecraft username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username (defaults to your linked account)')
      .setRequired(false));

export async function execute(interaction) {
  const profile = await resolveTarget(interaction);

  const embed = new EmbedBuilder()
    .setTitle(`UUID for ${profile.name}`)
    .setColor(0x36056E)
    .setThumbnail(avatar(profile.uuidDashed, { size: 64 }))
    .addFields(
      { name: 'Trimmed', value: `\`${profile.uuid}\`` },
      { name: 'Dashed', value: `\`${profile.uuidDashed}\`` },
    )
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
