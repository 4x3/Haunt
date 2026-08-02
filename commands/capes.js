import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { resolveProfile } from '../lib/mojang.js';
import { respond } from '../lib/respond.js';

export const data = new SlashCommandBuilder()
  .setName('capes')
  .setDescription('Show Minecraft capes for a username')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username')
      .setRequired(true));

// OptiFine keys capes by username. Mojang's old capes.minecraft.net host was
// retired and its domain no longer resolves, so there is no Java cape source.
function optifineCapeUrl(username) {
  return `https://optifine.net/capes/${username}.png`;
}

async function hasOptifineCape(username) {
  try {
    const res = await fetch(optifineCapeUrl(username), {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok && res.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

export async function execute(interaction) {
  const username = interaction.options.getString('username');
  const profile = await resolveProfile(username);

  const optifine = await hasOptifineCape(profile.name);

  const embed = new EmbedBuilder()
    .setTitle(`Capes for ${profile.name}`)
    .setColor(0x36056E)
    .addFields({
      name: 'OptiFine',
      value: optifine ? `[View cape](${optifineCapeUrl(profile.name)})` : 'None',
    })
    .setFooter({ text: `Requested by ${interaction.user.username}` })
    .setTimestamp();

  if (optifine) embed.setImage(optifineCapeUrl(profile.name));

  await respond(interaction, { embeds: [embed] });
}
