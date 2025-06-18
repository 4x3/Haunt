import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, GatewayIntentBits, Collection, ActivityType } from 'discord.js';

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

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const activities = [
    { name: `${client.guilds.cache.size} Servers!`, type: ActivityType.Watching },
    { name: `${client.users.cache.size} User Installs!`, type: ActivityType.Watching },
  ];

  let index = 0;

  // Set initial activity and status
  client.user.setActivity(activities[index].name, { type: activities[index].type });
  client.user.setStatus('online');

  // Rotate status every 15 seconds
  setInterval(() => {
    index = (index + 1) % activities.length;
    client.user.setActivity(activities[index].name, { type: activities[index].type });
  }, 15000);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Error executing command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Error executing command!', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
