import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('level')
  .setDescription('Shows the Hypixel level of a player')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

export async function execute(interaction) {
  const username = interaction.options.getString('username');

  // Hypixel API key from environment variables
  const hypixelApiKey = process.env.HYPIXEL_API_KEY;
  const fetch = (await import('node-fetch')).default;

  try {
    // Fetch player data from Hypixel API
    const res = await fetch(`https://api.hypixel.net/player?key=${hypixelApiKey}&name=${username}`);
    const data = await res.json();

    if (!data.player) {
      return interaction.reply({ content: `Player **${username}** not found on Hypixel.`, ephemeral: true });
    }

    // Calculate Hypixel level based on networkExp
    const exp = data.player.networkExp || 0;
    const level = Math.floor((Math.sqrt(2 * exp + 30625) / 50) - 2.5);

    const embed = new EmbedBuilder()
      .setTitle(`${username}'s Hypixel Level`)
      .setDescription(`**Level:** ${level}`)
      .setColor(0x36056E)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Error fetching Hypixel level.', ephemeral: true });
  }
}
