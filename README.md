# Haunt | Hypixel Utility Discord Bot

Haunt is a feature-rich, open-source Discord bot tailored specifically for the Minecraft community. Built with Node.js, it interfaces with the Hypixel API and Mojang API to provide users with real-time statistics, player data, and account utilities natively within Discord. 

## Features

* **In-Depth Minigame Statistics:** Instantly fetch and display detailed player metrics for popular Hypixel gamemodes, including Bedwars, Skywars, and Duels.
* **Comprehensive Player Profiles:** Retrieve overall Hypixel network levels, active guild affiliations, and UUID conversions.
* **Cosmetics & Visual Rendering:** Generate and display high-quality renders of player skins and associated capes directly in the chat.
* **Account Integration:** Allow users to seamlessly link their Minecraft accounts to their Discord profiles for streamlined command usage.
* **Server Utilities:** Ping independent Minecraft servers for real-time status updates and monitor bot/API latency.

## Command Modules

Haunt's architecture is modularized into specific command files for rapid execution and easy expansion:
* `bedwars`, `skywars`, `duels` - Gamemode-specific analytics.
* `profile`, `level`, `guild` - General Hypixel network data.
* `skin`, `capes`, `uuid` - Mojang account data and visual renders.
* `link` - Discord-to-Minecraft account binding.
* `server`, `ping`, `help`, `invite` - Core bot utilities.

## Prerequisites

* Node.js v18 or higher (the bot uses the built-in `fetch`)
* Discord Bot Token and Application ID (via Discord Developer Portal)
* Hypixel API Key (Generated in-game via `/api new`)

## Installation & Configuration

### 1. Clone & Install Dependencies
Clone the repository to your local machine or host, then install the required Node packages:

    git clone https://github.com/4x3/haunt.git
    cd haunt
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

### 4. Initialization
Once your environment is configured and dependencies are installed, start the bot:

    npm start

---
*Disclaimer: Haunt is an independent, open-source project and is not officially affiliated with, maintained, or endorsed by Hypixel Inc. or Mojang AB.*
