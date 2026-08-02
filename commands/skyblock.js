import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { getSkillResources, getSkyblockProfiles } from '../lib/hypixel.js';
import { bodyRender } from '../lib/renders.js';
import { compact, count, titleCase } from '../lib/format.js';
import { respond } from '../lib/respond.js';
import { resolveTarget } from '../lib/target.js';
import { UserError } from '../lib/errors.js';

export const data = new SlashCommandBuilder()
  .setName('skyblock')
  .setDescription('SkyBlock profile summary for a player')
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username (defaults to your linked account)')
      .setRequired(false));

// Skills that count toward the skill average players actually quote. Social
// and the newer additions are deliberately excluded, matching community tools.
const AVERAGE_SKILLS = [
  'FARMING', 'MINING', 'COMBAT', 'FORAGING',
  'FISHING', 'ENCHANTING', 'ALCHEMY', 'TAMING',
];

const SLAYERS = ['zombie', 'spider', 'wolf', 'enderman', 'blaze', 'vampire'];

// Slayer level thresholds are fixed and not exposed as a resource, so they live
// here. Vampire caps at 5, the rest at 9.
const SLAYER_XP = [0, 5, 15, 200, 1000, 5000, 20000, 100000, 400000, 1000000];
const VAMPIRE_XP = [0, 20, 75, 240, 840, 2400];

/*
 * Hypixel reshuffled the member payload a while back: skill XP moved from
 * `experience_skill_<name>` to `player_data.experience.SKILL_<NAME>`, and the
 * purse moved under `currencies`. Plenty of profiles still return the old
 * layout, so read both and take whichever is present.
 */
function skillXp(member, skillKey) {
  const modern = member?.player_data?.experience?.[`SKILL_${skillKey}`];
  if (typeof modern === 'number') return modern;

  const legacy = member?.[`experience_skill_${skillKey.toLowerCase()}`];
  return typeof legacy === 'number' ? legacy : null;
}

function levelFromXp(xp, levels, maxLevel) {
  let level = 0;
  for (const step of levels) {
    if (xp >= step.totalExpRequired) level = step.level;
    else break;
  }
  return Math.min(level, maxLevel ?? level);
}

function slayerLevel(xp, type) {
  const table = type === 'vampire' ? VAMPIRE_XP : SLAYER_XP;
  let level = 0;
  table.forEach((threshold, i) => {
    if (xp >= threshold) level = i;
  });
  return level;
}

function pickProfile(profiles) {
  // `selected` marks the profile the player is currently on. Falling back to
  // the first entry keeps things working for the odd payload without one.
  return profiles.find(p => p.selected) ?? profiles[0];
}

export async function execute(interaction) {
  const target = await resolveTarget(interaction);
  const profiles = await getSkyblockProfiles(target.uuid);

  if (!profiles.length) {
    throw new UserError(`**${target.name}** has no SkyBlock profiles.`);
  }

  const profile = pickProfile(profiles);
  const member = profile?.members?.[target.uuid] ?? {};
  const skillTable = await getSkillResources();

  const skillLevels = [];
  for (const key of AVERAGE_SKILLS) {
    const xp = skillXp(member, key);
    if (xp === null) continue;

    const definition = skillTable[key];
    if (!definition?.levels) continue;

    skillLevels.push({
      name: definition.name ?? titleCase(key),
      level: levelFromXp(xp, definition.levels, definition.maxLevel),
    });
  }

  const average = skillLevels.length
    ? (skillLevels.reduce((sum, s) => sum + s.level, 0) / skillLevels.length).toFixed(2)
    : 'N/A';

  const bosses = member.slayer?.slayer_bosses ?? member.slayer_bosses ?? {};
  const slayerLine = SLAYERS
    .map(type => ({ type, xp: bosses[type]?.xp ?? 0 }))
    .filter(entry => entry.xp > 0)
    .map(entry => `${titleCase(entry.type)} ${slayerLevel(entry.xp, entry.type)}`)
    .join(' - ');

  const purse = member.currencies?.coin_purse ?? member.coin_purse ?? 0;
  const bank = profile.banking?.balance ?? null;

  const embed = new EmbedBuilder()
    .setTitle(`${target.name} - SkyBlock`)
    .setColor(0x36056E)
    .setThumbnail(bodyRender(target.uuidDashed))
    .addFields(
      { name: 'Profile', value: profile.cute_name ?? 'Unknown', inline: true },
      { name: 'Skill Average', value: String(average), inline: true },
      { name: 'Fairy Souls', value: count(member.fairy_soul?.total_collected ?? member.fairy_souls_collected), inline: true },
      { name: 'Purse', value: `${compact(purse)} coins`, inline: true },
      { name: 'Bank', value: bank === null ? 'Private' : `${compact(bank)} coins`, inline: true },
      { name: 'Profiles', value: String(profiles.length), inline: true },
    )
    .setTimestamp();

  if (skillLevels.length) {
    embed.addFields({
      name: 'Skills',
      value: skillLevels.map(s => `${s.name} ${s.level}`).join(' - '),
    });
  }

  if (slayerLine) {
    embed.addFields({ name: 'Slayers', value: slayerLine });
  }

  await respond(interaction, { embeds: [embed] });
}
