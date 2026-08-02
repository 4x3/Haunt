import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { UserError } from '../lib/errors.js';
import { count } from '../lib/format.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('server')
  .setDescription('Get info about a Minecraft server by IP or domain')
  .addStringOption(option =>
    option.setName('ip')
      .setDescription('Minecraft server IP or domain')
      .setRequired(true));

const HOST_PATTERN = /^[a-zA-Z0-9.\-]{1,253}(:\d{1,5})?$/;

export async function execute(interaction) {
  const host = interaction.options.getString('ip');
  if (!HOST_PATTERN.test(host)) {
    throw new UserError(`\`${host}\` is not a valid server address.`);
  }

  const res = await fetch(`https://api.mcsrvstat.us/3/${host}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`mcsrvstat returned ${res.status}`);

  const data = await res.json();
  if (!data.online) throw new UserError(`**${host}** is offline or does not exist.`);

  const embed = new EmbedBuilder()
    .setTitle(host)
    .setColor(0x36056E)
    .addFields(
      { name: 'Address', value: `\`${data.ip ?? host}:${data.port ?? 25565}\``, inline: true },
      {
        name: 'Players',
        value: `${count(data.players?.online)} / ${count(data.players?.max)}`,
        inline: true,
      },
      { name: 'Version', value: data.version ?? 'Unknown', inline: true },
    )
    .setTimestamp();

  const motd = data.motd?.clean?.join('\n').trim();
  if (motd) embed.setDescription(motd);

  if (data.icon) {
    embed.setThumbnail(`https://api.mcsrvstat.us/icon/${host}`);
  }

  await respond(interaction, { embeds: [embed] });
}
