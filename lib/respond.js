import { MessageFlags } from 'discord.js';

// Picks the right reply method for whatever state the interaction is in, so a
// handler that already deferred or replied doesn't throw InteractionAlreadyReplied.
export function respond(interaction, payload) {
  if (interaction.deferred) {
    // Ephemerality is fixed at defer time; editReply rejects the flag.
    const { flags, ...rest } = payload;
    return interaction.editReply(rest);
  }
  if (interaction.replied) return interaction.followUp(payload);
  return interaction.reply(payload);
}

export function respondError(interaction, message) {
  return respond(interaction, {
    content: message,
    embeds: [],
    flags: MessageFlags.Ephemeral,
  });
}
