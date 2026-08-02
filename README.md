# Haunt | Hypixel Utility Discord Bot

Haunt is a feature-rich, open-source Discord bot tailored specifically for the Minecraft community. Built with Node.js, it interfaces with the Hypixel Public API to provide real-time statistics, player data, and account utilities natively within Discord.

## Features

* **Every gamemode, one command:** `/game` covers 22 gamemodes - Bed Wars, SkyWars, Duels, Murder Mystery, Build Battle, Wool Wars, The Pit, Mega Walls, UHC, Cops and Crims, Warlords and more - with a dropdown to switch between them without re-running anything.
* **Live network data:** See whether someone is online and what map they're on, browse their recent games, check live player counts, active boosters, leaderboards, and Watchdog ban statistics.
* **SkyBlock tooling:** Bazaar prices with spreads and volume, lowest Buy-It-Now lookups across the whole auction house, mayor elections, patch notes, and per-profile skill and slayer summaries.
* **Guild insight:** Guild overview with level and weekly GEXP, plus a full weekly contribution leaderboard.
* **Account linking:** Link once with `/link` and every stats command defaults to your own account, so `/stats` on its own just works.
* **Cosmetics:** Skin renders, skin model detection, and both Minecraft and OptiFine capes.

## Commands

| Group | Commands |
| --- | --- |
| Player stats | `/stats` `/game` `/status` `/recentgames` |
| Guilds | `/guild` `/guildtop` |
| SkyBlock | `/skyblock` `/bazaar` `/lowestbin` `/election` `/sbnews` `/firesales` |
| Network | `/counts` `/boosters` `/punishments` `/leaderboards` |
| Minecraft | `/skin` `/capes` `/uuid` `/server` |
| Account | `/link` `/unlink` `/whois` |
| Bot | `/ping` `/invite` `/help` |

Most player commands take an optional username and fall back to your linked account when you leave it out.

## Project layout

```
commands/   one file per slash command, kept thin
lib/        all API and data logic
  hypixel.js    Hypixel v2 client: header auth, caching, rate limit handling
  players.js    username/UUID resolution via PlayerDB
  games.js      per-gamemode stat extraction
  auctions.js   lowest-BIN index over the auction house
  renders.js    skin render URL builders (Minotar)
  links.js      Discord to Minecraft account store
```

## Prerequisites

* Node.js v18 or higher (the bot uses the built-in `fetch`)
* Discord Bot Token and Application ID from the [Discord Developer Portal](https://discord.com/developers/applications)
* Hypixel API key from the [Hypixel Developer Dashboard](https://developer.hypixel.net)

> The old in-game `/api new` command no longer issues keys. You now register an application on the developer dashboard and take the key from there.

## Installation & Configuration

### 1. Clone & Install Dependencies

    git clone https://github.com/4x3/Haunt.git
    cd Haunt
    npm install

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials. Never commit the `.env` file:

    DISCORD_TOKEN=your_discord_bot_token_here
    CLIENT_ID=your_discord_application_id_here
    HYPIXEL_API_KEY=your_hypixel_api_key_here

Optionally set `GUILD_ID` to a server ID to register commands there instantly while developing.

### 3. Register Slash Commands

Push the command definitions to Discord. Re-run this whenever a command's name, description, or options change:

    npm run deploy

### 4. Run

    npm start

## Notes on the API

* Hypixel authenticates with an `API-Key` header. The old `?key=` query parameter is no longer accepted and returns `400` even with a valid key.
* Everything under `/resources` plus the SkyBlock bazaar, auctions, news and fire sale endpoints are open and need no key, so those commands work before you configure one.
* Responses are cached briefly in-process and identical in-flight requests are shared, which keeps the bot well inside its rate limit.
* Names and UUIDs come from [PlayerDB](https://playerdb.co); skin renders come from [Minotar](https://minotar.net). The bot never downloads a render itself, it just puts the URL in the embed and lets Discord fetch it. Every render URL is built in `lib/renders.js`, so switching provider is a one-file change.

---
*Disclaimer: Haunt is an independent, open-source project and is not officially affiliated with, maintained, or endorsed by Hypixel Inc. or Mojang AB.*
