import * as path from "node:path";

import { expect, mock, test } from "bun:test";
import type { MessageContextMenuCommandInteraction } from "discord.js";

import { IdolCommand } from "./idol";

test("replies to the target message and mentions its author", async () => {
	const reply = mock(async (_options: unknown) => ({}));
	const command = Object.create(IdolCommand.prototype) as IdolCommand;
	const interaction = {
		isMessageContextMenuCommand: true,
		targetMessage: {},
		reply,
	} as unknown as MessageContextMenuCommandInteraction;

	await command.contextMenuRun(interaction);

	const replyOptions = reply.mock.calls[0]?.[0] as {
		allowedMentions: { repliedUser: boolean };
		files: string[];
	};

	expect(replyOptions.allowedMentions).toEqual({ repliedUser: true });
	expect(path.basename(replyOptions.files[0])).toBe("IDOL.mp4");
	expect(replyOptions).not.toHaveProperty("content");
});
