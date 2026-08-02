import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REST, Routes } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

for (const [name, value] of Object.entries({ DISCORD_TOKEN, CLIENT_ID })) {
  if (!value) {
    console.error(`${name} is missing from .env — see .env.example.`);
    process.exit(1);
  }
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// Guild commands register instantly and are the right target while developing;
// global commands can take up to an hour to propagate.
const route = GUILD_ID
  ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
  : Routes.applicationCommands(CLIENT_ID);

try {
  console.log(`Registering ${commands.length} commands ${GUILD_ID ? `to guild ${GUILD_ID}` : 'globally'}...`);
  await rest.put(route, { body: commands });
  console.log('Done.');
} catch (error) {
  console.error('Failed to register commands:', error);
  process.exit(1);
}
