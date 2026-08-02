import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  OAuth2Scopes,
  PermissionFlagsBits,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('invite')
  .setDescription('Get the bot invite link');

export const defer = false;

// Everything the bot actually does is post embeds. Asking for more than this
// gets invites declined and widens the blast radius if the token ever leaks.
const REQUIRED_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
];

export async function execute(interaction) {
  const invite = interaction.client.generateInvite({
    scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
    permissions: REQUIRED_PERMISSIONS,
  });

  const embed = new EmbedBuilder()
    .setTitle('Invite Haunt')
    .setColor(0x36056E)
    .setDescription(`[Add Haunt to your server](${invite})`)
    .addFields({
      name: 'Permissions requested',
      value: 'View Channel, Send Messages, Embed Links',
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
