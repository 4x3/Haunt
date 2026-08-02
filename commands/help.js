import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Shows all available commands');

export const defer = false;

export async function execute(interaction) {
  // Listed in the description rather than as fields, which cap out at 25.
  const lines = [...interaction.client.commands.values()]
    .map(command => `**/${command.data.name}** \u2014 ${command.data.description}`)
    .sort()
    .join('\n');

  const embed = new EmbedBuilder()
    .setTitle('Haunt commands')
    .setColor(0x36056E)
    .setDescription(lines)
    .setTimestamp();

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
