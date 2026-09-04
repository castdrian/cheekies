import { Database } from "bun:sqlite";
import {
	ApplicationCommandRegistries,
	SapphireClient,
} from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import "@sapphire/plugin-logger/register";

import { config } from "@src/config";
import * as schema from "@src/database/schema";

ApplicationCommandRegistries.setDefaultGuildIds(
	config.devGuildId ? [config.devGuildId] : undefined,
);

const client = new SapphireClient({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

const sqlite = new Database("cheekies.db");
const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: "./src/database/drizzle" });

await client.login(config.discordToken);
