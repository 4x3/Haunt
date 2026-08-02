import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const LINKS_FILE = path.join(DATA_DIR, 'links.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

const links = load();

// Serializes writes so two people running /link at once can't interleave and
// truncate the file.
let pendingWrite = Promise.resolve();

function persist() {
  pendingWrite = pendingWrite.then(async () => {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${LINKS_FILE}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(links, null, 2));
    await fsp.rename(tmp, LINKS_FILE);
  });
  return pendingWrite;
}

export function getLinkByDiscordId(discordId) {
  return links[discordId] ?? null;
}

export function getLinkByUuid(uuid) {
  const entry = Object.entries(links).find(([, link]) => link.uuid === uuid);
  if (!entry) return null;
  return { discordId: entry[0], ...entry[1] };
}

export async function saveLink(discordId, { uuid, name }) {
  links[discordId] = { uuid, name, linkedAt: new Date().toISOString() };
  await persist();
  return links[discordId];
}
