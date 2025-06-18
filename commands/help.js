import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Shows all available commands');

export async function execute(interaction) {
  const commands = interaction.client.commands;

  const embed = new EmbedBuilder()
    .setTitle('Available Commands')
    .setColor(0x36056E)
    .setDescription('Here are the commands you can use:')
    .setTimestamp();

  // Add each command name and description as a field
  commands.forEach(cmd => {
    embed.addFields({ name: `/${cmd.data.name}`, value: cmd.data.description || 'No description', inline: true });
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
