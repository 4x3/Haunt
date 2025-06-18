import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('uuid')
  .setDescription('Get Minecraft UUID for a username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

export async function execute(interaction) {
  const username = interaction.options.getString('username');

  try {
    const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    if (!response.ok) {
      return await interaction.reply({ content: `No user found with username: ${username}`, ephemeral: true });
    }
    const data = await response.json();

    const embed = new EmbedBuilder()
      .setTitle(`UUID for ${username}`)
      .setDescription(`\`${data.id}\``)
      .setColor(0x36056E)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Error fetching UUID.', ephemeral: true });
  }
}
