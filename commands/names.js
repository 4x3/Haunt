import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('names')
  .setDescription('Get Minecraft username history')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true)
  );

export async function execute(interaction) {
  const username = interaction.options.getString('username');

  try {
    // Step 1: Get UUID from Mojang API
    const mojangRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    if (!mojangRes.ok) {
      return interaction.reply({ content: `No user found with username: ${username}`, ephemeral: true });
    }
    const mojangData = await mojangRes.json();
    const uuid = mojangData.id;

    // Step 2: Get name history using UUID (without dashes)
    const historyRes = await fetch(`https://api.mojang.com/user/profiles/${uuid}/names`);
    if (!historyRes.ok) {
      return interaction.reply({ content: `Failed to fetch name history for: ${username}`, ephemeral: true });
    }
    const historyData = await historyRes.json();

    // Step 3: Format name history list
    const namesList = historyData.map(entry => {
      if (entry.changedToAt) {
        const date = new Date(entry.changedToAt);
        const formattedDate = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        return `**${entry.name}** — changed on ${formattedDate}`;
      } else {
        return `**${entry.name}** — original name`;
      }
    }).join('\n');

    // Step 4: Build and send embed
    const embed = new EmbedBuilder()
      .setTitle(`Name History for ${username}`)
      .setDescription(namesList)
      .setColor(0x36056E)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    await interaction.reply({ content: `Error fetching name history for: ${username}`, ephemeral: true });
  }
}
