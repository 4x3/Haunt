import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { getGuildByName, getGuildByPlayer } from '../lib/hypixel.js';
import { resolvePlayer, resolveUsername } from '../lib/players.js';
import { getLinkByDiscordId } from '../lib/links.js';
import { count } from '../lib/format.js';
import { respond } from '../lib/respond.js';
import { UserError } from '../lib/errors.js';

export const data = new SlashCommandBuilder()
  .setName('guildtop')
  .setDescription('Weekly guild XP leaderboard')
  .addStringOption(option =>
    option.setName('player')
      .setDescription('A player in the guild')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('name')
      .setDescription('Guild name')
      .setRequired(false));

// Resolving names costs one lookup each, so cap the board at something that
// stays inside the interaction window.
const TOP_N = 10;

function weeklyGexp(member) {
  return Object.values(member?.expHistory ?? {}).reduce((total, xp) => total + (xp ?? 0), 0);
}

async function findGuild(interaction) {
  const name = interaction.options.getString('name');
  if (name) return getGuildByName(name);

  const player = interaction.options.getString('player');
  if (player) {
    const profile = await resolvePlayer(player);
    return getGuildByPlayer(profile.uuid);
  }

  const link = getLinkByDiscordId(interaction.user.id);
  if (!link) throw new UserError('Give me a player or a guild name, or run `/link` first.');
  return getGuildByPlayer(link.uuid);
}

export async function execute(interaction) {
  const guild = await findGuild(interaction);
  if (!guild) throw new UserError('No guild found.');

  const ranked = [...(guild.members ?? [])]
    .map(member => ({ member, gexp: weeklyGexp(member) }))
    .sort((a, b) => b.gexp - a.gexp)
    .slice(0, TOP_N);

  if (!ranked.length) throw new UserError(`**${guild.name}** has no members to rank.`);

  const names = await Promise.all(ranked.map(entry => resolveUsername(entry.member.uuid)));

  const board = ranked
    .map((entry, i) => {
      const name = names[i] ?? 'Unknown';
      const rank = entry.member.rank ? ` *(${entry.member.rank})*` : '';
      return `\`${String(i + 1).padStart(2)}.\` **${name}**${rank} - ${count(entry.gexp)}`;
    })
    .join('\n');

  const embed = new EmbedBuilder()
    .setTitle(`${guild.name} - weekly GEXP`)
    .setColor(0x36056E)
    .setDescription(board)
    .setFooter({ text: 'GEXP totalled over the last 7 days' })
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
