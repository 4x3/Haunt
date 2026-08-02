import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { fetchSkinModel, resolveProfile } from '../lib/mojang.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('skin')
  .setDescription('Get the Minecraft skin for a username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const profile = await resolveProfile(username);
  const model = await fetchSkinModel(profile.uuid);

  // Rendered by UUID so a name change can't serve a stale skin.
  const embed = new EmbedBuilder()
    .setTitle(`Skin for ${profile.name}`)
    .setColor(0x36056E)
    .setImage(`https://mc-heads.net/body/${profile.uuid}/250`)
    .addFields(
      { name: 'Model', value: model === 'slim' ? 'Slim' : 'Classic', inline: true },
      {
        name: 'Download',
        value: `[Skin file](https://mc-heads.net/download/${profile.uuid})`,
        inline: true,
      },
    )
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
