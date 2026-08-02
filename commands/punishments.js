import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { getPunishmentStats } from '../lib/hypixel.js';
import { count } from '../lib/format.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('punishments')
  .setDescription('Network-wide Watchdog and staff ban statistics');

export async function execute(interaction) {
  const stats = await getPunishmentStats();

  const embed = new EmbedBuilder()
    .setTitle('Hypixel punishment stats')
    .setColor(0x36056E)
    .addFields(
      { name: 'Watchdog (last minute)', value: count(stats.watchdog_lastMinute), inline: true },
      { name: 'Watchdog (24h)', value: count(stats.watchdog_rollingDaily), inline: true },
      { name: 'Watchdog (total)', value: count(stats.watchdog_total), inline: true },
      { name: 'Staff (24h)', value: count(stats.staff_rollingDaily), inline: true },
      { name: 'Staff (total)', value: count(stats.staff_total), inline: true },
    )
    .setFooter({ text: 'Watchdog is the automated anticheat; staff bans are manual.' })
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
