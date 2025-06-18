import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('capes')
  .setDescription('Show Minecraft capes info for a username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true)
  );

// Helper function to get UUID from Mojang
async function getUUID(username) {
  const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.id;
}

// Check if Mojang Java Cape exists
async function checkJavaCape(uuid) {
  // Mojang stores capes at https://capes.minecraft.net/MinecraftCloaks/{uuid}.png
  // Note: This endpoint may require HTTPS and only available for legacy capes
  const url = `https://capes.minecraft.net/MinecraftCloaks/${uuid}.png`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (res.ok) return url;
  } catch {
    // ignore errors
  }
  return null;
}

// Check if Optifine cape exists
async function checkOptifineCape(username) {
  // Optifine capes: https://optifine.net/capes/{username}.png
  // They may only exist if player purchased cape
  const url = `https://optifine.net/capes/${username}.png`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (res.ok) return url;
  } catch {
    // ignore errors
  }
  return null;
}

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const uuid = await getUUID(username);

  if (!uuid) {
    return interaction.reply({ content: `No user found with username: ${username}`, ephemeral: true });
  }

  // Check capes
  const javaCapeUrl = await checkJavaCape(uuid);
  const optifineCapeUrl = await checkOptifineCape(username);

  const embed = new EmbedBuilder()
    .setTitle(`Capes for ${username}`)
    .setColor(0x36056E)
    .addFields(
      {
        name: 'Java Cape',
        value: javaCapeUrl ? `[View Cape](${javaCapeUrl})` : '`N/A`',
        inline: false,
      },
      {
        name: 'Optifine Cape',
        value: optifineCapeUrl ? `[View Cape](${optifineCapeUrl})` : '`N/A`',
        inline: false,
      }
    )
    .setTimestamp()
    .setFooter({ text: `Requested by: ${interaction.user.username}` });

  // Add images if available
  if (javaCapeUrl) {
    embed.setImage(javaCapeUrl);
  } else if (optifineCapeUrl) {
    embed.setImage(optifineCapeUrl);
  }

  await interaction.reply({ embeds: [embed] });
}
