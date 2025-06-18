import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

// Helper to get display rank without + Superstar
function getDisplayRank(player) {
  if (player.rank && player.rank !== "NORMAL") {
    return '`' + player.rank.charAt(0) + player.rank.slice(1).toLowerCase() + '`';
  }

  if (player.monthlyPackageRank === "SUPERSTAR") {
    return '`MVP++`';  // no + Superstar
  }

  if (player.monthlyPackageRank === "MVP_PLUS") {
    return '`MVP+`';
  }

  if (player.newPackageRank) {
    switch (player.newPackageRank) {
      case "MVP_PLUS": return '`MVP+`';
      case "MVP": return '`MVP`';
      case "VIP_PLUS": return '`VIP+`';
      case "VIP": return '`VIP`';
      default: return '`' + player.newPackageRank + '`';
    }
  }

  return '`Default`';
}

// Check if user has an Optifine cape
async function hasOptifineCape(uuid) {
  try {
    const url = `https://optifine.net/capes/${uuid}.png`;
    const res = await fetch(url);
    if (!res.ok) return false;

    const buffer = await res.arrayBuffer();
    // Transparent cape is very small, so size > 100 bytes = cape present
    return buffer.byteLength > 100;
  } catch {
    return false;
  }
}

// Dummy placeholder for your actual link-checking logic
async function isLinkedToHaunt(uuid) {
  // Replace with your real DB check
  return false;
}

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Get detailed Hypixel profile info for a Minecraft username')
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
    const uuidNoDashes = uuid.replace(/-/g, '');

    // Fetch Hypixel player data
    const hypixelRes = await fetch(`https://api.hypixel.net/player?key=${apiKey}&uuid=${uuid}`);
    if (!hypixelRes.ok) return interaction.reply({ content: 'Failed to fetch Hypixel data.', ephemeral: true });
    const hypixelData = await hypixelRes.json();

    if (!hypixelData.player) return interaction.reply({ content: 'No Hypixel player data found.', ephemeral: true });

    const player = hypixelData.player;

    // Rank display (already backticked inside function)
    const rank = getDisplayRank(player);

    // Linked to Haunt?
    const linkedToHaunt = await isLinkedToHaunt(uuid);
    const linkedToHauntStr = linkedToHaunt ? '`True`' : '`False`';

    // Lunar+ status
    const hasLunarPlus = player.lunar ? '`True`' : '`False`';

    // Fetch skin model from Mojang sessionserver
    let skinModel = '`Classic`'; // default
    try {
      const sessionRes = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        // Parse textures property (base64 JSON inside properties)
        const texturesProp = sessionData.properties.find(prop => prop.name === 'textures');
        if (texturesProp) {
          const texturesJson = JSON.parse(Buffer.from(texturesProp.value, 'base64').toString());
          const model = texturesJson?.textures?.SKIN?.metadata?.model;
          if (model && model.toLowerCase() === 'slim') skinModel = '`Slim`';
        }
      }
    } catch {
      // fallback to classic if error
      skinModel = '`Classic`';
    }

    const skinDownloadUrl = `https://mc-heads.net/download/${username}`;
    const skinImageUrl = `https://mc-heads.net/body/${username}/100`;

    // Hypixel cape (activeCape or cape)
    let activeCape = player.activeCape || player.cape || null;
    if (activeCape) activeCape = '`' + activeCape + '`';
    else activeCape = '`N/A`';

    // Check Optifine cape
    const hasOptifine = await hasOptifineCape(uuidNoDashes);
    const optifineCapeStr = hasOptifine ? '`Optifine Cape`' : '`N/A`';

    // Build cape display string:
    let capeDisplay;
    if (activeCape === '`N/A`' && optifineCapeStr === '`N/A`') {
      capeDisplay = '`N/A`';
    } else if (activeCape !== '`N/A`' && optifineCapeStr === '`N/A`') {
      capeDisplay = activeCape;
    } else if (activeCape === '`N/A`' && optifineCapeStr !== '`N/A`') {
      capeDisplay = optifineCapeStr;
    } else {
      // Remove last backtick from activeCape and first backtick from optifineCapeStr and join with comma
      capeDisplay = activeCape.slice(0, -1) + ', ' + optifineCapeStr.slice(1);
    }

    // Build embed with skin thumbnail
    const embed = new EmbedBuilder()
      .setTitle(`IGN: ${username} • Information`)
      .setColor(0x36056E)
      .setThumbnail(skinImageUrl)
      .addFields(
        { name: 'Username', value: `\`${username}\``, inline: true },
        { name: 'UUID', value: `\`${uuid}\``, inline: true },
        { name: 'Rank', value: rank, inline: true },
        { name: 'Linked to Haunt?', value: linkedToHauntStr, inline: true },
        { name: 'Has Lunar+?', value: hasLunarPlus, inline: true },
        { name: 'Skin Model', value: skinModel, inline: true },
        { name: 'Active Skin', value: `[Download Skin](${skinDownloadUrl})`, inline: true },
        { name: 'Active Cape', value: capeDisplay, inline: true }
      )
      .setFooter({ text: `Requested by: ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Error fetching profile info.', ephemeral: true });
  }
}
