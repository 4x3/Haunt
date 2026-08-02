import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { getSkyblockNews } from '../lib/hypixel.js';
import { clamp } from '../lib/format.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('sbnews')
  .setDescription('Latest SkyBlock news and patch notes');

const MAX_ITEMS = 6;

export async function execute(interaction) {
  const items = await getSkyblockNews();

  const embed = new EmbedBuilder()
    .setTitle('SkyBlock news')
    .setColor(0x36056E)
    .setTimestamp();

  if (!items.length) {
    embed.setDescription('No news posted right now.');
  } else {
    // `text` is the post date rather than a body, which reads oddly in the API
    // but is exactly what the in-game news menu shows.
    embed.setDescription(
      clamp(
        items
          .slice(0, MAX_ITEMS)
          .map(item => `**[${item.title}](${item.link})**\n${item.text ?? ''}`)
          .join('\n\n'),
        4000,
      ),
    );
  }

  await respond(interaction, { embeds: [embed] });
}
