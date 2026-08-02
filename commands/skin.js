import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { bodyRender, skinFile } from '../lib/renders.js';
import { respond } from '../lib/respond.js';
import { resolveTarget } from '../lib/target.js';

export const data = new SlashCommandBuilder()
  .setName('skin')
  .setDescription('Show a player\'s Minecraft skin')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username (defaults to your linked account)')
      .setRequired(false));

export async function execute(interaction) {
  const profile = await resolveTarget(interaction);

  const embed = new EmbedBuilder()
    .setTitle(`${profile.name}'s skin`)
    .setColor(0x36056E)
    .setImage(bodyRender(profile.uuidDashed))
    .addFields(
      { name: 'Model', value: profile.skinModel === 'slim' ? 'Slim (Alex)' : 'Classic (Steve)', inline: true },
      { name: 'Download', value: `[Skin file](${skinFile(profile.uuidDashed)})`, inline: true },
    )
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
