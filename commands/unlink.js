import { SlashCommandBuilder } from 'discord.js';

import { getLinkByDiscordId, removeLink } from '../lib/links.js';
import { respond } from '../lib/respond.js';
import { UserError } from '../lib/errors.js';

export const data = new SlashCommandBuilder()
  .setName('unlink')
  .setDescription('Remove the Minecraft account linked to your Discord');

export const ephemeral = true;

export async function execute(interaction) {
  const existing = getLinkByDiscordId(interaction.user.id);
  if (!existing) throw new UserError("You don't have an account linked.");

  await removeLink(interaction.user.id);

  await respond(interaction, {
    content: `Unlinked **${existing.name}** from your Discord.`,
  });
}
