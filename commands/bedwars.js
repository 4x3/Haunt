import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('bedwars')
  .setDescription('Get Hypixel Bedwars stats for a Minecraft username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

// Function to convert Bedwars XP to Level
function getBedwarsLevel(exp) {
  const levels = [500, 1000, 2000, 3500, 6000, 10000]; // XP required for levels 1 to 6
  let level = 0;
  let i = 0;

  while (i < levels.length && exp >= levels[i]) {
    exp -= levels[i];
    i++;
  }

  level = i;

  if (i === levels.length) {
    // After level 6, each level requires 5000 XP
    level += Math.floor(exp / 5000);
  }

  return level;
}

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const apiKey = process.env.HYPIXEL_API_KEY;

  try {
    // Get UUID from Mojang API
    const mojangRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    if (!mojangRes.ok) return interaction.reply({ content: `No user found with username: ${username}`, ephemeral: true });
    const mojangData = await mojangRes.json();
    const uuid = mojangData.id;

    // Fetch Hypixel player data
    const hypixelRes = await fetch(`https://api.hypixel.net/player?key=${apiKey}&uuid=${uuid}`);
    if (!hypixelRes.ok) return interaction.reply({ content: 'Failed to fetch Hypixel data.', ephemeral: true });
    const hypixelData = await hypixelRes.json();

    if (!hypixelData.player) return interaction.reply({ content: 'No Hypixel player data found.', ephemeral: true });

    // Extract Bedwars stats
    const bwStats = hypixelData.player.stats?.Bedwars;
    if (!bwStats) return interaction.reply({ content: 'No Bedwars stats found for this player.', ephemeral: true });

    // Calculate Bedwars level from XP
    const bedwarsExp = bwStats.Experience || 0;
    const stars = getBedwarsLevel(bedwarsExp);

    const finalKills = bwStats.final_kills_bedwars || 0;
    const finalDeaths = bwStats.final_deaths_bedwars || 0;
    const wins = bwStats.wins_bedwars || 0;
    const losses = bwStats.losses_bedwars || 0;
    const winstreak = bwStats.winstreak || 0;
    const bedsBroken = bwStats.beds_broken_bedwars || 0;

    const embed = new EmbedBuilder()
      .setTitle(`Bedwars Stats for ${username}`)
      .setColor(0x36056E)
      .addFields(
        { name: 'Level', value: stars.toString(), inline: true },
        { name: 'Final Kills', value: finalKills.toString(), inline: true },
        { name: 'Final Deaths', value: finalDeaths.toString(), inline: true },
        { name: 'Wins', value: wins.toString(), inline: true },
        { name: 'Losses', value: losses.toString(), inline: true },
        { name: 'Win Streak', value: winstreak.toString(), inline: true },
        { name: 'Beds Broken', value: bedsBroken.toString(), inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Error fetching Bedwars stats.', ephemeral: true });
  }
}
