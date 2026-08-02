import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { getGuildByName, getGuildByPlayer } from '../lib/hypixel.js';
import { resolvePlayer, resolveUsername } from '../lib/players.js';
import { getLinkByDiscordId } from '../lib/links.js';
import { clamp, count, discordDate, stripColors } from '../lib/format.js';
import { respond } from '../lib/respond.js';
import { UserError } from '../lib/errors.js';

export const data = new SlashCommandBuilder()
  .setName('guild')
  .setDescription('Look up a Hypixel guild')
  .addStringOption(option =>
    option.setName('player')
      .setDescription('Find the guild this player is in')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('name')
      .setDescription('Find a guild by its name')
      .setRequired(false));

// Guild XP per level plateaus at 3,000,000 once you're past the early levels.
const GUILD_LEVEL_STEPS = [
  100000, 150000, 250000, 500000, 750000,
  1000000, 1250000, 1500000, 2000000, 2500000, 2500000, 2500000, 2500000, 2500000,
];
const GUILD_XP_PLATEAU = 3000000;

function guildLevel(exp = 0) {
  let remaining = exp;
  let level = 0;

  for (const step of GUILD_LEVEL_STEPS) {
    if (remaining < step) return level + remaining / step;
    remaining -= step;
    level++;
  }

  return level + remaining / GUILD_XP_PLATEAU;
}

function weeklyGexp(member) {
  return Object.values(member?.expHistory ?? {}).reduce((total, xp) => total + (xp ?? 0), 0);
}

async function findGuild(interaction) {
  const name = interaction.options.getString('name');
  if (name) return { guild: await getGuildByName(name), label: name };

  const player = interaction.options.getString('player');
  if (player) {
    const profile = await resolvePlayer(player);
    return { guild: await getGuildByPlayer(profile.uuid), label: profile.name };
  }

  // No arguments at all - fall back to whoever ran the command, same as the
  // stats commands do.
  const link = getLinkByDiscordId(interaction.user.id);
  if (!link) {
    throw new UserError('Give me a player or a guild name, or run `/link` first.');
  }

  const profile = await resolvePlayer(link.uuid);
  return { guild: await getGuildByPlayer(profile.uuid), label: profile.name };
}

export async function execute(interaction) {
  const { guild, label } = await findGuild(interaction);
  if (!guild) throw new UserError(`No guild found for **${label}**.`);

  const members = guild.members ?? [];
  const weekly = members.reduce((total, member) => total + weeklyGexp(member), 0);

  const topThree = [...members]
    .sort((a, b) => weeklyGexp(b) - weeklyGexp(a))
    .slice(0, 3);
  const topNames = await Promise.all(topThree.map(m => resolveUsername(m.uuid)));

  const embed = new EmbedBuilder()
    .setTitle(`${guild.tag ? `[${stripColors(guild.tag)}] ` : ''}${guild.name}`)
    .setColor(0x36056E)
    .addFields(
      { name: 'Level', value: String(Math.floor(guildLevel(guild.exp))), inline: true },
      { name: 'Members', value: `${members.length}/125`, inline: true },
      { name: 'Created', value: discordDate(guild.created), inline: true },
      { name: 'Total GEXP', value: count(guild.exp), inline: true },
      { name: 'Weekly GEXP', value: count(weekly), inline: true },
      { name: 'Publicly Listed', value: guild.publiclyListed ? 'Yes' : 'No', inline: true },
    )
    .setTimestamp();

  if (guild.description) {
    embed.setDescription(clamp(guild.description, 400));
  }

  if (topThree.length) {
    embed.addFields({
      name: 'Top contributors this week',
      value: topThree
        .map((m, i) => `${i + 1}. **${topNames[i] ?? 'Unknown'}** - ${count(weeklyGexp(m))}`)
        .join('\n'),
    });
  }

  embed.setFooter({ text: 'Use /guildtop for the full weekly leaderboard' });
  await respond(interaction, { embeds: [embed] });
}
