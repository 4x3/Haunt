import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ActivityType,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from 'discord.js';

import { UserError } from './lib/errors.js';
import { respondError } from './lib/respond.js';
import { warmGameNames } from './lib/gamenames.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

function currentActivities() {
  const members = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
  return [
    { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching },
    { name: `${members.toLocaleString('en-US')} players`, type: ActivityType.Watching },
    { name: 'Hypixel stats', type: ActivityType.Watching },
  ];
}

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag} (${client.commands.size} commands)`);
  client.user.setStatus('online');

  // Pull the game name table up front so the first /counts isn't slower than
  // the rest. Failure is fine - it retries on demand.
  warmGameNames();

  let index = 0;
  const rotate = () => {
    // Rebuilt each tick so the counts follow joins and leaves.
    const activities = currentActivities();
    const activity = activities[index % activities.length];
    client.user.setActivity(activity.name, { type: activity.type });
    index++;
  };

  rotate();
  setInterval(rotate, 15000);
});

client.on(Events.InteractionCreate, async interaction => {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (interaction.isAutocomplete()) {
    // Discord gives autocomplete a hard 3 second budget and there's no way to
    // surface an error, so a failure just means no suggestions.
    try {
      await command.autocomplete?.(interaction);
    } catch (error) {
      console.error(`autocomplete for /${interaction.commandName} failed:`, error);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  try {
    // Defer first so a slow upstream API can't blow the 3 second deadline.
    // Commands that need to own their first reply set `defer = false`.
    if (command.defer !== false) {
      await interaction.deferReply(command.ephemeral ? { flags: MessageFlags.Ephemeral } : {});
    }
    await command.execute(interaction);
  } catch (error) {
    if (error instanceof UserError) {
      await respondError(interaction, error.message).catch(() => {});
      return;
    }

    console.error(`/${interaction.commandName} failed:`, error);
    await respondError(
      interaction,
      'Something went wrong running that command. Try again in a moment.',
    ).catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);
