import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  MessageFlags,
} from 'discord.js';

import { GAMES, gameChoices, getGame } from '../lib/games.js';
import { getPlayer } from '../lib/hypixel.js';
import { headRender } from '../lib/renders.js';
import { respond } from '../lib/respond.js';
import { resolveTarget } from '../lib/target.js';
import { UserError } from '../lib/errors.js';

export const data = new SlashCommandBuilder()
  .setName('game')
  .setDescription('Detailed stats for a specific Hypixel gamemode')
  .addStringOption(option =>
    option.setName('mode')
      .setDescription('Which gamemode')
      .setRequired(true)
      .addChoices(...gameChoices()))
  .addStringOption(option =>
    option.setName('username')
      .setDescription('Minecraft username (defaults to your linked account)')
      .setRequired(false));

// How long the gamemode dropdown stays clickable before we strip it.
const PICKER_TIMEOUT_MS = 2 * 60 * 1000;

function buildEmbed(game, profile, player) {
  const stats = player.stats?.[game.statsKey];

  const embed = new EmbedBuilder()
    .setTitle(`${profile.name} - ${game.label}`)
    .setColor(0x36056E)
    .setThumbnail(headRender(profile.uuidDashed))
    .setTimestamp();

  // Hypixel drops the key entirely for games the player has never opened, so
  // an absent object is "never played" rather than an error.
  if (!stats) {
    return embed.setDescription(`No ${game.label} stats - looks like they've never played it.`);
  }

  return embed.addFields(...game.fields(stats, player));
}

function picker(selectedId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('game-picker')
    .setPlaceholder('Switch gamemode')
    .addOptions(
      GAMES.map(game => ({
        label: game.label,
        value: game.id,
        default: game.id === selectedId,
      })),
    );

  return new ActionRowBuilder().addComponents(menu);
}

export async function execute(interaction) {
  const modeId = interaction.options.getString('mode');
  const game = getGame(modeId);
  if (!game) throw new UserError(`I don't know a gamemode called \`${modeId}\`.`);

  const profile = await resolveTarget(interaction);
  const player = await getPlayer(profile.uuid);
  if (!player) {
    throw new UserError(`**${profile.name}** has never logged into Hypixel.`);
  }

  const message = await respond(interaction, {
    embeds: [buildEmbed(game, profile, player)],
    components: [picker(game.id)],
  });

  // The player payload is already in memory, so switching gamemodes is free -
  // no reason to make people re-run the command for every mode.
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: PICKER_TIMEOUT_MS,
  });

  collector.on('collect', async selection => {
    if (selection.user.id !== interaction.user.id) {
      await selection.reply({
        content: 'Run `/game` yourself to browse someone\'s stats.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const next = getGame(selection.values[0]);
    if (!next) return;

    await selection.update({
      embeds: [buildEmbed(next, profile, player)],
      components: [picker(next.id)],
    });
  });

  collector.on('end', async () => {
    // Leave the final embed in place but drop the now-dead dropdown.
    await interaction.editReply({ components: [] }).catch(() => {});
  });
}
