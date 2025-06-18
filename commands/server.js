import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('server')
  .setDescription('Get info about a Minecraft server by IP/domain')
  .addStringOption(option =>
    option.setName('ip')
      .setDescription('Minecraft server IP or domain')
      .setRequired(true));

export async function execute(interaction) {
  const ip = interaction.options.getString('ip');

  try {
    const res = await fetch(`https://api.mcsrvstat.us/2/${ip}`);
    if (!res.ok) return interaction.reply({ content: 'Failed to fetch server info.', ephemeral: true });

    const data = await res.json();

    if (!data.online) return interaction.reply({ content: `Server ${ip} is offline or does not exist.`, ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle(`Minecraft Server Info: ${ip}`)
      .setColor(0x36056E)
      .addFields(
        { name: 'IP', value: data.ip || ip, inline: true },
        { name: 'Port', value: data.port?.toString() || '25565', inline: true },
        { name: 'Online Players', value: `${data.players.online} / ${data.players.max}`, inline: true },
        { name: 'Version', value: data.version || 'Unknown', inline: true },
        { name: 'MOTD', value: data.motd?.clean?.join('\n') || 'No MOTD' },
        { name: 'Plugins', value: data.plugins?.names?.join(', ') || 'Unknown' }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Error fetching server info.', ephemeral: true });
  }
}
