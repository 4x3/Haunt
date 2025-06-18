import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('skywars')
  .setDescription('Get Hypixel SkyWars stats for a Minecraft username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const apiKey = process.env.HYPIXEL_API_KEY;

  try {
    // Get UUID from Mojang
    const mojangRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    if (!mojangRes.ok) return interaction.reply({ content: `No user found with username: ${username}`, ephemeral: true });
    const mojangData = await mojangRes.json();
    const uuid = mojangData.id;

    // Get Hypixel player data
    const hypixelRes = await fetch(`https://api.hypixel.net/player?key=${apiKey}&uuid=${uuid}`);
    if (!hypixelRes.ok) return interaction.reply({ content: 'Failed to fetch Hypixel data.', ephemeral: true });
    const hypixelData = await hypixelRes.json();

    if (!hypixelData.player) return interaction.reply({ content: 'No Hypixel player data found.', ephemeral: true });

    const swStats = hypixelData.player.stats?.SkyWars;
    if (!swStats) return interaction.reply({ content: 'No SkyWars stats found for this player.', ephemeral: true });

    const kills = swStats.kills || 0;
    const deaths = swStats.deaths || 0;
    const wins = swStats.wins || 0;
    const losses = swStats.losses || 0;
    const winstreak = swStats.winstreak || 0;
    const coins = swStats.coins || 0;

    const embed = new EmbedBuilder()
      .setTitle(`SkyWars Stats for ${username}`)
      .setColor(0x36056E)
      .addFields(
        { name: 'Kills', value: kills.toString(), inline: true },
        { name: 'Deaths', value: deaths.toString(), inline: true },
        { name: 'Wins', value: wins.toString(), inline: true },
        { name: 'Losses', value: losses.toString(), inline: true },
        { name: 'Win Streak', value: winstreak.toString(), inline: true },
        { name: 'Coins', value: coins.toString(), inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Error fetching SkyWars stats.', ephemeral: true });
  }
}
