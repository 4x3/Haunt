import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check bot latency');

export async function execute(interaction) {
  const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;

  const embed = new EmbedBuilder()
    .setTitle('Pong!')
    .setDescription(`Latency is ${latency}ms.`)
    .setColor(0x36056E)
    .setTimestamp();

  await interaction.editReply({ content: null, embeds: [embed] });
}