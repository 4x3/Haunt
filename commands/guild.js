import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('guild')
  .setDescription('Get the Hypixel guild info for a Minecraft username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
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

    // Fetch Hypixel guild info using player UUID
    const guildRes = await fetch(`https://api.hypixel.net/guild?key=${apiKey}&player=${uuid}`);
    if (!guildRes.ok) return interaction.reply({ content: 'Failed to fetch Hypixel guild data.', ephemeral: true });
    const guildData = await guildRes.json();

    if (!guildData.guild) return interaction.reply({ content: `${username} is not in a guild.`, ephemeral: true });

    const guild = guildData.guild;
    const guildName = guild.name || 'Unknown';
    const guildTag = guild.tag ? `[${guild.tag}]` : '';
    const created = guild.created ? new Date(guild.created).toLocaleDateString() : 'Unknown';
    const description = guild.description || 'No description';
    const memberCount = guild.members ? guild.members.length : 0;

    // Optional: sort members by guild rank or joined date
    // For now just show top 5 members with their rank
    const membersList = guild.members
      .slice(0, 5)
      .map(m => `${m.rank} - <@${m.uuid}>`)
      .join('\n') || 'No members listed';

    const embed = new EmbedBuilder()
      .setTitle(`Guild Info for ${username}`)
      .setColor(0x36056E)
      .addFields(
        { name: 'Guild Name', value: `${guildTag} ${guildName}`, inline: true },
        { name: 'Created', value: created, inline: true },
        { name: 'Members', value: memberCount.toString(), inline: true },
        { name: 'Description', value: description },
        { name: 'Top Members', value: membersList }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Error fetching guild info.', ephemeral: true });
  }
}
