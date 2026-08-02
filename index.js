import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  ActivityType,
  MessageFlags,
} from 'discord.js';

import { UserError } from './lib/errors.js';
import { respondError } from './lib/respond.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

function currentActivities() {
  const members = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
  return [
    { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching },
    { name: `${members.toLocaleString()} players`, type: ActivityType.Watching },
  ];
}

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setStatus('online');

  let index = 0;
  const rotate = () => {
    // Rebuilt every tick so the counts track joins and leaves.
    const activities = currentActivities();
    const activity = activities[index % activities.length];
    client.user.setActivity(activity.name, { type: activity.type });
    index++;
  };

  rotate();
  setInterval(rotate, 15000);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    // Defer up front so slow upstream APIs can't blow the 3 second deadline.
    // Commands that must own their first reply opt out with `defer = false`.
    if (command.defer !== false) {
      await interaction.deferReply(
        command.ephemeral ? { flags: MessageFlags.Ephemeral } : {},
      );
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
