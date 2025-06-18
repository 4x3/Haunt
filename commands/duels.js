import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('duels')
  .setDescription('Get Hypixel Duels stats for a Minecraft username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const apiKey = process.env.HYPIXEL_API_KEY;

  try {
    const mojangRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    if (!mojangRes.ok) return interaction.reply({ content: `No user found with username: ${username}`, ephemeral: true });
    const mojangData = await mojangRes.json();
    const uuid = mojangData.id;

    const hypixelRes = await fetch(`https://api.hypixel.net/player?key=${apiKey}&uuid=${uuid}`);
    if (!hypixelRes.ok) return interaction.reply({ content: 'Failed to fetch Hypixel data.', ephemeral: true });
    const hypixelData = await hypixelRes.json();

    if (!hypixelData.player) return interaction.reply({ content: 'No Hypixel player data found.', ephemeral: true });

    const duelsStats = hypixelData.player.stats?.Duels;
    if (!duelsStats) return interaction.reply({ content: 'No Duels stats found for this player.', ephemeral: true });

    const wins = duelsStats.wins || 0;
    const losses = duelsStats.losses || 0;
    const kills = duelsStats.kills || 0;
    const deaths = duelsStats.deaths || 0;

    const embed = new EmbedBuilder()
      .setTitle(`Duels Stats for ${username}`)
      .setColor(0x36056E)
      .addFields(
        { name: 'Wins', value: wins.toString(), inline: true },
        { name: 'Losses', value: losses.toString(), inline: true },
        { name: 'Kills', value: kills.toString(), inline: true },
        { name: 'Deaths', value: deaths.toString(), inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Error fetching Duels stats.', ephemeral: true });
  }
}
