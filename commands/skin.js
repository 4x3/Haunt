import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('skin')
  .setDescription('Get the Minecraft skin for a username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

export async function execute(interaction) {
  const username = interaction.options.getString('username');

  // Skin preview URL from Minecraft skins server
  const skinUrl = `https://mc-heads.net/body/${username}/250`;

  // Direct skin download URL (official Mojang skin server)
  // Format UUID needed — for simplicity here use username in download link pattern from namemc or mc-heads.net
  // But to be precise, you’d want UUID; for demo, we'll keep username

  const downloadUrl = `https://mc-heads.net/download/${username}`;

  const embed = new EmbedBuilder()
    .setTitle(`Minecraft Skin for ${username}`)
    .setColor(0x36056E)
    .setImage(skinUrl)
    .setDescription(`[Download Skin](${downloadUrl})`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
