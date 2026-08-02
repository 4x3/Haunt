import { SlashCommandBuilder } from 'discord.js';

import { UserError } from '../lib/errors.js';
import { requirePlayer } from '../lib/hypixel.js';
import { getLinkByUuid, saveLink } from '../lib/links.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('link')
  .setDescription('Link your Minecraft account to your Discord')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Your Minecraft username')
      .setRequired(true));

export const ephemeral = true;

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const { profile, player } = await requirePlayer(username);

  const hypixelDiscord = player.socialMedia?.links?.DISCORD;
  if (!hypixelDiscord) {
    throw new UserError(
      `**${profile.name}** has no Discord linked on Hypixel.\n` +
      'Set it in game with `/profile` \u2192 Social Media \u2192 Discord, then run this again.',
    );
  }

  // Must match the whole handle. A substring check would let anyone whose name
  // appears inside the real handle claim the account.
  if (hypixelDiscord.toLowerCase() !== interaction.user.username.toLowerCase()) {
    throw new UserError(
      'That account is linked to a different Discord user.\n' +
      `Linked on Hypixel: \`${hypixelDiscord}\`\nYou: \`${interaction.user.username}\``,
    );
  }

  const existing = getLinkByUuid(profile.uuid);
  if (existing && existing.discordId !== interaction.user.id) {
    throw new UserError(`**${profile.name}** is already linked to another Discord account.`);
  }

  await saveLink(interaction.user.id, { uuid: profile.uuid, name: profile.name });

  await respond(interaction, {
    content: `Linked your Discord to **${profile.name}**.`,
  });
}
