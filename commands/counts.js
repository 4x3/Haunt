import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { cleanGameName } from '../lib/gamenames.js';
import { getCounts } from '../lib/hypixel.js';
import { count } from '../lib/format.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('counts')
  .setDescription('Live player counts across the Hypixel network');

const TOP_GAMES = 12;

export async function execute(interaction) {
  const data_ = await getCounts();
  const games = data_.games ?? {};

  const busiest = Object.entries(games)
    .map(([type, info]) => ({ type, players: info?.players ?? 0 }))
    .sort((a, b) => b.players - a.players)
    .slice(0, TOP_GAMES);

  const rows = await Promise.all(
    busiest.map(async entry => {
      const name = await cleanGameName(entry.type);
      return `\`${count(entry.players).padStart(7)}\`  ${name}`;
    }),
  );

  const embed = new EmbedBuilder()
    .setTitle('Hypixel player counts')
    .setColor(0x36056E)
    .setDescription(rows.join('\n') || 'No game data returned.')
    .addFields({ name: 'Total online', value: count(data_.playerCount) })
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
