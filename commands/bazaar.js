import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { getBazaar } from '../lib/hypixel.js';
import { compact, count, titleCase } from '../lib/format.js';
import { respond } from '../lib/respond.js';
import { UserError } from '../lib/errors.js';

export const data = new SlashCommandBuilder()
  .setName('bazaar')
  .setDescription('SkyBlock bazaar prices for an item')
  .addStringOption(option =>
    option.setName('item')
      .setDescription('Bazaar item')
      .setRequired(true)
      .setAutocomplete(true));

const coins = value => `${count(Math.round(value ?? 0))} coins`;

export async function autocomplete(interaction) {
  const typed = interaction.options.getFocused().toLowerCase().replace(/\s+/g, '_');

  let ids = [];
  try {
    ids = Object.keys(await getBazaar());
  } catch {
    await interaction.respond([]);
    return;
  }

  await interaction.respond(
    ids
      .filter(id => id.toLowerCase().includes(typed))
      .slice(0, 25)
      .map(id => ({ name: titleCase(id).slice(0, 100), value: id })),
  );
}

export async function execute(interaction) {
  const itemId = interaction.options.getString('item');
  const products = await getBazaar();

  // Autocomplete hands back exact IDs, but people also type them by hand.
  const product = products[itemId] ?? products[itemId.toUpperCase().replace(/\s+/g, '_')];
  if (!product) throw new UserError(`\`${itemId}\` isn't a bazaar item.`);

  const q = product.quick_status ?? {};

  /*
   * Careful with the naming here - Hypixel's buyPrice is what *you* pay to buy
   * instantly (the higher number), and sellPrice is what you receive selling
   * instantly. Labelling them the other way round is the classic bazaar bug.
   */
  const instantBuy = q.buyPrice ?? 0;
  const instantSell = q.sellPrice ?? 0;
  const spread = instantBuy - instantSell;

  const embed = new EmbedBuilder()
    .setTitle(titleCase(product.product_id ?? itemId))
    .setColor(0x36056E)
    .addFields(
      { name: 'Instant Buy', value: coins(instantBuy), inline: true },
      { name: 'Instant Sell', value: coins(instantSell), inline: true },
      {
        name: 'Spread',
        value: instantBuy ? `${coins(spread)} (${((spread / instantBuy) * 100).toFixed(1)}%)` : 'N/A',
        inline: true,
      },
      { name: 'Buy Orders', value: count(q.buyOrders), inline: true },
      { name: 'Sell Orders', value: count(q.sellOrders), inline: true },
      { name: 'In Stock', value: compact(q.sellVolume), inline: true },
      { name: 'Weekly Buy Volume', value: compact(q.buyMovingWeek), inline: true },
      { name: 'Weekly Sell Volume', value: compact(q.sellMovingWeek), inline: true },
    )
    .setFooter({ text: 'Live bazaar data' })
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
