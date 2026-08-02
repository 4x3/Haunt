import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { getElection } from '../lib/hypixel.js';
import { count, percent } from '../lib/format.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('election')
  .setDescription('Current SkyBlock mayor and election standings');

export async function execute(interaction) {
  const data_ = await getElection();
  const mayor = data_.mayor;
  const current = data_.current;

  const embed = new EmbedBuilder()
    .setColor(0x36056E)
    .setTitle(mayor?.name ? `Mayor ${mayor.name}` : 'SkyBlock election')
    .setTimestamp();

  if (mayor?.perks?.length) {
    embed.setDescription(
      mayor.perks.map(perk => `**${perk.name}**\n${perk.description ?? ''}`).join('\n\n'),
    );
  }

  if (mayor?.election?.year) {
    embed.addFields({ name: 'Elected', value: `Year ${mayor.election.year}`, inline: true });
  }

  // `current` only exists while voting is actually open.
  if (current?.candidates?.length) {
    const totalVotes = current.candidates.reduce((sum, c) => sum + (c.votes ?? 0), 0);
    const standings = [...current.candidates]
      .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
      .map((c, i) => {
        const votes = c.votes ?? 0;
        return `${i + 1}. **${c.name}** - ${count(votes)} (${percent(votes, totalVotes)})`;
      })
      .join('\n');

    embed.addFields({ name: `Year ${current.year} election`, value: standings });
  } else {
    embed.setFooter({ text: 'No election is currently running.' });
  }

  await respond(interaction, { embeds: [embed] });
}
