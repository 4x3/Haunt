import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { cleanGameName } from '../lib/gamenames.js';
import { getPlayer, getStatus } from '../lib/hypixel.js';
import { headRender } from '../lib/renders.js';
import { relativeTime, titleCase } from '../lib/format.js';
import { respond } from '../lib/respond.js';
import { resolveTarget } from '../lib/target.js';

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Check whether a player is online and what they are playing')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username (defaults to your linked account)')
      .setRequired(false));

export async function execute(interaction) {
  const profile = await resolveTarget(interaction);

  // Status alone doesn't tell us when they were last seen, so pull the player
  // record too - it's usually already cached from another command anyway.
  const [session, player] = await Promise.all([
    getStatus(profile.uuid),
    getPlayer(profile.uuid).catch(() => null),
  ]);

  const online = session?.online === true;

  const embed = new EmbedBuilder()
    .setTitle(`${profile.name} is ${online ? 'online' : 'offline'}`)
    .setColor(online ? 0x3BA55D : 0x36056E)
    .setThumbnail(headRender(profile.uuidDashed))
    .setTimestamp();

  if (online) {
    embed.addFields(
      { name: 'Game', value: await cleanGameName(session.gameType), inline: true },
      { name: 'Mode', value: session.mode ? titleCase(session.mode) : 'N/A', inline: true },
      { name: 'Map', value: session.map ?? 'N/A', inline: true },
    );
  } else if (player?.lastLogout) {
    embed.addFields({ name: 'Last seen', value: relativeTime(player.lastLogout) });
  }

  // Players can hide their session in Hypixel's privacy settings, which comes
  // back as online:false rather than an error - worth saying so explicitly.
  if (!online) {
    embed.setFooter({ text: 'Players with session privacy enabled always show as offline.' });
  }

  await respond(interaction, { embeds: [embed] });
}
