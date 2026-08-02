import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { headRender } from '../lib/renders.js';
import { respond } from '../lib/respond.js';
import { resolveTarget } from '../lib/target.js';

export const data = new SlashCommandBuilder()
  .setName('capes')
  .setDescription('Show the capes a player owns')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username (defaults to your linked account)')
      .setRequired(false));

/*
 * Cape sources worth knowing about:
 *
 *  - Official Mojang capes (MineCon, Migrator, ...) come straight out of the
 *    profile texture blob, which PlayerDB already gives us. This used to be
 *    broken because the old code hit capes.minecraft.net, a host that was
 *    retired years ago and no longer resolves at all.
 *  - OptiFine capes are keyed by username, not UUID. Getting that wrong means
 *    every lookup silently 404s and reports "no cape".
 */
async function hasOptifineCape(username) {
  try {
    const res = await fetch(`https://optifine.net/capes/${username}.png`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok && res.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

export async function execute(interaction) {
  const profile = await resolveTarget(interaction);
  const optifine = await hasOptifineCape(profile.name);

  const embed = new EmbedBuilder()
    .setTitle(`${profile.name}'s capes`)
    .setColor(0x36056E)
    .setThumbnail(headRender(profile.uuidDashed))
    .addFields(
      {
        name: 'Minecraft cape',
        value: profile.capeTexture ? `[View](${profile.capeTexture})` : 'None',
        inline: true,
      },
      {
        name: 'OptiFine cape',
        value: optifine ? `[View](https://optifine.net/capes/${profile.name}.png)` : 'None',
        inline: true,
      },
    )
    .setTimestamp();

  // Prefer showing the official cape since it's the rarer one.
  const preview = profile.capeTexture ?? (optifine ? `https://optifine.net/capes/${profile.name}.png` : null);
  if (preview) embed.setImage(preview);

  if (!profile.capeTexture && !optifine) {
    embed.setDescription('No capes found on this account.');
  }

  await respond(interaction, { embeds: [embed] });
}
