import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { cleanGameName } from '../lib/gamenames.js';
import { getBoosters } from '../lib/hypixel.js';
import { duration } from '../lib/format.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('boosters')
  .setDescription('Network coin boosters that are currently running');

const MAX_SHOWN = 10;

export async function execute(interaction) {
  const boosters = await getBoosters();

  // The endpoint returns every queued booster, not just live ones. A booster is
  // active once it has a dateActivated and still has length remaining.
  const active = boosters
    .filter(b => b.dateActivated && (b.length ?? 0) > 0)
    .sort((a, b) => (a.length ?? 0) - (b.length ?? 0))
    .slice(0, MAX_SHOWN);

  const embed = new EmbedBuilder()
    .setTitle('Active boosters')
    .setColor(0x36056E)
    .setTimestamp();

  if (!active.length) {
    embed.setDescription('No boosters are running right now.');
  } else {
    const lines = await Promise.all(
      active.map(async booster => {
        const game = await cleanGameName(booster.gameType);
        const stacked = Array.isArray(booster.stacked) ? booster.stacked.length : 0;
        const extra = stacked ? ` (+${stacked} stacked)` : '';
        // `length` counts down in seconds.
        return `**${game}** - ${booster.amount}x - ${duration(booster.length * 1000)} left${extra}`;
      }),
    );
    embed.setDescription(lines.join('\n'));
  }

  await respond(interaction, { embeds: [embed] });
}
