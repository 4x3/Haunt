import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('invite')
  .setDescription('Get the bot invite link');

export async function execute(interaction) {
  const clientId = interaction.client.user.id;
  const invite = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;

  const embed = new EmbedBuilder()
    .setTitle('Invite Link')
    .setDescription(`[Click here to invite me to your server!](${invite})`)
    .setColor(0x36056E)
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
