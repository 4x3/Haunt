import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { count, discordDate, relativeTime } from '../lib/format.js';
import { getPlayer, networkLevel, xpForNetworkLevel } from '../lib/hypixel.js';
import { getLinkByUuid } from '../lib/links.js';
import { bodyRender } from '../lib/renders.js';
import { respond } from '../lib/respond.js';
import { resolveTarget } from '../lib/target.js';
import { UserError } from '../lib/errors.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Overall Hypixel stats for a player')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username (defaults to your linked account)')
      .setRequired(false));

const PACKAGE_RANKS = {
  MVP_PLUS: 'MVP+',
  MVP: 'MVP',
  VIP_PLUS: 'VIP+',
  VIP: 'VIP',
};

function displayRank(player) {
  // Staff and special ranks live on `rank`; everything else is a purchase.
  // "NORMAL" shows up on plenty of accounts and just means no staff rank.
  if (player?.rank && player.rank !== 'NORMAL') {
    return player.rank.charAt(0) + player.rank.slice(1).toLowerCase();
  }
  if (player?.monthlyPackageRank === 'SUPERSTAR') return 'MVP++';
  return PACKAGE_RANKS[player?.newPackageRank] ?? 'Default';
}

export async function execute(interaction) {
  const profile = await resolveTarget(interaction);
  const player = await getPlayer(profile.uuid);

  if (!player) {
    throw new UserError(`**${profile.name}** has never logged into Hypixel.`);
  }

  const exp = player.networkExp ?? 0;
  const exact = networkLevel(exp);
  const level = Math.floor(exact);
  const toNext = Math.max(0, Math.ceil(xpForNetworkLevel(level + 1) - exp));

  const link = getLinkByUuid(profile.uuid);

  const embed = new EmbedBuilder()
    .setTitle(`${profile.name}'s Hypixel Stats`)
    .setColor(0x36056E)
    .setThumbnail(bodyRender(profile.uuidDashed))
    .addFields(
      { name: 'Rank', value: displayRank(player), inline: true },
      { name: 'Network Level', value: `${level}`, inline: true },
      { name: 'Karma', value: count(player.karma), inline: true },
      { name: 'Achievement Points', value: count(player.achievementPoints), inline: true },
      { name: 'XP to Next Level', value: count(toNext), inline: true },
      { name: 'Linked', value: link ? `<@${link.discordId}>` : 'Not linked', inline: true },
      { name: 'First Login', value: discordDate(player.firstLogin), inline: true },
      { name: 'Last Login', value: relativeTime(player.lastLogin), inline: true },
    )
    .setFooter({ text: `Use /game to break down a specific gamemode` })
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
