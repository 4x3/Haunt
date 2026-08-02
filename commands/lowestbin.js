import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { indexAge, lowestBinIndex } from '../lib/auctions.js';
import { count, duration, titleCase } from '../lib/format.js';
import { respond } from '../lib/respond.js';
import { UserError } from '../lib/errors.js';

export const data = new SlashCommandBuilder()
  .setName('lowestbin')
  .setDescription('Cheapest Buy-It-Now price for a SkyBlock item')
  .addStringOption(option =>
    option.setName('item')
      .setDescription('Item name as it appears in game')
      .setRequired(true)
      .setAutocomplete(true));

export async function autocomplete(interaction) {
  const typed = interaction.options.getFocused().toLowerCase();

  // Only offer suggestions off an already-built index. Kicking off a 51-page
  // scan from autocomplete would blow the 3 second budget every time.
  if (indexAge() === null) {
    await interaction.respond([]);
    return;
  }

  const names = [...(await lowestBinIndex()).keys()];
  await interaction.respond(
    names
      .filter(name => name.toLowerCase().includes(typed))
      .slice(0, 25)
      .map(name => ({ name: name.slice(0, 100), value: name.slice(0, 100) })),
  );
}

export async function execute(interaction) {
  const query = interaction.options.getString('item');
  const index = await lowestBinIndex();

  // Exact match first, then fall back to a contains search so people don't have
  // to reproduce reforge prefixes exactly.
  let name = index.has(query) ? query : null;
  if (!name) {
    const needle = query.toLowerCase();
    const matches = [...index.keys()].filter(key => key.toLowerCase().includes(needle));
    matches.sort((a, b) => index.get(a).price - index.get(b).price);
    name = matches[0] ?? null;
  }

  if (!name) throw new UserError(`Nothing on the auction house matches \`${query}\`.`);

  const entry = index.get(name);
  const age = indexAge();

  const embed = new EmbedBuilder()
    .setTitle(name)
    .setColor(0x36056E)
    .addFields(
      { name: 'Lowest BIN', value: `${count(entry.price)} coins`, inline: true },
      { name: 'Tier', value: entry.tier ? titleCase(entry.tier) : 'Unknown', inline: true },
    )
    .setFooter({ text: `Auction snapshot ${age ? `${duration(age)} old` : 'just taken'}` })
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
