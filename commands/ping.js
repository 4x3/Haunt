import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check bot latency');

// Owns its own reply so the round trip isn't measured against a deferral.
export const defer = false;

export async function execute(interaction) {
  const roundTrip = Date.now() - interaction.createdTimestamp;
  const heartbeat = Math.round(interaction.client.ws.ping);

  const embed = new EmbedBuilder()
    .setTitle('Pong')
    .setColor(0x36056E)
    .addFields(
      { name: 'Round trip', value: `${roundTrip}ms`, inline: true },
      // -1 until the first heartbeat completes after startup.
      { name: 'Websocket', value: heartbeat < 0 ? 'Measuring' : `${heartbeat}ms`, inline: true },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
