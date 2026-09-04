import { Database } from "bun:sqlite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";

import * as schema from "@src/database/schema";

const sqlite = new Database("cheekies.db");
export const db = drizzle(sqlite, { schema });

export type GuildSettings = typeof schema.guildPreferences.$inferSelect;
export type GreetingSettings = typeof schema.greetingPreferences.$inferSelect;

export async function getOrCreateGuildSettings(guildId: string) {
	const existingSettings = await db
		.select()
		.from(schema.guildPreferences)
		.where(eq(schema.guildPreferences.id, guildId))
		.limit(1);

	if (existingSettings.length > 0) {
		return existingSettings[0];
	}

	const newSettings: GuildSettings = {
		id: guildId,
		XAutoEmbed: false,
		instagramAutoEmbed: false,
		tiktokAutoEmbed: false,
		greetingEnabled: false,
		joinRoleEnabled: false,
		joinRoleId: null,
	};

	const createdSettings = await db
		.insert(schema.guildPreferences)
		.values(newSettings)
		.returning();
	return createdSettings[0];
}

export async function updateGuildSettings(
	guildId: string,
	newSettings: Partial<GuildSettings>,
) {
	await db
		.update(schema.guildPreferences)
		.set(newSettings)
		.where(eq(schema.guildPreferences.id, guildId))
		.returning();
	return getOrCreateGuildSettings(guildId);
}

export async function isXAutoEmbedEnabled(guildId: string) {
	const settings = await getOrCreateGuildSettings(guildId);
	return settings.XAutoEmbed;
}

export async function isInstagramAutoEmbedEnabled(guildId: string) {
	const settings = await getOrCreateGuildSettings(guildId);
	return settings.instagramAutoEmbed;
}

export async function isTikTokAutoEmbedEnabled(guildId: string) {
	const settings = await getOrCreateGuildSettings(guildId);
	return settings.tiktokAutoEmbed;
}

export async function getOrCreateGreetingSettings(guildId: string) {
	const existingSettings = await db
		.select()
		.from(schema.greetingPreferences)
		.where(eq(schema.greetingPreferences.id, guildId))
		.limit(1);

	if (existingSettings.length > 0) {
		return existingSettings[0];
	}

	const newSettings = {
		id: guildId,
		greetingChannelId: null,
		greetingMessageContent: null,
		greetingEmbedTitle: null,
		greetingEmbedDescription: null,
	};

	const createdSettings = await db
		.insert(schema.greetingPreferences)
		.values(newSettings)
		.returning();
	return createdSettings[0];
}

export async function updateGreetingSettings(
	guildId: string,
	newSettings: Partial<GreetingSettings>,
) {
	await db
		.update(schema.greetingPreferences)
		.set(newSettings)
		.where(eq(schema.greetingPreferences.id, guildId))
		.returning();
	return getOrCreateGreetingSettings(guildId);
}

export async function removeGreetingSettings(guildId: string) {
	await db
		.delete(schema.greetingPreferences)
		.where(eq(schema.greetingPreferences.id, guildId));
}

export async function isGreetingEnabled(guildId: string) {
	const settings = await getOrCreateGuildSettings(guildId);
	return settings.greetingEnabled;
}

export async function isJoinRoleEnabled(guildId: string) {
	const settings = await getOrCreateGuildSettings(guildId);
	return settings.joinRoleEnabled;
}
