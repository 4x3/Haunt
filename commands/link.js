import { SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Simple JSON file to store links (replace with real DB in production)
const linksFile = path.resolve('./links.json');
let links = {};
if (fs.existsSync(linksFile)) {
  links = JSON.parse(fs.readFileSync(linksFile));
}

export const data = new SlashCommandBuilder()
  .setName('link')
  .setDescription('Link your Minecraft account to your Discord')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Your Minecraft username')
      .setRequired(true));

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

    const player = hypixelData.player;

    // Get linked Discord from Hypixel socials
    const linkedDiscordOnHypixel = player.socialMedia?.links?.DISCORD || null;

    // Current user's Discord tag
    const discordTag = interaction.user.tag; // username#discrim

    if (!linkedDiscordOnHypixel) {
      return interaction.reply({
        content: `Mismatched Discord User!\nThe Discord linked on Hypixel does not match your current username!\n\nHypixel: None\nCurrent: ${discordTag}`,
        ephemeral: true,
      });
    }

    // Compare linked Discord (case insensitive) to user's Discord username (not tag, just username)
    if (!linkedDiscordOnHypixel.toLowerCase().includes(interaction.user.username.toLowerCase())) {
      return interaction.reply({
        content: `Mismatched Discord User!\nThe Discord linked on Hypixel does not match your current username!\n\nHypixel: ${linkedDiscordOnHypixel}\nCurrent: ${discordTag}`,
        ephemeral: true,
      });
    }

    // Passed verification, save the link
    links[interaction.user.id] = {
      minecraftUsername: username,
      minecraftUUID: uuid,
      linkedAt: new Date().toISOString(),
    };

    fs.writeFileSync(linksFile, JSON.stringify(links, null, 2));

    return interaction.reply({
      content: `Successfully linked your Discord to Minecraft account **${username}**!`,
      ephemeral: true,
    });

  } catch (error) {
    console.error(error);
    return interaction.reply({ content: 'Error while linking accounts.', ephemeral: true });
  }
}
