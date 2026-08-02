import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('List everything Haunt can do');

export const defer = false;

// Grouping is manual on purpose - it reads far better than an alphabetical dump,
// and there aren't enough commands for it to be a maintenance burden.
const GROUPS = [
  ['Player stats', ['stats', 'game', 'status', 'recentgames']],
  ['Guilds', ['guild', 'guildtop']],
  ['SkyBlock', ['skyblock', 'bazaar', 'lowestbin', 'election', 'sbnews', 'firesales']],
  ['Network', ['counts', 'boosters', 'punishments', 'leaderboards']],
  ['Minecraft', ['skin', 'capes', 'uuid', 'server']],
  ['Account', ['link', 'unlink', 'whois']],
  ['Bot', ['ping', 'invite', 'help']],
];

export async function execute(interaction) {
  const commands = interaction.client.commands;

  const embed = new EmbedBuilder()
    .setTitle('Haunt commands')
    .setColor(0x36056E)
    .setDescription('Link your account once with `/link` and most commands will default to you.')
    .setTimestamp();

  for (const [heading, names] of GROUPS) {
    const lines = names
      .map(name => commands.get(name))
      .filter(Boolean)
      .map(command => `**/${command.data.name}** - ${command.data.description}`);

    if (lines.length) embed.addFields({ name: heading, value: lines.join('\n') });
  }

  // Anything new that hasn't been slotted into a group yet still shows up.
  const grouped = new Set(GROUPS.flatMap(([, names]) => names));
  const ungrouped = [...commands.keys()].filter(name => !grouped.has(name));
  if (ungrouped.length) {
    embed.addFields({ name: 'Other', value: ungrouped.map(n => `**/${n}**`).join(', ') });
  }

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
