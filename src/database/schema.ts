import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const guildPreferences = sqliteTable("guild_preferences", {
	id: text("id").primaryKey(),
	XAutoEmbed: integer("x_auto_embed", { mode: "boolean" })
		.notNull()
		.default(false),
	instagramAutoEmbed: integer("instagram_auto_embed", { mode: "boolean" })
		.notNull()
		.default(false),
	tiktokAutoEmbed: integer("tiktok_auto_embed", { mode: "boolean" })
		.notNull()
		.default(false),
	greetingEnabled: integer("greeting_enabled", { mode: "boolean" })
		.notNull()
		.default(false),
	joinRoleEnabled: integer("join_role_enabled", { mode: "boolean" })
		.notNull()
		.default(false),
	joinRoleId: text("join_role_id"),
});

export const greetingPreferences = sqliteTable("greeting_preferences", {
	id: text("id")
		.primaryKey()
		.references(() => guildPreferences.id),
	greetingChannelId: text("greeting_channel_id"),
	greetingMessageContent: text("greeting_message_content"),
	greetingEmbedTitle: text("greeting_embed_title"),
	greetingEmbedDescription: text("greeting_embed_description"),
});
