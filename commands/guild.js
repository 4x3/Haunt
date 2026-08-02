import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { UserError } from '../lib/errors.js';
import { count, discordDate } from '../lib/format.js';
import { getGuildByPlayer } from '../lib/hypixel.js';
import { resolveProfile, fetchUsername } from '../lib/mojang.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('guild')
  .setDescription('Get the Hypixel guild info for a Minecraft username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

const TOP_MEMBERS = 5;

function weeklyGexp(member) {
  return Object.values(member.expHistory ?? {}).reduce((total, xp) => total + xp, 0);
}

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const profile = await resolveProfile(username);

  const guild = await getGuildByPlayer(profile.uuid);
  if (!guild) throw new UserError(`**${profile.name}** is not in a guild.`);

  const members = guild.members ?? [];
  const topContributors = [...members]
    .sort((a, b) => weeklyGexp(b) - weeklyGexp(a))
    .slice(0, TOP_MEMBERS);

  // Hypixel only returns UUIDs, so names come from Mojang. Fetched together
  // rather than in sequence to keep this inside the interaction window.
  const names = await Promise.all(
    topContributors.map(member => fetchUsername(member.uuid)),
  );

  const topList = topContributors
    .map((member, i) => {
      const name = names[i] ?? 'Unknown player';
      return `**${name}** — ${weeklyGexp(member).toLocaleString()} GEXP (${member.rank})`;
    })
    .join('\n');

  const tag = guild.tag ? `[${guild.tag}] ` : '';

  const embed = new EmbedBuilder()
    .setTitle(`${tag}${guild.name}`)
    .setColor(0x36056E)
    .addFields(
      { name: 'Members', value: `${members.length}/125`, inline: true },
      { name: 'Total GEXP', value: count(guild.exp), inline: true },
      { name: 'Created', value: discordDate(guild.created), inline: true },
    )
    .setTimestamp();

  if (guild.description) {
    embed.setDescription(guild.description);
  }
  if (topList) {
    embed.addFields({ name: 'Top weekly contributors', value: topList });
  }

  await respond(interaction, { embeds: [embed] });
}
