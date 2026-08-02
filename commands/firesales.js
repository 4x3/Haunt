import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { getFireSales } from '../lib/hypixel.js';
import { count, relativeTime, titleCase } from '../lib/format.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('firesales')
  .setDescription('Active SkyBlock fire sales');

export async function execute(interaction) {
  const sales = await getFireSales();

  const embed = new EmbedBuilder()
    .setTitle('SkyBlock fire sales')
    .setColor(0x36056E)
    .setTimestamp();

  if (!sales.length) {
    // Empty most of the time - fire sales only run for a few days now and then.
    embed.setDescription('No fire sales are running at the moment.');
  } else {
    embed.setDescription(
      sales
        .map(sale => {
          const name = titleCase(sale.item_id ?? 'Unknown item');
          const price = sale.price ? `${count(sale.price)} gems` : 'Unknown price';
          return `**${name}** - ${price}\nEnds ${relativeTime(sale.end)} - ${count(sale.amount)} available`;
        })
        .join('\n\n'),
    );
  }

  await respond(interaction, { embeds: [embed] });
}
