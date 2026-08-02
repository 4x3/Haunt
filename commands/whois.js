import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { getLinkByDiscordId, getLinkByUuid } from '../lib/links.js';
import { resolvePlayer } from '../lib/players.js';
import { headRender } from '../lib/renders.js';
import { discordDate } from '../lib/format.js';
import { respond } from '../lib/respond.js';
import { UserError } from '../lib/errors.js';

export const data = new SlashCommandBuilder()
  .setName('whois')
  .setDescription('Look up the link between a Discord user and a Minecraft account')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('Discord user to look up')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username to look up')
      .setRequired(false));

export async function execute(interaction) {
  const discordUser = interaction.options.getUser('user');
  const username = interaction.options.getString('username');

  // Two directions through the same store: Discord -> Minecraft, or the reverse.
  let link;
  let subject;

  if (username) {
    const profile = await resolvePlayer(username);
    link = getLinkByUuid(profile.uuid);
    subject = profile.name;

    if (!link) throw new UserError(`**${profile.name}** isn't linked to any Discord account here.`);
  } else {
    const user = discordUser ?? interaction.user;
    link = getLinkByDiscordId(user.id);
    subject = user.username;

    if (!link) {
      throw new UserError(
        user.id === interaction.user.id
          ? "You haven't linked an account yet. Run `/link` to set one up."
          : `${user.username} hasn't linked a Minecraft account.`,
      );
    }
    link = { ...link, discordId: user.id };
  }

  const profile = await resolvePlayer(link.uuid);

  const embed = new EmbedBuilder()
    .setTitle(`Link for ${subject}`)
    .setColor(0x36056E)
    .setThumbnail(headRender(profile.uuidDashed))
    .addFields(
      { name: 'Discord', value: `<@${link.discordId}>`, inline: true },
      { name: 'Minecraft', value: profile.name, inline: true },
      { name: 'Linked', value: discordDate(Date.parse(link.linkedAt)), inline: true },
      { name: 'UUID', value: `\`${profile.uuid}\`` },
    )
    .setTimestamp();

  await respond(interaction, { embeds: [embed] });
}
