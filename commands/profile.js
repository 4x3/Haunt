import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { count, discordDate } from '../lib/format.js';
import { networkLevel, requirePlayer } from '../lib/hypixel.js';
import { getLinkByUuid } from '../lib/links.js';
import { fetchSkinModel } from '../lib/mojang.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Get detailed Hypixel profile info for a Minecraft username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

const PACKAGE_RANKS = {
  MVP_PLUS: 'MVP+',
  MVP: 'MVP',
  VIP_PLUS: 'VIP+',
  VIP: 'VIP',
};

function getDisplayRank(player) {
  // Staff ranks live on `rank`; everything else is a purchased package.
  if (player.rank && player.rank !== 'NORMAL') {
    return player.rank.charAt(0) + player.rank.slice(1).toLowerCase();
  }
  if (player.monthlyPackageRank === 'SUPERSTAR') return 'MVP++';
  return PACKAGE_RANKS[player.newPackageRank] ?? 'Default';
}

// OptiFine serves capes by username, not UUID.
async function hasOptifineCape(username) {
  try {
    const res = await fetch(`https://optifine.net/capes/${username}.png`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok && res.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const { profile, player } = await requirePlayer(username);

  const [skinModel, optifineCape] = await Promise.all([
    fetchSkinModel(profile.uuid),
    hasOptifineCape(profile.name),
  ]);

  const link = getLinkByUuid(profile.uuid);

  const embed = new EmbedBuilder()
    .setTitle(`${profile.name} \u2022 Profile`)
    .setColor(0x36056E)
    .setThumbnail(`https://mc-heads.net/body/${profile.uuid}/100`)
    .addFields(
      { name: 'Rank', value: getDisplayRank(player), inline: true },
      { name: 'Hypixel Level', value: `${Math.floor(networkLevel(player.networkExp))}`, inline: true },
      { name: 'Karma', value: count(player.karma), inline: true },
      { name: 'First Login', value: discordDate(player.firstLogin), inline: true },
      { name: 'Last Login', value: discordDate(player.lastLogin), inline: true },
      { name: 'Linked to Haunt', value: link ? `<@${link.discordId}>` : 'Not linked', inline: true },
      { name: 'Skin Model', value: skinModel === 'slim' ? 'Slim' : 'Classic', inline: true },
      { name: 'OptiFine Cape', value: optifineCape ? 'Yes' : 'No', inline: true },
      { name: 'UUID', value: `\`${profile.uuid}\`` },
      { name: 'Skin', value: `[Download](https://mc-heads.net/download/${profile.uuid})` },
    )
    .setFooter({ text: `Requested by ${interaction.user.username}` })
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
