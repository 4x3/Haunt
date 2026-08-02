import { UserError } from './errors.js';
import { getLinkByDiscordId } from './links.js';
import { resolvePlayer } from './players.js';

/*
 * Works out which Minecraft account a command is about.
 *
 * The username option is optional everywhere on purpose: once someone has run
 * /link they can just type /stats and get their own numbers. That's the main
 * payoff for linking, so it's worth the small amount of plumbing.
 */
export async function resolveTarget(interaction, optionName = 'username') {
  const provided = interaction.options.getString(optionName);
  if (provided) return resolvePlayer(provided);

  const link = getLinkByDiscordId(interaction.user.id);
  if (link) return resolvePlayer(link.uuid);

  throw new UserError(
    'Tell me a username, or run `/link` once and I\'ll remember your account.',
  );
}
